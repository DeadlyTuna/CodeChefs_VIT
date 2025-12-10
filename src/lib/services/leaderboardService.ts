import { supabase } from '@/lib/supabase/client';

export interface LeaderboardEntry {
    id: string;
    user_id: string;
    period: 'daily' | 'weekly' | 'monthly' | 'all_time';
    period_date: string;
    points: number;
    rank?: number;
    user_profile?: {
        username?: string;
        full_name?: string;
        avatar_url?: string;
        level: number;
    };
}

class LeaderboardService {
    private supabase = createClientComponentClient();

    async getLeaderboard(
        period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time',
        limit: number = 50
    ): Promise<LeaderboardEntry[]> {
        const periodDate = this.getPeriodDate(period);

        const { data, error } = await this.supabase
            .from('leaderboard_entries')
            .select(`
                *,
                user_profile:user_profiles(
                    username,
                    full_name,
                    avatar_url,
                    level
                )
            `)
            .eq('period', period)
            .eq('period_date', periodDate)
            .order('rank', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data as LeaderboardEntry[];
    }

    async getUserRank(userId: string, period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time') {
        const periodDate = this.getPeriodDate(period);

        const { data, error } = await this.supabase
            .from('leaderboard_entries')
            .select('*')
            .eq('user_id', userId)
            .eq('period', period)
            .eq('period_date', periodDate)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as LeaderboardEntry | null;
    }

    async updateLeaderboard() {
        const { error } = await this.supabase.rpc('update_leaderboard');
        if (error) throw error;
    }

    private getPeriodDate(period: 'daily' | 'weekly' | 'monthly' | 'all_time'): string {
        const today = new Date();

        switch (period) {
            case 'daily':
                return today.toISOString().split('T')[0];
            case 'weekly':
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                return weekStart.toISOString().split('T')[0];
            case 'monthly':
                return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            case 'all_time':
                return '2000-01-01';
            default:
                return today.toISOString().split('T')[0];
        }
    }
}

export const leaderboardService = new LeaderboardService();
