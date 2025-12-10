import { offlineDb } from '@/lib/offline/db';
import { supabase } from '@/lib/supabase/client';
import { syncService } from '@/lib/offline/syncService';

export const notesService = {
    async createNote(userId: string, title: string, content: string, tags: string[] = []) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await offlineDb.notes.add({
            id,
            userId,
            title,
            content,
            tags,
            createdAt: now,
            updatedAt: now,
            synced: false,
        });

        syncService.syncAll();
        return id;
    },

    async updateNote(id: string, updates: Partial<{ title: string; content: string; tags: string[] }>) {
        await offlineDb.notes.update(id, {
            ...updates,
            updatedAt: new Date().toISOString(),
            synced: false,
        });

        syncService.syncAll();
    },

    async deleteNote(id: string) {
        await offlineDb.notes.update(id, {
            deleted: true,
            synced: false,
        });

        syncService.syncAll();
    },

    async getNotes(userId: string) {
        return await offlineDb.notes
            .where('userId')
            .equals(userId)
            .and(note => !note.deleted)
            .toArray();
    },

    async searchNotes(userId: string, query: string) {
        const allNotes = await this.getNotes(userId);
        const lowerQuery = query.toLowerCase();

        return allNotes.filter(note =>
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery) ||
            note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
    },
};
