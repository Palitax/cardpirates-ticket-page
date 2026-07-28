import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowLeft, MailX, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '@heroui/react';
import { newsletterService } from '../services/newsletterService';

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [inputEmail, setInputEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (emailParam) {
      handleUnsubscribe(emailParam);
    }
  }, [emailParam]);

  const handleUnsubscribe = async (emailToUnsub: string) => {
    const cleanEmail = emailToUnsub.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatus('error');
      setMessage('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    setStatus('loading');
    try {
      const res = await newsletterService.unsubscribe(cleanEmail);
      if (res.success) {
        setStatus('success');
        setMessage(`Die E-Mail-Adresse ${cleanEmail} wurde erfolgreich abgemeldet.`);
      } else {
        setStatus('error');
        setMessage(res.message || 'Abmeldung fehlgeschlagen. Bitte versuche es erneut.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später noch einmal.');
    }
  };

  const handleResubscribe = async () => {
    if (!inputEmail) return;
    setStatus('loading');
    try {
      const res = await newsletterService.subscribe(inputEmail, 'landing_page');
      if (res.success) {
        setStatus('idle');
        setMessage('Du hast dich wieder erfolgreich zum Newsletter angemeldet!');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Wiederanmeldung fehlgeschlagen.');
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 select-none text-zinc-100 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 blur-[90px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border border-zinc-800/80 rounded-3xl p-6 sm:p-9 shadow-2xl backdrop-blur-xl relative z-10 space-y-6"
      >
        {/* Top Tag Header */}
        <div className="flex items-center justify-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full shadow-sm">
            <Sparkles size={12} className="text-rose-400" />
            Cardpirates Newsletter
          </span>
        </div>

        {/* Header Icon Ring */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 blur-sm" />
            <div className="relative w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-center text-rose-500 shadow-inner">
              <MailX size={32} />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="space-y-4 py-6 text-center">
            <div className="inline-flex p-3 rounded-full bg-zinc-950 border border-zinc-800 text-rose-400 animate-spin">
              <RefreshCw size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Abmeldung wird verarbeitet</h3>
              <p className="text-xs text-zinc-400">Deine Newsletter-Einstellungen werden aktualisiert...</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center gap-2 text-emerald-400 font-black text-xl">
                <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
                <h2>Erfolgreich abgemeldet</h2>
              </div>
              <p className="text-xs text-zinc-400">Du erhältst ab sofort keine weiteren Newsletter-Mails.</p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/70 p-4 rounded-2xl text-left space-y-2 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                <span>Bestätigung:</span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed font-mono bg-zinc-900/90 border border-zinc-800/60 p-2.5 rounded-xl break-all">
                {message}
              </p>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                variant="outline"
                onClick={handleResubscribe}
                className="w-full bg-zinc-950 hover:bg-zinc-800/90 border border-zinc-800 text-zinc-300 font-bold text-xs min-h-[48px] rounded-xl transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                Aus Versehen geklickt? Wieder anmelden
              </Button>

              <Link
                to="/"
                className="w-full min-h-[48px] rounded-xl bg-white hover:bg-zinc-100 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.99]"
              >
                <ArrowLeft size={16} />
                <span>Zurück zur Startseite</span>
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="space-y-6 text-center animate-fade-in">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center gap-2 text-rose-400 font-black text-xl">
                <AlertCircle size={24} className="shrink-0 text-rose-400" />
                <h2>Abmeldung nicht möglich</h2>
              </div>
              <p className="text-xs text-zinc-400">Bitte überprüfe deine Angaben und versuche es erneut.</p>
            </div>

            <div className="bg-zinc-950/80 border border-zinc-800/70 p-4 rounded-2xl text-left shadow-inner">
              <p className="text-xs text-rose-300 leading-relaxed">
                {message}
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/"
                className="w-full min-h-[48px] rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-[0.99]"
              >
                <ArrowLeft size={16} />
                <span>Zurück zur Startseite</span>
              </Link>
            </div>
          </div>
        )}

        {/* Idle / Manual Unsubscribe Form */}
        {status === 'idle' && (
          <div className="space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-black text-white tracking-tight">Newsletter abmelden</h2>
              <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                Gib deine E-Mail-Adresse ein, um dich vom Cardpirates Newsletter auszutragen.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUnsubscribe(inputEmail);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Deine E-Mail-Adresse
                </label>
                <input
                  type="email"
                  placeholder="name@beispiel.de"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500/80 focus:ring-2 focus:ring-rose-500/20 rounded-xl px-4 py-3.5 text-base sm:text-sm text-white placeholder-zinc-600 outline-none transition-all"
                />
              </div>

              <Button
                type="submit"
                className="w-full min-h-[48px] bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-900/20 active:scale-[0.99]"
              >
                Vom Newsletter abmelden
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-zinc-800/60">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-zinc-800/50"
              >
                <ArrowLeft size={14} />
                <span>Abbrechen und zurück zur Hauptseite</span>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

