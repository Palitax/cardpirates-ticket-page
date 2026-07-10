import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Ticket, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

const ENABLE_QR_CODE = false;

interface TicketItem {
  id: string;
  event_id: string;
  title: string;
  date: string;
  location: string;
  image?: string;
  purchaseDate: string;
  status: string;
  ticketNumber?: string;
  firstName?: string;
  lastName?: string;
}

export default function TicketsPage({ currentUser }: { currentUser: any }) {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);

  useEffect(() => {
    if (currentUser) {
      const key = `purchased_tickets_${currentUser.shopify_customer_id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setTickets(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse tickets', e);
        }
      }
    }
  }, [currentUser]);

  // Group tickets into Upcoming and Past (older than 2 days)
  const now = new Date();
  const limitDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  const upcomingTickets = tickets.filter(ticket => {
    if (!ticket.date) return true; // Default to upcoming if no date
    return new Date(ticket.date) >= limitDate;
  });

  const pastTickets = tickets.filter(ticket => {
    if (!ticket.date) return false;
    return new Date(ticket.date) < limitDate;
  });

  return (
    <div className="px-4 sm:px-6 pb-24 pt-4 max-w-2xl mx-auto space-y-8 animate-fade-in text-zinc-300 text-left">
      
      {/* Header & Back Button */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer font-bold"
        >
          <ArrowLeft size={14} />
          Zurück zum Zeitplan
        </button>
      </nav>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight flex items-center gap-2.5">
          <Ticket size={28} className="text-white" />
          Meine Tickets
        </h1>
        <p className="text-xs text-zinc-400">
          Verwalte hier deine Einlass-Tickets für Cardpirates Crew-Events.
        </p>
      </div>

      {!currentUser ? (
        <div className="text-center py-12 bg-zinc-900/20 border border-zinc-900 rounded-3xl space-y-4 px-6">
          <p className="text-sm text-zinc-400">Bitte logge dich ein, um deine Tickets anzuzeigen.</p>
          <Button
            variant="primary"
            onPress={() => navigate('/')}
            className="py-2.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs cursor-pointer border border-white"
          >
            Zur Startseite & Anmelden
          </Button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/20 border border-zinc-900 rounded-3xl space-y-4 px-6">
          <div className="w-12 h-12 rounded-full bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
            <Ticket size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Keine Tickets gefunden</p>
            <p className="text-xs text-zinc-500">Du hast aktuell noch keine Tickets für kommende Events erworben.</p>
          </div>
          <Button
            variant="primary"
            onPress={() => navigate('/')}
            className="py-2.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs cursor-pointer border border-white"
          >
            Events durchstöbern
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Upcoming Section */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-1.5 flex items-center justify-between">
              <span>Kommende Events</span>
              <span className="text-[10px] text-zinc-600 font-bold bg-zinc-900/35 border border-zinc-900 px-2 py-0.5 rounded-full">
                {upcomingTickets.length}
              </span>
            </h2>
            
            {upcomingTickets.length === 0 ? (
              <p className="text-xs text-zinc-650 py-3 italic">Keine anstehenden Tickets.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {upcomingTickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedTicket(ticket)}
                    className="p-4 bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 rounded-2xl flex gap-4 items-center justify-between cursor-pointer transition-all relative overflow-hidden"
                  >
                    {/* Event Image or Fallback */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900 shrink-0">
                      {ticket.image ? (
                        <img src={ticket.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <Ticket size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-black text-white truncate uppercase tracking-wide leading-tight">
                        {ticket.title}
                      </h3>
                      <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-zinc-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-zinc-500" />
                          {ticket.date ? new Date(ticket.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-zinc-500" />
                          {ticket.location || 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] font-black text-red-500 bg-red-950/20 border border-red-900/30 px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0 select-none">
                      Ticket ansehen
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Past Section */}
          <div className="space-y-3.5 pt-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-900 pb-1.5 flex items-center justify-between">
              <span>Vergangene Events</span>
              <span className="text-[10px] text-zinc-600 font-bold bg-zinc-900/35 border border-zinc-900 px-2 py-0.5 rounded-full">
                {pastTickets.length}
              </span>
            </h2>

            {pastTickets.length === 0 ? (
              <p className="text-xs text-zinc-650 py-3 italic">Keine vergangenen Tickets.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 opacity-40">
                {pastTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl flex gap-4 items-center justify-between select-none"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-900 shrink-0 grayscale">
                      {ticket.image ? (
                        <img src={ticket.image} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                          <Ticket size={20} />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-zinc-500 truncate uppercase tracking-wide leading-tight">
                        {ticket.title}
                      </h3>
                      <div className="flex flex-col gap-0.5 mt-1 text-[10px] text-zinc-600 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-zinc-700" />
                          {ticket.date ? new Date(ticket.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }) : 'TBA'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-zinc-700" />
                          {ticket.location || 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="text-[9px] font-black text-zinc-600 bg-zinc-900/10 border border-zinc-800/40 px-2.5 py-1 rounded-lg uppercase tracking-wider shrink-0">
                      Inaktiv
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Ticket QR Code Modal Overlay */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in select-none">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-850 rounded-3xl p-6 relative flex flex-col items-center justify-between min-h-[440px] text-center shadow-2xl">
            
            {/* Close button */}
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="space-y-1.5 mt-4">
              <span className="text-[10px] font-black text-red-650 uppercase tracking-widest block">
                Cardpirates Einlass-Ticket
              </span>
              <h2 className="text-base font-extrabold text-white leading-snug px-4">
                {selectedTicket.title}
              </h2>
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 font-semibold mt-1">
                <MapPin size={12} className="text-zinc-500" />
                <span>{selectedTicket.location}</span>
              </div>
            </div>

            {/* Conditional QR Code or Ticket Information Stub */}
            {ENABLE_QR_CODE ? (
              <div className="my-6 p-4 bg-white rounded-3xl border border-zinc-200 shadow-xl shadow-black/45">
                <QRCodeSVG 
                  value={selectedTicket.id}
                  size={180}
                  level="H"
                  includeMargin={false}
                />
              </div>
            ) : (
              <div className="w-full space-y-4 my-6 p-5 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-left">
                <div className="space-y-1">
                  <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Ticket-Inhaber</span>
                  <span className="block text-sm font-extrabold text-white">
                    {selectedTicket.firstName || currentUser?.first_name || ''} {selectedTicket.lastName || currentUser?.last_name || ''}
                  </span>
                </div>

                <div className="space-y-1 border-t border-zinc-900 pt-3">
                  <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Ort & Datum</span>
                  <span className="block text-[10px] text-zinc-400 font-semibold leading-normal">
                    {selectedTicket.location || 'TBA'} <br />
                    {selectedTicket.date ? new Date(selectedTicket.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'TBA'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-3">
                  <div className="space-y-1">
                    <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Ticketnummer</span>
                    <span className="block text-xs font-mono font-black text-red-500 uppercase tracking-wider">
                      {selectedTicket.ticketNumber || `CP-${selectedTicket.id.substring(0, 6).toUpperCase()}`}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[8px] text-zinc-500 font-bold uppercase tracking-wider">Status</span>
                    <span className="block text-xs font-bold text-emerald-500 uppercase">Gültig</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom ID tag */}
            <div className="space-y-1 mt-auto">
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                Ticket-ID: {selectedTicket.id}
              </p>
              <p className="text-xs text-white font-extrabold">
                Bitte beim Einlass vorzeigen.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
