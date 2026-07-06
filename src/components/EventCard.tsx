import { Calendar, MapPin, Info, ShoppingCart } from 'lucide-react';
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
      className="bg-slate-900/40 border border-slate-800/80 hover:border-sky-500/50 shadow-2xl rounded-3xl overflow-hidden group transition-all duration-300 hover:scale-[1.01] hover:shadow-sky-500/5 cursor-pointer"
    >
      <Card.Content className="p-0 flex flex-col h-full">
        {/* Thumbnail and Countdown Container */}
        <div className="relative aspect-video w-full overflow-hidden shrink-0">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Date Badge */}
          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-950/80 backdrop-blur-md rounded-full text-xs font-semibold text-sky-400 border border-slate-800/80">
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
        <div className="flex flex-col p-6 flex-1 justify-between">
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
          <div className="space-y-4">
            {/* Price Tag */}
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider font-sans">Ticketpreis</span>
              <span className="text-lg font-bold text-white">
                {priceAmount} <span className="text-xs text-slate-400 font-medium">{currency}</span>
              </span>
            </div>

            {/* Stops propagation so clicking buttons doesn't trigger card navigation */}
            <div className="grid grid-cols-2 gap-2.5" onClick={(e) => e.stopPropagation()}>
              {/* More Info Button */}
              <Button
                variant="outline"
                onPress={() => navigate(`/events/${event.handle}`)}
                className="py-3.5 px-4 rounded-xl border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold flex items-center gap-1.5 justify-center"
              >
                <Info size={15} />
                <span>Mehr Infos</span>
              </Button>

              {/* Quick Buy Trigger */}
              <Button
                variant="primary"
                onPress={() => onQuickBuy(event)}
                className="py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/10 hover:brightness-105 transition-all flex items-center gap-1.5 justify-center"
              >
                <ShoppingCart size={15} />
                <span>Direkt kaufen</span>
              </Button>
            </div>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
