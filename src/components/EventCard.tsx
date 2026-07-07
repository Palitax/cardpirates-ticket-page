import { useState, useEffect } from 'react';
import { Calendar, MapPin, Info, ShoppingCart, Share2 } from 'lucide-react';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from './CountdownTimer';
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@heroui/react';

interface EventCardProps {
  event: ShopifyProduct;
  onQuickBuy: (event: ShopifyProduct) => void;
}

export default function EventCard({ event, onQuickBuy }: EventCardProps) {
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
  const formattedDate = dateValue 
    ? new Date(dateValue).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'TBA';

  const priceAmount = event.variants.nodes[0]?.price.amount || '0.00';
  const currency = event.variants.nodes[0]?.price.currencyCode || 'EUR';

  return (
    <Card 
      onClick={() => navigate(`/events/${event.handle}`)}
      className="bg-zinc-950/20 hover:bg-zinc-950/30 border border-zinc-900/50 hover:border-zinc-800 rounded-3xl overflow-hidden group transition-all duration-300 hover:scale-[1.01] cursor-pointer shadow-lg shadow-black/10"
    >
      <Card.Content className="p-6 flex flex-col h-full justify-between gap-5">
        <div className="space-y-3.5">
          {/* Top Row: Date Badge and Countdown */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950/60 border border-zinc-900 rounded-xl text-xs font-semibold text-zinc-300">
              <Calendar size={13} className="text-zinc-500" />
              <span>{formattedDate}</span>
            </div>
            {dateValue && (
              <div className="scale-90 origin-right">
                <CountdownTimer targetDate={dateValue} />
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight group-hover:text-zinc-300 transition-colors">
            {title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-2 text-zinc-400 text-sm">
            <MapPin size={15} className="text-zinc-500 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          {/* Description */}
          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3">
            {event.description}
          </p>
        </div>

        {/* Buy/Details Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-900/40">
          {/* Price Tag */}
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ticketpreis</span>
            <span className="text-lg font-extrabold text-white leading-tight">
              {priceAmount} <span className="text-xs text-zinc-400 font-medium">{currency}</span>
            </span>
          </div>

          {/* Buttons Row */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Share or More Info Button */}
            {isShareSupported ? (
              <Button
                variant="outline"
                onPress={handleShare}
                className="w-10 h-10 min-w-0 p-0 rounded-xl border-zinc-800 hover:border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer bg-zinc-950/40"
                aria-label="Event teilen"
              >
                <Share2 size={16} className="text-white" />
              </Button>
            ) : (
              <Button
                variant="outline"
                onPress={() => navigate(`/events/${event.handle}`)}
                className="w-10 h-10 min-w-0 p-0 rounded-xl border-zinc-800 hover:border-zinc-700 text-zinc-200 flex items-center justify-center transition-all cursor-pointer bg-zinc-950/40"
                aria-label="Mehr Infos"
              >
                <Info size={16} />
              </Button>
            )}

            {/* Quick Buy Trigger */}
            <Button
              variant="primary"
              onPress={() => onQuickBuy(event)}
              className="w-10 h-10 min-w-0 p-0 rounded-xl bg-white hover:bg-zinc-200 text-black border border-white flex items-center justify-center transition-all cursor-pointer font-bold shadow-lg shadow-white/5"
              aria-label="Direkt kaufen"
            >
              <ShoppingCart size={16} />
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
