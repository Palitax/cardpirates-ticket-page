import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, CreditCard, ChevronRight, Video, Share2 } from 'lucide-react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import CountdownTimer from '../components/CountdownTimer';
import { Button } from '@heroui/react';

interface DetailPageProps {
  onQuickBuy: (event: ShopifyProduct) => void;
}

export default function DetailPage({ onQuickBuy }: DetailPageProps) {
  const { handle } = useParams<{ handle: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [isShareSupported, setIsShareSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && !!(navigator as any).share) {
      setIsShareSupported(true);
    }
  }, []);

  const handleShare = async () => {
    if (!event) return;
    try {
      await navigator.share({
        title: event.title,
        text: `Komm zu unserem Event: ${event.title}!`,
        url: window.location.href,
      });
    } catch (err) {
      console.log('Share failed or cancelled', err);
    }
  };

  useEffect(() => {
    async function loadEvent() {
      if (!handle) return;
      try {
        const product = await shopifyService.getEventByHandle(handle);
        setEvent(product);
        if (product && product.images.nodes.length > 0) {
          setActiveImage(product.images.nodes[0].url);
        }
      } catch (err) {
        console.error('Failed to load event detail', err);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [handle]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-400 text-sm font-semibold">Lade Event-Details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-xl font-bold text-white">Event nicht gefunden</h2>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 py-2.5 px-5 bg-zinc-800 text-white rounded-xl text-sm font-bold"
        >
          <ArrowLeft size={16} /> Zurück zum Zeitplan
        </button>
      </div>
    );
  }

  const location = event.eventLocation?.value || 'TBA';
  const dateValue = event.eventDate?.value;
  const formattedDate = dateValue 
    ? new Date(dateValue).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'TBA';

  const priceAmount = event.variants.nodes[0]?.price.amount || '0.00';
  const currency = event.variants.nodes[0]?.price.currencyCode || 'EUR';
  const videoUrl = event.eventVideoUrl?.value;

  return (
    <div className="px-4 sm:px-6 pb-32 pt-4 max-w-4xl mx-auto space-y-8 animate-fade-in text-zinc-300">
      
      {/* Back Navigation & Breadcrumb */}
      <nav className="flex items-center justify-between text-xs text-zinc-400 w-full">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-1 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Zeitplan
          </button>
          <ChevronRight size={12} className="text-zinc-650" />
          <span className="text-zinc-300 font-medium truncate max-w-[150px] sm:max-w-xs">{event.title}</span>
        </div>

        {/* Mobile-Only Share Button */}
        {isShareSupported && (
          <button
            onClick={handleShare}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 active:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <Share2 size={13} className="text-white" />
            <span>Teilen</span>
          </button>
        )}
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

          {/* Promo Video Option */}
          {videoUrl && (
            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-900/80 flex items-center gap-3">
              <div className="p-2.5 bg-zinc-800 text-white rounded-xl">
                <Video size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-white">Promo-Video verfügbar</h4>
                <p className="text-[11px] text-zinc-500">Klicke hier, um Event-Teaser und Highlights anzusehen.</p>
              </div>
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-white hover:underline"
              >
                Jetzt ansehen
              </a>
            </div>
          )}
        </div>

        {/* Content Column (Right) */}
        <div className="md:col-span-5 space-y-6">
          <div className="space-y-2 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {event.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-white font-bold uppercase tracking-wider">
              <Calendar size={13} />
              Bevorstehendes Event
            </div>
          </div>

          <div className="space-y-4 p-4.5 bg-zinc-900/40 rounded-2xl border border-zinc-900/50 text-left">
            <div className="flex items-start gap-3 text-sm">
              <Calendar size={18} className="text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Datum & Uhrzeit</span>
                <span className="text-zinc-200 font-semibold">{formattedDate}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm border-t border-zinc-900 pt-3.5">
              <MapPin size={18} className="text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Veranstaltungsort</span>
                <span className="text-zinc-200 font-semibold">{location}</span>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm border-t border-zinc-900 pt-3.5">
              <CreditCard size={18} className="text-zinc-500 shrink-0 mt-0.5" />
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ticket-Zugang</span>
                <span className="text-zinc-200 font-semibold">Sofortige digitale Zustellung per E-Mail nach Zahlung</span>
              </div>
            </div>
          </div>

          {/* Desktop Buy Ticket Card */}
          <div className="hidden md:block p-5 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-4 shadow-xl shadow-black/20 text-left">
            <div className="flex justify-between items-center">
              <div>
                <span className="block text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Ticketpreis</span>
                <span className="text-2xl font-extrabold text-white">
                  {priceAmount} <span className="text-xs text-zinc-400 font-semibold">{currency}</span>
                </span>
              </div>
              <span className="text-[10px] text-white font-bold bg-zinc-950 border border-zinc-900 px-2 py-1 rounded-md">
                Verfügbar
              </span>
            </div>

            <Button
              variant="primary"
              onPress={() => onQuickBuy(event)}
              className="w-full py-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm border border-white transition-all select-none active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-white/5"
            >
              Jetzt Ticket sichern
            </Button>
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-900 p-4 pb-safe flex items-center justify-between max-w-4xl mx-auto sm:rounded-t-3xl sm:border-x md:hidden text-left">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gesamtpreis</span>
          <span className="text-2xl font-extrabold text-white">
            {priceAmount} <span className="text-xs text-zinc-400 font-semibold">{currency}</span>
          </span>
        </div>

        <div className="flex gap-2">
          {isShareSupported && (
            <Button
              variant="outline"
              onPress={handleShare}
              className="py-3 px-3.5 rounded-xl border border-zinc-800 bg-zinc-900 active:bg-zinc-850 text-zinc-300 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Event teilen"
            >
              <Share2 size={16} className="text-white" />
            </Button>
          )}

          <Button
            variant="primary"
            onPress={() => onQuickBuy(event)}
            className="py-3 px-8 rounded-xl bg-white hover:bg-zinc-200 text-black border border-white font-extrabold text-sm transition-all select-none active:scale-[0.98] cursor-pointer"
          >
            Jetzt Ticket sichern
          </Button>
        </div>
      </div>

    </div>
  );
}
