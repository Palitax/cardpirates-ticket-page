import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, ChevronRight, Video, ShoppingBag, XCircle } from 'lucide-react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from '../components/CountdownTimer';
import { Button } from '@heroui/react';
import { formatPrice } from '../utils/formatters';

interface DetailPageProps {
  onQuickBuy: (event: ShopifyProduct) => void;
  currentUser?: any | null;
  onRegisterTrigger?: () => void;
}

export default function DetailPage({ onQuickBuy, currentUser, onRegisterTrigger }: DetailPageProps) {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (handle) {
      setLoading(true);
      shopifyService.getEventByHandle(handle).then((res) => {
        setEvent(res);
        if (res?.images.nodes[0]) {
          setActiveImage(res.images.nodes[0].url);
        }
        setLoading(false);
      });
    }
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-center">
        <h2 className="text-xl font-bold text-white">Event nicht gefunden</h2>
        <button 
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-bold text-white hover:bg-zinc-800 transition-all cursor-pointer"
        >
          Zurück zur Übersicht
        </button>
      </div>
    );
  }

  const isSoldOut = event.variants.nodes.length > 0 && event.variants.nodes.every(v => v.availableForSale === false);
  const dateValue = event.eventDate?.value;
  const location = event.eventLocation?.value || 'TBA';
  const videoUrl = event.eventVideoUrl?.value;
  const priceAmount = event.variants.nodes[0]?.price.amount || '0.00';
  const currency = event.variants.nodes[0]?.price.currencyCode || 'EUR';

  return (
    <div className="space-y-6 pb-24 md:pb-12 text-left max-w-4xl mx-auto px-4">
      
      {/* Top Breadcrumb Navigation & Actions Bar */}
      <nav className="flex items-center justify-between py-2 border-b border-zinc-900 text-xs">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors font-bold cursor-pointer"
          >
            <ArrowLeft size={14} />
            Zeitplan
          </button>
          <ChevronRight size={12} className="text-zinc-650" />
        </div>
      </nav>

      {/* Main Grid: Media & Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Media Column (Left) */}
        <div className="md:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950">
            {activeImage && (
              <img 
                src={activeImage} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            )}

            {/* Countdown Badge overlay */}
            {dateValue && (
              <div className="absolute bottom-4 left-4 right-4 max-w-sm">
                <CountdownTimer targetDate={dateValue} />
              </div>
            )}
          </div>

          {/* Thumbnails list */}
          {event.images.nodes.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {event.images.nodes.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img.url)}
                  className={`w-20 aspect-video rounded-xl overflow-hidden border-2 shrink-0 transition-all ${activeImage === img.url ? 'border-white' : 'border-zinc-900 hover:border-zinc-800'}`}
                >
                  <img src={img.url} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}

          {videoUrl && (
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-900/80 flex items-center gap-3">
              <div className="p-2.5 bg-zinc-800 text-white rounded-xl">
                <Video size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white">Event Trailer verfügbar</p>
                <a 
                  href={videoUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-[11px] text-zinc-400 hover:text-white underline truncate block"
                >
                  Trailer auf YouTube ansehen
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Content & Ticket Info Column (Right) */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl font-semibold">
                <Calendar size={13} className="text-white" />
                <span>{dateValue ? new Date(dateValue).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'TBA'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl font-semibold">
                <MapPin size={13} className="text-white" />
                <span>{location}</span>
              </div>
            </div>
          </div>

          {/* Ticket Buy Box */}
          <div className="p-5 bg-zinc-950 border border-zinc-800/90 rounded-3xl space-y-5 shadow-2xl">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block">
                Verfügbare Kategorien
              </span>
              
              {event.variants.nodes.length > 1 ? (
                currentUser ? (
                  // LOGGED IN: Show matching variant for account type
                  (() => {
                    const isBusiness = currentUser.user_type === 'business';
                    const matchingVariant = event.variants.nodes.find(v => 
                      isBusiness 
                        ? (v.title.toLowerCase().includes('aussteller') || v.title.toLowerCase().includes('business'))
                        : (v.title.toLowerCase().includes('privat') || v.title.toLowerCase().includes('einzel'))
                    ) || event.variants.nodes[0];

                    const displayTitle = matchingVariant.title.toLowerCase().includes('privat') ? 'Einzelticket' : matchingVariant.title;

                    return (
                      <div className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                        <div>
                          <span className="text-xs font-bold text-white block">{displayTitle}</span>
                          <span className={`text-[10px] font-semibold ${matchingVariant.availableForSale === false ? 'text-rose-400' : 'text-zinc-400'}`}>
                            {matchingVariant.availableForSale === false ? 'Ausverkauft' : 'Sofort verfügbar'}
                          </span>
                        </div>
                        <span className="text-sm font-black text-white">
                          {formatPrice(matchingVariant.price.amount, matchingVariant.price.currencyCode)}
                        </span>
                      </div>
                    );
                  })()
                ) : (
                  // NOT LOGGED IN: Show Einzelticket + Aussteller info note
                  <div className="space-y-2">
                    {event.variants.nodes.map((v) => {
                      const isPrivat = v.title.toLowerCase().includes('privat') || v.title.toLowerCase().includes('einzel');
                      const displayTitle = isPrivat ? 'Einzelticket' : v.title;
                      const isAussteller = v.title.toLowerCase().includes('aussteller');

                      return (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                          <div>
                            <span className="text-xs font-bold text-white block">{displayTitle}</span>
                            <span className={`text-[10px] font-semibold ${v.availableForSale === false ? 'text-rose-400' : 'text-zinc-400'}`}>
                              {v.availableForSale === false ? 'Ausverkauft' : 'Sofort verfügbar'}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-white">
                            {isAussteller ? (
                              <button 
                                onClick={() => onRegisterTrigger?.()}
                                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                              >
                                registriere dich für eine Preisübersicht
                              </button>
                            ) : (
                              formatPrice(v.price.amount, v.price.currencyCode)
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-extrabold text-white">
                    {formatPrice(priceAmount, currency)}
                  </span>
                  <span className={`text-[10px] font-bold border px-2 py-1 rounded-md ${isSoldOut ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-zinc-950 border-zinc-900 text-white'}`}>
                    {isSoldOut ? 'Ausverkauft' : 'Verfügbar'}
                  </span>
                </div>
              )}
            </div>

            {isSoldOut ? (
              <button
                disabled
                className="w-full py-4 rounded-xl bg-zinc-900 text-zinc-500 font-extrabold text-sm border border-zinc-800 cursor-not-allowed opacity-60 flex items-center justify-center gap-2 select-none"
              >
                <XCircle size={16} />
                <span>Ausverkauft</span>
              </button>
            ) : (
              <Button
                variant="primary"
                onPress={() => onQuickBuy(event)}
                className="w-full py-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm border border-white transition-all select-none active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
              >
                <ShoppingBag size={16} />
                <span>In den Warenkorb</span>
              </Button>
            )}
          </div>

          <div className="space-y-3 text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Über dieses Event
            </h3>
            <div 
              className="text-zinc-300 text-sm leading-relaxed space-y-3"
              dangerouslySetInnerHTML={{ __html: event.descriptionHtml }}
            />
          </div>
        </div>

      </div>

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-900 p-4 pb-safe flex items-center justify-between md:hidden">
        <div className="flex flex-col">
          {event.variants.nodes.length > 1 ? (
             <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
               {currentUser ? (currentUser.user_type === 'business' ? 'Aussteller' : 'Einzelticket') : 'Tickets ab'}
             </span>
          ) : (
            <>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Ticketpreis</span>
              <span className="text-lg font-extrabold text-white leading-none mt-0.5">
                {formatPrice(priceAmount, currency)}
              </span>
            </>
          )}
        </div>

        {isSoldOut ? (
          <button
            disabled
            className="py-3 px-5 rounded-xl bg-zinc-900 text-zinc-500 font-extrabold text-xs border border-zinc-800 cursor-not-allowed opacity-60 flex items-center gap-1.5"
          >
            <XCircle size={14} />
            <span>Ausverkauft</span>
          </button>
        ) : (
          <Button
            variant="primary"
            onPress={() => onQuickBuy(event)}
            className="py-3 px-5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs border border-white transition-all active:scale-[0.98] cursor-pointer shadow-lg flex items-center gap-1.5"
          >
            <ShoppingBag size={14} />
            <span>In den Warenkorb</span>
          </Button>
        )}
      </div>

    </div>
  );
}
