import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import EventCard from '../components/EventCard';
import { Button } from '@heroui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface LandingPageProps {
  onQuickBuy: (event: ShopifyProduct) => void;
  currentUser: any | null;
}

export default function LandingPage({ onQuickBuy, currentUser }: LandingPageProps) {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Carousel State for Mobile Swipe
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);

  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  // Local Purchased Tickets Check
  const [purchasedEventIds, setPurchasedEventIds] = useState<string[]>([]);

  const fetchPurchasedTickets = () => {
    if (currentUser) {
      const key = `purchased_tickets_${currentUser.shopify_customer_id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const ids = parsed.map((t: any) => t.id);
          setPurchasedEventIds(ids);
          return;
        } catch (e) {
          console.error(e);
        }
      }
    }
    setPurchasedEventIds([]);
  };

  useEffect(() => {
    fetchPurchasedTickets();
    window.addEventListener('focus', fetchPurchasedTickets);
    return () => {
      window.removeEventListener('focus', fetchPurchasedTickets);
    };
  }, [currentUser]);

  useEffect(() => {
    async function loadEvents() {
      try {
        const products = await shopifyService.getEvents();
        setEvents(products);
        // Find index of first upcoming event to auto-center if needed
        setCarouselIndex(0);
      } catch (err) {
        console.error('Failed to load events schedule', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
      setNewsletterEmail('');
    }
  };

  // Drag Gesture Handlers for Carousel swiping
  const handleDragStart = (e: any) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
  };

  const handleDragEnd = (e: any) => {
    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const diffX = dragStartX - clientX;
    
    if (Math.abs(diffX) > 45) { // Swipe threshold
      if (diffX > 0 && carouselIndex < events.length - 1) {
        setCarouselIndex(prev => prev + 1);
      } else if (diffX < 0 && carouselIndex > 0) {
        setCarouselIndex(prev => prev - 1);
      }
    }
  };

  return (
    <div className="px-4 sm:px-6 pb-24 pt-4 max-w-4xl mx-auto space-y-12 animate-fade-in text-zinc-300">
      
      {/* Event Schedule Section */}
      <section className="space-y-6 text-center">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm font-semibold">Lade Event-Zeitplan...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle size={32} className="text-zinc-600" />
            <p className="text-zinc-400 font-medium">Aktuell sind keine Events geplant.</p>
          </div>
        ) : (
          <>
            {/* Mobile Swipe-Stack Carousel (Fanned layout, resembling physical tickets) */}
            <div className="md:hidden flex flex-col items-center select-none">
              
              {/* Stack Wrapper */}
              <div 
                className="relative w-full h-[415px] flex items-center justify-center overflow-visible touch-pan-y"
                onTouchStart={handleDragStart}
                onTouchEnd={handleDragEnd}
                onMouseDown={handleDragStart}
                onMouseUp={handleDragEnd}
              >
                {events.map((event, idx) => {
                  const offset = idx - carouselIndex;
                  const absOffset = Math.abs(offset);
                  
                  // Fanned rotation & translation logic
                  if (absOffset > 2) return null; // Render max 3 active cards for viewport speed
                  
                  const zIndex = 20 - absOffset;
                  const scale = 1 - absOffset * 0.08;
                  const rotateAngle = offset * 4.5; // Curved fan-out tilt
                  const xTranslation = offset * 115; // Spread offset to peek out sides
                  const opacity = 1 - absOffset * 0.35;

                  return (
                    <motion.div
                      key={event.id}
                      style={{
                        zIndex,
                        originY: 0.95,
                        clipPath: "path('M 0 0 L 230 0 L 230 227 A 8 8 0 0 0 230 243 L 230 395 L 0 395 L 0 243 A 8 8 0 0 0 0 227 Z')"
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
                      className={`absolute w-[230px] h-[395px] bg-white text-zinc-800 rounded-[24px] overflow-hidden flex flex-col justify-between shadow-2xl transition-all duration-300 border-none ${offset === 0 ? '' : 'cursor-pointer'}`}
                    >
                      {/* Card Cover image with fading gradient blend */}
                      <div className="relative h-[155px] w-full overflow-hidden shrink-0">
                        <img src={event.images.nodes[0]?.url} className="w-full h-full object-cover" alt="" />
                        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-white via-white/80 to-transparent" />
                        
                        {/* Event Title overlayed on image */}
                        <div className="absolute bottom-2 inset-x-0 px-3 text-center">
                          <h3 className="text-sm font-extrabold text-zinc-900 drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)] tracking-tight leading-tight">
                            {event.title}
                          </h3>
                        </div>
                      </div>

                      {/* Card details */}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-3.5 text-left">
                          <div className="min-w-0">
                            <span className="block text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Ort</span>
                            <span className="block text-[10px] text-zinc-800 font-extrabold truncate">{event.eventLocation?.value || 'TBA'}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Datum</span>
                            <span className="block text-[10px] text-zinc-800 font-extrabold truncate">
                              {event.eventDate?.value ? new Date(event.eventDate.value).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' }) : 'TBA'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Uhrzeit</span>
                            <span className="block text-[10px] text-zinc-800 font-extrabold truncate">
                              {event.eventDate?.value ? new Date(event.eventDate.value).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr' : 'TBA'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="block text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Kategorie</span>
                            <span className="block text-[9px] text-zinc-500 font-extrabold truncate uppercase tracking-widest">Crew-Event</span>
                          </div>
                        </div>

                        {/* Perforation Line with CSS Notches */}
                        <div className="relative my-3 shrink-0">
                          <div className="border-t border-dashed border-zinc-200 w-full" />
                        </div>

                        {/* Bottom Barcode or Buy Ticket Button */}
                        <div className="flex flex-col items-center justify-center shrink-0 min-h-[50px]">
                          {purchasedEventIds.includes(event.id) ? (
                            <div className="flex flex-col items-center justify-center space-y-1 w-full animate-fade-in">
                              <svg className="w-36 h-8 text-zinc-900 fill-current" viewBox="0 0 100 20" preserveAspectRatio="none">
                                <rect x="0" y="0" width="2" height="20" />
                                <rect x="4" y="0" width="1" height="20" />
                                <rect x="7" y="0" width="3" height="20" />
                                <rect x="12" y="0" width="1" height="20" />
                                <rect x="15" y="0" width="2" height="20" />
                                <rect x="19" y="0" width="4" height="20" />
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
                              <span className="text-[7px] font-mono tracking-widest text-zinc-500 uppercase">CP-{event.handle.substring(0, 8)}</span>
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickBuy(event);
                              }}
                              className="w-full py-2.5 rounded-full bg-black hover:bg-zinc-950 text-white font-extrabold text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-black"
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
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === carouselIndex ? 'w-4.5 bg-white' : 'bg-zinc-700'}`}
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
      <section className="pt-10 border-t border-zinc-900 max-w-xl mx-auto text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Button
            variant="outline"
            onPress={() => window.open('https://discord.gg/8yRykEdr4G', '_blank')}
            className="bg-black hover:bg-zinc-950 border border-zinc-750 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-[0.98] w-fit cursor-pointer"
          >
            <svg className="w-4 h-4 fill-white" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1.07-.79,2.12-1.61,3.13-2.47a75.1,75.1,0,0,0,64.84,0c1,.86,2.06,1.68,3.13,2.47a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.07,47,122.9,24.16,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.72,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96,53,91,65.69,84.69,65.69Z"/>
            </svg>
            <span>Tritt unserem Discord bei</span>
          </Button>

          {/* Email Newsletter Input container */}
          <div className="w-full max-w-sm space-y-2 mt-2 pt-3 border-t border-zinc-800">
            {newsletterSubmitted ? (
              <p className="text-xs text-white font-semibold bg-zinc-900 border border-zinc-800 py-2.5 px-4 rounded-xl text-center animate-fade-in">
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
                  className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-base text-white placeholder-zinc-700 outline-none transition-all"
                />
                <Button
                  type="submit"
                  variant="outline"
                  className="bg-white hover:bg-zinc-200 text-black border border-white rounded-xl text-xs font-bold px-4 py-2.5 transition-all cursor-pointer"
                >
                  Anmelden
                </Button>
              </form>
            )}
            <p className="text-[10px] text-zinc-500 text-center leading-normal">
              Melde dich hier für unseren E-Mail-Newsletter an, um keine Ticket-Verkäufe zu verpassen.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
