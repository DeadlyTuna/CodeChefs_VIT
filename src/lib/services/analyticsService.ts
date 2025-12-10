import { supabase } from '@/lib/supabase/client';

export interface StudySession {
    id: string;
    user_id: string;
    subject_id?: string;
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface AnalyticsEvent {
    id: string;
    user_id: string;
    event_type: string;
    event_data?: any;
    created_at: string;
}

export interface ProductivityMetrics {
    id: string;
    user_id: string;
    date: string;
    study_minutes: number;
    notes_created: number;
    assignments_completed: number;
    attendance_percentage?: number;
}

export interface StudyStats {
    totalStudyTime: number;
    averageSessionTime: number;
    studySessionsCount: number;
    topSubjects: Array<{ subject_id: string; subject_name: string; total_minutes: number }>;
    dailyStudyTime: Array<{ date: string; minutes: number }>;
}

export interface AttendanceStats {
    totalClasses: number;
    attendedClasses: number;
    attendanceRate: number;
    bySubject: Array<{ subject_id: string; subject_name: string; attended: number; total: number; rate: number }>;
}

export interface ProductivityInsights {
    streakDays: number;
    totalPoints: number;
    level: number;
    weeklyProgress: number;
    topAchievements: string[];
}

class AnalyticsService {
    private supabase = supabase;

    // Study Session Management
    async startStudySession(userId: string, subjectId?: string, notes?: string) {
        const { data, error } = await this.supabase
            .from('study_sessions')
            .insert({
                user_id: userId,
                subject_id: subjectId,
                notes,
                start_time: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data as StudySession;
    }

    async endStudySession(sessionId: string) {
        const { data, error } = await this.supabase
            .from('study_sessions')
            .update({
                end_time: new Date().toISOString(),
            })
            .eq('id', sessionId)
            .select()
            .single();

        if (error) throw error;
        return data as StudySession;
    }

    async getActiveStudySession(userId: string): Promise<StudySession | null> {
        const { data, error } = await this.supabase
            .from('study_sessions')
            .select('*')
            .eq('user_id', userId)
            .is('end_time', null)
            .order('start_time', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as StudySession | null;
    }

    async getStudySessions(userId: string, startDate?: Date, endDate?: Date) {
        let query = this.supabase
            .from('study_sessions')
            .select('*, subjects(name)')
            .eq('user_id', userId)
            .order('start_time', { ascending: false });

        if (startDate) {
            query = query.gte('start_time', startDate.toISOString());
        }
        if (endDate) {
            query = query.lte('start_time', endDate.toISOString());
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    // Analytics Events
    async trackEvent(userId: string, eventType: string, eventData?: any) {
        const { data, error } = await this.supabase
            .from('analytics_events')
            .insert({
                user_id: userId,
                event_type: eventType,
                event_data: eventData,
            });

        if (error) throw error;
        return data;
    }

    // Study Statistics
    async getStudyStats(userId: string, days: number = 30): Promise<StudyStats> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sessions = await this.getStudySessions(userId, startDate);

        const totalStudyTime = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        const studySessionsCount = sessions.length;
        const averageSessionTime = studySessionsCount > 0 ? totalStudyTime / studySessionsCount : 0;

        // Top subjects
        const subjectMap = new Map<string, { name: string; minutes: number }>();
        sessions.forEach((s: any) => {
            if (s.subject_id && s.subjects) {
                const existing = subjectMap.get(s.subject_id) || { name: s.subjects.name, minutes: 0 };
                existing.minutes += s.duration_minutes || 0;
                subjectMap.set(s.subject_id, existing);
            }
        });

        const topSubjects = Array.from(subjectMap.entries())
            .map(([id, data]) => ({
                subject_id: id,
                subject_name: data.name,
                total_minutes: data.minutes,
            }))
            .sort((a, b) => b.total_minutes - a.total_minutes)
            .slice(0, 5);

        // Daily study time
        const dailyMap = new Map<string, number>();
        sessions.forEach((s) => {
            const date = new Date(s.start_time).toISOString().split('T')[0];
            dailyMap.set(date, (dailyMap.get(date) || 0) + (s.duration_minutes || 0));
        });

        const dailyStudyTime = Array.from(dailyMap.entries())
            .map(([date, minutes]) => ({ date, minutes }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return {
            totalStudyTime,
            averageSessionTime,
            studySessionsCount,
            topSubjects,
            dailyStudyTime,
        };
    }

    // Attendance Statistics
    async getAttendanceStats(userId: string): Promise<AttendanceStats> {
        const { data: attendanceData, error } = await this.supabase
            .from('attendance')
            .select('*, subjects(name)')
            .eq('user_id', userId);

        if (error) throw error;

        const totalClasses = attendanceData?.length || 0;
        const attendedClasses = attendanceData?.filter((a) => a.present).length || 0;
        const attendanceRate = totalClasses > 0 ? (attendedClasses / totalClasses) * 100 : 0;

        // By subject
        const subjectMap = new Map<string, { name: string; attended: number; total: number }>();
        attendanceData?.forEach((a: any) => {
            if (a.subject_id) {
                const existing = subjectMap.get(a.subject_id) || {
                    name: a.subjects?.name || 'Unknown',
                    attended: 0,
                    total: 0,
                };
                existing.total += 1;
                if (a.present) existing.attended += 1;
                subjectMap.set(a.subject_id, existing);
            }
        });

        const bySubject = Array.from(subjectMap.entries()).map(([id, data]) => ({
            subject_id: id,
            subject_name: data.name,
            attended: data.attended,
            total: data.total,
            rate: (data.attended / data.total) * 100,
        }));

        return {
            totalClasses,
            attendedClasses,
            attendanceRate,
            bySubject,
        };
    }

    // Assignment Completion Rate
    async getAssignmentCompletionRate(userId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: assignments, error } = await this.supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId)
            .gte('created_at', startDate.toISOString());

        if (error) throw error;

        const total = assignments?.length || 0;
        const completed = assignments?.filter((a) => a.completed).length || 0;
        const pending = total - completed;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        return {
            total,
            completed,
            pending,
            completionRate,
        };
    }

    // Productivity Insights
    async getProductivityInsights(userId: string): Promise<ProductivityInsights> {
        // Get user profile for points and level
        const { data: profile } = await this.supabase
            .from('user_profiles')
            .select('points, level')
            .eq('id', userId)
            .single();

        // Calculate streak
        const { data: metrics } = await this.supabase
            .from('productivity_metrics')
            .select('date, study_minutes')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .limit(30);

        let streakDays = 0;
        if (metrics && metrics.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            let checkDate = new Date(today);

            for (const metric of metrics) {
                const metricDate = new Date(metric.date).toISOString().split('T')[0];
                const expectedDate = checkDate.toISOString().split('T')[0];

                if (metricDate === expectedDate && metric.study_minutes > 0) {
                    streakDays++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // Calculate weekly progress
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { data: weekMetrics } = await this.supabase
            .from('productivity_metrics')
            .select('study_minutes')
            .eq('user_id', userId)
            .gte('date', weekAgo.toISOString().split('T')[0]);

        const weeklyProgress = weekMetrics?.reduce((sum, m) => sum + m.study_minutes, 0) || 0;

        // Top achievements (simplified)
        const achievements: string[] = [];
        if (streakDays >= 7) achievements.push(`🔥 ${streakDays} Day Streak`);
        if ((profile?.points || 0) >= 1000) achievements.push('⭐ 1000 Points');
        if ((profile?.level || 0) >= 10) achievements.push('🏆 Level 10');

        return {
            streakDays,
            totalPoints: profile?.points || 0,
            level: profile?.level || 1,
            weeklyProgress,
            topAchievements: achievements,
        };
    }

    // Productivity Metrics
    async getProductivityMetrics(userId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await this.supabase
            .from('productivity_metrics')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate.toISOString().split('T')[0])
            .order('date', { ascending: true });

        if (error) throw error;
        return data as ProductivityMetrics[];
    }
}

export const analyticsService = new AnalyticsService();
