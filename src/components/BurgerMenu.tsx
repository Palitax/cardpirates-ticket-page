import { useState, useEffect } from 'react';
import { X, Mail, Shield, Scale, Info, FileText, Ticket, ShoppingBag, User, LogOut } from 'lucide-react';
import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import type { CustomerProfile } from '../services/supabase';
import logoSchrift from '../assets/cardpirates-schrift-weiss.png';
import { WHATNOT_LOGO_BASE64 } from '../assets/whatnotLogoData';

interface BurgerMenuProps {
  currentUser: CustomerProfile | null;
  onLoginTrigger: () => void;
  onLogout: () => void;
  onProfileUpdate?: (profile: CustomerProfile) => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export default function BurgerMenu({ currentUser, onLoginTrigger, onLogout, onProfileUpdate: _onProfileUpdate, cartCount = 0, onOpenCart }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'impressum' | 'agb' | 'datenschutz' | 'widerruf' | null>(null);

  const navigate = useNavigate();

  // Newsletter States
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubmitted(true);
      setNewsletterEmail('');
    }
  };
  
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
      {/* Floating Menu Button (Top Left - Mobile & Desktop) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-5 left-5 z-40 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer p-2.5 md:p-3 rounded-xl bg-zinc-950/80 md:bg-white/[0.04] backdrop-blur-md border border-zinc-800 md:border-white/10 hover:bg-zinc-900 md:hover:bg-white/[0.08] shadow-lg shadow-black/20 min-w-[44px] min-h-[44px]"
        aria-label="Menü öffnen"
      >
        <svg className="w-5 h-5 md:w-6 md:h-6 stroke-current text-white fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {/* Floating Cart Button (Top Right - Mobile only) */}
      {onOpenCart && (
        <button
          onClick={onOpenCart}
          className="md:hidden fixed top-5 right-5 z-40 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer p-2.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800 shadow-lg shadow-black/20 min-w-[44px] min-h-[44px]"
          aria-label="Warenkorb öffnen"
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-black font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
              {cartCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-in Half Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex animate-fade-in">
          
          {/* Clickable Backdrop Overlay (Closes menu) */}
          <div 
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Sidebar Panel */}
          <div className="relative w-[75vw] max-w-[280px] h-full bg-black md:bg-zinc-950/95 md:backdrop-blur-2xl border-r border-zinc-900 md:border-white/10 shadow-2xl flex flex-col z-10 animate-slide-right select-none text-zinc-300">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-900 shrink-0">
              <div className="flex items-center select-none pointer-events-none">
                <img 
                  src={(window as any).ShopifyAssets?.logoSchriftUrl || logoSchrift} 
                  alt="Cardpirates Logo" 
                  className="h-6 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
                aria-label="Menü schließen"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col justify-between">

              {/* Profile Context Section (Top - Highest Priority) */}
              <div className="space-y-4 shrink-0">
                {!currentUser ? (
                  /* LOGGED OUT USER VIEW */
                  <div className="space-y-3 text-center px-1 py-1">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Crew Profil</span>
                    <p className="text-[11px] text-zinc-500 leading-normal mb-1 text-left">
                      Logge dich ein, um deine Tickets und Profildetails einzusehen.
                    </p>
                    <Button
                      variant="primary"
                      onPress={() => {
                        setIsOpen(false);
                        onLoginTrigger();
                      }}
                      className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs cursor-pointer border border-white transition-all active:scale-[0.98]"
                    >
                      Login / Registrieren
                    </Button>
                  </div>
                ) : (
                  /* LOGGED IN USER VIEW - High Visibility Profile & Tickets */
                  <div className="space-y-2.5 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-900">
                    {/* User Info Header & Direct Logout */}
                    <div className="flex items-center justify-between gap-2 text-left pb-1">
                      <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate">Hallo, {currentUser.first_name}!</h4>
                        <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-bold truncate">
                          {currentUser.user_type === 'business' ? 'Business Account' : 'Private Account'}
                        </span>
                      </div>
                      <button
                        onClick={onLogout}
                        className="text-[9px] font-extrabold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-900/50 px-2.5 py-1.5 rounded-lg uppercase tracking-wider shrink-0 cursor-pointer transition-all flex items-center gap-1 active:scale-95"
                      >
                        <LogOut size={10} />
                        <span>Logout</span>
                      </button>
                    </div>

                    {/* Meine Tickets Button (Prominent) */}
                    <Button
                      variant="primary"
                      onPress={() => {
                        setIsOpen(false);
                        navigate('/meine-tickets');
                      }}
                      className="w-full py-2.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs cursor-pointer border border-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md"
                    >
                      <Ticket size={15} />
                      <span>Meine Tickets</span>
                    </Button>
                    
                    {/* Profil bearbeiten Button */}
                    <Button
                      variant="outline"
                      onPress={() => {
                        setIsOpen(false);
                        navigate('/profil');
                      }}
                      className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold text-xs cursor-pointer border border-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <User size={14} />
                      <span>Profil bearbeiten</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Socials & Community Section */}
              <div className="space-y-4 pt-4 shrink-0">
                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5 text-left">
                    Community & Socials
                  </span>
                  
                  {/* Discord Button */}
                  <Button
                    variant="primary"
                    onPress={() => window.open('https://discord.gg/8yRykEdr4G', '_blank')}
                    className="w-full py-2.5 rounded-xl bg-black hover:bg-zinc-950 text-white font-extrabold text-xs cursor-pointer border border-zinc-800 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4 fill-white shrink-0 block" viewBox="0 0 127.14 96.36">
                      <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1.07-.79,2.12-1.61,3.13-2.47a75.1,75.1,0,0,0,64.84,0c1,.86,2.06,1.68,3.13,2.47a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.07,47,122.9,24.16,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.72,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96,53,91,65.69,84.69,65.69Z"/>
                    </svg>
                    <span>Discord Server</span>
                  </Button>

                  {/* Instagram & WhatNot Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="https://www.instagram.com/cardpiratesofficial/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-750 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="w-4.5 h-4.5 rounded-md bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shrink-0 flex items-center justify-center p-0.5">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      <span className="text-[11px] font-extrabold text-white group-hover:text-rose-400 transition-colors">Instagram</span>
                    </a>

                    <a
                      href="https://www.whatnot.com/de-DE/user/cardpirates/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-zinc-950 border border-zinc-850 hover:border-zinc-750 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer group active:scale-[0.98]"
                    >
                      <div className="w-4.5 h-4.5 rounded-md overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={WHATNOT_LOGO_BASE64} alt="WhatNot" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[11px] font-extrabold text-white group-hover:text-amber-400 transition-colors">WhatNot</span>
                    </a>
                  </div>
                </div>

                {/* Newsletter Input Section */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5 text-left">
                    Newsletter
                  </span>
                  {newsletterSubmitted ? (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] rounded-xl text-center font-medium">
                      Danke für dein Abonnement! 🎉
                    </div>
                  ) : (
                    <form onSubmit={handleNewsletterSubmit} className="flex gap-1.5">
                      <input
                        type="email"
                        required
                        placeholder="Deine E-Mail-Adresse"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-3 py-2 text-[11px] text-white placeholder-zinc-700 outline-none transition-all"
                      />
                      <button
                        type="submit"
                        className="px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-[11px] cursor-pointer border border-white transition-all active:scale-95"
                      >
                        OK
                      </button>
                    </form>
                  )}
                </div>

                {/* Support & Kontakt */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5 text-left">
                    Support
                  </span>
                  <a
                    href="mailto:support@cardpirates.de?subject=Cardpirates%20Supportanfrage"
                    className="w-full flex items-center justify-center gap-2 p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl hover:border-zinc-800 transition-all text-slate-300 text-xs font-bold text-center"
                  >
                    <Mail size={13} className="text-white" />
                    <span>Support kontaktieren</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Legal Documents Listed Vertically (Footer) */}
            <div className="px-4 border-t border-zinc-900 pt-4 pb-6 mt-auto bg-zinc-950/20">
              <div className="flex flex-col space-y-0.5 text-left">
                <button 
                  onClick={() => setActiveSheet('impressum')}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2 border-b border-zinc-900/55"
                >
                  <div className="flex items-center gap-2">
                    <FileText size={12} className="text-white shrink-0" />
                    <span>Impressum</span>
                  </div>
                  <span className="text-zinc-700 text-[10px] font-extrabold">&rarr;</span>
                </button>
                <button 
                  onClick={() => setActiveSheet('agb')}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2 border-b border-zinc-900/55"
                >
                  <div className="flex items-center gap-2">
                    <Scale size={12} className="text-white shrink-0" />
                    <span>AGB</span>
                  </div>
                  <span className="text-zinc-700 text-[10px] font-extrabold">&rarr;</span>
                </button>
                <button 
                  onClick={() => setActiveSheet('datenschutz')}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2 border-b border-zinc-900/55"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={12} className="text-white shrink-0" />
                    <span>Datenschutz</span>
                  </div>
                  <span className="text-zinc-700 text-[10px] font-extrabold">&rarr;</span>
                </button>
                <button 
                  onClick={() => setActiveSheet('widerruf')}
                  className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider flex items-center justify-between cursor-pointer py-2"
                >
                  <div className="flex items-center gap-2">
                    <Info size={12} className="text-white shrink-0" />
                    <span>Widerruf</span>
                  </div>
                  <span className="text-zinc-700 text-[10px] font-extrabold">&rarr;</span>
                </button>
              </div>
              <p className="text-[9px] text-zinc-650 text-center mt-4">
                &copy; {new Date().getFullYear()} Cardpirates x Rohde Media.
              </p>
            </div>

            {/* Legal modal sheets */}
            {activeSheet && (
              <div className="fixed inset-0 z-50 bg-black flex flex-col animate-slide-up text-zinc-300">
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-900">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {legalContent[activeSheet].title}
                  </h3>
                  <button
                    onClick={() => setActiveSheet(null)}
                    className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto text-left text-zinc-300 text-[11px] leading-relaxed whitespace-pre-line space-y-4">
                  {legalContent[activeSheet].body}
                </div>
                <div className="p-4 border-t border-zinc-900 bg-zinc-950/20">
                  <Button
                    onPress={() => setActiveSheet(null)}
                    className="w-full py-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs cursor-pointer"
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
