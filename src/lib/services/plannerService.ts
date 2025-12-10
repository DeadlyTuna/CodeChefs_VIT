import { supabase } from '@/lib/supabase/client';

export const plannerService = {
    // Subjects
    async getSubjects(userId: string) {
        const { data, error } = await supabase
            .from('subjects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        return { data, error };
    },

    async createSubject(userId: string, subject: { name: string; code: string; professor?: string; color?: string }) {
        const { data, error } = await supabase
            .from('subjects')
            .insert({ user_id: userId, ...subject })
            .select()
            .single();
        return { data, error };
    },

    async updateSubject(id: string, updates: Partial<{ name: string; code: string; professor: string; color: string }>) {
        const { data, error } = await supabase
            .from('subjects')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deleteSubject(id: string) {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        return { error };
    },

    // Attendance
    async getAttendance(userId: string, subjectId?: string) {
        let query = supabase
            .from('attendance')
            .select(`
        *,
        subjects (
          name,
          code,
          color
        )
      `)
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        const { data, error } = await query;
        return { data, error };
    },

    async markAttendance(userId: string, subjectId: string, date: string, status: 'present' | 'absent' | 'leave') {
        const { data, error } = await supabase
            .from('attendance')
            .insert({
                user_id: userId,
                subject_id: subjectId,
                date,
                status,
            })
            .select()
            .single();
        return { data, error };
    },

    async updateAttendance(id: string, status: 'present' | 'absent' | 'leave') {
        const { data, error } = await supabase
            .from('attendance')
            .update({ status })
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    // Assignments
    async getAssignments(userId: string, subjectId?: string) {
        let query = supabase
            .from('assignments')
            .select(`
        *,
        subjects (
          name,
          code,
          color
        )
      `)
            .eq('user_id', userId)
            .order('deadline', { ascending: true });

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        const { data, error } = await query;
        return { data, error };
    },

    async createAssignment(
        userId: string,
        assignment: {
            subject_id: string;
            title: string;
            description?: string;
            deadline?: string;
        }
    ) {
        const { data, error } = await supabase
            .from('assignments')
            .insert({ user_id: userId, ...assignment })
            .select()
            .single();
        return { data, error };
    },

    async updateAssignment(
        id: string,
        updates: Partial<{
            title: string;
            description: string;
            deadline: string;
            completed: boolean;
        }>
    ) {
        const { data, error } = await supabase
            .from('assignments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    },

    async deleteAssignment(id: string) {
        const { error } = await supabase.from('assignments').delete().eq('id', id);
        return { error };
    },
};
