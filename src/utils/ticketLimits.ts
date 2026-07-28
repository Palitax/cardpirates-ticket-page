export const MAX_TICKETS_PER_EVENT = 10;

/**
 * Gets the total number of tickets a user has already purchased for a specific event.
 */
export function getBoughtTicketsCountForEvent(
  customerId: string | null | undefined,
  eventId: string,
  eventTitle?: string
): number {
  if (!customerId) {
    // If no customer ID, check anonymous storage or global purchased tickets fallback
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('purchased_tickets'));
      let total = 0;
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const tickets = JSON.parse(raw);
          if (Array.isArray(tickets)) {
            total += tickets.filter((t: any) => 
              t.event_id === eventId || 
              (eventTitle && t.title && t.title.toLowerCase().includes(eventTitle.toLowerCase()))
            ).length;
          }
        }
      }
      return total;
    } catch {
      return 0;
    }
  }

  try {
    const key = `purchased_tickets_${customerId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const tickets = JSON.parse(raw);
    if (!Array.isArray(tickets)) return 0;

    return tickets.filter((t: any) => 
      t.event_id === eventId || 
      (eventTitle && t.title && t.title.toLowerCase().includes(eventTitle.toLowerCase()))
    ).length;
  } catch {
    return 0;
  }
}

/**
 * Evaluates whether a user can buy the requested number of tickets for an event.
 */
export function checkTicketPurchaseLimit(
  customerId: string | null | undefined,
  eventId: string,
  requestedQuantity: number,
  currentInCartQuantity: number = 0,
  eventTitle?: string
): { 
  allowed: boolean; 
  maxAllowed: number; 
  alreadyBought: number; 
  reason?: string 
} {
  const alreadyBought = getBoughtTicketsCountForEvent(customerId, eventId, eventTitle);
  const totalAttempted = alreadyBought + currentInCartQuantity + requestedQuantity;

  const maxRemaining = Math.max(0, MAX_TICKETS_PER_EVENT - alreadyBought - currentInCartQuantity);

  if (alreadyBought >= MAX_TICKETS_PER_EVENT) {
    return {
      allowed: false,
      maxAllowed: 0,
      alreadyBought,
      reason: `Du hast bereits das maximale Limit von ${MAX_TICKETS_PER_EVENT} Tickets für dieses Event erreicht.`
    };
  }

  if (totalAttempted > MAX_TICKETS_PER_EVENT) {
    return {
      allowed: false,
      maxAllowed: maxRemaining,
      alreadyBought,
      reason: `Maximal ${MAX_TICKETS_PER_EVENT} Tickets pro Event erlaubt. Du besitzt bereits ${alreadyBought} Tickets ${currentInCartQuantity > 0 ? `und hast ${currentInCartQuantity} im Warenkorb` : ''}.`
    };
  }

  return {
    allowed: true,
    maxAllowed: maxRemaining,
    alreadyBought
  };
}
