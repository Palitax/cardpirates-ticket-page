import { MapPin, Check, ShoppingBag, XCircle } from 'lucide-react';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from './CountdownTimer';
import { useNavigate } from 'react-router-dom';
import logoAnimVideo from '../assets/cardpirates-logo-kleiner.mp4';
import { formatPrice } from '../utils/formatters';

interface EventCardProps {
  event: ShopifyProduct;
  onQuickBuy: (event: ShopifyProduct) => void;
  purchasedTickets?: any[];
  onShowQr?: (ticketIds: string[], title: string) => void;
  currentUser?: any | null;
  onRegisterTrigger?: () => void;
}

export default function EventCard({ 
  event, 
  onQuickBuy, 
  purchasedTickets = [], 
  onShowQr, 
  currentUser, 
  onRegisterTrigger 
}: EventCardProps) {
  const navigate = useNavigate();
  const logoAnimVideoUrl = (window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo;

  const title = event.title;
  const location = event.eventLocation?.value || 'TBA';
  const dateValue = event.eventDate?.value;
  
  const dateObj = dateValue ? new Date(dateValue) : null;
  const day = dateObj ? dateObj.getDate() : '--';
  const month = dateObj ? dateObj.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase() : 'TBA';

  const matchingTickets = purchasedTickets.filter(t => t.event_id === event.id || t.id === event.id);
  const isPurchased = matchingTickets.length > 0;
  const isSoldOut = event.variants.nodes.length > 0 && event.variants.nodes.every(v => v.availableForSale === false);

  return (
    <div className="w-full h-auto aspect-[816/220] min-h-[220px] transition-all duration-350 hover:scale-[1.012] active:scale-[0.995] animate-ticket-glow hover:!filter hover:!drop-shadow-[0_0_30px_rgba(255,255,255,0.45)]">
      <div 
        onClick={() => navigate(`/events/${event.handle}`)}
        style={{
          mask: 'radial-gradient(circle at 78% 0px, transparent 12px, black 13px) 0% 0% / 100% 51% no-repeat, radial-gradient(circle at 78% 100%, transparent 12px, black 13px) 0% 100% / 100% 51% no-repeat',
          WebkitMask: 'radial-gradient(circle at 78% 0px, transparent 12px, black 13px) 0% 0% / 100% 51% no-repeat, radial-gradient(circle at 78% 100%, transparent 12px, black 13px) 0% 100% / 100% 51% no-repeat'
        }}
        className="relative w-full h-full flex flex-row rounded-3xl border-[1.5px] border-white/[0.15] bg-white/[0.07] group-hover:bg-white/[0.12] group-hover:border-white/[0.4] backdrop-blur-xl group transition-all duration-350 cursor-pointer overflow-hidden"
      >
        {/* Glossy Reflection Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.08] group-hover:from-white/[0.08] group-hover:to-white/[0.22] pointer-events-none z-10 transition-all duration-350" />

        {/* Left Section: Video Cover (Merged) */}
        <div className="relative w-[27%] h-full overflow-hidden shrink-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            style={{
              maskImage: 'linear-gradient(to right, black 55%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to right, black 55%, transparent 100%)'
            }}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300 grayscale brightness-150 contrast-125"
            src={logoAnimVideoUrl}
          />

          {/* Countdown Badge (Bottom-Left of Video) */}
          {dateValue && (
            <div className="absolute bottom-4 left-4 z-20 scale-75 origin-bottom-left">
              <CountdownTimer targetDate={dateValue} />
            </div>
          )}
        </div>

        <div className="flex-1 p-6 pl-2 pr-8 space-y-3.5 text-left flex flex-col justify-center min-w-fit z-10">
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-white/95 transition-colors uppercase font-mono whitespace-nowrap">
              {title}
            </h3>

            {/* Date Elongated Capsule */}
            {dateValue && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.12] text-white text-[9px] font-black tracking-widest uppercase w-fit">
                <span className="w-1 h-1 rounded-full bg-white/60 animate-pulse" />
                <span>{day}. {dateObj ? dateObj.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }).toUpperCase() : month}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold w-0 min-w-full">
            <MapPin size={13} className="text-white/60 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          <p className="text-zinc-300/80 text-xs leading-relaxed line-clamp-2 w-0 min-w-full">
            {event.description}
          </p>
        </div>

        {/* Dashed Tear-off Perforation Line */}
        <div className="absolute top-0 bottom-0 right-[22%] border-l border-dashed border-white/15 z-10 pointer-events-none" />

        {/* Right Part: Ticket Stub (Width 22%) */}
        <div className="w-[22%] shrink-0 h-full flex flex-col items-center justify-center px-4 py-5 z-10 relative bg-white/[0.01] rounded-r-3xl gap-4">
          {/* Left Glow effect behind QR */}
          <div className="absolute left-4 top-4 w-16 h-16 bg-white/[0.02] group-hover:bg-white/[0.08] group-hover:scale-125 rounded-full blur-xl pointer-events-none transition-all duration-350" />
          
          {isPurchased ? (
            /* GREEN CHECKMARK VIEW */
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onShowQr?.(matchingTickets.map(t => t.id), event.title);
              }}
              className="flex flex-col items-center justify-center gap-2 cursor-pointer hover:scale-[1.05] active:scale-[0.97] transition-all select-none"
              title="Tippen zum Vorzeigen"
            >
              {/* Glowing Green Circle with Checkmark */}
              <div className="relative w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.15)] group-hover:border-emerald-500/50 transition-colors">
                <Check size={28} className="text-emerald-400 filter drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" strokeWidth={3} />
                {matchingTickets.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-5.5 h-5.5 bg-emerald-600 border border-zinc-900 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow-md z-20">
                    {matchingTickets.length}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                Du bist an Board!
              </span>
            </div>
          ) : null}

          <div className="flex flex-col items-center text-center justify-center gap-3.5 w-full z-10">
            {!isPurchased && (
              <div className="flex flex-col items-center justify-center w-full select-none text-center">
                {event.variants.nodes.length > 1 ? (
                  currentUser ? (
                    // LOGGED IN USER: Show only the matching variant for account type
                    (() => {
                      const isBusiness = currentUser.user_type === 'business';
                      const matchingVariant = event.variants.nodes.find(v => 
                        isBusiness 
                          ? (v.title.toLowerCase().includes('aussteller') || v.title.toLowerCase().includes('business'))
                          : (v.title.toLowerCase().includes('privat') || v.title.toLowerCase().includes('einzel'))
                      ) || event.variants.nodes[0];

                      const displayTitle = matchingVariant.title.toLowerCase().includes('privat')
                        ? 'Einzelticket'
                        : matchingVariant.title;

                      return (
                        <div className="flex flex-col items-center justify-center">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
                            {displayTitle}
                          </span>
                          <span className="text-sm font-extrabold text-white leading-tight mt-0.5">
                            {formatPrice(matchingVariant.price.amount, matchingVariant.price.currencyCode)}
                          </span>
                        </div>
                      );
                    })()
                  ) : (
                    // NOT LOGGED IN: Show Einzelticket ("ab 45,00€") and Aussteller ("registriere dich für eine Preisübersicht")
                    (() => {
                      const privateVariant = event.variants.nodes.find(v => 
                        v.title.toLowerCase().includes('privat') || v.title.toLowerCase().includes('einzel')
                      ) || event.variants.nodes[0];

                      return (
                        <div className="flex flex-col items-center text-center space-y-1">
                          <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">
                            Ticketpreise
                          </span>
                          <div className="flex flex-col items-center text-[10px] text-zinc-300 font-semibold leading-tight space-y-1">
                            <div>
                              <span className="text-zinc-400 font-bold uppercase">Einzelticket: </span>
                              <span className="text-white font-extrabold">ab {formatPrice(privateVariant.price.amount, privateVariant.price.currencyCode)}</span>
                            </div>
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                onRegisterTrigger?.();
                              }}
                              className="cursor-pointer hover:underline text-[9px] text-zinc-400 hover:text-white"
                              title="Klicke hier, um dich zu registrieren"
                            >
                              <span className="font-bold uppercase text-zinc-400">Aussteller: </span>
                              <span className="text-zinc-400 underline">registriere dich für eine Preisübersicht</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )
                ) : (
                  <>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Ticketpreis</span>
                    <span className="text-base font-extrabold text-white leading-none mt-0.5">
                      {formatPrice(event.variants.nodes[0]?.price.amount, event.variants.nodes[0]?.price.currencyCode)}
                    </span>
                  </>
                )}
              </div>
            )}

            <div onClick={(e) => e.stopPropagation()} className="w-full">
              {isSoldOut ? (
                <button
                  disabled
                  className="w-full py-2 rounded-xl bg-zinc-900 text-zinc-500 border border-zinc-800 font-extrabold text-[11px] cursor-not-allowed opacity-60 select-none flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Ausverkauft</span>
                </button>
              ) : isPurchased ? (
                <button
                  onClick={() => onQuickBuy(event)}
                  className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 font-extrabold text-[11px] transition-all select-none active:scale-[0.98] cursor-pointer shadow-lg shadow-black/20 flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={14} />
                  <span>weiteres Ticket</span>
                </button>
              ) : (
                <button
                  onClick={() => onQuickBuy(event)}
                  className="w-full py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] transition-all select-none active:scale-[0.98] cursor-pointer shadow-lg shadow-white/5 border border-white flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={14} />
                  <span>In den Warenkorb</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
