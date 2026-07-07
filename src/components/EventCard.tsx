import { useState, useEffect } from 'react';
import { MapPin, Share2, Check } from 'lucide-react';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from './CountdownTimer';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
  event: ShopifyProduct;
  onQuickBuy: (event: ShopifyProduct) => void;
  purchasedEventIds?: string[];
}

export default function EventCard({ event, onQuickBuy, purchasedEventIds = [] }: EventCardProps) {
  const navigate = useNavigate();
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!(navigator as any).share) {
      setIsShareSupported(true);
    }
  }, []);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: `Komm zu unserem Event: ${event.title}!`,
        url: `${window.location.origin}/events/${event.handle}`,
      });
    } catch (err) {
      console.log('Share failed or cancelled', err);
    }
  };

  const title = event.title;
  const location = event.eventLocation?.value || 'TBA';
  const dateValue = event.eventDate?.value;
  
  const dateObj = dateValue ? new Date(dateValue) : null;
  const day = dateObj ? dateObj.getDate() : '--';
  const month = dateObj ? dateObj.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase() : 'TBA';

  const priceAmount = event.variants.nodes[0]?.price.amount || '0.00';
  const currency = event.variants.nodes[0]?.price.currencyCode || 'EUR';
  const isPurchased = purchasedEventIds.includes(event.id);

  return (
    <div 
      onClick={() => navigate(`/events/${event.handle}`)}
      className="relative w-full h-[500px] flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur-xl shadow-2xl shadow-black/60 overflow-visible group hover:scale-[1.01] hover:border-white/20 transition-all duration-300 cursor-pointer"
    >
      {/* Glossy Reflection Overlay */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.01] via-transparent to-white/[0.04] pointer-events-none z-10" />

      {/* Edge highlight overlay */}
      <div className="absolute inset-px rounded-[23px] border border-white/[0.03] pointer-events-none z-10" />

      {/* Top Part: Main Body */}
      <div className="w-full flex flex-col flex-1 min-h-0">
        
        {/* Cover Image Container */}
        <div className="relative h-[200px] w-full overflow-hidden rounded-t-[23px] border-b border-white/[0.08] bg-zinc-950 shrink-0">
          {event.images.nodes[0]?.url && (
            <img 
              src={event.images.nodes[0].url} 
              alt={title}
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}
          {/* Cover gradient blending */}
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />

          {/* Date Circle Badge (Top-Left of Image) */}
          <div className="absolute top-4 left-4 z-20 w-14 h-14 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/20 shadow-lg flex flex-col items-center justify-center text-white">
            <span className="text-base font-black leading-none tracking-tight">{day}</span>
            <span className="text-[9px] font-extrabold tracking-wider leading-none text-white/70 mt-0.5">{month}</span>
          </div>

          {/* Share Button (Top-Right of Image) */}
          {isShareSupported && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleShare();
              }}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-sm"
              aria-label="Event teilen"
            >
              <Share2 size={13} />
            </button>
          )}

          {/* Countdown Badge (Bottom-Right of Image) */}
          {dateValue && (
            <div className="absolute bottom-3 right-3 z-20 scale-[0.85] origin-bottom-right">
              <CountdownTimer targetDate={dateValue} />
            </div>
          )}
        </div>

        {/* Text Details Area */}
        <div className="flex-1 p-5 space-y-3 text-left flex flex-col justify-center min-h-0">
          <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-white/95 transition-colors uppercase font-mono line-clamp-2">
            {title}
          </h3>

          <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-semibold">
            <MapPin size={13} className="text-white/40 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">
            {event.description}
          </p>
        </div>

      </div>

      {/* CSS Notches Overlayed on Edges */}
      {/* Left Notch */}
      <div className="absolute -left-3 bottom-[110px] w-6 h-6 rounded-full bg-[#0b0f19] border border-white/[0.08] z-20 shadow-[inset_-3px_0_4px_rgba(0,0,0,0.5)]" />
      {/* Right Notch */}
      <div className="absolute -right-3 bottom-[110px] w-6 h-6 rounded-full bg-[#0b0f19] border border-white/[0.08] z-20 shadow-[inset_3px_0_4px_rgba(0,0,0,0.5)]" />
      
      {/* Dashed Tear-off Perforation Line */}
      <div className="absolute inset-x-0 bottom-[121px] border-t border-dashed border-white/15 z-10 pointer-events-none" />

      {/* Bottom Part: Ticket Stub (Height 110px) */}
      <div className="h-[110px] w-full flex items-center justify-between p-5 pt-7 z-10 relative bg-white/[0.01] rounded-b-3xl">
        {/* Left Glow effect behind QR */}
        <div className="absolute left-4 bottom-4 w-16 h-16 bg-white/[0.02] rounded-full blur-xl pointer-events-none" />
        
        {/* QR Code Graphic (Left) */}
        <div className="p-2 bg-white/[0.04] border border-white/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner z-10">
          <svg className="w-10 h-10 text-white/50 group-hover:text-white/80 transition-colors duration-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M 2 2 H 8 V 8 H 2 Z M 4 4 V 6 H 6 V 4 Z M 16 2 H 22 V 8 H 16 Z M 18 4 V 6 H 20 V 4 Z M 2 16 H 8 V 22 H 2 Z M 4 18 V 20 H 6 V 18 Z M 11 2 H 13 V 4 H 11 Z M 11 6 H 13 V 8 H 11 Z M 11 11 H 13 V 13 H 11 Z M 16 11 H 18 V 13 H 16 Z M 16 16 H 18 V 18 H 16 Z M 11 16 H 13 V 18 H 11 Z M 18 20 H 20 V 22 H 18 Z M 13 20 H 15 V 22 H 13 Z M 20 16 H 22 V 18 H 20 Z M 20 11 H 22 V 13 H 20 Z" />
          </svg>
        </div>

        {/* Price & Action Area (Right) */}
        <div className="flex flex-col items-end text-right justify-center gap-1.5 flex-1 min-w-0 z-10">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Ticketpreis</span>
            <span className="text-base font-extrabold text-white leading-none mt-0.5">
              {priceAmount} <span className="text-[10px] text-zinc-400 font-semibold">{currency}</span>
            </span>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            {isPurchased ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg text-[10px] font-extrabold text-green-400">
                <Check size={11} strokeWidth={3} /> ERWORBEN
              </span>
            ) : (
              <button
                onClick={() => onQuickBuy(event)}
                className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] transition-all select-none active:scale-[0.98] cursor-pointer shadow-lg shadow-white/5 border border-white"
              >
                Sichern
              </button>
            )}
          </div>
        </div>

        {/* Bottom Notch cutout */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#0b0f19] border border-white/[0.08] z-20 shadow-[inset_0_3px_4px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
}
