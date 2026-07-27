import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, ArrowLeft, MailX, RefreshCw } from 'lucide-react';
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
        setMessage(`Die E-Mail-Adresse ${cleanEmail} wurde erfolgreich vom Cardpirates Newsletter abgemeldet.`);
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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 select-none text-zinc-100">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-zinc-900/90 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center space-y-6"
      >
        {/* Header Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-rose-500 shadow-inner">
            <MailX size={32} />
          </div>
        </div>

        {/* Loading State */}
        {status === 'loading' && (
          <div className="space-y-4 py-4">
            <div className="inline-block animate-spin text-zinc-400">
              <RefreshCw size={28} />
            </div>
            <p className="text-sm font-bold text-white">Abmeldung wird verarbeitet...</p>
            <p className="text-xs text-zinc-500">Wir aktualisieren deine Newsletter-Einstellungen.</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-lg">
              <CheckCircle2 size={22} className="shrink-0" />
              <h2>Erfolgreich abgemeldet</h2>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 border border-zinc-800/60 p-4 rounded-2xl">
              {message}
            </p>

            <p className="text-[11px] text-zinc-500">
              Du wirst ab sofort keine Newsletter- oder Event-Mails mehr an diese Adresse erhalten.
            </p>

            <div className="pt-2 space-y-3">
              <Button
                variant="outline"
                onClick={handleResubscribe}
                className="w-full bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer"
              >
                Aus Versehen geklickt? Wieder anmelden
              </Button>

              <Link
                to="/"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg block"
              >
                <ArrowLeft size={16} />
                <span>Zurück zur Startseite</span>
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-extrabold text-lg">
              <AlertCircle size={22} className="shrink-0" />
              <h2>Abmeldung nicht möglich</h2>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/80 border border-zinc-800/60 p-4 rounded-2xl">
              {message}
            </p>

            <div className="pt-2">
              <Link
                to="/"
                className="w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer block"
              >
                <ArrowLeft size={16} />
                <span>Zurück zur Startseite</span>
              </Link>
            </div>
          </div>
        )}

        {/* Idle / Manual Unsubscribe Form */}
        {status === 'idle' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-white">Newsletter abmelden</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Gib deine E-Mail-Adresse ein, um dich vom Cardpirates Newsletter abzumelden.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUnsubscribe(inputEmail);
              }}
              className="space-y-3"
            >
              <input
                type="email"
                placeholder="Deine E-Mail-Adresse"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-white rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all"
              />

              <Button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs py-3.5 rounded-xl transition-all cursor-pointer shadow-lg"
              >
                Vom Newsletter abmelden
              </Button>
            </form>

            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
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
