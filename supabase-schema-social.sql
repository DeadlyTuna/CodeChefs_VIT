-- Social Features Database Schema
-- Tables for user profiles, friendships, study groups, and leaderboards

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    study_preferences JSONB DEFAULT '{}'::jsonb,
    level INTEGER DEFAULT 1,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships Table
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Study Groups Table
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Study Group Members Table
CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Leaderboard Entries Table
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    period TEXT NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    period_date DATE NOT NULL,
    points INTEGER DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, period, period_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_study_groups_creator ON study_groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON study_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON study_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboard_entries(period, period_date);
CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON leaderboard_entries(rank);

-- Row Level Security Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
    ON user_profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Friendships Policies
CREATE POLICY "Users can view own friendships"
    ON friendships FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships"
    ON friendships FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships"
    ON friendships FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete own friendships"
    ON friendships FOR DELETE
    USING (auth.uid() = user_id);

-- Study Groups Policies
CREATE POLICY "Public groups are viewable by everyone"
    ON study_groups FOR SELECT
    USING (is_public = true OR creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_groups.id AND user_id = auth.uid()));

CREATE POLICY "Authenticated users can create groups"
    ON study_groups FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can update groups"
    ON study_groups FOR UPDATE
    USING (creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_groups.id AND user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Creators can delete groups"
    ON study_groups FOR DELETE
    USING (creator_id = auth.uid());

-- Study Group Members Policies
CREATE POLICY "Group members can view members"
    ON study_group_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM study_groups WHERE id = group_id AND (is_public = true OR 
           EXISTS (SELECT 1 FROM study_group_members sgm WHERE sgm.group_id = group_id AND sgm.user_id = auth.uid()))));

CREATE POLICY "Users can join groups"
    ON study_group_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update members"
    ON study_group_members FOR UPDATE
    USING (EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_group_members.group_id AND user_id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Users can leave groups"
    ON study_group_members FOR DELETE
    USING (auth.uid() = user_id);

-- Leaderboard Policies
CREATE POLICY "Leaderboard is viewable by everyone"
    ON leaderboard_entries FOR SELECT
    USING (true);

CREATE POLICY "System can manage leaderboard"
    ON leaderboard_entries FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, username, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NULL),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Function to update leaderboard
CREATE OR REPLACE FUNCTION update_leaderboard()
RETURNS void AS $$
BEGIN
    -- Update daily leaderboard
    INSERT INTO leaderboard_entries (user_id, period, period_date, points)
    SELECT 
        up.id,
        'daily',
        CURRENT_DATE,
        up.points
    FROM user_profiles up
    ON CONFLICT (user_id, period, period_date)
    DO UPDATE SET 
        points = EXCLUDED.points,
        updated_at = NOW();
    
    -- Calculate ranks
    WITH ranked_users AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (ORDER BY points DESC) as new_rank
        FROM leaderboard_entries
        WHERE period = 'daily' AND period_date = CURRENT_DATE
    )
    UPDATE leaderboard_entries le
    SET rank = ru.new_rank
    FROM ranked_users ru
    WHERE le.id = ru.id;
END;
$$ LANGUAGE plpgsql;

-- Function to award points
CREATE OR REPLACE FUNCTION award_points(p_user_id UUID, p_points INTEGER)
RETURNS void AS $$
BEGIN
    UPDATE user_profiles
    SET 
        points = points + p_points,
        level = FLOOR((points + p_points) / 100) + 1,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;
