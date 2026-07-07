import { useState, useEffect } from 'react';
import type { TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Info, ShoppingCart, MapPin, Share2 } from 'lucide-react';
import { Button } from '@heroui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import EventCard from '../components/EventCard';
import CountdownTimer from '../components/CountdownTimer';

interface LandingPageProps {
  onQuickBuy: (event: ShopifyProduct) => void;
}

export default function LandingPage({ onQuickBuy }: LandingPageProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredIndex, setFeaturedIndex] = useState(0);



  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!(navigator as any).share) {
      setIsShareSupported(true);
    }
  }, []);

  const handleShareFeatured = async () => {
    if (!events[featuredIndex]) return;
    const fEvent = events[featuredIndex];
    try {
      await navigator.share({
        title: fEvent.title,
        text: `Komm zu unserem Event: ${fEvent.title}!`,
        url: `${window.location.origin}/events/${fEvent.handle}`,
      });
    } catch (err) {
      console.log('Share failed or cancelled', err);
    }
  };

  // Swipe gesture tracking state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Swipe Tutorial state
  const [isInitialMount, setIsInitialMount] = useState(true);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubmitted(true);
    setNewsletterEmail('');
    setTimeout(() => {
      setNewsletterSubmitted(false);
    }, 5000);
  };

  useEffect(() => {
    const tutorialTimer = setTimeout(() => {
      setIsInitialMount(false);
    }, 5200);

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

    return () => clearTimeout(tutorialTimer);
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
    setIsInitialMount(false);
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
      <header className="text-center pt-8 pb-4 max-w-xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
          Werde Teil der Crew!
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
          Triff uns und unsere Community auf einem unserer spannenden Events. Von exklusiven Cardshows über packende Turniere bis hin zu gemütlichen Community Meetups und Trade Nights.
        </p>
      </header>

      {/* Featured Shuffling Countdown Hero Section (Mobile Optimized & Swipeable) */}
      {featuredEvent && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <CalendarDays size={14} className="text-sky-500" />
              Nächstes Event
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
            onClick={() => navigate(`/events/${featuredEvent.handle}`)}
            className="relative overflow-hidden rounded-none bg-transparent p-0 touch-pan-y cursor-pointer transition-colors duration-300"
          >
            {isInitialMount && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 5.2, times: [0, 0.05, 0.95, 1], ease: "easeInOut" }}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/65 backdrop-blur-[2px] rounded-3xl pointer-events-none"
              >
                <div className="relative flex items-center justify-center w-36 h-36">
                  {/* Left Arrow */}
                  <motion.div
                    animate={{ x: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
                    className="absolute left-1 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  >
                    <svg className="w-8 h-8 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </motion.div>

                  {/* Finger Component */}
                  <motion.div
                    animate={{
                      x: [0, -25, 25, 0],
                      scale: [1, 0.93, 0.93, 1]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      times: [0, 0.35, 0.7, 1],
                      ease: "easeInOut"
                    }}
                    className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                  >
                    <svg className="w-12 h-12 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 11V4a1.5 1.5 0 0 0-3 0v7M9 11V9a1.5 1.5 0 0 0-3 0v2M6 11V10a1.5 1.5 0 0 0-3 0v5a7 7 0 0 0 14 0v-4a1.5 1.5 0 0 0-3 0v3M15 11v-1a1.5 1.5 0 0 0-3 0v3" />
                    </svg>
                  </motion.div>

                  {/* Right Arrow */}
                  <motion.div
                    animate={{ x: [0, 12, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
                    className="absolute right-1 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                  >
                    <svg className="w-8 h-8 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </motion.div>
                </div>
                
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
                  Wischen zum Blättern
                </span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={featuredIndex}
                initial={{ opacity: 0, x: 40, filter: 'blur(6px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: -40, filter: 'blur(6px)' }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
              >
                {/* Photo & Timer Overlay on Top-Right */}
                <div className="relative aspect-video rounded-none overflow-hidden group">
                  <img 
                    src={featuredEvent.images.nodes[0]?.url} 
                    alt={featuredEvent.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                </div>

                {/* Event details and Call-To-Actions */}
                <div className="flex flex-col h-full justify-center space-y-4 relative">
                  {featuredEvent.eventDate?.value && (
                    <div className="absolute top-0 right-0 z-10" onClick={(e) => e.stopPropagation()}>
                      <CountdownTimer targetDate={featuredEvent.eventDate.value} />
                    </div>
                  )}

                  <div className="pr-28 sm:pr-32">
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-widest">
                      Als nächstes im Fokus
                    </span>
                    <h3 className="text-2xl font-bold text-white tracking-tight mt-1 hover:text-sky-400 transition-colors">
                      {featuredEvent.title}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-2" onClick={(e) => e.stopPropagation()}>
                      <MapPin size={14} className="text-slate-500 shrink-0" />
                      <span>{featuredEvent.eventLocation?.value || 'TBA'}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                    {featuredEvent.description}
                  </p>

                  <div className="pt-4 border-t border-slate-900 flex flex-wrap gap-4 items-center justify-between">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Eintrittsticket</span>
                      <span className="text-xl font-extrabold text-white">
                        {featuredEvent.variants.nodes[0]?.price.amount} {featuredEvent.variants.nodes[0]?.price.currencyCode}
                      </span>
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Share or More Info Button */}
                      {isShareSupported ? (
                        <Button
                          variant="outline"
                          onPress={handleShareFeatured}
                          className="w-10 h-10 min-w-0 p-0 rounded-none border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                          aria-label="Event teilen"
                        >
                          <Share2 size={16} className="text-sky-400" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onPress={() => navigate(`/events/${featuredEvent.handle}`)}
                          className="w-10 h-10 min-w-0 p-0 rounded-none border-slate-700 hover:border-slate-500 text-slate-200 flex items-center justify-center transition-all cursor-pointer"
                          aria-label="Mehr Infos"
                        >
                          <Info size={16} />
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        onPress={() => onQuickBuy(featuredEvent)}
                        className="w-10 h-10 min-w-0 p-0 rounded-none bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 shadow-lg shadow-sky-500/10 hover:brightness-105 flex items-center justify-center transition-all cursor-pointer"
                        aria-label="Direktkauf Ticket"
                      >
                        <ShoppingCart size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
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

      {/* Community Call to Actions & Newsletter (Bottom of Page) */}
      <section className="pt-10 border-t border-slate-900/60 max-w-xl mx-auto text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="outline"
            onPress={() => window.open('https://discord.gg/8yRykEdr4G', '_blank')}
            className="bg-[#5865F2] hover:bg-[#4752C4] border-none text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-[#5865F2]/10 transition-all active:scale-[0.98] w-fit cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.03c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.03A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
            </svg>
            <span>Tritt unserem Discord bei</span>
          </Button>

          {/* Email Newsletter Input container */}
          <div className="w-full max-w-sm space-y-2 mt-2 pt-3 border-t border-slate-800/80">
            {newsletterSubmitted ? (
              <p className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 py-2.5 px-4 rounded-xl text-center animate-fade-in">
                ✓ Danke für deine Anmeldung zum Newsletter!
              </p>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Deine E-Mail-Adresse"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-2.5 text-base text-white placeholder-slate-600 outline-none transition-all"
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold px-4 py-2.5 transition-all"
                >
                  Anmelden
                </Button>
              </form>
            )}
            <p className="text-[10px] text-slate-500 text-center leading-normal">
              Melde dich hier für unseren E-Mail-Newsletter an, um keine Ticket-Verkäufe zu verpassen.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
