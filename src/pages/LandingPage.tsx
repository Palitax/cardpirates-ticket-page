import { useState, useEffect } from 'react';
import type { TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { motion } from 'framer-motion';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import EventCard from '../components/EventCard';

interface LandingPageProps {
  onQuickBuy: (event: ShopifyProduct) => void;
}

export default function LandingPage({ onQuickBuy }: LandingPageProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedEventIds, setPurchasedEventIds] = useState<string[]>([]);



  // Swipe gesture tracking state
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

  // Helper to load owned ticket ids from localStorage
  const getPurchasedIds = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (!savedUser) return [];
    try {
      const user = JSON.parse(savedUser);
      const key = `purchased_tickets_${user.shopify_customer_id}`;
      const savedTicketsRaw = localStorage.getItem(key);
      if (savedTicketsRaw) {
        return JSON.parse(savedTicketsRaw).map((t: any) => t.id);
      }
    } catch (e) {}
    return [];
  };

  useEffect(() => {
    // 1. Load Shopify events
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

    // 2. Load purchased tickets list
    const updateTickets = () => {
      setPurchasedEventIds(getPurchasedIds());
    };
    updateTickets();
    window.addEventListener('focus', updateTickets);

    // 3. Setup tutorial timer
    const tutorialTimer = setTimeout(() => {
      setIsInitialMount(false);
    }, 5200);

    return () => {
      clearTimeout(tutorialTimer);
      window.removeEventListener('focus', updateTickets);
    };
  }, []);

  // Carousel State & Swipe Handlers
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselTouchStart, setCarouselTouchStart] = useState<number | null>(null);
  const [carouselTouchEnd, setCarouselTouchEnd] = useState<number | null>(null);

  const handleCarouselTouchStart = (e: TouchEvent) => {
    setCarouselTouchStart(e.targetTouches[0].clientX);
    setIsInitialMount(false);
  };

  const handleCarouselTouchMove = (e: TouchEvent) => {
    setCarouselTouchEnd(e.targetTouches[0].clientX);
  };

  const handleCarouselTouchEnd = () => {
    if (!carouselTouchStart || !carouselTouchEnd) return;
    const distance = carouselTouchStart - carouselTouchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && carouselIndex < events.length - 1) {
      setCarouselIndex((prev) => prev + 1);
    }
    if (isRightSwipe && carouselIndex > 0) {
      setCarouselIndex((prev) => prev - 1);
    }
    setCarouselTouchStart(null);
    setCarouselTouchEnd(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Lade anstehende Events...</p>
      </div>
    );
  }

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

      {/* Grid of All Upcoming Events */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 px-1">
          Alle anstehenden Events & Meetups
        </h2>

        {/* Mobile Swipeable Stack Carousel (Nintendo Switch Style) */}
        {events.length === 0 ? (
          <div className="p-8 bg-slate-900/40 rounded-none border border-slate-900 text-center">
            <p className="text-sm text-slate-400">Zurzeit sind keine Events geplant. Komm bald wieder vorbei!</p>
          </div>
        ) : (
          <>
            {/* Mobile-Only Carousel */}
            <div className="md:hidden relative w-full overflow-hidden py-8 px-4 flex flex-col items-center select-none">
              
              {/* Swipe Tutorial Overlay inside Carousel */}
              {isInitialMount && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  transition={{ duration: 5.2, times: [0, 0.05, 0.95, 1], ease: "easeInOut" }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/65 backdrop-blur-[2px] pointer-events-none rounded-none"
                >
                  <div className="relative flex items-center justify-center w-36 h-36">
                    <motion.div
                      animate={{ x: [0, -12, 0], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.0, ease: "easeInOut" }}
                      className="absolute left-1 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                    >
                      <svg className="w-8 h-8 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </motion.div>
                    <motion.div
                      animate={{ x: [0, -25, 25, 0], scale: [1, 0.93, 0.93, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.35, 0.7, 1], ease: "easeInOut" }}
                      className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]"
                    >
                      <svg className="w-12 h-12 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 11V4a1.5 1.5 0 0 0-3 0v7M9 11V9a1.5 1.5 0 0 0-3 0v2M6 11V10a1.5 1.5 0 0 0-3 0v5a7 7 0 0 0 14 0v-4a1.5 1.5 0 0 0-3 0v3M15 11v-1a1.5 1.5 0 0 0-3 0v3" />
                      </svg>
                    </motion.div>
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
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-300 mt-1">Wische zum Durchblättern</span>
                </motion.div>
              )}

              {/* Carousel Stack Container */}
              <div 
                onTouchStart={handleCarouselTouchStart}
                onTouchMove={handleCarouselTouchMove}
                onTouchEnd={handleCarouselTouchEnd}
                className="relative flex items-center justify-center w-full h-[430px] overflow-visible touch-pan-y"
              >
                {events.map((event, idx) => {
                  const offset = idx - carouselIndex;
                  const absOffset = Math.abs(offset);
                  
                  if (absOffset > 2) return null;

                  const xTranslation = offset * 115;
                  const rotateAngle = offset * 4;
                  const scale = 1 - absOffset * 0.08;
                  const zIndex = 20 - absOffset;
                  const opacity = 1 - absOffset * 0.35;

                  return (
                    <motion.div
                      key={event.id}
                      style={{
                        zIndex,
                        originY: 0.95
                      }}
                      animate={{
                        x: xTranslation,
                        scale,
                        rotate: rotateAngle,
                        opacity,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      onClick={() => {
                        if (offset === 0) {
                          navigate(`/events/${event.handle}`);
                        } else {
                          setCarouselIndex(idx);
                        }
                      }}
                      className={`absolute w-[230px] h-[395px] bg-white text-slate-800 rounded-[24px] overflow-hidden flex flex-col justify-between shadow-2xl transition-colors duration-300 border-none ${offset === 0 ? 'ring-2 ring-sky-500/30' : 'cursor-pointer hover:border-slate-300'}`}
                    >
                      {/* Card Cover image with fading gradient blend */}
                      <div className="relative h-[155px] w-full overflow-hidden shrink-0">
                        <img src={event.images.nodes[0]?.url} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent" />
                        
                        {/* Event Title overlayed on image */}
                        <div className="absolute bottom-2 inset-x-0 px-3 text-center">
                          <h3 className="text-sm font-extrabold text-slate-900 drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)] tracking-tight leading-tight">
                            {event.title}
                          </h3>
                        </div>
                      </div>

                      {/* Card details */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 text-left">
                          <div className="min-w-0">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Ort</span>
                            <span className="block text-[10px] text-slate-800 font-extrabold truncate">{event.eventLocation?.value || 'TBA'}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Datum</span>
                            <span className="block text-[10px] text-slate-800 font-extrabold truncate">
                              {event.eventDate?.value ? new Date(event.eventDate.value).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' }) : 'TBA'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Uhrzeit</span>
                            <span className="block text-[10px] text-slate-800 font-extrabold truncate">
                              {event.eventDate?.value ? new Date(event.eventDate.value).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : 'TBA'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">Kategorie</span>
                            <span className="block text-[9px] text-sky-600 font-extrabold truncate uppercase tracking-widest">Crew-Event</span>
                          </div>
                        </div>

                        {/* Perforation Line with CSS Notches */}
                        <div className="relative my-3 shrink-0">
                          <div className="border-t border-dashed border-slate-200 w-full" />
                          <div className="absolute left-[-22px] top-[-8px] w-4 h-4 bg-[#0b0f19] rounded-full z-10" />
                          <div className="absolute right-[-22px] top-[-8px] w-4 h-4 bg-[#0b0f19] rounded-full z-10" />
                        </div>

                        {/* Bottom Barcode or Buy Ticket Button */}
                        <div className="flex flex-col items-center justify-center shrink-0 min-h-[50px]">
                          {purchasedEventIds.includes(event.id) ? (
                            <div className="flex flex-col items-center justify-center space-y-1 w-full animate-fade-in">
                              <svg className="w-36 h-8 text-slate-900 fill-current" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <rect x="0" y="0" width="2" height="20" />
                                <rect x="4" y="0" width="1" height="20" />
                                <rect x="7" y="0" width="3" height="20" />
                                <rect x="12" y="0" width="1" height="20" />
                                <rect x="15" y="0" width="2" height="20" />
                                <rect x="19" y="0" width="4" height="20" />
                                <rect x="25" y="0" width="1" height="20" />
                                <rect x="28" y="0" width="2" height="20" />
                                <rect x="32" y="0" width="3" height="20" />
                                <rect x="37" y="0" width="1" height="20" />
                                <rect x="40" y="0" width="4" height="20" />
                                <rect x="46" y="0" width="2" height="20" />
                                <rect x="50" y="0" width="1" height="20" />
                                <rect x="53" y="0" width="3" height="20" />
                                <rect x="58" y="0" width="2" height="20" />
                                <rect x="62" y="0" width="1" height="20" />
                                <rect x="65" y="0" width="4" height="20" />
                                <rect x="71" y="0" width="2" height="20" />
                                <rect x="75" y="0" width="3" height="20" />
                                <rect x="80" y="0" width="1" height="20" />
                                <rect x="83" y="0" width="2" height="20" />
                                <rect x="87" y="0" width="4" height="20" />
                                <rect x="93" y="0" width="1" height="20" />
                                <rect x="96" y="0" width="3" height="20" />
                              </svg>
                              <span className="text-[7px] font-mono tracking-widest text-slate-500 uppercase">CP-{event.handle.substring(0, 8)}</span>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickBuy(event);
                              }}
                              className="w-full py-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              Ticket kaufen ({event.variants.nodes[0]?.price.amount} {event.variants.nodes[0]?.price.currencyCode})
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Carousel Indicators */}
              <div className="flex gap-1.5 mt-3 justify-center items-center">
                {events.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCarouselIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'w-4.5 bg-sky-500' : 'bg-slate-700'}`}
                    aria-label={`Gehe zu Event ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Grid View */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onQuickBuy={onQuickBuy}
                />
              ))}
            </div>
          </>
        )}
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
