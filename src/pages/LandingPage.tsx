import { useState, useEffect } from 'react';
import { Sparkles, CalendarDays } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Loading upcoming events...</p>
      </div>
    );
  }

  const featuredEvent = events[featuredIndex];

  return (
    <div className="space-y-10 px-4 sm:px-6 pb-20 animate-fade-in">
      
      {/* Hero Welcome Header */}
      <header className="text-center pt-8 pb-4 max-w-xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 rounded-full text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={12} />
          Official Cardpirates Events
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Secure Your Ticket for the Next Battle
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Join premium card tournaments, masterclasses, and trading events. Connect with the elite card collectors community.
        </p>
      </header>

      {/* Featured Shuffling Countdown Hero Section (Mobile Optimized) */}
      {featuredEvent && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-violet-500" />
              Featured Event (Cycling)
            </h2>
            <div className="flex gap-1">
              {events.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setFeaturedIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === featuredIndex ? 'w-4 bg-violet-500' : 'bg-slate-700'}`}
                  aria-label={`Show featured event ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Shuffling Highlight Container */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-slate-800/80 p-5 sm:p-6 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Photo & Timer */}
              <div className="relative aspect-video rounded-2xl overflow-hidden group">
                <img 
                  src={featuredEvent.images.nodes[0]?.url} 
                  alt={featuredEvent.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                
                {featuredEvent.eventDate?.value && (
                  <div className="absolute bottom-4 left-4 right-4 max-w-sm">
                    <CountdownTimer targetDate={featuredEvent.eventDate.value} />
                  </div>
                )}
              </div>

              {/* Event details and Call-To-Actions */}
              <div className="flex flex-col h-full justify-center space-y-4">
                <div>
                  <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">
                    Next up in focus
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
                    <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Entry Ticket</span>
                    <span className="text-xl font-extrabold text-white">
                      {featuredEvent.variants.nodes[0]?.price.amount} {featuredEvent.variants.nodes[0]?.price.currencyCode}
                    </span>
                  </div>

                  <button
                    onClick={() => onQuickBuy(featuredEvent)}
                    className="py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-600/20 transition-all select-none active:scale-[0.98]"
                  >
                    Quick Ticket Purchase
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* Grid of All Upcoming Events */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
          All Upcoming Battles & Masterclasses
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
