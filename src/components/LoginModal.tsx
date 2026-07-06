import React, { useState } from 'react';
import { X, Building2, User, Loader2, ArrowRight } from 'lucide-react';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import { profileService } from '../services/supabase';
import type { CustomerProfile } from '../services/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShopifyProduct | null;
  onSuccess: (checkoutUrl: string) => void;
}

export default function LoginModal({ isOpen, onClose, event, onSuccess }: LoginModalProps) {
  const [isRegister, setIsRegister] = useState(true);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Simulate authentication / profile creation
      // In production, you would authenticate via Supabase Auth here:
      // await supabase.auth.signUp({ email, password })
      
      const mockCustomerId = `shopify-cust-${email.replace(/[^a-zA-Z0-9]/g, '')}`;

      const profileData: CustomerProfile = {
        shopify_customer_id: mockCustomerId,
        user_type: userType,
        first_name: firstName || 'Guest',
        last_name: lastName || 'User',
        phone: phone || '',
        address_line_1: address1 || '',
        address_line_2: address2 || '',
        city: city || '',
        zip_code: zip || '',
        country: country || 'DE',
        company_name: userType === 'business' ? companyName : undefined,
        vat_number: userType === 'business' ? vatNumber : undefined,
      };

      // 2. Save customer metadata in database (Supabase / LocalStorage)
      await profileService.saveProfile(profileData);

      // 3. Create Shopify Cart and pre-fill checkout via Storefront API
      if (event) {
        const variantId = event.variants.nodes[0]?.id;
        if (!variantId) {
          throw new Error('Ticket variant not found for this event.');
        }

        const checkoutUrl = await shopifyService.createCheckoutLink(variantId, email, {
          firstName: profileData.first_name,
          lastName: profileData.last_name,
          address1: profileData.address_line_1,
          city: profileData.city,
          zip: profileData.zip_code,
          country: profileData.country,
          company: userType === 'business' ? companyName : undefined,
        });

        if (checkoutUrl) {
          onSuccess(checkoutUrl);
        } else {
          throw new Error('Failed to generate a checkout link.');
        }
      } else {
        // No event, just successful signup/login
        onSuccess('');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {event 
                ? (isRegister ? 'Registrieren & Kaufen' : 'Anmelden & Kaufen')
                : (isRegister ? 'Konto erstellen' : 'Konto-Login')
              }
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {event ? (
                <>Um Tickets zu kaufen für <span className="text-sky-400 font-semibold">{event.title}</span></>
              ) : (
                'Greife auf deine Cardpirates-Kämpfe und dein Profil zu'
              )}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${isRegister ? 'bg-slate-850 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Registrieren
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${!isRegister ? 'bg-slate-850 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
            >
              Einloggen
            </button>
          </div>

          {/* User Type Selection (Signup only) */}
          {isRegister && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Kontotyp</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('private')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${userType === 'private' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'}`}
                >
                  <User size={16} />
                  Privatperson
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('business')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-bold transition-all ${userType === 'business' ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'}`}
                >
                  <Building2 size={16} />
                  Unternehmen
                </button>
              </div>
            </div>
          )}

          {/* Basic Fields */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 gap-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">E-Mail-Adresse</label>
                <input
                  type="email"
                  required
                  placeholder="name@firma.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Passwort</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                />
              </div>
            </div>

            {isRegister && (
              <>
                {/* Names */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Vorname</label>
                    <input
                      type="text"
                      required
                      placeholder="Max"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nachname</label>
                    <input
                      type="text"
                      required
                      placeholder="Mustermann"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Business specific fields */}
                {userType === 'business' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
                    <div className="sm:col-span-2">
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-2">Unternehmensdaten</h4>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Firmenname</label>
                      <input
                        type="text"
                        required={userType === 'business'}
                        placeholder="Muster GmbH"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">USt-IdNr. (Mehrwertsteuer)</label>
                      <input
                        type="text"
                        required={userType === 'business'}
                        placeholder="DE123456789"
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Checkout Address Details */}
                <div className="space-y-3.5 border-t border-slate-800 pt-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rechnungs- & Lieferadresse</h4>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Straße & Hausnummer</label>
                    <input
                      type="text"
                      required
                      placeholder="Musterstraße 12"
                      value={address1}
                      onChange={(e) => setAddress1(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Adresszusatz (Optional)</label>
                    <input
                      type="text"
                      placeholder="Wohnung, Etage, etc."
                      value={address2}
                      onChange={(e) => setAddress2(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Postleitzahl</label>
                      <input
                        type="text"
                        required
                        placeholder="10115"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Stadt</label>
                      <input
                        type="text"
                        required
                        placeholder="Berlin"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Länderkürzel</label>
                      <input
                        type="text"
                        required
                        placeholder="DE"
                        value={country}
                        onChange={(e) => setCountry(e.target.value.toUpperCase())}
                        maxLength={2}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Telefonnummer</label>
                      <input
                        type="tel"
                        required
                        placeholder="+49 170 1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-sky-500/10 disabled:opacity-75 transition-all select-none active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {event ? 'Sichere Kasse wird geladen...' : 'Authentifizierung...'}
              </>
            ) : (
              <>
                {event ? 'Weiter zur PayPal-Zahlung' : (isRegister ? 'Konto registrieren' : 'Einloggen')}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
