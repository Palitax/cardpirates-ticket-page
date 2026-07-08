import { MapPin, Check, QrCode } from 'lucide-react';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from './CountdownTimer';
import { useNavigate } from 'react-router-dom';
import logoAnimVideo from '../assets/cardpirates-logo-kleiner.mp4';
import { QRCodeSVG } from 'qrcode.react';

interface EventCardProps {
  event: ShopifyProduct;
  onQuickBuy: (event: ShopifyProduct) => void;
  purchasedTickets?: any[];
  onShowQr?: (ticketId: string, title: string) => void;
}

export default function EventCard({ event, onQuickBuy, purchasedTickets = [], onShowQr }: EventCardProps) {
  const navigate = useNavigate();
  const logoAnimVideoUrl = (window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo;

  const title = event.title;
  const location = event.eventLocation?.value || 'TBA';
  const dateValue = event.eventDate?.value;
  
  const dateObj = dateValue ? new Date(dateValue) : null;
  const day = dateObj ? dateObj.getDate() : '--';
  const month = dateObj ? dateObj.toLocaleDateString('de-DE', { month: 'short' }).toUpperCase() : 'TBA';

  const priceAmount = event.variants.nodes[0]?.price.amount || '0.00';
  const currency = event.variants.nodes[0]?.price.currencyCode || 'EUR';
  const userTicket = purchasedTickets.find(t => t.event_id === event.id || t.id === event.id);
  const isPurchased = !!userTicket;

  return (
    <div className="w-full h-[220px] transition-all duration-350 hover:scale-[1.012] active:scale-[0.995] animate-ticket-glow hover:!filter hover:!drop-shadow-[0_0_30px_rgba(255,255,255,0.45)]">
      <div 
        onClick={() => navigate(`/events/${event.handle}`)}
        style={{
          mask: 'radial-gradient(circle at calc(100% - 180px) 0px, transparent 12px, black 13px) 0% 0% / 100% 50% no-repeat, radial-gradient(circle at calc(100% - 180px) 100%, transparent 12px, black 13px) 0% 100% / 100% 50% no-repeat',
          WebkitMask: 'radial-gradient(circle at calc(100% - 180px) 0px, transparent 12px, black 13px) 0% 0% / 100% 50% no-repeat, radial-gradient(circle at calc(100% - 180px) 100%, transparent 12px, black 13px) 0% 100% / 100% 50% no-repeat'
        }}
        className="relative w-full h-full flex flex-row rounded-3xl border border-white/[0.12] bg-white/[0.07] group-hover:bg-white/[0.12] group-hover:border-white/[0.35] backdrop-blur-xl group transition-all duration-350 cursor-pointer overflow-hidden"
      >
        {/* Glossy Reflection Overlay */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/[0.02] via-transparent to-white/[0.08] group-hover:from-white/[0.08] group-hover:to-white/[0.22] pointer-events-none z-10 transition-all duration-350" />

        {/* Edge highlight overlay */}
        <div className="absolute inset-px rounded-[23px] border border-white/[0.06] group-hover:border-white/[0.15] pointer-events-none z-10 transition-all duration-350" />

        {/* Left Section: Video Cover (Merged) */}
        <div className="relative w-[220px] h-full overflow-hidden shrink-0">
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

        {/* Middle Section: Details */}
        <div className="flex-1 p-6 pl-2 space-y-3.5 text-left flex flex-col justify-center min-h-0 z-10">
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-white tracking-tight leading-tight group-hover:text-white/95 transition-colors uppercase font-mono line-clamp-1">
              {title}
            </h3>

            {/* Date Elongated Capsule */}
            {dateValue && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.12] text-white text-[9px] font-black tracking-widest uppercase w-fit">
                <span className="w-1 h-1 rounded-full bg-white/60 animate-pulse" />
                <span>{day}. {dateObj ? dateObj.toLocaleDateString('de-DE', { month: 'long' }).toUpperCase() : month}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-zinc-300 text-xs font-semibold">
            <MapPin size={13} className="text-white/60 shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>

          <p className="text-zinc-300/80 text-xs leading-relaxed line-clamp-2">
            {event.description}
          </p>
        </div>

        {/* Dashed Tear-off Perforation Line */}
        <div className="absolute top-0 bottom-0 right-[180px] border-l border-dashed border-white/15 z-10 pointer-events-none" />

        {/* Right Part: Ticket Stub (Width 180px) */}
        <div className="w-[180px] shrink-0 h-full flex flex-col items-center justify-between p-5 pt-6 z-10 relative bg-white/[0.01] rounded-r-3xl">
          {/* Left Glow effect behind QR */}
          <div className="absolute left-4 top-4 w-16 h-16 bg-white/[0.02] group-hover:bg-white/[0.08] group-hover:scale-125 rounded-full blur-xl pointer-events-none transition-all duration-350" />
          
          {/* QR Code Graphic (Top) */}
          {isPurchased && userTicket ? (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onShowQr?.(userTicket.id, event.title);
              }}
              className="p-1.5 bg-white border border-white rounded-xl flex items-center justify-center shrink-0 shadow-lg z-10 hover:scale-[1.08] active:scale-[0.98] transition-all cursor-pointer"
              title="Tippen zum Vergrößern"
            >
              <QRCodeSVG
                value={userTicket.id}
                size={80}
                bgColor={"#ffffff"}
                fgColor={"#09090b"}
                level={"M"}
              />
            </div>
          ) : (
            <div className="p-2 bg-white/[0.04] group-hover:bg-white/[0.08] group-hover:border-white/20 border border-white/10 rounded-xl flex items-center justify-center shrink-0 shadow-inner z-10 transition-all duration-350">
              <QrCode size={40} className="text-white/40 group-hover:text-white/80 transition-colors" />
            </div>
          )}

          {/* Price & Action Area (Bottom) */}
          <div className="flex flex-col items-center text-center justify-center gap-1.5 w-full z-10">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Ticketpreis</span>
              <span className="text-base font-extrabold text-white leading-none mt-0.5">
                {priceAmount} <span className="text-[10px] text-zinc-400 font-semibold">{currency}</span>
              </span>
            </div>

            <div onClick={(e) => e.stopPropagation()} className="w-full">
              {isPurchased && userTicket ? (
                <button
                  onClick={() => onShowQr?.(userTicket.id, event.title)}
                  className="inline-flex items-center justify-center gap-1 w-full px-2.5 py-1.5 bg-green-500/15 hover:bg-green-500/25 border border-green-500/35 rounded-lg text-[10px] font-extrabold text-green-400 cursor-pointer transition-all active:scale-[0.98] animate-fade-in"
                >
                  <Check size={11} strokeWidth={3} /> QR ANZEIGEN
                </button>
              ) : (
                <button
                  onClick={() => onQuickBuy(event)}
                  className="w-full py-1.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] transition-all select-none active:scale-[0.98] cursor-pointer shadow-lg shadow-white/5 border border-white"
                >
                  Sichern
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
