import { supabase } from '@/lib/supabase/client';

export const chatService = {
    async getConversations(userId: string) {
        const { data, error } = await supabase
            .from('conversation_participants')
            .select(`
        conversation_id,
        conversations (
          id,
          name,
          is_group,
          updated_at,
          messages (
            content,
            created_at,
            sender_id
          )
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        return { data, error };
    },

    async getMessages(conversationId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select(`
        *,
        profiles:sender_id (
          full_name,
          avatar_url
        )
      `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        return { data, error };
    },

    async sendMessage(conversationId: string, content: string, senderId: string) {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content,
            })
            .select()
            .single();

        return { data, error };
    },

    async createConversation(participantIds: string[], isGroup: boolean = false, name?: string) {
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .insert({ is_group: isGroup, name })
            .select()
            .single();

        if (convError || !conversation) return { data: null, error: convError };

        const participants = participantIds.map(id => ({
            conversation_id: conversation.id,
            user_id: id,
        }));

        const { error: partError } = await supabase
            .from('conversation_participants')
            .insert(participants);

        return { data: conversation, error: partError };
    },

    subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                callback
            )
            .subscribe();
    },
};
