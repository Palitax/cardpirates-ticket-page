import { useState, useEffect } from 'react';
import { X, Mail, Shield, Scale, Info, FileText } from 'lucide-react';
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

  // Toggle body scroll lock when drawer is active
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

  // Load purchased ticket history
  useEffect(() => {
    if (!currentUser) {
      setTickets([]);
      return;
    }

    const key = `purchased_tickets_${currentUser.shopify_customer_id}`;
    let savedTicketsRaw = localStorage.getItem(key);
    let savedTickets = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];

    // Seed default past ticket if empty
    if (savedTickets.length === 0) {
      savedTickets = [
        {
          id: 'past-event-1',
          title: 'Cardshow Düsseldorf',
          date: '2026-05-10T10:00:00.000Z',
          location: 'Düsseldorf Congress Center',
          image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=200',
          purchaseDate: '2026-04-20T15:30:00.000Z',
          status: 'expired'
        }
      ];
      localStorage.setItem(key, JSON.stringify(savedTickets));
    }

    setTickets(savedTickets);
  }, [currentUser, isOpen]);

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
        className="fixed top-4 left-4 z-40 md:hidden flex items-center justify-center w-11 h-11 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md active:scale-95 transition-all cursor-pointer"
        aria-label="Menü öffnen"
      >
        <svg className="w-5 h-5 stroke-current text-white fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {/* Slide-in Half Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          
          {/* Clickable Backdrop Overlay (Closes menu) */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Sidebar Panel */}
          <div className="relative w-[75vw] max-w-[280px] h-full bg-[#0b0f19] border-r border-slate-900/80 shadow-2xl flex flex-col z-10 animate-slide-right select-none">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-900 shrink-0">
              <span className="text-2xl font-medium text-white font-[Qwigley] tracking-wide lowercase first-letter:uppercase">
                Cardpirates
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                aria-label="Menü schließen"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">

              {/* Profile Context Section */}
              {!currentUser ? (
                /* LOGGED OUT USER VIEW */
                <div className="space-y-3 shrink-0">
                  <div className="p-4 bg-slate-900/40 border border-slate-900 rounded-xl space-y-2 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Crew Profil</span>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Logge dich ein, um deine Tickets und Profildetails einzusehen.
                    </p>
                    <Button
                      variant="primary"
                      onPress={() => {
                        setIsOpen(false);
                        onLoginTrigger();
                      }}
                      className="w-full py-3.5 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-extrabold text-[11px] cursor-pointer"
                    >
                      Login / Registrieren
                    </Button>
                  </div>
                </div>
              ) : (
                /* LOGGED IN USER VIEW */
                <div className="space-y-4 shrink-0">
                  {/* User Profile Header Card */}
                  <div className="p-3 bg-slate-900/35 border border-slate-900 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center font-bold text-sky-400 uppercase text-xs shrink-0">
                        {currentUser.first_name[0]}{currentUser.last_name[0]}
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">Hallo, {currentUser.first_name}!</h4>
                        <span className="block text-[8px] text-slate-500 uppercase tracking-widest font-semibold truncate">
                          {currentUser.user_type === 'business' ? 'Business' : 'Private'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="text-[9px] font-bold text-rose-400 hover:underline uppercase tracking-wider px-2 py-1 bg-rose-500/5 border border-rose-500/10 rounded-md transition-all shrink-0"
                    >
                      Logout
                    </button>
                  </div>

                  {/* Tickets Sektion */}
                  <div className="space-y-2.5">
                    <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 text-left">
                      Meine Tickets
                    </span>

                    {/* Active Ticket */}
                    {tickets.filter(t => t.status === 'active').length === 0 ? (
                      <div className="py-4 px-3 bg-slate-900/10 border border-dashed border-slate-900 text-center rounded-lg">
                        <p className="text-[10px] text-slate-500">Keine aktiven Tickets.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {tickets.filter(t => t.status === 'active').map((ticket) => (
                          <div 
                            key={ticket.id}
                            className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md text-left"
                          >
                            <div className="p-3 flex gap-2.5 border-b border-slate-850">
                              {ticket.image && (
                                <img src={ticket.image} className="w-11 h-11 rounded-md object-cover border border-slate-800 shrink-0" alt="" />
                              )}
                              <div className="text-left flex-1 min-w-0">
                                <h4 className="text-[11px] font-bold text-white truncate">{ticket.title}</h4>
                                <span className="block text-[9px] text-slate-400 mt-1 truncate">
                                  {ticket.date ? new Date(ticket.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : 'TBA'}
                                </span>
                              </div>
                            </div>
                            
                            {/* QR Barcode */}
                            <div className="bg-slate-950/60 p-2.5 flex flex-col items-center justify-center text-center space-y-1">
                              <div className="w-16 h-16 bg-white p-1 rounded flex flex-wrap gap-0.5 justify-center items-center relative">
                                <div className="grid grid-cols-6 gap-0.5 w-full h-full">
                                  {[...Array(36)].map((_, i) => (
                                    <div 
                                      key={i} 
                                      className={`rounded-none ${(i % 3 === 0 || i % 7 === 0 || i < 6 || i % 6 === 0 || i > 30) ? 'bg-slate-950' : 'bg-transparent'}`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span className="text-[7px] uppercase font-bold tracking-widest text-slate-500">Scan am Einlass</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Expired Tickets */}
                    {tickets.filter(t => t.status === 'expired').length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="block text-[8px] font-bold text-slate-600 uppercase tracking-widest text-left">
                          Archiv
                        </span>
                        {tickets.filter(t => t.status === 'expired').map((ticket) => (
                          <div 
                            key={ticket.id}
                            className="p-2.5 bg-slate-950/30 border border-slate-900 rounded-lg flex gap-2.5 opacity-30 select-none grayscale text-left"
                          >
                            {ticket.image && (
                              <img src={ticket.image} className="w-8 h-8 rounded-md object-cover border border-slate-900 shrink-0" alt="" />
                            )}
                            <div className="text-left flex-1 min-w-0">
                              <h5 className="text-[10px] font-bold text-slate-300 truncate">{ticket.title}</h5>
                              <p className="text-[8px] text-slate-500 mt-0.5">Genutzt 2026</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Discord Button Sektion */}
              <div className="space-y-2 shrink-0">
                <Button
                  variant="primary"
                  onPress={() => window.open('https://discord.gg/8yRykEdr4G', '_blank')}
                  className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-extrabold text-[11px] py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#5865F2]/10 transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.03c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.03A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                  </svg>
                  <span>Tritt unserem Discord bei</span>
                </Button>
              </div>

              {/* Support & Kontakt */}
              <div className="space-y-2 shrink-0">
                <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1.5 text-left">
                  Support
                </span>
                <a
                  href="mailto:support@cardpirates.de?subject=Cardpirates%20Supportanfrage"
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-950/40 border border-slate-900/60 rounded-lg hover:border-slate-800 transition-all text-slate-300 text-xs font-bold text-center"
                >
                  <Mail size={13} className="text-sky-400" />
                  <span>Support kontaktieren</span>
                </a>
              </div>
            </div>

            {/* Legal Documents Listed Vertically (Footer) */}
            <div className="px-4 border-t border-slate-900 pt-4 pb-6 mt-auto bg-slate-950/20">
              <div className="flex flex-col space-y-0.5 text-left">
                <button 
                  onClick={() => setActiveSheet('impressum')}
                  className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2 border-b border-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-sky-400 shrink-0" />
                    <span>Impressum</span>
                  </div>
                  <span className="text-slate-600 text-[10px] font-extrabold">&rarr;</span>
                </button>
                <button 
                  onClick={() => setActiveSheet('agb')}
                  className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2 border-b border-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <Scale size={12} className="text-sky-400 shrink-0" />
                    <span>AGB</span>
                  </div>
                  <span className="text-slate-600 text-[10px] font-extrabold">&rarr;</span>
                </button>
                <button 
                  onClick={() => setActiveSheet('datenschutz')}
                  className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2 border-b border-slate-900/50"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={12} className="text-sky-400 shrink-0" />
                    <span>Datenschutz</span>
                  </div>
                  <span className="text-slate-600 text-[10px] font-extrabold">&rarr;</span>
                </button>
                <button 
                  onClick={() => setActiveSheet('widerruf')}
                  className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2"
                >
                  <div className="flex items-center gap-2">
                    <Info size={12} className="text-sky-400 shrink-0" />
                    <span>Widerruf</span>
                  </div>
                  <span className="text-slate-600 text-[10px] font-extrabold">&rarr;</span>
                </button>
              </div>
              <p className="text-[9px] text-slate-600 text-center mt-4">
                &copy; {new Date().getFullYear()} Cardpirates.
              </p>
            </div>

            {/* Legal modal sheets */}
            {activeSheet && (
              <div className="fixed inset-0 z-50 bg-[#0b0f19] flex flex-col animate-slide-up">
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-900">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {legalContent[activeSheet].title}
                  </h3>
                  <button
                    onClick={() => setActiveSheet(null)}
                    className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-900 rounded-lg transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto text-left text-slate-300 text-[11px] leading-relaxed whitespace-pre-line space-y-4">
                  {legalContent[activeSheet].body}
                </div>
                <div className="p-4 border-t border-slate-900 bg-slate-950/20">
                  <Button
                    onPress={() => setActiveSheet(null)}
                    className="w-full py-3.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs cursor-pointer"
                  >
                    Schließen
                  </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
