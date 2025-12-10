import { supabase } from '@/lib/supabase/client';

export interface UserProfile {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    bio?: string;
    study_preferences?: any;
    level: number;
    points: number;
    created_at: string;
    updated_at: string;
}

class ProfileService {

    async getProfile(userId: string): Promise<UserProfile | null> {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as UserProfile | null;
    }

    async updateProfile(userId: string, updates: Partial<UserProfile>) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as UserProfile;
    }

    async uploadAvatar(userId: string, file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await this.supabase.storage
            .from('user-content')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = this.supabase.storage
            .from('user-content')
            .getPublicUrl(filePath);

        // Update profile with new avatar URL
        await this.updateProfile(userId, { avatar_url: urlData.publicUrl });

        return urlData.publicUrl;
    }

    async searchUsers(query: string, limit: number = 10) {
        const { data, error } = await this.supabase
            .from('user_profiles')
            .select('id, username, full_name, avatar_url, level, points')
            .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
            .limit(limit);

        if (error) throw error;
        return data;
    }

    async awardPoints(userId: string, points: number) {
        const { error } = await this.supabase.rpc('award_points', {
            p_user_id: userId,
            p_points: points,
        });

        if (error) throw error;
    }
}

export const profileService = new ProfileService();
