import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tabs, 
  TextField, 
  Label, 
  Input, 
  Button 
} from '@heroui/react';
import { ArrowRight, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shopifyService } from '../services/shopify';
import type { ShopifyProduct } from '../services/shopify';
import { profileService, supabase } from '../services/supabase';
import type { CustomerProfile } from '../services/supabase';
import logoAnimVideo from '../assets/cardpirates-logo-kleiner.mp4';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShopifyProduct | null;
  onSuccess: (checkoutUrl: string, profile?: CustomerProfile, actionType?: 'login' | 'register') => void;
}

export default function LoginModal({ isOpen, onClose, event, onSuccess }: LoginModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<string>('login');
  const [userType, setUserType] = useState<'private' | 'business'>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Ticket Selection States
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Initialize selectedVariantId when event changes
  useEffect(() => {
    if (event) {
      setSelectedVariantId(event.variants.nodes[0]?.id || '');
      setQuantity(1);
    }
  }, [event]);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const phone = '';
  const address1 = '';
  const address2 = '';
  const city = '';
  const zip = '';
  const country = 'DE';

  const [isInputFocused, setIsInputFocused] = useState(false);

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
    
    const variantId = selectedVariantId || event.variants.nodes[0]?.id;
    if (!variantId) {
      throw new Error('Ticket-Variante für dieses Event nicht gefunden.');
    }
    const selectedVariant = event.variants.nodes.find(v => v.id === variantId) || event.variants.nodes[0];
    
    // Save quantity tickets
    const savedTicketsRaw = localStorage.getItem(`purchased_tickets_${profileData.shopify_customer_id}`);
    const savedTickets = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];

    for (let i = 0; i < quantity; i++) {
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

      savedTickets.push({
        id: ticketId,
        event_id: event.id,
        title: `${event.title} - ${selectedVariant.title}`,
        date: event.eventDate?.value,
        location: event.eventLocation?.value,
        image: event.images.nodes[0]?.url,
        purchaseDate: new Date().toISOString(),
        status: 'active'
      });
    }

    localStorage.setItem(`purchased_tickets_${profileData.shopify_customer_id}`, JSON.stringify(savedTickets));

    const checkoutUrl = await shopifyService.createCheckoutLink(variantId, email, {
      firstName: profileData.first_name,
      lastName: profileData.last_name,
      address1: profileData.address_line_1 || 'Hauptstraße 1',
      city: profileData.city || 'Berlin',
      zip: profileData.zip_code || '10115',
      country: profileData.country || 'DE',
      company: profileData.company_name,
    }, quantity);

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
        type: 'signup'
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

      setSuccessMessage('Konto erfolgreich verifiziert!');
      setShowOtpScreen(false);
      setOtpCode('');

      if (event) {
        await generateCheckoutAndCallSuccess(profileData);
      } else {
        onSuccess('', profileData, 'register');
      }
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
    if (!supabase) {
      setError('Supabase-Verbindung fehlt.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      if (resendError) throw resendError;
      setSuccessMessage('Ein neuer Bestätigungscode wurde an deine E-Mail-Adresse gesendet.');
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
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
      // address1, zip, city, phone are no longer required during registration

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
      <Modal.Backdrop className="fixed inset-0 z-40 bg-black md:bg-black/70 md:backdrop-blur-sm animate-fade-in block" />
      <Modal.Container className="fixed inset-0 z-50 flex flex-col !w-full items-stretch md:items-center justify-stretch md:justify-center p-0 md:p-4 bg-black md:bg-transparent">
        <Modal.Dialog className="bg-black md:bg-zinc-900 border-none md:border border-zinc-800 rounded-none md:rounded-3xl w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl overflow-hidden flex flex-col shadow-none md:shadow-2xl relative animate-fade-in md:animate-scale-up text-zinc-300">
          
          {/* Close button */}
          <Modal.CloseTrigger 
            onClick={onClose}
            className="absolute top-4 right-4 bg-zinc-100 hover:bg-zinc-200 text-black w-11 h-11 flex items-center justify-center p-0 rounded-xl transition-colors cursor-pointer z-10"
          >
            <X size={20} className="text-black" />
          </Modal.CloseTrigger>

          {/* Mobile Header (Animated Logo) */}
          {!isInputFocused && (
            <div className="md:hidden flex flex-col items-center justify-center pt-8 pb-3 shrink-0 select-none">
              <div className="w-24 h-24 overflow-hidden">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ mixBlendMode: 'screen' }}
                  className="w-full h-full object-cover grayscale brightness-200 contrast-150 scale-110"
                  src={(window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo}
                />
              </div>
            </div>
          )}

          {/* Desktop Header */}
          <Modal.Header className="hidden md:block border-b border-zinc-800/80 px-6 py-5 text-left">
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
                    Bitte gib den Verifizierungscode ein, den wir dir an <span className="text-white font-semibold">{email}</span> gesendet haben.
                  </p>
                </div>

                <TextField name="otpCode" className="space-y-1.5 w-full">
                  <Label className="text-zinc-400 text-xs font-bold uppercase tracking-wider block text-center">Aktivierungscode</Label>
                  <Input
                    type="text"
                    placeholder="Code eingeben"
                    maxLength={12}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-center text-lg font-black tracking-[4px] text-white outline-none transition-all placeholder:tracking-normal placeholder:font-normal"
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
                {/* Custom Sliding Tab Toggle */}
                <div className="flex justify-center pb-3 shrink-0">
                  <div className="relative flex bg-zinc-900 border border-zinc-800 p-1 rounded-full w-full max-w-[280px] select-none">
                    {/* Sliding Background Pill */}
                    <motion.div
                      className="absolute top-1 bottom-1 bg-white rounded-full"
                      layoutId="modalTabBackground"
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      style={{
                        left: activeTab === 'login' ? '4px' : 'calc(50% + 2px)',
                        width: 'calc(50% - 6px)'
                      }}
                    />
                    
                    {/* Login Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setValidationErrors([]);
                        setActiveTab('login');
                      }}
                      className={`relative z-10 flex-1 py-1.5 text-center text-xs font-black transition-colors duration-200 rounded-full cursor-pointer ${
                        activeTab === 'login' ? 'text-black font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Login
                    </button>
                    
                    {/* Register/Sign Up Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setValidationErrors([]);
                        setActiveTab('register');
                      }}
                      className={`relative z-10 flex-1 py-1.5 text-center text-xs font-black transition-colors duration-200 rounded-full cursor-pointer ${
                        activeTab === 'register' ? 'text-black font-extrabold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Sign up
                    </button>
                  </div>
                </div>

                {/* Input Form Fields */}
                <form 
                  onSubmit={handleSubmit} 
                  onFocusCapture={() => setIsInputFocused(true)}
                  onBlurCapture={(e) => {
                    const currentTarget = e.currentTarget;
                    setTimeout(() => {
                      if (!currentTarget.contains(document.activeElement)) {
                        setIsInputFocused(false);
                      }
                    }, 50);
                  }}
                  className="space-y-4 md:space-y-5"
                >
                  {/* Ticket Selection Area (Only when event is defined) */}
                  {event && (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-4 mb-2 select-none">
                      <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b border-zinc-900 pb-2">
                        Ticket-Auswahl
                      </div>
                      
                      {/* Variant Selection */}
                      {event.variants.nodes.length > 1 && (
                        <div className="space-y-1.5 text-left">
                          <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Ticket-Kategorie</label>
                          <select
                            value={selectedVariantId}
                            onChange={(e) => setSelectedVariantId(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors cursor-pointer"
                          >
                            {event.variants.nodes.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.title} — {v.price.amount} {v.price.currencyCode}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Quantity Selection */}
                      <div className="space-y-1.5 text-left">
                        <label className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider block">Anzahl Tickets</label>
                        <select
                          value={quantity}
                          onChange={(e) => setQuantity(Number(e.target.value))}
                          className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none transition-colors cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <option key={n} value={n}>{n} Ticket{n > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <AnimatePresence mode="wait">
                    {activeTab === 'login' ? (
                      /* LOGIN FORM FIELDS */
                      <motion.div
                        key="login"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4 md:space-y-5"
                      >
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
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (validationErrors.includes('password')) {
                                  setValidationErrors(validationErrors.filter((f) => f !== 'password'));
                                }
                              }}
                              required
                              className={`w-full bg-zinc-950 border focus:border-white rounded-xl pl-4 pr-12 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                                validationErrors.includes('password') 
                                  ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                                  : 'border-zinc-800'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors focus:outline-none cursor-pointer p-1"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </TextField>
                      </motion.div>
                    ) : (
                      /* REGISTER FORM FIELDS */
                      <motion.div
                        key="register"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4 md:space-y-5"
                      >
                        {/* Account Type Toggle */}
                        <div className="space-y-2 pt-2">
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

                        {/* Business fields */}
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

                        {/* Names: Vorname, Nachname */}
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

                        {/* Email */}
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

                        {/* Password */}
                        <TextField name="password" className="space-y-1.5 w-full">
                          <Label className={`text-xs font-bold uppercase tracking-wider block transition-colors ${validationErrors.includes('password') ? 'text-rose-500' : 'text-zinc-400'}`}>Passwort</Label>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                if (validationErrors.includes('password')) {
                                  setValidationErrors(validationErrors.filter((f) => f !== 'password'));
                                }
                              }}
                              required
                              className={`w-full bg-zinc-950 border focus:border-white rounded-xl pl-4 pr-12 py-3 text-base text-white placeholder-zinc-700 outline-none transition-all ${
                                validationErrors.includes('password') 
                                  ? 'border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.15)] focus:border-rose-500' 
                                  : 'border-zinc-800'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors focus:outline-none cursor-pointer p-1"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </TextField>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Button inside Form */}
                  <div className="pt-4 md:pt-6">
                    <Button
                      type="submit"
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
                  </div>
                </form>
              </>
            )}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal>
  );
}
