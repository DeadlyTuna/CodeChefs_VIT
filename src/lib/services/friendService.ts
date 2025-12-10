import { supabase } from '@/lib/supabase/client';

export interface Friendship {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface FriendWithProfile {
    id: string;
    user_id: string;
    friend_id: string;
    status: string;
    friend_profile: {
        id: string;
        username?: string;
        full_name?: string;
        avatar_url?: string;
        level: number;
        points: number;
    };
}

class FriendService {
    private supabase = createClientComponentClient();

    async sendFriendRequest(userId: string, friendId: string) {
        const { data, error } = await this.supabase
            .from('friendships')
            .insert({
                user_id: userId,
                friend_id: friendId,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;
        return data as Friendship;
    }

    async acceptFriendRequest(friendshipId: string) {
        const { data, error } = await this.supabase
            .from('friendships')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;

        // Create reciprocal friendship
        const friendship = data as Friendship;
        await this.supabase.from('friendships').insert({
            user_id: friendship.friend_id,
            friend_id: friendship.user_id,
            status: 'accepted',
        });

        return data;
    }

    async rejectFriendRequest(friendshipId: string) {
        const { data, error } = await this.supabase
            .from('friendships')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', friendshipId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getFriends(userId: string): Promise<FriendWithProfile[]> {
        const { data, error } = await this.supabase
            .from('friendships')
            .select(`
                *,
                friend_profile:user_profiles!friendships_friend_id_fkey(
                    id,
                    username,
                    full_name,
                    avatar_url,
                    level,
                    points
                )
            `)
            .eq('user_id', userId)
            .eq('status', 'accepted');

        if (error) throw error;
        return data as FriendWithProfile[];
    }

    async getPendingRequests(userId: string) {
        const { data, error } = await this.supabase
            .from('friendships')
            .select(`
                *,
                sender_profile:user_profiles!friendships_user_id_fkey(
                    id,
                    username,
                    full_name,
                    avatar_url,
                    level,
                    points
                )
            `)
            .eq('friend_id', userId)
            .eq('status', 'pending');

        if (error) throw error;
        return data;
    }

    async removeFriend(userId: string, friendId: string) {
        // Remove both directions
        await this.supabase
            .from('friendships')
            .delete()
            .eq('user_id', userId)
            .eq('friend_id', friendId);

        await this.supabase
            .from('friendships')
            .delete()
            .eq('user_id', friendId)
            .eq('friend_id', userId);
    }

    async checkFriendship(userId: string, friendId: string): Promise<Friendship | null> {
        const { data, error } = await this.supabase
            .from('friendships')
            .select('*')
            .eq('user_id', userId)
            .eq('friend_id', friendId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data as Friendship | null;
    }
}

export const friendService = new FriendService();
