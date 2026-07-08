import { supabase } from './supabase';
import { db, type LocalTicket } from './localDb';

export interface ScanResult {
  success: boolean;
  reason?: 'not_found' | 'already_checked_in' | 'network_error' | 'invalid_id';
  holderName?: string;
  isOffline?: boolean;
}

export const syncService = {
  /**
   * Downloads all tickets for a specific event from Supabase and caches them in IndexedDB.
   */
  async downloadEventTickets(eventId: string): Promise<{ success: boolean; count: number; error?: string }> {
    if (!supabase) {
      return { success: false, count: 0, error: 'Supabase-Client nicht initialisiert.' };
    }

    try {
      // 1. Fetch from Supabase
      const { data: serverTickets, error } = await supabase
        .from('tickets')
        .select('id, event_id, holder_name, status, checked_in_at, conflict_duplicate')
        .eq('event_id', eventId);

      if (error) throw error;
      if (!serverTickets) throw new Error('Keine Ticket-Daten empfangen.');

      // 2. Clear old cached tickets for this event locally
      await db.tickets.where('event_id').equals(eventId).delete();

      // 3. Map and write to local IndexedDB
      const localTickets: LocalTicket[] = serverTickets.map(t => ({
        id: t.id,
        event_id: t.event_id,
        holder_name: t.holder_name,
        status: t.status as 'open' | 'checked_in',
        checked_in_at: t.checked_in_at,
        conflict_duplicate: t.conflict_duplicate
      }));

      if (localTickets.length > 0) {
        await db.tickets.bulkPut(localTickets);
      }

      return { success: true, count: localTickets.length };
    } catch (err: any) {
      console.error('Error downloading event tickets:', err);
      return { success: false, count: 0, error: err.message || 'Verbindungsfehler' };
    }
  },

  /**
   * Processes a ticket scan.
   * Attempt online-first checking against Supabase.
   * Fallback to offline IndexedDB checking if offline or on network failure.
   */
  async checkInTicket(ticketId: string, eventId: string): Promise<ScanResult> {
    // Validate UUID format roughly
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ticketId)) {
      return { success: false, reason: 'invalid_id' };
    }

    const isOnline = navigator.onLine;

    if (isOnline && supabase) {
      try {
        // ONLINE SCAN ROUTINE
        // 1. Get ticket status from server
        const { data: ticket, error: fetchError } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();

        if (fetchError || !ticket) {
          return { success: false, reason: 'not_found' };
        }

        // Verify it belongs to the active event
        if (ticket.event_id !== eventId) {
          return { success: false, reason: 'not_found' };
        }

        // Check if already checked in
        if (ticket.status === 'checked_in') {
          // Flag as duplicate conflict on server
          await supabase
            .from('tickets')
            .update({ conflict_duplicate: true })
            .eq('id', ticketId);

          // Update local cache too
          await db.tickets.update(ticketId, { status: 'checked_in', conflict_duplicate: true });
          
          return { success: false, reason: 'already_checked_in', holderName: ticket.holder_name };
        }

        // 2. Perform check-in update on server
        const scanTime = new Date().toISOString();
        const { error: updateError } = await supabase
          .from('tickets')
          .update({
            status: 'checked_in',
            checked_in_at: scanTime
          })
          .eq('id', ticketId);

        if (updateError) throw updateError;

        // 3. Keep local cache updated
        await db.tickets.update(ticketId, {
          status: 'checked_in',
          checked_in_at: scanTime
        });

        return { success: true, holderName: ticket.holder_name, isOffline: false };
      } catch (err) {
        console.warn('Online scan failed, falling back to offline scan:', err);
        // Fall through to offline scanning if network call failed
      }
    }

    // OFFLINE SCAN ROUTINE (Fallback)
    try {
      const localTicket = await db.tickets.get(ticketId);

      if (!localTicket || localTicket.event_id !== eventId) {
        return { success: false, reason: 'not_found', isOffline: true };
      }

      if (localTicket.status === 'checked_in') {
        // Mark local duplicate conflict
        await db.tickets.update(ticketId, { conflict_duplicate: true });
        return { success: false, reason: 'already_checked_in', holderName: localTicket.holder_name, isOffline: true };
      }

      // Check in locally
      const scanTime = new Date().toISOString();
      await db.tickets.update(ticketId, {
        status: 'checked_in',
        checked_in_at: scanTime
      });

      // Queue for background sync
      await db.syncQueue.add({
        ticketId,
        checkedInAt: scanTime
      });

      return { success: true, holderName: localTicket.holder_name, isOffline: true };
    } catch (err) {
      console.error('Offline scan failed:', err);
      return { success: false, reason: 'network_error', isOffline: true };
    }
  },

  /**
   * Synchronizes the offline queue with Supabase.
   */
  async syncOfflineQueue(): Promise<{ success: boolean; syncedCount: number; errorsCount: number }> {
    if (!supabase) {
      return { success: false, syncedCount: 0, errorsCount: 0 };
    }

    let syncedCount = 0;
    let errorsCount = 0;

    try {
      const queue = await db.syncQueue.toArray();
      if (queue.length === 0) {
        return { success: true, syncedCount: 0, errorsCount: 0 };
      }

      for (const item of queue) {
        try {
          // Get server status
          const { data: ticket, error: fetchError } = await supabase
            .from('tickets')
            .select('status')
            .eq('id', item.ticketId)
            .single();

          if (fetchError || !ticket) {
            // Ticket not found on server anymore, skip and delete from queue to avoid blockages
            await db.syncQueue.delete(item.id!);
            syncedCount++;
            continue;
          }

          if (ticket.status === 'checked_in') {
            // Already checked in (Double Scan detected post-sync)
            await supabase
              .from('tickets')
              .update({ conflict_duplicate: true })
              .eq('id', item.ticketId);
            
            // Mark locally as conflict too
            await db.tickets.update(item.ticketId, { conflict_duplicate: true });
          } else {
            // Not checked in yet, register the offline check-in time
            await supabase
              .from('tickets')
              .update({
                status: 'checked_in',
                checked_in_at: item.checkedInAt
              })
              .eq('id', item.ticketId);
          }

          // Successfully processed, delete from queue
          await db.syncQueue.delete(item.id!);
          syncedCount++;
        } catch (err) {
          console.error(`Error syncing queue item ${item.ticketId}:`, err);
          errorsCount++;
          // Abort loop on connection failure to avoid clearing queue incorrectly
          break;
        }
      }

      return { success: errorsCount === 0, syncedCount, errorsCount };
    } catch (err) {
      console.error('Failed to run sync queue:', err);
      return { success: false, syncedCount, errorsCount };
    }
  }
};
