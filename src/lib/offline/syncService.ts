import { offlineDb, SyncQueue } from './db';
import { supabase } from '@/lib/supabase/client';

export class SyncService {
    private isOnline = typeof window !== 'undefined' && navigator.onLine;
    private syncInProgress = false;

    constructor() {
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.isOnline = true;
                this.syncAll();
            });
            window.addEventListener('offline', () => {
                this.isOnline = false;
            });
        }
    }

    async syncAll() {
        if (!this.isOnline || this.syncInProgress) return;

        this.syncInProgress = true;
        try {
            await this.syncNotes();
            await this.processSyncQueue();
        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    async syncNotes() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Upload unsynced notes
            const unsyncedNotes = await offlineDb.notes
                .where('synced')
                .equals(0)  // Use 0 instead of false for IndexedDB
                .toArray();

            for (const note of unsyncedNotes) {
                try {
                    if (note.deleted) {
                        await supabase.from('notes').delete().eq('id', note.id);
                        await offlineDb.notes.delete(note.id);
                    } else {
                        const { data: existing } = await supabase
                            .from('notes')
                            .select('*')
                            .eq('id', note.id)
                            .single();

                        if (existing) {
                            await supabase
                                .from('notes')
                                .update({
                                    title: note.title,
                                    content: note.content,
                                    tags: note.tags,
                                    updated_at: note.updatedAt,
                                })
                                .eq('id', note.id);
                        } else {
                            await supabase.from('notes').insert({
                                id: note.id,
                                user_id: user.id,
                                title: note.title,
                                content: note.content,
                                tags: note.tags,
                                created_at: note.createdAt,
                                updated_at: note.updatedAt,
                            });
                        }

                        await offlineDb.notes.update(note.id, { synced: 1 });
                    }
                } catch (error) {
                    console.error('Error syncing note:', error);
                }
            }

            // Download new/updated notes
            const lastSyncTime = localStorage.getItem('lastNoteSync');
            const query = supabase
                .from('notes')
                .select('*')
                .eq('user_id', user.id);

            if (lastSyncTime) {
                query.gt('updated_at', lastSyncTime);
            }

            const { data: serverNotes } = await query;

            if (serverNotes) {
                for (const note of serverNotes) {
                    await offlineDb.notes.put({
                        id: note.id,
                        userId: note.user_id,
                        title: note.title,
                        content: note.content || '',
                        tags: note.tags || [],
                        createdAt: note.created_at,
                        updatedAt: note.updated_at,
                        synced: 1,
                    });
                }
            }

            localStorage.setItem('lastNoteSync', new Date().toISOString());
        } catch (error) {
            console.error('Error in syncNotes:', error);
            // Silently fail - user can continue offline
        }
    }

    async processSyncQueue() {
        const queue = await offlineDb.syncQueue.toArray();

        for (const item of queue) {
            try {
                // Process sync operation
                await offlineDb.syncQueue.delete(item.id!);
            } catch (error) {
                console.error('Error processing sync queue:', error);
            }
        }
    }
}

export const syncService = new SyncService();
