-- Analytics Database Schema
-- Tables for study sessions, analytics events, and productivity tracking

-- Study Sessions Table
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'note_created', 'assignment_completed', 'chat_sent', etc.
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Productivity Metrics Table
CREATE TABLE IF NOT EXISTS productivity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    study_minutes INTEGER DEFAULT 0,
    notes_created INTEGER DEFAULT 0,
    assignments_completed INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_subject_id ON study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_productivity_metrics_user_date ON productivity_metrics(user_id, date);

-- Row Level Security Policies
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE productivity_metrics ENABLE ROW LEVEL SECURITY;

-- Study Sessions Policies
CREATE POLICY "Users can view own study sessions"
    ON study_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own study sessions"
    ON study_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study sessions"
    ON study_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own study sessions"
    ON study_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Analytics Events Policies
CREATE POLICY "Users can view own analytics events"
    ON analytics_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own analytics events"
    ON analytics_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Productivity Metrics Policies
CREATE POLICY "Users can view own productivity metrics"
    ON productivity_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own productivity metrics"
    ON productivity_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own productivity metrics"
    ON productivity_metrics FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to calculate study time
CREATE OR REPLACE FUNCTION calculate_study_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL THEN
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate duration
CREATE TRIGGER calculate_study_duration_trigger
    BEFORE INSERT OR UPDATE ON study_sessions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_study_duration();

-- Function to update productivity metrics
CREATE OR REPLACE FUNCTION update_productivity_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO productivity_metrics (user_id, date, study_minutes)
    VALUES (NEW.user_id, DATE(NEW.start_time), COALESCE(NEW.duration_minutes, 0))
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        study_minutes = productivity_metrics.study_minutes + COALESCE(NEW.duration_minutes, 0),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics when study session ends
CREATE TRIGGER update_productivity_on_study_trigger
    AFTER INSERT OR UPDATE ON study_sessions
    FOR EACH ROW
    WHEN (NEW.end_time IS NOT NULL)
    EXECUTE FUNCTION update_productivity_metrics();
