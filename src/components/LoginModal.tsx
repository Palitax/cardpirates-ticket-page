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
import { profileService, supabase } from '../services/supabase';
import type { CustomerProfile } from '../services/supabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShopifyProduct | null;
  onSuccess: (checkoutUrl: string, profile?: CustomerProfile, actionType?: 'login' | 'register') => void;
}

export default function LoginModal({ isOpen, onClose, event, onSuccess }: LoginModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<string>('register');
  const [userType, setUserType] = useState<'private' | 'business'>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

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
  const country = 'DE';

  // OTP Verification States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getErrorMessage = (err: any): string => {
    console.error('Auth Error Details:', err);
    if (!err) return 'Ein unbekannter Fehler ist aufgetreten.';
    if (typeof err === 'string') return err;
    if (err.message && err.message !== '{}') return err.message;
    if (err.error_description) return err.error_description;
    
    try {
      const serialized = JSON.stringify(err);
      if (serialized && serialized !== '{}') return serialized;
    } catch (e) {}
    
    return err.toString() !== '[object Object]' ? err.toString() : 'Aktion fehlgeschlagen. Bitte prüfe deine Eingaben und Verbindung.';
  };

  const generateCheckoutAndCallSuccess = async (profileData: CustomerProfile) => {
    if (!event) return;
    const ticketId = crypto.randomUUID();
    
    if (supabase) {
      try {
        const { error: insertErr } = await supabase
          .from('tickets')
          .insert({
            id: ticketId,
            event_id: event.id,
            holder_name: `${profileData.first_name} ${profileData.last_name}`,
            status: 'open'
          });
        if (insertErr) {
          console.error('Failed to insert ticket to Supabase:', insertErr);
        }
      } catch (err) {
        console.warn('Network error writing ticket to Supabase:', err);
      }
    }

    const savedTicketsRaw = localStorage.getItem(`purchased_tickets_${profileData.shopify_customer_id}`);
    const savedTickets = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];
    
    savedTickets.push({
      id: ticketId,
      event_id: event.id,
      title: event.title,
      date: event.eventDate?.value,
      location: event.eventLocation?.value,
      image: event.images.nodes[0]?.url,
      purchaseDate: new Date().toISOString(),
      status: 'active'
    });
    localStorage.setItem(`purchased_tickets_${profileData.shopify_customer_id}`, JSON.stringify(savedTickets));

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
      onSuccess(checkoutUrl, profileData, activeTab === 'register' ? 'register' : 'login');
    } else {
      throw new Error('Fehler beim Erstellen der Kasse.');
    }
  };

  const handleSignUp = async () => {
    if (!supabase) {
      setError('Supabase-Datenbank nicht verknüpft.');
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            user_type: userType,
            address_line_1: address1,
            address_line_2: address2,
            city: city,
            zip_code: zip,
            country: country,
            company_name: userType === 'business' ? companyName : undefined,
            vat_number: userType === 'business' ? vatNumber : undefined,
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user && !data.session) {
        setShowOtpScreen(true);
        setSuccessMessage('Bestätigungscode gesendet! Bitte prüfe dein Postfach.');
      } else if (data.session) {
        // If double opt-in is disabled, auto-login immediately
        const mockCustomerId = `shopify-cust-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
        const profileData: CustomerProfile = {
          shopify_customer_id: mockCustomerId,
          user_type: userType,
          first_name: firstName || 'Gast',
          last_name: lastName || 'User',
          phone: phone,
          address_line_1: address1,
          address_line_2: address2,
          city: city,
          zip_code: zip,
          country: country,
          company_name: userType === 'business' ? companyName : undefined,
          vat_number: userType === 'business' ? vatNumber : undefined,
        };
        await profileService.saveProfile(profileData);
        if (event) {
          await generateCheckoutAndCallSuccess(profileData);
        } else {
          onSuccess('', profileData, 'register');
        }
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleVerifyOtp = async () => {
    if (!supabase) return;
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      });

      if (verifyError) {
        throw verifyError;
      }

      // Create database profile row upon successful email validation
      const mockCustomerId = `shopify-cust-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      const profileData: CustomerProfile = {
        shopify_customer_id: mockCustomerId,
        user_type: userType,
        first_name: firstName || 'Gast',
        last_name: lastName || 'User',
        phone: phone,
        address_line_1: address1,
        address_line_2: address2,
        city: city,
        zip_code: zip,
        country: country,
        company_name: userType === 'business' ? companyName : undefined,
        vat_number: userType === 'business' ? vatNumber : undefined,
      };
      await profileService.saveProfile(profileData);

      setSuccessMessage('Konto erfolgreich verifiziert! Logge dich jetzt ein.');
      setShowOtpScreen(false);
      setActiveTab('login');
      setOtpCode('');
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleSignIn = async () => {
    if (!supabase) {
      // Mock Bypass for local/offline testing
      const mockCustomerId = `shopify-cust-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      const profileData: CustomerProfile = {
        shopify_customer_id: mockCustomerId,
        user_type: 'private',
        first_name: 'Gast',
        last_name: 'User',
        phone: '',
        address_line_1: '',
        city: '',
        zip_code: '',
        country: 'DE',
      };
      if (event) {
        await generateCheckoutAndCallSuccess(profileData);
      } else {
        onSuccess('', profileData, 'login');
      }
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        throw signInError;
      }

      if (data.user) {
        const userMetadata = data.user.user_metadata || {};
        const mockCustomerId = `shopify-cust-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
        
        let profileData = await profileService.getProfile(mockCustomerId);
        if (!profileData) {
          profileData = {
            shopify_customer_id: mockCustomerId,
            user_type: userMetadata.user_type || 'private',
            first_name: userMetadata.first_name || 'Gast',
            last_name: userMetadata.last_name || 'User',
            phone: userMetadata.phone || '',
            address_line_1: userMetadata.address_line_1 || '',
            address_line_2: userMetadata.address_line_2 || '',
            city: userMetadata.city || '',
            zip_code: userMetadata.zip_code || '',
            country: userMetadata.country || 'DE',
            company_name: userMetadata.company_name,
            vat_number: userMetadata.vat_number,
          };
          await profileService.saveProfile(profileData);
        }

        if (event) {
          await generateCheckoutAndCallSuccess(profileData);
        } else {
          onSuccess('', profileData, 'login');
        }
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleResendOtp = async () => {
    if (!supabase) return;
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email
      });
      if (resendError) throw resendError;
      setSuccessMessage('Ein neuer Code wurde an deine E-Mail gesendet.');
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    if (showOtpScreen) {
      await handleVerifyOtp();
    } else if (activeTab === 'register') {
      const missingFields: string[] = [];
      if (!email.trim()) missingFields.push('email');
      if (!password.trim()) missingFields.push('password');
      if (!firstName.trim()) missingFields.push('firstName');
      if (!lastName.trim()) missingFields.push('lastName');
      if (userType === 'business') {
        if (!companyName.trim()) missingFields.push('companyName');
        if (!vatNumber.trim()) missingFields.push('vatNumber');
      }
      if (!address1.trim()) missingFields.push('address1');
      if (!zip.trim()) missingFields.push('zip');
      if (!city.trim()) missingFields.push('city');
      if (!phone.trim()) missingFields.push('phone');

      if (missingFields.length > 0) {
        setValidationErrors(missingFields);
        setError('Bitte fülle alle erforderlichen Felder aus.');
        setLoading(false);
        return;
      }
      await handleSignUp();
    } else {
      if (!email.trim() || !password.trim()) {
        const missingFields: string[] = [];
        if (!email.trim()) missingFields.push('email');
        if (!password.trim()) missingFields.push('password');
        setValidationErrors(missingFields);
        setError('Bitte fülle E-Mail und Passwort aus.');
        setLoading(false);
        return;
      }
      await handleSignIn();
    }
    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-fade-in hidden md:block" />
      <Modal.Container className="fixed inset-0 z-50 flex items-stretch md:items-center justify-stretch md:justify-center p-0 md:p-4">
        <Modal.Dialog className="bg-zinc-950 md:bg-zinc-900 border-none md:border border-zinc-800 rounded-none md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg overflow-hidden flex flex-col shadow-none md:shadow-2xl relative animate-fade-in md:animate-scale-up text-zinc-300">
          
          {/* Close button */}
          <Modal.CloseTrigger 
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white w-11 h-11 flex items-center justify-center p-0 hover:bg-zinc-850 rounded-xl transition-colors cursor-pointer z-10"
          >
            <X size={20} />
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
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl font-medium animate-fade-in">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl font-medium animate-fade-in">
                {successMessage}
              </div>
            )}

            {showOtpScreen ? (
              <div className="space-y-5 animate-fade-in pt-2">
                <div className="text-center py-2 space-y-2 select-none">
                  <span className="text-[32px] block">✉️</span>
                  <p className="text-sm font-bold text-white">E-Mail verifizieren</p>
                  <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    Bitte gib den 6-stelligen Verifizierungscode ein, den wir dir an <span className="text-white font-semibold">{email}</span> gesendet haben.
                  </p>
                </div>

                <TextField name="otpCode" className="space-y-1.5 w-full">
                  <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block text-center">6-Stelliger Code</Label>
                  <Input
                    type="text"
                    placeholder="123456"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-center text-lg font-black tracking-[10px] text-white outline-none transition-all placeholder:tracking-normal placeholder:font-normal"
                  />
                </TextField>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-xs text-zinc-500 hover:text-white font-semibold underline cursor-pointer transition-colors"
                  >
                    Code erneut senden
                  </button>
                  <span className="mx-2 text-zinc-700">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowOtpScreen(false);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-zinc-500 hover:text-white font-semibold underline cursor-pointer transition-colors"
                  >
                    Zurück
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Account Type Toggle (only when registering) */}
                {activeTab === 'register' && (
                  <div className="space-y-2 animate-fade-in pt-2">
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
                )}

            {/* Input Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <TextField name="email" className="space-y-1.5 w-full">
                <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('email') ? 'text-rose-500' : 'text-zinc-400'}`}>E-Mail-Adresse</Label>
                <Input
                  type="email"
                  placeholder="name@firma.de"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.includes('email')) {
                      setValidationErrors(validationErrors.filter((f) => f !== 'email'));
                    }
                  }}
                  required
                  className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                    validationErrors.includes('email') 
                      ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                      : 'border-zinc-800'
                  }`}
                />
              </TextField>

              <TextField name="password" className="space-y-1.5 w-full">
                <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('password') ? 'text-rose-500' : 'text-zinc-400'}`}>Passwort</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.includes('password')) {
                      setValidationErrors(validationErrors.filter((f) => f !== 'password'));
                    }
                  }}
                  required
                  className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                    validationErrors.includes('password') 
                      ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                      : 'border-zinc-800'
                  }`}
                />
              </TextField>

              {activeTab === 'register' && (
                <div className="space-y-4 md:space-y-5 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField name="firstName" className="space-y-1.5">
                      <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('firstName') ? 'text-rose-500' : 'text-zinc-400'}`}>Vorname</Label>
                      <Input
                        type="text"
                        placeholder="Max"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (validationErrors.includes('firstName')) {
                            setValidationErrors(validationErrors.filter((f) => f !== 'firstName'));
                          }
                        }}
                        required
                        className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                          validationErrors.includes('firstName') 
                            ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                            : 'border-zinc-800'
                        }`}
                      />
                    </TextField>
                    <TextField name="lastName" className="space-y-1.5">
                      <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('lastName') ? 'text-rose-500' : 'text-zinc-400'}`}>Nachname</Label>
                      <Input
                        type="text"
                        placeholder="Mustermann"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (validationErrors.includes('lastName')) {
                            setValidationErrors(validationErrors.filter((f) => f !== 'lastName'));
                          }
                        }}
                        required
                        className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                          validationErrors.includes('lastName') 
                            ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                            : 'border-zinc-800'
                        }`}
                      />
                    </TextField>
                  </div>

                  {userType === 'business' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                      <TextField name="companyName" className="space-y-1.5">
                        <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('companyName') ? 'text-rose-500' : 'text-zinc-400'}`}>Firmenname</Label>
                        <Input
                          type="text"
                          placeholder="Cardpirates GmbH"
                          value={companyName}
                          onChange={(e) => {
                            setCompanyName(e.target.value);
                            if (validationErrors.includes('companyName')) {
                              setValidationErrors(validationErrors.filter((f) => f !== 'companyName'));
                            }
                          }}
                          required={userType === 'business'}
                          className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                            validationErrors.includes('companyName') 
                              ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                              : 'border-zinc-800'
                          }`}
                        />
                      </TextField>
                      
                      <TextField name="vatNumber" className="space-y-1.5">
                        <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('vatNumber') ? 'text-rose-500' : 'text-zinc-400'}`}>USt-IdNr.</Label>
                        <Input
                          type="text"
                          placeholder="DE123456789"
                          value={vatNumber}
                          onChange={(e) => {
                            setVatNumber(e.target.value);
                            if (validationErrors.includes('vatNumber')) {
                              setValidationErrors(validationErrors.filter((f) => f !== 'vatNumber'));
                            }
                          }}
                          required={userType === 'business'}
                          className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                            validationErrors.includes('vatNumber') 
                              ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                              : 'border-zinc-800'
                          }`}
                        />
                      </TextField>
                    </div>
                  )}

                  {/* Address Section */}
                  <div className="space-y-4 pt-3 border-t border-zinc-800/80">
                    <span className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-left">Rechnungsadresse</span>
                    
                    <TextField name="address1" className="space-y-1.5">
                      <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('address1') ? 'text-rose-500' : 'text-zinc-400'}`}>Straße und Hausnummer</Label>
                      <Input
                        type="text"
                        placeholder="Musterstraße 12a"
                        value={address1}
                        onChange={(e) => {
                          setAddress1(e.target.value);
                          if (validationErrors.includes('address1')) {
                            setValidationErrors(validationErrors.filter((f) => f !== 'address1'));
                          }
                        }}
                        required
                        className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                          validationErrors.includes('address1') 
                            ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                            : 'border-zinc-800'
                        }`}
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
                        <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('zip') ? 'text-rose-500' : 'text-zinc-400'}`}>PLZ</Label>
                        <Input
                          type="text"
                          placeholder="10115"
                          value={zip}
                          onChange={(e) => {
                            setZip(e.target.value);
                            if (validationErrors.includes('zip')) {
                              setValidationErrors(validationErrors.filter((f) => f !== 'zip'));
                            }
                          }}
                          required
                          className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                            validationErrors.includes('zip') 
                              ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                              : 'border-zinc-800'
                          }`}
                        />
                      </TextField>
                      <TextField name="city" className="space-y-1.5">
                        <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('city') ? 'text-rose-500' : 'text-zinc-400'}`}>Ort</Label>
                        <Input
                          type="text"
                          placeholder="Berlin"
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            if (validationErrors.includes('city')) {
                              setValidationErrors(validationErrors.filter((f) => f !== 'city'));
                            }
                          }}
                          required
                          className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                            validationErrors.includes('city') 
                              ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                              : 'border-zinc-800'
                          }`}
                        />
                      </TextField>
                    </div>

                    <TextField name="phone" className="space-y-1.5">
                      <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('phone') ? 'text-rose-500' : 'text-zinc-400'}`}>Telefonnummer</Label>
                      <Input
                        type="tel"
                        placeholder="+49 170 1234567"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (validationErrors.includes('phone')) {
                            setValidationErrors(validationErrors.filter((f) => f !== 'phone'));
                          }
                        }}
                        required
                        className={`w-full bg-zinc-950 border focus:border-white rounded-xl px-4 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                          validationErrors.includes('phone') 
                            ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                            : 'border-zinc-800'
                        }`}
                      />
                    </TextField>
                  </div>
                </div>
              )}
            </form>
            </>
            )}
          </Modal.Body>

          <Modal.Footer className="border-t border-zinc-800 bg-zinc-950/60 p-4 md:p-6 flex flex-col justify-center items-center gap-4 shrink-0">
            <Button
              onPress={() => handleSubmit()}
              className="w-full py-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm border border-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>
                  {showOtpScreen 
                    ? 'Code wird verifiziert...' 
                    : (event ? 'Sichere Kasse wird geladen...' : 'Bitte warten...')}
                </span>
              ) : (
                <>
                  <span>
                    {showOtpScreen 
                      ? 'Konto verifizieren' 
                      : (event ? 'Weiter zur PayPal-Zahlung' : (activeTab === 'register' ? 'Konto registrieren' : 'Einloggen'))}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </Button>

            {!showOtpScreen && (
              <p className="text-xs text-zinc-400 text-center font-normal">
                {activeTab === 'register' ? (
                  <>
                    Bereits ein Konto?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setError(null);
                        setSuccessMessage(null);
                        setValidationErrors([]);
                      }}
                      className="text-white hover:underline font-bold cursor-pointer transition-colors"
                    >
                      Jetzt einloggen
                    </button>
                  </>
                ) : (
                  <>
                    Noch kein Konto?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setError(null);
                        setSuccessMessage(null);
                        setValidationErrors([]);
                      }}
                      className="text-white hover:underline font-bold cursor-pointer transition-colors"
                    >
                      Jetzt registrieren
                    </button>
                  </>
                )}
              </p>
            )}
          </Modal.Footer>
          
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
