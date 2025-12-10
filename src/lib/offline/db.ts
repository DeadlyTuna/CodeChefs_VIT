import Dexie, { Table } from 'dexie';

export interface OfflineNote {
    id: string;
    userId: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    synced: boolean;
    deleted?: boolean;
}

export interface SyncQueue {
    id?: number;
    operation: 'create' | 'update' | 'delete';
    table: 'notes';
    data: any;
    timestamp: number;
}

export class OfflineDatabase extends Dexie {
    notes!: Table<OfflineNote, string>;
    syncQueue!: Table<SyncQueue, number>;

    constructor() {
        super('UnifiedAppDB');
        this.version(1).stores({
            notes: 'id, userId, synced, updatedAt',
            syncQueue: '++id, timestamp, table',
        });
    }
}

export const offlineDb = new OfflineDatabase();
