import { Calendar, MapPin, Info, ShoppingCart } from 'lucide-react';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from './CountdownTimer';
import { useNavigate } from 'react-router-dom';

interface EventCardProps {
  event: ShopifyProduct;
  onQuickBuy: (event: ShopifyProduct) => void;
}

export default function EventCard({ event, onQuickBuy }: EventCardProps) {
  const navigate = useNavigate();

  const title = event.title;
  const image = event.images.nodes[0]?.url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600';
  const location = event.eventLocation?.value || 'TBA';
  const dateValue = event.eventDate?.value;
  const formattedDate = dateValue 
    ? new Date(dateValue).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'TBA';

  const priceAmount = event.variants.nodes[0]?.price.amount || '0.00';
  const currency = event.variants.nodes[0]?.price.currencyCode || 'EUR';

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-3xl overflow-hidden border border-slate-800/60 shadow-xl transition-all duration-300 hover:scale-[1.01] hover:border-slate-700/80">
      {/* Thumbnail and Countdown Container */}
      <div className="relative aspect-video w-full overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          loading="lazy"
        />
        
        {/* Date Badge */}
        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full text-xs font-semibold text-violet-400 border border-slate-800/80">
          <Calendar size={13} />
          {formattedDate}
        </div>

        {/* Countdown Overlap (Bottom right on card) */}
        {dateValue && (
          <div className="absolute bottom-4 right-4 w-48 shadow-2xl">
            <CountdownTimer targetDate={dateValue} />
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="flex flex-col p-6 flex-1">
        <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-2 line-clamp-1">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
          <MapPin size={15} className="text-slate-500 shrink-0" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
          {event.description}
        </p>

        {/* Buy/Details Actions */}
        <div className="mt-auto flex flex-col gap-3">
          {/* Price Tag */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ticketpreis</span>
            <span className="text-lg font-bold text-white">
              {priceAmount} <span className="text-xs text-slate-400 font-medium">{currency}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* More Info Link */}
            <button
              onClick={() => navigate(`/events/${event.handle}`)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 text-slate-200 text-sm font-semibold transition-all select-none active:scale-[0.98]"
            >
              <Info size={16} />
              Mehr Infos
            </button>

            {/* Quick Buy Trigger */}
            <button
              onClick={() => onQuickBuy(event)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-violet-600/15 transition-all select-none active:scale-[0.98]"
            >
              <ShoppingCart size={16} />
              Direkt kaufen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
