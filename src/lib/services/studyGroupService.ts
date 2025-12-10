import { supabase } from '@/lib/supabase/client';

export interface StudyGroup {
    id: string;
    name: string;
    description?: string;
    avatar_url?: string;
    creator_id: string;
    is_public: boolean;
    max_members: number;
    created_at: string;
    updated_at: string;
}

export interface StudyGroupMember {
    id: string;
    group_id: string;
    user_id: string;
    role: 'admin' | 'moderator' | 'member';
    joined_at: string;
}

export interface GroupWithMembers extends StudyGroup {
    member_count: number;
    is_member: boolean;
    user_role?: string;
}

class StudyGroupService {
    private supabase = createClientComponentClient();

    async createGroup(
        userId: string,
        name: string,
        description?: string,
        isPublic: boolean = true
    ): Promise<StudyGroup> {
        const { data: group, error } = await this.supabase
            .from('study_groups')
            .insert({
                name,
                description,
                creator_id: userId,
                is_public: isPublic,
            })
            .select()
            .single();

        if (error) throw error;

        // Add creator as admin
        await this.supabase.from('study_group_members').insert({
            group_id: group.id,
            user_id: userId,
            role: 'admin',
        });

        return group as StudyGroup;
    }

    async getGroups(userId?: string): Promise<GroupWithMembers[]> {
        let query = this.supabase
            .from('study_groups')
            .select(`
                *,
                study_group_members(count)
            `)
            .eq('is_public', true);

        const { data: groups, error } = await query;
        if (error) throw error;

        // Add member info if userId provided
        if (userId) {
            const { data: memberships } = await this.supabase
                .from('study_group_members')
                .select('group_id, role')
                .eq('user_id', userId);

            const membershipMap = new Map(
                memberships?.map((m) => [m.group_id, m.role]) || []
            );

            return groups.map((g: any) => ({
                ...g,
                member_count: g.study_group_members[0]?.count || 0,
                is_member: membershipMap.has(g.id),
                user_role: membershipMap.get(g.id),
            }));
        }

        return groups.map((g: any) => ({
            ...g,
            member_count: g.study_group_members[0]?.count || 0,
            is_member: false,
        }));
    }

    async getGroup(groupId: string): Promise<StudyGroup> {
        const { data, error } = await this.supabase
            .from('study_groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (error) throw error;
        return data as StudyGroup;
    }

    async joinGroup(userId: string, groupId: string) {
        const { data, error } = await this.supabase
            .from('study_group_members')
            .insert({
                group_id: groupId,
                user_id: userId,
                role: 'member',
            })
            .select()
            .single();

        if (error) throw error;
        return data as StudyGroupMember;
    }

    async leaveGroup(userId: string, groupId: string) {
        const { error } = await this.supabase
            .from('study_group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', userId);

        if (error) throw error;
    }

    async getGroupMembers(groupId: string) {
        const { data, error } = await this.supabase
            .from('study_group_members')
            .select(`
                *,
                user_profiles(
                    id,
                    username,
                    full_name,
                    avatar_url,
                    level,
                    points
                )
            `)
            .eq('group_id', groupId)
            .order('joined_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async updateGroup(groupId: string, updates: Partial<StudyGroup>) {
        const { data, error } = await this.supabase
            .from('study_groups')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', groupId)
            .select()
            .single();

        if (error) throw error;
        return data as StudyGroup;
    }

    async deleteGroup(groupId: string) {
        const { error } = await this.supabase
            .from('study_groups')
            .delete()
            .eq('id', groupId);

        if (error) throw error;
    }

    async updateMemberRole(groupId: string, userId: string, role: 'admin' | 'moderator' | 'member') {
        const { data, error } = await this.supabase
            .from('study_group_members')
            .update({ role })
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}

export const studyGroupService = new StudyGroupService();
