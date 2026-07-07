import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import EventCard from '../components/EventCard';
import { Button } from '@heroui/react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import logoAnimVideo from '../assets/cardpirates-logo-ohne-watermark.mp4';
import logoSchrift from '../assets/cardpirates-schrift-weiss.png';

interface LandingPageProps {
  onQuickBuy: (event: ShopifyProduct) => void;
  currentUser: any | null;
  onRegisterTrigger: () => void;
}

export default function LandingPage({ onQuickBuy, currentUser, onRegisterTrigger }: LandingPageProps) {
  const navigate = useNavigate();
  const logoAnimVideoUrl = (window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo;
  const logoSchriftUrl = (window as any).ShopifyAssets?.logoSchriftUrl || logoSchrift;
  const [events, setEvents] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Carousel State for Mobile Swipe
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [hasSwiped, setHasSwiped] = useState(() => {
    return localStorage.getItem('has_swiped_carousel') === 'true';
  });

  useEffect(() => {
    if (carouselIndex !== 0 && !hasSwiped) {
      setHasSwiped(true);
      localStorage.setItem('has_swiped_carousel', 'true');
    }
  }, [carouselIndex, hasSwiped]);

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

  // Sword Slash Transition State
  const [slashState, setSlashState] = useState<'idle' | 'slashing'>('idle');
  const [scrollY, setScrollY] = useState(0);

  const handleRegisterClick = () => {
    setScrollY(window.scrollY);
    setSlashState('slashing');
    
    // Trigger modal open after animation completes
    setTimeout(() => {
      onRegisterTrigger();
    }, 700);

    // Reset slashState back to idle after animation wraps up
    setTimeout(() => {
      setSlashState('idle');
    }, 950);
  };

  const renderMainContent = () => {
    return (
      <>
        {/* Hero Welcome Header (Restored) */}
        <header className="text-center pt-8 pb-4 max-w-xl mx-auto space-y-4 flex flex-col items-center">
          <img 
            src={logoSchriftUrl} 
            alt="Cardpirates" 
            className="w-64 sm:w-80 h-auto object-contain select-none pointer-events-none drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]" 
          />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            Werde Teil der Crew!
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
            Triff uns und unsere Community auf einem unserer spannenden Events. Von exklusiven Cardshows über packende Turniere bis hin zu gemütlichen Community Meetups und Trade Nights.
          </p>
          {!currentUser && (
            <Button
              variant="primary"
              onPress={handleRegisterClick}
              className="mt-2 py-3 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              Jetzt registrieren
            </Button>
          )}
        </header>

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
              {/* Mobile Swipe-Stack Carousel (Fanned layout, physical ticket cutouts) */}
              <div className="md:hidden flex flex-col items-center select-none">
                
                {/* Stack Wrapper */}
                <div className="relative w-full h-[415px] flex items-center justify-center overflow-visible touch-pan-y">
                  {events.map((event, idx) => {
                    const offset = idx - carouselIndex;
                    const absOffset = Math.abs(offset);
                    
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
                          originY: 0.95
                        }}
                        animate={{
                          x: xTranslation,
                          scale,
                          rotate: rotateAngle,
                          opacity,
                        }}
                        drag={offset === 0 ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.25}
                        onDragEnd={(_, info) => {
                          const threshold = 40;
                          if (info.offset.x < -threshold && carouselIndex < events.length - 1) {
                            setCarouselIndex(prev => prev + 1);
                          } else if (info.offset.x > threshold && carouselIndex > 0) {
                            setCarouselIndex(prev => prev - 1);
                          }
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        onClick={() => {
                          if (offset === 0) {
                            navigate(`/events/${event.handle}`);
                          } else {
                            setCarouselIndex(idx);
                          }
                        }}
                        className={`absolute left-1/2 -ml-[115px] w-[230px] h-[395px] bg-transparent border-none outline-none select-none transition-shadow duration-300 ${offset === 0 ? 'drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]' : 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.3)] cursor-pointer'}`}
                      >
                        {/* Inner Card Container clipped into physical ticket for hardware-accelerated animations */}
                        <div 
                          style={{
                            clipPath: "path('M 0 0 L 230 0 L 230 227 A 8 8 0 0 0 230 243 L 230 395 L 0 395 L 0 243 A 8 8 0 0 0 0 227 Z')"
                          }}
                          className="w-full h-full bg-white text-zinc-800 rounded-[24px] overflow-hidden flex flex-col justify-between"
                        >
                          {/* Card Cover image with fading gradient blend */}
                          <div className="relative h-[155px] w-full overflow-hidden shrink-0 bg-black">
                            <video
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="w-full h-full object-cover scale-[0.85] grayscale brightness-150 contrast-125"
                              src={logoAnimVideoUrl}
                            />
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

                {/* Swipe Tutorial */}
                {!hasSwiped && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-1.5 mt-4 text-[10px] uppercase tracking-widest text-zinc-500 font-bold pointer-events-none"
                  >
                    <motion.span
                      animate={{ x: [-8, 8, -8] }}
                      transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      className="text-xs"
                    >
                      ↔️
                    </motion.span>
                    <span>Wische zum Durchblättern</span>
                  </motion.div>
                )}
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
      </>
    );
  };

  return (
    <>
      <div 
        className={`px-4 sm:px-6 pb-24 pt-4 max-w-4xl mx-auto space-y-12 animate-fade-in text-zinc-300 transition-opacity duration-150 ${
          slashState === 'slashing' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        {renderMainContent()}
      </div>

      {slashState === 'slashing' && (
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          {/* White Screen Slash Flash */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.75, 0] }}
            transition={{ duration: 0.22, times: [0, 0.35, 1] }}
            className="absolute inset-0 bg-white z-50"
          />

          {/* Sword Slash visual line */}
          <motion.div 
            initial={{ x: '-120%', rotate: 9 }}
            animate={{ x: '120%' }}
            transition={{ duration: 0.38, ease: "easeOut" }}
            className="absolute w-[180%] h-[4px] bg-white shadow-[0_0_15px_#f43f5e,0_0_30px_#f43f5e,0_0_55px_#fff] z-50"
            style={{ 
              top: '40%', // matches midpoint of 32% and 48%
              left: '-40%',
              transformOrigin: 'center'
            }}
          />

          {/* Top Cut Part (quick fade out & slide up/left) */}
          <motion.div
            initial={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
            animate={{ opacity: 0, y: -70, x: -15, rotate: -1.5 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.08 }}
            className="absolute inset-0 bg-[#000000] flex flex-col justify-start"
            style={{ 
              clipPath: "polygon(0 0, 100% 0, 100% 48%, 0 32%)",
            }}
          >
            {/* Scroll matching wrapper */}
            <div style={{ transform: `translateY(${-scrollY}px)` }} className="px-4 sm:px-6 pb-24 pt-4 max-w-4xl mx-auto space-y-12 text-zinc-300">
              {renderMainContent()}
            </div>
          </motion.div>

          {/* Bottom Cut Part (gravity fall - slide down and rotate) */}
          <motion.div
            initial={{ y: 0, x: 0, rotate: 0 }}
            animate={{ 
              y: window.innerHeight + 100, 
              x: 20, 
              rotate: 12 
            }}
            transition={{ duration: 0.78, ease: [0.32, 0, 0.67, 0], delay: 0.08 }}
            className="absolute inset-0 bg-[#000000] flex flex-col justify-start"
            style={{ 
              clipPath: "polygon(0 32%, 100% 48%, 100% 100%, 0 100%)",
            }}
          >
            {/* Scroll matching wrapper */}
            <div style={{ transform: `translateY(${-scrollY}px)` }} className="px-4 sm:px-6 pb-24 pt-4 max-w-4xl mx-auto space-y-12 text-zinc-300">
              {renderMainContent()}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
