import React from 'react';
import { Flame, Zap, XCircle } from 'lucide-react';

interface TicketInventoryBadgeProps {
  availableForSale: boolean;
  quantityAvailable?: number | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TicketInventoryBadge: React.FC<TicketInventoryBadgeProps> = ({
  availableForSale,
  quantityAvailable,
  className = '',
  size = 'md'
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-1 text-[10px] gap-1.5',
    lg: 'px-3 py-1.5 text-xs gap-1.5'
  }[size];

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  }[size];

  // 1. SOLD OUT STATE (availableForSale is false OR quantityAvailable is 0)
  if (!availableForSale || quantityAvailable === 0) {
    return (
      <span className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-sm ${sizeClasses} ${className}`}>
        <XCircle size={iconSizes} className="shrink-0 text-rose-400" />
        <span>Ausverkauft</span>
      </span>
    );
  }

  // If quantityAvailable is specified
  if (typeof quantityAvailable === 'number' && quantityAvailable > 0) {
    // 2. CRITICAL LOW STOCK (Under 10 tickets)
    if (quantityAvailable < 10) {
      return (
        <span className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 animate-pulse shadow-sm shadow-rose-900/20 ${sizeClasses} ${className}`}>
          <Flame size={iconSizes} className="shrink-0 text-rose-400 fill-rose-500/40" />
          <span>Fast ausverkauft – Nur noch {quantityAvailable} {quantityAvailable === 1 ? 'Ticket' : 'Tickets'}!</span>
        </span>
      );
    }

    // 3. LOW STOCK (Under 20 tickets: 10 to 19 tickets)
    if (quantityAvailable < 20) {
      return (
        <span className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 shadow-sm ${sizeClasses} ${className}`}>
          <Zap size={iconSizes} className="shrink-0 text-amber-400 fill-amber-500/30" />
          <span>Geringer Bestand – Nur {quantityAvailable} Tickets</span>
        </span>
      );
    }
  }

  // Default available state
  return (
    <span className={`inline-flex items-center font-extrabold uppercase tracking-wider rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 ${sizeClasses} ${className}`}>
      <span>Sofort verfügbar</span>
    </span>
  );
};

export default TicketInventoryBadge;
