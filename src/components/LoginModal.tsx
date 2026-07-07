import React, { useState } from 'react';
import { 
  Modal, 
  Tabs, 
  TextField, 
  Label, 
  Input, 
  Button 
} from '@heroui/react';
import { ArrowRight, X } from 'lucide-react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import { profileService } from '../services/supabase';
import type { CustomerProfile } from '../services/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShopifyProduct | null;
  onSuccess: (checkoutUrl: string, profile?: CustomerProfile) => void;
}

export default function LoginModal({ isOpen, onClose, event, onSuccess }: LoginModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<string>('register');
  const [userType, setUserType] = useState<'private' | 'business'>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('DE');

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const mockCustomerId = `shopify-cust-${email.replace(/[^a-zA-Z0-9]/g, '')}`;

      const profileData: CustomerProfile = {
        shopify_customer_id: mockCustomerId,
        user_type: userType,
        first_name: activeTab === 'register' ? (firstName || 'Gast') : 'Wiederkehrender',
        last_name: activeTab === 'register' ? (lastName || 'User') : 'Kunde',
        phone: activeTab === 'register' ? phone : '',
        address_line_1: activeTab === 'register' ? address1 : '',
        address_line_2: activeTab === 'register' ? address2 : '',
        city: activeTab === 'register' ? city : '',
        zip_code: activeTab === 'register' ? zip : '',
        country: activeTab === 'register' ? country : 'DE',
        company_name: activeTab === 'register' && userType === 'business' ? companyName : undefined,
        vat_number: activeTab === 'register' && userType === 'business' ? vatNumber : undefined,
      };

      // 1. Save profile metadata
      await profileService.saveProfile(profileData);

      // 2. Checkout link generation
      if (event) {
        // Save to mock purchased tickets list in localStorage
        const savedTicketsRaw = localStorage.getItem(`purchased_tickets_${mockCustomerId}`);
        const savedTickets = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];
        
        // Add new ticket if not already purchased
        if (!savedTickets.some((t: any) => t.id === event.id)) {
          savedTickets.push({
            id: event.id,
            title: event.title,
            date: event.eventDate?.value,
            location: event.eventLocation?.value,
            image: event.images.nodes[0]?.url,
            purchaseDate: new Date().toISOString(),
            status: 'active'
          });
          localStorage.setItem(`purchased_tickets_${mockCustomerId}`, JSON.stringify(savedTickets));
        }

        const variantId = event.variants.nodes[0]?.id;
        if (!variantId) {
          throw new Error('Ticket-Variante für dieses Event nicht gefunden.');
        }

        const checkoutUrl = await shopifyService.createCheckoutLink(variantId, email, {
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          address1: profileData.address_line_1 || 'Hauptstraße 1',
          city: profileData.city || 'Berlin',
          zip: profileData.zip_code || '10115',
          country: profileData.country || 'DE',
          company: profileData.company_name,
        });

        if (checkoutUrl) {
          onSuccess(checkoutUrl, profileData);
        } else {
          throw new Error('Fehler beim Erstellen der Kasse.');
        }
      } else {
        onSuccess('', profileData);
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in" />
      <Modal.Container className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-4 p-0">
        <Modal.Dialog className="bg-zinc-900 border-t md:border border-zinc-800 rounded-t-3xl md:rounded-3xl w-full max-w-lg h-[92vh] md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative animate-slide-up md:animate-scale-up text-zinc-300">
          
          {/* Close button */}
          <Modal.CloseTrigger 
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 hover:bg-zinc-850 rounded-lg transition-colors cursor-pointer z-10"
          >
            <X size={18} />
          </Modal.CloseTrigger>

          {/* Header */}
          <Modal.Header className="border-b border-zinc-800/80 px-4 py-4 md:px-6 md:py-5 text-left">
            <Modal.Heading className="text-lg font-bold text-white tracking-tight">
              {event 
                ? (activeTab === 'register' ? 'Registrieren & Kaufen' : 'Anmelden & Kaufen')
                : (activeTab === 'register' ? 'Konto erstellen' : 'Konto-Login')
              }
            </Modal.Heading>
            <p className="text-xs text-zinc-400 font-normal mt-1">
              {event ? (
                <>Um Tickets zu kaufen für <span className="text-white font-semibold">{event.title}</span></>
              ) : (
                'Greife auf deine Cardpirates-Kämpfe und dein Profil zu'
              )}
            </p>
          </Modal.Header>

          {/* Scrollable Body */}
          <Modal.Body className="px-4 py-4 md:px-6 md:py-5 overflow-y-auto space-y-4 md:space-y-6 flex-1 text-left">
            {error && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            {/* Controlled Tabs */}
            <Tabs 
              selectedKey={activeTab} 
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              <Tabs.ListContainer className="w-full">
                <Tabs.List className="w-full flex bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                  <Tabs.Tab 
                    id="register" 
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${activeTab === 'register' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Registrieren
                  </Tabs.Tab>
                  <Tabs.Tab 
                    id="login" 
                    className={`flex-1 py-2 text-center text-xs font-bold rounded-lg cursor-pointer transition-all ${activeTab === 'login' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Einloggen
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <Tabs.Panel id="register" className="space-y-5 pt-4">
                {/* Account Type Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Kontotyp</label>
                  <Tabs 
                    selectedKey={userType} 
                    onSelectionChange={(key) => setUserType(key as 'private' | 'business')}
                  >
                    <Tabs.ListContainer className="w-full">
                      <Tabs.List className="w-full flex bg-zinc-950 p-1 border border-zinc-800 rounded-xl">
                        <Tabs.Tab 
                          id="private" 
                          className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg cursor-pointer transition-all ${userType === 'private' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Privatperson
                        </Tabs.Tab>
                        <Tabs.Tab 
                          id="business" 
                          className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg cursor-pointer transition-all ${userType === 'business' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Unternehmen
                        </Tabs.Tab>
                      </Tabs.List>
                    </Tabs.ListContainer>
                    <Tabs.Panel id="private" className="hidden"><div /></Tabs.Panel>
                    <Tabs.Panel id="business" className="hidden"><div /></Tabs.Panel>
                  </Tabs>
                </div>
              </Tabs.Panel>

              <Tabs.Panel id="login" className="pt-2">
                <div />
              </Tabs.Panel>
            </Tabs>

            {/* Input Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <TextField name="email" className="space-y-1.5 w-full">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">E-Mail-Adresse</Label>
                <Input
                  type="email"
                  placeholder="name@firma.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                />
              </TextField>

              <TextField name="password" className="space-y-1.5 w-full">
                <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Passwort</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                />
              </TextField>

              {activeTab === 'register' && (
                <div className="space-y-4 md:space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField name="firstName" className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Vorname</Label>
                      <Input
                        type="text"
                        placeholder="Max"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </TextField>
                    <TextField name="lastName" className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Nachname</Label>
                      <Input
                        type="text"
                        placeholder="Mustermann"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </TextField>
                  </div>

                  {userType === 'business' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <TextField name="companyName" className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Firmenname</Label>
                        <Input
                          type="text"
                          placeholder="Cardpirates GmbH"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          required={userType === 'business'}
                          className="w-full bg-zinc-905 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </TextField>
                      
                      <TextField name="vatNumber" className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">USt-IdNr.</Label>
                        <Input
                          type="text"
                          placeholder="DE123456789"
                          value={vatNumber}
                          onChange={(e) => setVatNumber(e.target.value)}
                          required={userType === 'business'}
                          className="w-full bg-zinc-905 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </TextField>
                    </div>
                  )}

                  {/* Address Section */}
                  <div className="space-y-4 pt-3 border-t border-zinc-800/80">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Rechnungsadresse</span>
                    
                    <TextField name="address1" className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Straße und Hausnummer</Label>
                      <Input
                        type="text"
                        placeholder="Musterstraße 12a"
                        value={address1}
                        onChange={(e) => setAddress1(e.target.value)}
                        required
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </TextField>

                    <TextField name="address2" className="space-y-1.5">
                      <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Adresszusatz (optional)</Label>
                      <Input
                        type="text"
                        placeholder="Wohnung, Etage, etc."
                        value={address2}
                        onChange={(e) => setAddress2(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                      />
                    </TextField>

                    <div className="grid grid-cols-2 gap-4">
                      <TextField name="zip" className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">PLZ</Label>
                        <Input
                          type="text"
                          placeholder="10115"
                          value={zip}
                          onChange={(e) => setZip(e.target.value)}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </TextField>
                      <TextField name="city" className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Ort</Label>
                        <Input
                          type="text"
                          placeholder="Berlin"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField name="country" className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Länderkürzel</Label>
                        <Input
                          type="text"
                          placeholder="DE"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          maxLength={2}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </TextField>
                      <TextField name="phone" className="space-y-1.5">
                        <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block">Telefonnummer</Label>
                        <Input
                          type="tel"
                          placeholder="+49 170 1234567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all"
                        />
                      </TextField>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </Modal.Body>

          <Modal.Footer className="border-t border-zinc-800 bg-zinc-950/60 p-4 md:p-6 flex justify-end shrink-0">
            <Button
              onPress={() => handleSubmit()}
              className="w-full py-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm border border-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Sichere Kasse wird geladen...</span>
              ) : (
                <>
                  <span>{event ? 'Weiter zur PayPal-Zahlung' : (activeTab === 'register' ? 'Konto registrieren' : 'Einloggen')}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </Modal.Footer>
          
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
