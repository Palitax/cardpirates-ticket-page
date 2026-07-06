import { useState, useEffect } from 'react';
import type { TouchEvent } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@heroui/react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import EventCard from '../components/EventCard';
import CountdownTimer from '../components/CountdownTimer';

interface LandingPageProps {
  onQuickBuy: (event: ShopifyProduct) => void;
}

export default function LandingPage({ onQuickBuy }: LandingPageProps) {
  const [events, setEvents] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  // Swipe gesture tracking state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    async function loadEvents() {
      try {
        const products = await shopifyService.getEvents();
        setEvents(products);
      } catch (err) {
        console.error('Failed to load events', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Shuffle/cycle through featured events at the top every 8 seconds
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      setFeaturedIndex((prevIndex) => (prevIndex + 1) % events.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [events]);

  // Swipe Handlers
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && events.length > 0) {
      setFeaturedIndex((prev) => (prev + 1) % events.length);
    }
    if (isRightSwipe && events.length > 0) {
      setFeaturedIndex((prev) => (prev - 1 + events.length) % events.length);
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Lade anstehende Events...</p>
      </div>
    );
  }

  const featuredEvent = events[featuredIndex];

  return (
    <div className="space-y-10 px-4 sm:px-6 pb-20 animate-fade-in">
      
      {/* Hero Welcome Header */}
      <header className="text-center pt-8 pb-4 max-w-xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Werde Teil der Crew!
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Triff uns und unsere Community auf einem unserer spannenden Events. Von exklusiven Cardshows über packende Turniere bis hin zu gemütlichen Community Meetups und Trade Nights.
        </p>
      </header>

      {/* Featured Shuffling Countdown Hero Section (Mobile Optimized & Swipeable) */}
      {featuredEvent && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-sky-500" />
              Highlight-Event (Wische zum Blättern)
            </h2>
            <div className="flex gap-1">
              {events.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === featuredIndex ? 'w-4 bg-sky-500' : 'bg-slate-700'}`}
                  aria-label={`Zeige Highlight-Event ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Shuffling Highlight Container with Swipe Gestures */}
          <div 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-800/80 p-5 sm:p-6 shadow-2xl touch-pan-y"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Photo & Timer Overlay on Top-Right */}
              <div className="relative aspect-video rounded-2xl overflow-hidden group">
                <img 
                  src={featuredEvent.images.nodes[0]?.url} 
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                
                {featuredEvent.eventDate?.value && (
                  <div className="absolute top-4 right-4 w-44 sm:w-48 shadow-2xl">
                    <CountdownTimer targetDate={featuredEvent.eventDate.value} />
                  </div>
                )}
              </div>

              {/* Event details and Call-To-Actions */}
              <div className="flex flex-col h-full justify-center space-y-4">
                <div>
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest">
                    Als nächstes im Fokus
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight mt-1">
                    {featuredEvent.title}
                  </h3>
                </div>

                <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                  {featuredEvent.description}
                </p>

                <div className="pt-2 border-t border-slate-900 flex flex-wrap gap-4 items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Eintrittsticket</span>
                    <span className="text-xl font-extrabold text-white">
                      {featuredEvent.variants.nodes[0]?.price.amount} {featuredEvent.variants.nodes[0]?.price.currencyCode}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    onPress={() => onQuickBuy(featuredEvent)}
                    className="py-3 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/10 hover:brightness-105 transition-all select-none active:scale-[0.98]"
                  >
                    Direktkauf Ticket
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Grid of All Upcoming Events */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
          Alle anstehenden Events & Meetups
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onQuickBuy={onQuickBuy}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
