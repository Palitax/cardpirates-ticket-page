import { useState, useEffect } from 'react';
import { X, Mail, Shield, Scale, Info, FileText } from 'lucide-react';
import { Button } from '@heroui/react';
import type { CustomerProfile } from '../services/supabase';
import logo from '../assets/logo.png';

interface BurgerMenuProps {
  currentUser: CustomerProfile | null;
  onLoginTrigger: () => void;
  onLogout: () => void;
  onProfileUpdate?: (profile: CustomerProfile) => void;
}

export default function BurgerMenu({ currentUser, onLoginTrigger, onLogout, onProfileUpdate }: BurgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<'impressum' | 'agb' | 'datenschutz' | 'widerruf' | null>(null);
  
  // Profile Editing States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editUserType, setEditUserType] = useState<'private' | 'business'>('private');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editVatNumber, setEditVatNumber] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress1, setEditAddress1] = useState('');
  const [editAddress2, setEditAddress2] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editZip, setEditZip] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (isEditingProfile && currentUser) {
      setEditFirstName(currentUser.first_name || '');
      setEditLastName(currentUser.last_name || '');
      setEditUserType(currentUser.user_type || 'private');
      setEditCompanyName(currentUser.company_name || '');
      setEditVatNumber(currentUser.vat_number || '');
      setEditPhone(currentUser.phone || '');
      setEditAddress1(currentUser.address_line_1 || '');
      setEditAddress2(currentUser.address_line_2 || '');
      setEditCity(currentUser.city || '');
      setEditZip(currentUser.zip_code || '');
      setEditCountry(currentUser.country || '');
      setEditError(null);
    }
  }, [isEditingProfile, currentUser]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setEditLoading(true);
    setEditError(null);
    try {
      const updatedProfile: CustomerProfile = {
        shopify_customer_id: currentUser.shopify_customer_id,
        user_type: editUserType,
        first_name: editFirstName,
        last_name: editLastName,
        phone: editPhone,
        address_line_1: editAddress1,
        address_line_2: editAddress2 || undefined,
        city: editCity,
        zip_code: editZip,
        country: editCountry,
        company_name: editUserType === 'business' ? editCompanyName : undefined,
        vat_number: editUserType === 'business' ? editVatNumber : undefined,
      };
      const { profileService } = await import('../services/supabase');
      const savedProfile = await profileService.saveProfile(updatedProfile);
      onProfileUpdate?.(savedProfile);
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error(err);
      setEditError('Fehler beim Speichern des Profils. Bitte versuche es erneut.');
    } finally {
      setEditLoading(false);
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
      {/* Minimalist Floating Menu Button (Top Left - Floating glass circular button on desktop, borderless on mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-40 flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer p-1 md:p-3 rounded-xl md:bg-white/[0.04] md:backdrop-blur-md md:border md:border-white/10 md:hover:bg-white/[0.08] md:hover:border-white/20 md:shadow-lg md:shadow-black/20"
        aria-label="Menü öffnen"
      >
        <svg className="w-6 h-6 stroke-current text-white fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

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
              <div className="flex items-center gap-2 select-none pointer-events-none">
                <img 
                  src={(window as any).ShopifyAssets?.logoUrl || logo} 
                  alt="Cardpirates Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-2xl font-medium text-white font-[Qwigley] tracking-wide lowercase first-letter:uppercase">
                  Cardpirates
                </span>
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
            <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">

              {/* Profile Context Section */}
              {!currentUser ? (
                /* LOGGED OUT USER VIEW - Card Wrapper Removed */
                <div className="space-y-3 shrink-0 text-center px-1 py-2">
                  <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Crew Profil</span>
                  <p className="text-[11px] text-zinc-500 leading-normal mb-1">
                    Logge dich ein, um deine Tickets und Profildetails einzusehen.
                  </p>
                  <Button
                    variant="primary"
                    onPress={() => {
                      setIsOpen(false);
                      onLoginTrigger();
                    }}
                    className="w-full py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-extrabold text-xs cursor-pointer border border-white transition-all active:scale-[0.98]"
                  >
                    Login / Registrieren
                  </Button>
                </div>
              ) : (
                /* LOGGED IN USER VIEW */
                <div className="space-y-3 shrink-0">
                  {/* User Profile Header Card */}
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center font-bold text-white uppercase text-xs shrink-0 border border-zinc-800">
                        {currentUser.first_name[0]}{currentUser.last_name[0]}
                      </div>
                      <div className="text-left min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">Hallo, {currentUser.first_name}!</h4>
                        <span className="block text-[8px] text-zinc-500 uppercase tracking-widest font-semibold truncate">
                          {currentUser.user_type === 'business' ? 'Business' : 'Private'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onLogout}
                      className="text-[9px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-md transition-all shrink-0"
                    >
                      Logout
                    </button>
                  </div>
                  
                  {/* Edit Profile Button */}
                  <Button
                    variant="primary"
                    onPress={() => setIsEditingProfile(true)}
                    className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-white font-extrabold text-xs cursor-pointer border border-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center"
                  >
                    Profil bearbeiten
                  </Button>
                </div>
              )}

              {/* Discord Button Sektion (Unified size matching Login button, official logo path) */}
              <div className="space-y-2 shrink-0">
                <Button
                  variant="primary"
                  onPress={() => window.open('https://discord.gg/8yRykEdr4G', '_blank')}
                  className="w-full py-3 rounded-lg bg-black hover:bg-zinc-950 text-white font-extrabold text-xs cursor-pointer border border-zinc-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <svg className="w-4 h-4 fill-white shrink-0 block" viewBox="0 0 127.14 96.36">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1.07-.79,2.12-1.61,3.13-2.47a75.1,75.1,0,0,0,64.84,0c1,.86,2.06,1.68,3.13,2.47a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.07,47,122.9,24.16,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.9,46,53.72,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.14,46,96,53,91,65.69,84.69,65.69Z"/>
                  </svg>
                  <span>Tritt unserem Discord bei</span>
                </Button>
              </div>

              {/* Support & Kontakt */}
              <div className="space-y-2 shrink-0">
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5 text-left">
                  Support
                </span>
                <a
                  href="mailto:support@cardpirates.de?subject=Cardpirates%20Supportanfrage"
                  className="w-full flex items-center justify-center gap-2 p-2.5 bg-zinc-950 border border-zinc-900 rounded-lg hover:border-zinc-800 transition-all text-slate-300 text-xs font-bold text-center"
                >
                  <Mail size={13} className="text-white" />
                  <span>Support kontaktieren</span>
                </a>
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
                &copy; {new Date().getFullYear()} Cardpirates.
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

            {/* Edit Profile Slide-Up Modal */}
            {isEditingProfile && (
              <div className="fixed inset-0 z-50 bg-black flex flex-col animate-slide-up text-zinc-300">
                <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-900 shrink-0">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Profil bearbeiten
                  </h3>
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="text-zinc-400 hover:text-white p-1.5 hover:bg-zinc-900 rounded-lg transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <form onSubmit={handleProfileSave} className="flex-1 p-4 overflow-y-auto space-y-4 text-left">
                  {editError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                      {editError}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* User Type Tab Toggle */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Konto-Typ</label>
                      <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                        <button
                          type="button"
                          onClick={() => setEditUserType('private')}
                          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            editUserType === 'private' 
                              ? 'bg-zinc-900 text-white shadow-sm' 
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Privatperson
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditUserType('business')}
                          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                            editUserType === 'business' 
                              ? 'bg-zinc-900 text-white shadow-sm' 
                              : 'text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          Gewerblich
                        </button>
                      </div>
                    </div>

                    {/* Name fields */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Vorname</label>
                        <input
                          type="text"
                          required
                          value={editFirstName}
                          onChange={(e) => setEditFirstName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Nachname</label>
                        <input
                          type="text"
                          required
                          value={editLastName}
                          onChange={(e) => setEditLastName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Business fields */}
                    {editUserType === 'business' && (
                      <div className="grid grid-cols-2 gap-3 animate-fade-in">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Firmenname</label>
                          <input
                            type="text"
                            required
                            value={editCompanyName}
                            onChange={(e) => setEditCompanyName(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">USt-IdNr.</label>
                          <input
                            type="text"
                            required
                            value={editVatNumber}
                            onChange={(e) => setEditVatNumber(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* Phone field */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Telefonnummer</label>
                      <input
                        type="tel"
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </div>

                    {/* Address fields */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Adresse Zeile 1</label>
                      <input
                        type="text"
                        required
                        value={editAddress1}
                        onChange={(e) => setEditAddress1(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Adresse Zeile 2 (Optional)</label>
                      <input
                        type="text"
                        value={editAddress2}
                        onChange={(e) => setEditAddress2(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Stadt</label>
                        <input
                          type="text"
                          required
                          value={editCity}
                          onChange={(e) => setEditCity(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">PLZ</label>
                        <input
                          type="text"
                          required
                          value={editZip}
                          onChange={(e) => setEditZip(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Land</label>
                      <input
                        type="text"
                        required
                        value={editCountry}
                        onChange={(e) => setEditCountry(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-900 focus:border-white rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3 shrink-0">
                    <Button
                      type="button"
                      onPress={() => setIsEditingProfile(false)}
                      className="flex-1 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-white font-bold text-xs cursor-pointer border border-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center"
                    >
                      Abbrechen
                    </Button>
                     <button
                       type="submit"
                       disabled={editLoading}
                       className="flex-1 py-3 rounded-lg bg-white hover:bg-zinc-200 text-black font-extrabold text-xs cursor-pointer border border-white transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-50"
                     >
                       {editLoading ? 'Speichern...' : 'Speichern'}
                     </button>
                  </div>
                 </form>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
