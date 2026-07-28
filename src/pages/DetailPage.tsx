import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, ShoppingBag, XCircle, AlertTriangle, ShieldAlert } from 'lucide-react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from '../components/CountdownTimer';
import TicketInventoryBadge from '../components/TicketInventoryBadge';
import { getBoughtTicketsCountForEvent, MAX_TICKETS_PER_EVENT } from '../utils/ticketLimits';
import { Button } from '@heroui/react';
import { formatPrice } from '../utils/formatters';
import { WHATNOT_LOGO_BASE64 } from '../assets/whatnotLogoData';

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

  const isSoldOut = event.variants.nodes.length > 0 && event.variants.nodes.every(v => v.availableForSale === false || v.quantityAvailable === 0);
  const minQuantityAvailable = event.variants.nodes.reduce<number | null>((min, v) => {
    if (typeof v.quantityAvailable === 'number') {
      return min === null ? v.quantityAvailable : Math.min(min, v.quantityAvailable);
    }
    return min;
  }, null);

  const alreadyBought = getBoughtTicketsCountForEvent(currentUser?.shopify_customer_id, event.id, event.title);
  const isMaxLimitReached = alreadyBought >= MAX_TICKETS_PER_EVENT;

  const dateValue = event.eventDate?.value;
  const location = event.eventLocation?.value || 'TBA';
  const videoUrl = event.eventVideoUrl?.value;
  const priceAmount = event.variants.nodes[0]?.price.amount || '0.00';
  const currency = event.variants.nodes[0]?.price.currencyCode || 'EUR';

  return (
    <div className="space-y-6 pb-24 md:pb-12 text-left max-w-4xl mx-auto px-4 pt-20 md:pt-4">
      
      {/* Top Breadcrumb Navigation & Actions Bar */}
      <nav className="flex items-center justify-between py-2 border-b border-zinc-900 text-xs">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors font-bold cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Eventdetails</span>
          </button>
        </div>
      </nav>

      {/* Main Grid: Media & Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Media Column (Left) */}
        <div className="md:col-span-7 space-y-4">
          <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-900 bg-zinc-950">
            {videoUrl ? (
              <div className="w-full h-full relative">
                {videoUrl.includes('youtube') || videoUrl.includes('vimeo') || videoUrl.includes('youtu.be') ? (
                  <iframe
                    src={videoUrl.includes('watch?v=') ? videoUrl.replace('watch?v=', 'embed/') : videoUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={videoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    poster={activeImage || event.images.nodes[0]?.url}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ) : activeImage ? (
              <img 
                src={activeImage} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : null}

            {/* Countdown Badge overlay */}
            {dateValue && (
              <div className="absolute bottom-4 left-4 right-4 max-w-sm z-20">
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

          {/* Social Links: Instagram & WhatNot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <a
              href="https://www.instagram.com/cardpiratesofficial/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 bg-gradient-to-r from-zinc-900/90 to-zinc-900/50 hover:from-zinc-850 hover:to-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center gap-3 transition-all cursor-pointer group active:scale-[0.98] shadow-sm"
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shrink-0 shadow-md flex items-center justify-center">
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <div className="min-w-0 text-left">
                <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Folge uns auf</span>
                <span className="block text-xs font-black text-white group-hover:text-rose-400 transition-colors truncate">Instagram</span>
              </div>
            </a>

            <a
              href="https://www.whatnot.com/de-DE/user/cardpirates/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 bg-gradient-to-r from-zinc-900/90 to-zinc-900/50 hover:from-zinc-850 hover:to-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-2xl flex items-center gap-3 transition-all cursor-pointer group active:scale-[0.98] shadow-sm"
            >
              <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 p-0.5 shrink-0 shadow-md flex items-center justify-center overflow-hidden">
                <img 
                  src={WHATNOT_LOGO_BASE64} 
                  alt="WhatNot" 
                  className="w-full h-full object-contain rounded-lg" 
                />
              </div>
              <div className="min-w-0 text-left">
                <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Live Streams auf</span>
                <span className="block text-xs font-black text-white group-hover:text-amber-400 transition-colors truncate">WhatNot</span>
              </div>
            </a>
          </div>
        </div>

        {/* Content & Ticket Info Column (Right) */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TicketInventoryBadge 
                availableForSale={!isSoldOut} 
                quantityAvailable={minQuantityAvailable} 
                size="md"
              />
            </div>

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
                    const vSoldOut = matchingVariant.availableForSale === false || matchingVariant.quantityAvailable === 0;

                    return (
                      <div className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                        <div>
                          <span className="text-xs font-bold text-white block">{displayTitle}</span>
                          <TicketInventoryBadge availableForSale={!vSoldOut} quantityAvailable={matchingVariant.quantityAvailable} size="sm" />
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
                      const vSoldOut = v.availableForSale === false || v.quantityAvailable === 0;

                      return (
                        <div key={v.id} className="flex items-center justify-between p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
                          <div>
                            <span className="text-xs font-bold text-white block">{displayTitle}</span>
                            <TicketInventoryBadge availableForSale={!vSoldOut} quantityAvailable={v.quantityAvailable} size="sm" />
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
                  <TicketInventoryBadge availableForSale={!isSoldOut} quantityAvailable={minQuantityAvailable} size="sm" />
                </div>
              )}
            </div>

            {/* Ticket Purchase Limit Status Warning */}
            {alreadyBought > 0 && (
              <div className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 border ${
                isMaxLimitReached 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                {isMaxLimitReached ? (
                  <ShieldAlert size={16} className="shrink-0 text-rose-400" />
                ) : (
                  <AlertTriangle size={16} className="shrink-0 text-amber-400" />
                )}
                <span>
                  {isMaxLimitReached 
                    ? `Maximales Limit (10 Tickets) für dieses Event erreicht.` 
                    : `Du besitzt bereits ${alreadyBought} von max. 10 Tickets für dieses Event.`}
                </span>
              </div>
            )}

            {isSoldOut ? (
              <button
                disabled
                className="w-full py-4 rounded-xl bg-zinc-900 text-zinc-500 font-extrabold text-sm border border-zinc-800 cursor-not-allowed opacity-60 flex items-center justify-center gap-2 select-none"
              >
                <XCircle size={16} />
                <span>Ausverkauft</span>
              </button>
            ) : isMaxLimitReached ? (
              <button
                disabled
                className="w-full py-4 rounded-xl bg-rose-950/40 text-rose-400 font-extrabold text-sm border border-rose-900/50 cursor-not-allowed flex items-center justify-center gap-2 select-none"
              >
                <ShieldAlert size={16} />
                <span>Ticket-Limit (10/10) erreicht</span>
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 p-4 pb-safe flex items-center justify-between md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
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
