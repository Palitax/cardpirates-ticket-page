import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Mail, Save, AlertCircle, ArrowRight } from 'lucide-react';
import type { CustomerProfile } from '../services/supabase';
import { profileService, supabase } from '../services/supabase';

interface ProfilePageProps {
  currentUser: CustomerProfile | null;
  onProfileUpdate: (profile: CustomerProfile) => void;
}

export default function ProfilePage({ currentUser, onProfileUpdate }: ProfilePageProps) {
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const [activeEmail, setActiveEmail] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'private' | 'business'>('private');
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

  // Flow & State Controls
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email Change OTP Verification State
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [pendingNewEmail, setPendingNewEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Initial Data Population
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.first_name || '');
      setLastName(currentUser.last_name || '');
      setUserType(currentUser.user_type || 'private');
      setCompanyName(currentUser.company_name || '');
      setVatNumber(currentUser.vat_number || '');
      setPhone(currentUser.phone || '');
      setAddress1(currentUser.address_line_1 || '');
      setAddress2(currentUser.address_line_2 || '');
      setCity(currentUser.city || '');
      setZip(currentUser.zip_code || '');
      setCountry(currentUser.country || 'DE');

      // Fetch active session email from Supabase or fallback
      const fetchSessionEmail = async () => {
        if (supabase) {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
              setActiveEmail(session.user.email);
              setEmail(session.user.email);
              return;
            }
          } catch (e) {
            console.warn('Could not read session email:', e);
          }
        }
        if (currentUser.email) {
          setActiveEmail(currentUser.email);
          setEmail(currentUser.email);
        }
      };
      fetchSessionEmail();
    }
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const isEmailChanged = email.trim().toLowerCase() !== activeEmail.trim().toLowerCase() && email.trim() !== '';

      // 1. Save standard profile metadata (name, address, etc.)
      const updatedProfile: CustomerProfile = {
        shopify_customer_id: currentUser.shopify_customer_id,
        email: isEmailChanged ? activeEmail : email, // Keep current until verified if changed
        user_type: userType,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        address_line_1: address1,
        address_line_2: address2 || undefined,
        city: city,
        zip_code: zip,
        country: country,
        company_name: userType === 'business' ? companyName : undefined,
        vat_number: userType === 'business' ? vatNumber : undefined,
      };

      const savedProfile = await profileService.saveProfile(updatedProfile);
      onProfileUpdate(savedProfile);

      // 2. Handle Email Change Flow if email was edited
      if (isEmailChanged && supabase) {
        setPendingNewEmail(email.trim().toLowerCase());
        
        // Trigger email update in Supabase Auth
        const { error: updateAuthErr } = await supabase.auth.updateUser({
          email: email.trim().toLowerCase()
        });

        if (updateAuthErr) {
          throw updateAuthErr;
        }

        setShowEmailOtp(true);
        setSuccessMessage(`Bestätigungscode gesendet! Bitte prüfe das Postfach von ${email.trim()}.`);
      } else {
        setSuccessMessage('Dein Profil wurde erfolgreich aktualisiert! 🎉');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Fehler beim Speichern des Profils. Bitte prüfe deine Eingaben.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!supabase || !pendingNewEmail || !otpCode.trim()) return;

    setOtpLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // 1. Verify OTP with Supabase for email change
      let verifySuccess = false;

      // Try email_change type
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: pendingNewEmail,
        token: otpCode.trim(),
        type: 'email_change'
      });

      if (!verifyErr) {
        verifySuccess = true;
      } else {
        // Fallback try type 'email'
        const { error: fallbackErr } = await supabase.auth.verifyOtp({
          email: pendingNewEmail,
          token: otpCode.trim(),
          type: 'email'
        });
        if (!fallbackErr) {
          verifySuccess = true;
        } else {
          throw verifyErr;
        }
      }

      if (verifySuccess && currentUser) {
        // Update local active email state & profile
        setActiveEmail(pendingNewEmail);
        setEmail(pendingNewEmail);

        const updatedProfile: CustomerProfile = {
          ...currentUser,
          email: pendingNewEmail,
          first_name: firstName,
          last_name: lastName,
          user_type: userType,
          company_name: userType === 'business' ? companyName : undefined,
          vat_number: userType === 'business' ? vatNumber : undefined,
          phone: phone,
          address_line_1: address1,
          address_line_2: address2 || undefined,
          city: city,
          zip_code: zip,
          country: country
        };

        const saved = await profileService.saveProfile(updatedProfile);
        onProfileUpdate(saved);

        setShowEmailOtp(false);
        setPendingNewEmail('');
        setOtpCode('');
        setSuccessMessage('E-Mail-Adresse erfolgreich aktualisiert und verifiziert! 🎉');
      }
    } catch (err: any) {
      console.error('Email OTP verification failed:', err);
      setError(err.message || 'Der Verifizierungscode ist ungültig oder abgelaufen.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-20 pb-8 md:py-8 space-y-6 text-zinc-100 animate-fade-in text-left">
      
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-5">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Zurück</span>
        </button>

        <div className="text-right">
          <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
            Profil bearbeiten
          </h1>
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
            Cardpirates Crew-Konto
          </span>
        </div>
      </div>

      {/* Global Alert Banners */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl font-medium flex items-start gap-3 animate-fade-in">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && !showEmailOtp && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl font-medium flex items-start gap-3 animate-fade-in">
          <Check size={18} className="shrink-0 mt-0.5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Email Verification Card Overlay (Triggered when email is updated) */}
      {showEmailOtp ? (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-5 shadow-2xl animate-fade-in">
          <div className="text-center space-y-2 select-none">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white">
              <Mail size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Neue E-Mail-Adresse verifizieren</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Wir haben einen Verifizierungscode an <span className="text-white font-semibold">{pendingNewEmail}</span> gesendet. Bitte gib den Code ein, um die Änderung zu bestätigen.
            </p>
          </div>

          <div className="space-y-2 max-w-xs mx-auto">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block text-center">
              6-stelliger Aktivierungscode
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={12}
              placeholder="Code eingeben"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-center text-lg font-black tracking-[4px] text-white outline-none transition-all placeholder:tracking-normal placeholder:font-normal"
            />
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleVerifyEmailOtp}
              disabled={otpLoading || otpCode.length < 4}
              className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-extrabold text-xs border border-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              {otpLoading ? (
                <span>E-Mail wird verifiziert...</span>
              ) : (
                <>
                  <span>E-Mail-Adresse jetzt ändern</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            <div className="flex justify-between items-center text-xs pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowEmailOtp(false);
                  setEmail(activeEmail);
                  setError(null);
                }}
                className="text-zinc-500 hover:text-white font-semibold underline cursor-pointer transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (supabase && pendingNewEmail) {
                    setOtpLoading(true);
                    try {
                      await supabase.auth.updateUser({ email: pendingNewEmail });
                      setSuccessMessage('Neuer Code wurde erneut gesendet.');
                    } catch (e: any) {
                      setError(e.message);
                    } finally {
                      setOtpLoading(false);
                    }
                  }
                }}
                className="text-zinc-500 hover:text-white font-semibold underline cursor-pointer transition-colors"
              >
                Code erneut senden
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main Profile Editing Form */
        <form onSubmit={handleSaveProfile} className="space-y-6">
          
          {/* Account Type Toggle */}
          <div className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
              Konto-Typ
            </label>
            <div className="grid grid-cols-2 gap-2 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setUserType('private')}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  userType === 'private'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Privatperson
              </button>
              <button
                type="button"
                onClick={() => setUserType('business')}
                className={`py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  userType === 'business'
                    ? 'bg-white text-black font-extrabold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Unternehmen
              </button>
            </div>
          </div>

          {/* Email Address Section */}
          <div className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Mail size={14} className="text-zinc-400" />
                <span>E-Mail-Adresse</span>
              </label>
              {email.trim().toLowerCase() !== activeEmail.trim().toLowerCase() && (
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-md">
                  Verifizierung erforderlich
                </span>
              )}
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-700 outline-none transition-all font-semibold"
            />
            <p className="text-[11px] text-zinc-500 leading-normal">
              Bei Änderung der E-Mail-Adresse wird automatisch ein Verifizierungscode an deine neue Adresse gesendet.
            </p>
          </div>

          {/* Personal Information */}
          <div className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">
              Persönliche Daten
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Vorname</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Nachname</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                />
              </div>
            </div>

            {/* Business fields */}
            {userType === 'business' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-fade-in">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Firmenname</label>
                  <input
                    type="text"
                    required={userType === 'business'}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">USt-IdNr.</label>
                  <input
                    type="text"
                    required={userType === 'business'}
                    value={vatNumber}
                    onChange={(e) => setVatNumber(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Telefonnummer</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+49 170 1234567"
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="p-5 bg-zinc-950 border border-zinc-800/80 rounded-2xl space-y-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-900 pb-2">
              Rechnungsadresse
            </h3>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Adresse Zeile 1</label>
                <input
                  type="text"
                  placeholder="Hauptstraße 1"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Adresse Zeile 2 (Optional)</label>
                <input
                  type="text"
                  placeholder="Etage, App. etc."
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">PLZ</label>
                  <input
                    type="text"
                    placeholder="10115"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Stadt</label>
                  <input
                    type="text"
                    placeholder="Berlin"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">Land</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-white rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-700 outline-none transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* Submit / Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-extrabold text-sm border border-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span>Änderungen werden gespeichert...</span>
              ) : (
                <>
                  <Save size={18} />
                  <span>Profil speichern</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}
    </div>
  );
}
