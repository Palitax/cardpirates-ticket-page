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
  const image = event.images.nodes[0]?.url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600';
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
      className="bg-transparent border-none shadow-none rounded-none overflow-hidden group transition-all duration-300 hover:scale-[1.005] cursor-pointer"
    >
      <Card.Content className="p-0 flex flex-col h-full">
        {/* Thumbnail and Countdown Container */}
        <div className="relative aspect-video w-full overflow-hidden shrink-0 rounded-none">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Date Badge */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 backdrop-blur-md rounded-none text-xs font-semibold text-sky-400 border border-slate-900">
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
        <div className="flex flex-col p-5 flex-1 justify-between bg-slate-900/10 border border-slate-900/40 border-t-0">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-2 line-clamp-1 group-hover:text-sky-400 transition-colors">
              {title}
            </h3>

            <div className="flex items-center gap-2 text-slate-400 text-sm mb-4">
              <MapPin size={15} className="text-slate-500 shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
              {event.description}
            </p>
          </div>

          {/* Buy/Details Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-900/50">
            {/* Price Tag */}
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ticketpreis</span>
              <span className="text-lg font-bold text-white leading-tight">
                {priceAmount} <span className="text-xs text-slate-400 font-medium">{currency}</span>
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {/* Share or More Info Button */}
              {isShareSupported ? (
                <Button
                  variant="outline"
                  onPress={handleShare}
                  className="w-10 h-10 min-w-0 p-0 rounded-none border-slate-800 hover:border-slate-650 text-slate-200 flex items-center justify-center transition-all cursor-pointer bg-slate-950/40"
                  aria-label="Event teilen"
                >
                  <Share2 size={16} className="text-sky-400" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onPress={() => navigate(`/events/${event.handle}`)}
                  className="w-10 h-10 min-w-0 p-0 rounded-none border-slate-800 hover:border-slate-600 text-slate-200 flex items-center justify-center transition-all cursor-pointer bg-slate-950/40"
                  aria-label="Mehr Infos"
                >
                  <Info size={16} />
                </Button>
              )}

              {/* Quick Buy Trigger */}
              <Button
                variant="primary"
                onPress={() => onQuickBuy(event)}
                className="w-10 h-10 min-w-0 p-0 rounded-none bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-lg shadow-sky-500/10 hover:brightness-105 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Direkt kaufen"
              >
                <ShoppingCart size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
