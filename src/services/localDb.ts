import Dexie, { type Table } from 'dexie';

export interface LocalTicket {
  id: string; // Unique ticket UUID
  event_id: string; // Shopify/Supabase Event ID
  holder_name: string;
  status: 'open' | 'checked_in';
  checked_in_at?: string | null;
  conflict_duplicate?: boolean;
}

export interface SyncQueueItem {
  id?: number; // Auto-incrementing local ID
  ticketId: string;
  checkedInAt: string; // ISO string when check-in occurred
}

export class ScannerOfflineDatabase extends Dexie {
  tickets!: Table<LocalTicket>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('ScannerOfflineDatabase');
    this.version(1).stores({
      tickets: 'id, event_id, status',
      syncQueue: '++id, ticketId'
    });
  }
}

export const db = new ScannerOfflineDatabase();
