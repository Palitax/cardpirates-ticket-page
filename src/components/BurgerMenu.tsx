import { useState, useEffect } from 'react';
import { Menu, X, Share2, Calendar, MapPin, ExternalLink, Mail, Shield, Scale, Info, FileText } from 'lucide-react';
import { Button } from '@heroui/react';
import type { CustomerProfile } from '../services/supabase';

interface BurgerMenuProps {
  currentUser: CustomerProfile | null;
  onLoginTrigger: () => void;
  onLogout: () => void;
}

interface PurchasedTicket {
  id: string;
  title: string;
  date?: string;
  location?: string;
  image?: string;
  purchaseDate: string;
  status: 'active' | 'expired';
}

export default function BurgerMenu({ currentUser, onLoginTrigger, onLogout }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'impressum' | 'agb' | 'datenschutz' | 'widerruf' | null>(null);
  const [tickets, setTickets] = useState<PurchasedTicket[]>([]);

  // Toggle drawer body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Load and seed tickets
  useEffect(() => {
    if (!currentUser) {
      setTickets([]);
      return;
    }

    const key = `purchased_tickets_${currentUser.shopify_customer_id}`;
    let savedTicketsRaw = localStorage.getItem(key);
    let savedTickets = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];

    // Seed default past ticket if none exists for realistic demo
    if (savedTickets.length === 0) {
      savedTickets = [
        {
          id: 'past-event-1',
          title: 'Cardshow Düsseldorf',
          date: '2026-05-10T10:00:00.000Z',
          location: 'Düsseldorf Congress Center',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=300',
          purchaseDate: '2026-04-20T15:30:00.000Z',
          status: 'expired'
        }
      ];
      localStorage.setItem(key, JSON.stringify(savedTickets));
    }

    setTickets(savedTickets);
  }, [currentUser, isOpen]);

  const handleShareInvite = async () => {
    try {
      await navigator.share({
        title: 'Cardpirates Crew',
        text: 'Werde Teil der Cardpirates Crew und besuche unsere Events!',
        url: window.location.origin,
      });
    } catch (err) {
      console.log('Share invite failed', err);
    }
  };

  const legalContent = {
    impressum: {
      title: 'Impressum',
      body: `
        Cardpirates e.V.
        Musterstraße 44
        10115 Berlin

        Vertreten durch:
        Levin Rohde

        Kontakt:
        E-Mail: support@cardpirates.de
        Telefon: +49 30 1234567

        Registereintrag:
        Eintragung im Vereinsregister.
        Registergericht: Amtsgericht Charlottenburg
        Registernummer: VR 98765 B

        Umsatzsteuer-ID:
        Umsatzsteuer-Identifikationsnummer gemäß §27 a Umsatzsteuergesetz:
        DE 987654321
      `
    },
    agb: {
      title: 'Allgemeine Geschäftsbedingungen (AGB)',
      body: `
        §1 Geltungsbereich
        Für alle Geschäftsbeziehungen zwischen Cardpirates e.V. und dem Kunden gelten ausschließlich diese Allgemeinen Geschäftsbedingungen.

        §2 Vertragsabschluss
        Die Präsentation der Events im Ticketshop stellt kein rechtlich bindendes Angebot, sondern einen unverbindlichen Online-Katalog dar. Durch Anklicken des Kaufbuttons gibst du eine verbindliche Bestellung der im Warenkorb enthaltenen Tickets ab.

        §3 Tickets & Einlass
        Tickets werden unmittelbar nach Zahlungseingang digital per E-Mail in Form eines scannbaren QR-Codes zugestellt. Jedes Ticket berechtigt eine Person zum Einlass. Das Ticket verfällt nach Einlass-Scan.

        §4 Rückerstattung
        Rückgaben oder Erstattungen von Ticket-Käufen für feste Event-Termine sind gemäß § 312g Abs. 2 Nr. 9 BGB ausgeschlossen.
      `
    },
    datenschutz: {
      title: 'Datenschutzerklärung',
      body: `
        1. Datenschutz auf einen Blick
        Wir nehmen den Schutz deiner persönlichen Daten sehr ernst. Personenbezogene Daten werden auf dieser Webseite nur im technisch notwendigen Umfang (z. B. Kaufabwicklung, Profilerstellung) verarbeitet.

        2. Datenverarbeitung bei Ticketkauf
        Wenn du ein Ticket kaufst, erheben wir Namen, E-Mail-Adresse und Rechnungsadresse. Diese Daten werden verschlüsselt an Shopify und Supabase übermittelt, um die Tickets zu generieren.

        3. Deine Rechte
        Du hast jederzeit das Recht auf unentgeltliche Auskunft über Herkunft, Empfänger und Zweck deiner gespeicherten personenbezogenen Daten sowie ein Recht auf Berichtigung, Sperrung oder Löschung dieser Daten.
      `
    },
    widerruf: {
      title: 'Widerrufsbelehrung',
      body: `
        Widerrufsrecht
        Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.

        Ausschluss des Widerrufsrechts:
        Das Widerrufsrecht besteht nicht bei Verträgen zur Erbringung von Dienstleistungen im Zusammenhang mit Freizeitbetätigungen, wenn der Vertrag für die Erbringung einen spezifischen Termin oder Zeitraum vorsieht (z. B. Ticketbuchungen für unsere zeitlich definierten Events gemäß § 312g Abs. 2 Nr. 9 BGB).
      `
    }
  };

  return (
    <>
      {/* Floating Menu Button (Top Left - Mobile Only) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center w-11 h-11 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md active:scale-95 transition-all cursor-pointer"
        aria-label="Menü öffnen"
      >
        <Menu size={20} className="text-white" />
      </button>

      {/* Fullscreen Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0f19] flex flex-col md:hidden animate-fade-in overflow-y-auto pb-8">
          
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900 shrink-0">
            <span className="text-3xl font-medium text-white font-[Qwigley] tracking-wide lowercase first-letter:uppercase">
              Cardpirates
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
              aria-label="Menü schließen"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Scrollable Content */}
          <div className="flex-1 px-6 py-6 space-y-8 overflow-y-auto">

            {/* Profile Context Section */}
            {!currentUser ? (
              /* LOGGED OUT USER VIEW */
              <div className="space-y-4">
                <div className="p-5 bg-slate-900/40 border border-slate-900 rounded-2xl space-y-3.5 text-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mein Crew Profil</h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    Melde dich an, um gekaufte Tickets anzusehen und deine Profil-Details für den Checkout zu hinterlegen.
                  </p>
                  <Button
                    variant="primary"
                    onPress={() => {
                      setIsOpen(false);
                      onLoginTrigger();
                    }}
                    className="w-full py-5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-sky-500/10 cursor-pointer"
                  >
                    Anmelden / Registrieren
                  </Button>
                </div>

                <a
                  href="https://discord.gg/8yRykEdr4G"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-slate-900/20 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-sky-500/10 flex items-center justify-center rounded-xl text-sky-400">
                      <Share2 size={16} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-white">Join our Discord</h4>
                      <p className="text-[10px] text-slate-400">Tritt der Crew auf Discord bei</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-slate-500" />
                </a>
              </div>
            ) : (
              /* LOGGED IN USER VIEW */
              <div className="space-y-6">
                {/* User Info Header Card */}
                <div className="p-4 bg-slate-900/35 border border-slate-900 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-500/10 rounded-xl flex items-center justify-center font-bold text-sky-400 uppercase text-sm">
                      {currentUser.first_name[0]}{currentUser.last_name[0]}
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-extrabold text-white">Hallo, {currentUser.first_name}!</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">{currentUser.user_type === 'business' ? 'Unternehmen' : 'Privatkunde'}</p>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="text-[10px] font-bold text-rose-400 hover:underline uppercase tracking-wider px-2.5 py-1.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-lg transition-all"
                  >
                    Logout
                  </button>
                </div>

                {/* Tickets Tracker Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2">
                    Meine Tickets
                  </h3>

                  {/* Render Active Tickets */}
                  {tickets.filter(t => t.status === 'active').length === 0 ? (
                    <div className="py-6 px-4 bg-slate-900/10 border border-dashed border-slate-900 text-center rounded-xl">
                      <p className="text-xs text-slate-400">Keine aktiven Tickets vorhanden.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.filter(t => t.status === 'active').map((ticket) => (
                        <div 
                          key={ticket.id}
                          className="bg-slate-900 border border-slate-800 rounded-none overflow-hidden shadow-lg text-left"
                        >
                          <div className="p-4 flex gap-3.5 border-b border-slate-850">
                            {ticket.image && (
                              <img src={ticket.image} className="w-16 h-16 rounded-none object-cover border border-slate-800 shrink-0" alt="" />
                            )}
                            <div className="text-left flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{ticket.title}</h4>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                                <Calendar size={11} className="text-sky-400 shrink-0" />
                                <span className="truncate">
                                  {ticket.date ? new Date(ticket.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBA'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                <MapPin size={11} className="text-slate-500 shrink-0" />
                                <span className="truncate">{ticket.location || 'TBA'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* QR Code Container */}
                          <div className="bg-slate-950/60 p-4 flex flex-col items-center justify-center text-center space-y-2">
                            {/* Mock QR Code graphic */}
                            <div className="w-24 h-24 bg-white p-2 rounded-none flex flex-wrap gap-0.5 justify-center items-center shadow-inner relative">
                              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/5 rounded-none" />
                              {/* QR modules layout mockup */}
                              <div className="grid grid-cols-6 gap-1 w-full h-full">
                                {[...Array(36)].map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`rounded-none ${(i % 3 === 0 || i % 7 === 0 || i < 6 || i % 6 === 0 || i > 30) ? 'bg-slate-950' : 'bg-transparent'}`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400">QR-Code Scannen am Einlass</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Previous Tickets Section */}
                  {tickets.filter(t => t.status === 'expired').length > 0 && (
                    <div className="space-y-2 mt-4 pt-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left">
                        Vorherige Events
                      </h4>
                      <div className="space-y-2.5">
                        {tickets.filter(t => t.status === 'expired').map((ticket) => (
                          <div 
                            key={ticket.id}
                            className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-none flex gap-3 opacity-40 select-none grayscale text-left"
                          >
                            {ticket.image && (
                              <img src={ticket.image} className="w-11 h-11 rounded-none object-cover border border-slate-900 shrink-0" alt="" />
                            )}
                            <div className="text-left flex-1 min-w-0">
                              <h5 className="text-[11px] font-bold text-slate-200 truncate">{ticket.title}</h5>
                              <p className="text-[9px] text-slate-500 mt-1">
                                Expired / Genutzt am {ticket.date ? new Date(ticket.date).toLocaleDateString('de-DE') : 'TBA'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Discord and share buttons inside Logged In */}
                <div className="space-y-3 pt-2">
                  <a
                    href="https://discord.gg/8yRykEdr4G"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-900/20 border border-slate-900 hover:border-slate-800 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-sky-500/10 flex items-center justify-center rounded-xl text-sky-400">
                        <Share2 size={16} />
                      </div>
                      <div className="text-left">
                        <h4 className="text-xs font-bold text-white">Join our Discord</h4>
                        <p className="text-[10px] text-slate-400">Discord invite link</p>
                      </div>
                    </div>
                    <ExternalLink size={14} className="text-slate-500" />
                  </a>
                </div>
              </div>
            )}

            {/* Support Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-2">
                Hilfe & Support
              </h3>
              <a
                href="mailto:support@cardpirates.de"
                className="flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-900/60 rounded-none hover:border-slate-800 transition-all text-slate-300 text-xs text-left"
              >
                <Mail size={14} className="text-sky-400" />
                <span>support@cardpirates.de</span>
              </a>
              {typeof navigator !== 'undefined' && !!(navigator as any).share && (
                <button
                  onClick={handleShareInvite}
                  className="w-full flex items-center gap-3 p-3 bg-slate-950/40 border border-slate-900/60 rounded-none hover:border-slate-800 transition-all text-slate-300 text-xs text-left cursor-pointer"
                >
                  <Share2 size={14} className="text-sky-400" />
                  <span>Shop-Link teilen</span>
                </button>
              )}
            </div>
          </div>

          {/* Legal Footer Links (Drawer Bottom) */}
          <div className="px-6 border-t border-slate-900 pt-6 mt-auto">
            <div className="grid grid-cols-2 gap-3 text-left">
              <button 
                onClick={() => setActiveSheet('impressum')}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer py-1"
              >
                <FileText size={11} className="text-sky-400" />
                Impressum
              </button>
              <button 
                onClick={() => setActiveSheet('agb')}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Scale size={11} className="text-sky-400" />
                AGB
              </button>
              <button 
                onClick={() => setActiveSheet('datenschutz')}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Shield size={11} className="text-sky-400" />
                Datenschutz
              </button>
              <button 
                onClick={() => setActiveSheet('widerruf')}
                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1.5 cursor-pointer py-1"
              >
                <Info size={11} className="text-sky-400" />
                Widerruf
              </button>
            </div>
            <p className="text-[10px] text-slate-600 text-center mt-6">
              &copy; {new Date().getFullYear()} Cardpirates Crew.
            </p>
          </div>

          {/* Fullscreen Modal Sheets for Legal Content */}
          {activeSheet && (
            <div className="fixed inset-0 z-50 bg-[#0b0f19] flex flex-col animate-slide-up">
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {legalContent[activeSheet].title}
                </h3>
                <button
                  onClick={() => setActiveSheet(null)}
                  className="text-slate-400 hover:text-white p-2 hover:bg-slate-900 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto text-left text-slate-300 text-xs leading-relaxed whitespace-pre-line space-y-4">
                {legalContent[activeSheet].body}
              </div>
              <div className="p-6 border-t border-slate-900 bg-slate-950/20">
                <Button
                  onPress={() => setActiveSheet(null)}
                  className="w-full py-5 rounded-none bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs cursor-pointer"
                >
                  Schließen
                </Button>
              </div>
            </div>
          )}

        </div>
      )}
    </>
  );
}
