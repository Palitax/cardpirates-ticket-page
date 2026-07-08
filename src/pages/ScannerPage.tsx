import { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  Camera, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Wifi, 
  WifiOff, 
  LogOut, 
  RefreshCw, 
  UserCheck, 
  ShieldAlert,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '../services/supabase';
import { db } from '../services/localDb';
import { syncService } from '../services/syncService';
import { shopifyService, type ShopifyProduct } from '../services/shopify';
import logoAnimVideo from '../assets/cardpirates-logo-kleiner.mp4';

export default function ScannerPage() {
  const logoAnimVideoUrl = (window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo;

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'staff' | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // App navigation & Event state
  const [activeTab, setActiveTab] = useState<'scan' | 'dashboard'>('scan');
  const [events, setEvents] = useState<ShopifyProduct[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ShopifyProduct | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Scanning state
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    holderName?: string;
    reason?: 'not_found' | 'already_checked_in' | 'network_error' | 'invalid_id';
    ticketId?: string;
    isOffline?: boolean;
  } | null>(null);
  
  const isProcessingRef = useRef(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Manual search query
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Detect online/offline status changes
  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync when back online
      handleSyncQueue();
    };
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // 2. Fetch logged in session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          fetchUserRole(session.user.id);
        }
      } else {
        // Retrieve local mock staff session if database config is not set
        const savedMockSession = localStorage.getItem('mock_staff_session');
        if (savedMockSession) {
          const session = JSON.parse(savedMockSession);
          setUser(session);
          setUserRole('admin');
        }
      }
    };
    checkSession();
  }, []);

  const fetchUserRole = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('role')
        .eq('id', userId)
        .single();

      if (error || !data) {
        setUserRole(null);
        setAuthError('Zugriff verweigert: Du bist nicht als Einlass-Mitarbeiter registriert.');
        await supabase.auth.signOut();
        setUser(null);
      } else {
        setUserRole(data.role as 'admin' | 'staff');
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  // 3. Load Shopify Events
  useEffect(() => {
    if (!user) return;
    const loadEvents = async () => {
      setLoadingEvents(true);
      try {
        const productList = await shopifyService.getEvents();
        setEvents(productList);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    loadEvents();
  }, [user]);

  // 4. Dexie database queries for real-time reactivity
  const tickets = useLiveQuery(
    () => db.tickets.where('event_id').equals(selectedEvent?.id || '').toArray(),
    [selectedEvent?.id]
  );

  const syncQueue = useLiveQuery(
    () => db.syncQueue.toArray(),
    []
  );

  // Compute stats based on reactively updated local IndexedDB
  const stats = useMemo(() => {
    if (!tickets) return { total: 0, checkedIn: 0, open: 0, conflicts: 0 };
    const total = tickets.length;
    const checkedIn = tickets.filter(t => t.status === 'checked_in').length;
    const open = total - checkedIn;
    const conflicts = tickets.filter(t => t.conflict_duplicate).length;
    return { total, checkedIn, open, conflicts };
  }, [tickets]);

  // Filtered checkins for dashboard display
  const checkInHistory = useMemo(() => {
    if (!tickets) return [];
    return tickets
      .filter(t => t.status === 'checked_in')
      .sort((a, b) => {
        const timeA = a.checked_in_at ? new Date(a.checked_in_at).getTime() : 0;
        const timeB = b.checked_in_at ? new Date(b.checked_in_at).getTime() : 0;
        return timeB - timeA;
      });
  }, [tickets]);

  // Manual search filtering
  const searchResults = useMemo(() => {
    if (!tickets || !searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return tickets.filter(t => 
      t.holder_name.toLowerCase().includes(query) || 
      t.id.toLowerCase().includes(query)
    );
  }, [tickets, searchQuery]);

  // 5. Synth audio generator for scan feedback
  const playBeep = (type: 'success' | 'error') => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      if (type === 'success') {
        osc.frequency.setValueAtTime(1000, audioCtx.currentTime); // High pitch success beep
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.15);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, audioCtx.currentTime); // Low buzz error tone
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  };

  // 6. Camera scanning lifecycle (using html5-qrcode)
  useEffect(() => {
    let qrScanner: Html5Qrcode | null = null;
    let isMounted = true;

    const startCamera = async () => {
      if (activeTab !== 'scan' || !selectedEvent || scanResult) return;
      
      try {
        await new Promise(r => setTimeout(r, 200));
        if (!isMounted) return;

        const container = document.getElementById('qr-reader');
        if (!container) return;

        qrScanner = new Html5Qrcode('qr-reader');
        await qrScanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7;
              return { width: size, height: size };
            }
          },
          async (decodedText) => {
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            // Trigger scan processing
            await handleScan(decodedText);
          },
          () => {} // Suppress noise logs
        );
      } catch (err) {
        console.error('Camera startup failed:', err);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (qrScanner && qrScanner.isScanning) {
        qrScanner.stop().catch(err => console.error('Camera shutdown error:', err));
      }
    };
  }, [activeTab, selectedEvent, scanResult]);

  // 7. Operations & Actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    // Bypass real Supabase Auth for mock credentials to facilitate instant testing/demoing
    if (authEmail === 'admin@cardpirates.de' && authPassword === 'password') {
      const mockUser = { id: 'mock-staff-1', email: authEmail };
      localStorage.setItem('mock_staff_session', JSON.stringify(mockUser));
      // Reload page immediately to trigger native browser password-save prompt
      window.location.reload();
      return;
    }

    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword
      });

      if (error) {
        setAuthError(error.message);
        setAuthLoading(false);
      } else if (data.user) {
        // Fetch role to ensure they are staff before reloading
        const { data: staffData } = await supabase
          .from('staff_members')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (staffData) {
          // Valid staff member. Reload page to trigger native password save prompt
          window.location.reload();
        } else {
          setAuthError('Zugriff verweigert: Du bist nicht als Einlass-Mitarbeiter registriert.');
          await supabase.auth.signOut();
          setAuthLoading(false);
        }
      }
    } else {
      // Mock Sandbox Login Fallback
      setTimeout(() => {
        setAuthError('Falsche Zugangsdaten (Tipp: admin@cardpirates.de / password)');
        setAuthLoading(false);
      }, 800);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem('mock_staff_session');
    }
    setUser(null);
    setUserRole(null);
    setSelectedEvent(null);
    setActiveTab('scan');
  };

  const handleDownloadTickets = async () => {
    if (!selectedEvent) return;
    setSyncing(true);
    setSyncStatusMsg('Lade Ticketliste...');
    
    const res = await syncService.downloadEventTickets(selectedEvent.id);
    setSyncing(false);
    
    if (res.success) {
      setSyncStatusMsg(`Erfolgreich geladen: ${res.count} Tickets.`);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } else {
      setSyncStatusMsg(`Fehler: ${res.error}`);
    }
  };

  const handleSyncQueue = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    setSyncStatusMsg('Synchronisiere Offline-Scans...');
    
    const res = await syncService.syncOfflineQueue();
    setSyncing(false);

    if (res.success) {
      setSyncStatusMsg(`Abgleich komplett: ${res.syncedCount} hochgeladen.`);
      setTimeout(() => setSyncStatusMsg(''), 4000);
    } else {
      setSyncStatusMsg(`Synchronisation unvollständig. ${res.errorsCount} Fehler.`);
    }
  };

  const handleScan = async (ticketId: string) => {
    if (!selectedEvent) return;

    const res = await syncService.checkInTicket(ticketId, selectedEvent.id);
    
    setScanResult({
      success: res.success,
      holderName: res.holderName,
      reason: res.reason,
      ticketId,
      isOffline: res.isOffline
    });

    playBeep(res.success ? 'success' : 'error');

    // Auto-reset scan overlay after 2.5 seconds to scan next ticket
    setTimeout(() => {
      setScanResult(null);
      isProcessingRef.current = false;
    }, 2500);
  };

  const handleManualCheckIn = async (ticketId: string) => {
    if (!selectedEvent) return;
    
    const confirmCheck = window.confirm(`Ticket manuell entwerten?`);
    if (!confirmCheck) return;

    const res = await syncService.checkInTicket(ticketId, selectedEvent.id);
    
    alert(res.success ? 'Erfolgreich eingecheckt!' : `Fehler beim Einchecken: ${res.reason}`);
    
    setSearchQuery('');
  };

  return (
    <div className="w-full min-h-[85vh] bg-black text-zinc-100 rounded-3xl border border-zinc-900/30 shadow-2xl p-4 md:p-6 overflow-hidden flex flex-col font-sans">
      
      {/* 1. TOP HEADER STATUS */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#dc2626]" />
          <h1 className="font-extrabold text-sm uppercase tracking-wider text-white">Cardpirates Einlass</h1>
        </div>
        
        {user && (
          <div className="flex items-center gap-2.5">
            {isOnline ? (
              <span className="flex items-center gap-1 text-[10px] text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                <Wifi size={10} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <WifiOff size={10} /> Offline
              </span>
            )}
            <button 
              onClick={handleLogout} 
              className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 2. LOGIN VIEW */}
      {!user ? (
        <div className="flex-1 flex flex-col justify-center items-center py-10 max-w-sm mx-auto w-full text-center">
          <div className="w-52 h-52 overflow-hidden mb-4 flex items-center justify-center relative select-none">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain grayscale brightness-125"
              src={logoAnimVideoUrl}
            />
          </div>
          
          <h2 className="text-lg font-bold text-white mb-1">Mitarbeiter Login</h2>
          <p className="text-xs text-zinc-500 mb-6">Logge dich ein, um Tickets dieses Events offline zu laden und zu entwerten.</p>

          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">E-Mail Adresse</label>
              <input 
                type="email" 
                required
                name="email"
                autoComplete="username email"
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-600 transition-all font-medium"
                placeholder="z. B. crew@cardpirates.de"
                style={{ fontSize: '16px' }} // Prevents iOS input auto-zoom
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Passwort</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  name="password"
                  autoComplete="current-password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-600 transition-all font-medium"
                  placeholder="••••••••"
                  style={{ fontSize: '16px' }} // Prevents iOS input auto-zoom
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? "Passwort ausblenden" : "Passwort anzeigen"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex gap-2 text-left items-start text-xs text-red-400 leading-normal">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black font-extrabold rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2"
            >
              {authLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Prüfe Login...
                </>
              ) : (
                'Einloggen'
              )}
            </button>
          </form>
        </div>
      ) : (
        /* 3. AUTHENTICATED SCANNER INTERFACE */
        <div className="flex-1 flex flex-col min-h-0 relative">
          
          {/* OFFLINE WARNING BANNER */}
          {!isOnline && (
            <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 mb-4 flex gap-2 items-center text-amber-500 text-xs text-left animate-fade-in leading-relaxed select-none">
              <AlertTriangle size={18} className="shrink-0 animate-pulse text-amber-500" />
              <div>
                <p className="font-bold">Scanner Offline (Lokaler Modus)</p>
                <p className="text-[10px] text-amber-500/80">Tickets werden lokal geprüft. Doppelscans werden gesammelt und nach Verbindung synchronisiert.</p>
              </div>
            </div>
          )}

          {/* BACKGROUND SYNC STATUS NOTIFICATION */}
          {syncStatusMsg && (
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 mb-4 flex gap-3 items-center text-xs text-left animate-fade-in">
              {syncing ? (
                <Loader2 size={16} className="animate-spin text-red-500 shrink-0" />
              ) : (
                <Database size={16} className="text-green-500 shrink-0" />
              )}
              <span className="flex-1 text-zinc-300">{syncStatusMsg}</span>
            </div>
          )}

          {/* EVENT SELECTOR OR EVENT INFO CARD */}
          {!selectedEvent ? (
            <div className="flex-1 flex flex-col justify-center py-6 max-w-sm mx-auto w-full">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-left mb-2">Event zum Einlass wählen</span>
              
              {loadingEvents ? (
                <div className="flex flex-col justify-center items-center py-10 space-y-2">
                  <Loader2 size={24} className="animate-spin text-red-500" />
                  <p className="text-xs text-zinc-500">Lade Events...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((evt) => (
                    <button
                      key={evt.id}
                      onClick={() => {
                        setSelectedEvent(evt);
                        // Trigger immediate cache download
                        setTimeout(() => syncService.downloadEventTickets(evt.id), 100);
                      }}
                      className="w-full p-4 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
                    >
                      <h4 className="font-bold text-white group-hover:text-red-400 transition-colors text-sm">{evt.title}</h4>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">
                        {evt.eventLocation?.value || 'TBA'}
                      </p>
                    </button>
                  ))}
                  {events.length === 0 && (
                    <p className="text-xs text-zinc-500 text-center py-8">Keine Events verfügbar.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* EVENT LOADED & ACTIVE SCANNER SESSIONS */
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Event Meta Bar */}
              <div className="p-3 bg-zinc-900 border border-zinc-850 rounded-2xl flex items-center justify-between gap-3 mb-4 select-none">
                <div className="min-w-0 text-left">
                  <span className="block text-[8px] font-bold text-red-500 uppercase tracking-widest">Geladenes Event</span>
                  <h3 className="font-extrabold text-xs text-white truncate">{selectedEvent.title}</h3>
                </div>
                <div className="flex gap-2 shrink-0">
                  {isOnline && (
                    <button
                      onClick={handleDownloadTickets}
                      disabled={syncing}
                      className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-800 text-[10px] font-bold text-zinc-300 rounded-lg border border-zinc-800 flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                      title="Ticketliste neu laden"
                    >
                      <RefreshCw size={11} className={syncing ? 'animate-spin' : ''} />
                      Event laden
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="px-2.5 py-1.5 bg-zinc-950 hover:bg-zinc-850 text-[10px] font-bold text-zinc-400 hover:text-white rounded-lg border border-zinc-800 transition-all cursor-pointer"
                  >
                    Event wechseln
                  </button>
                </div>
              </div>

              {/* STATS OVERVIEW HEADER */}
              <div className="grid grid-cols-4 gap-2 mb-4 text-center select-none">
                <div className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-2">
                  <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Gesamt</span>
                  <span className="text-sm font-extrabold text-white">{stats.total}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-2">
                  <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Einlass</span>
                  <span className="text-sm font-extrabold text-green-400">{stats.checkedIn}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-2">
                  <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Offen</span>
                  <span className="text-sm font-extrabold text-zinc-400">{stats.open}</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-900 rounded-xl p-2">
                  <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider">Konflikte</span>
                  <span className={`text-sm font-extrabold ${stats.conflicts > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-600'}`}>{stats.conflicts}</span>
                </div>
              </div>

              {/* TAB NAVIGATION */}
              <div className="flex bg-zinc-900 rounded-xl p-1 mb-4 select-none">
                <button
                  onClick={() => setActiveTab('scan')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'scan' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Camera size={14} /> Scan-Modus
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'dashboard' ? 'bg-zinc-950 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Database size={14} /> Dashboard & Log
                </button>
              </div>

              {/* 4. ACTIVE SCREEN RENDER */}
              <div className="flex-1 min-h-0">
                {activeTab === 'scan' ? (
                  /* TAB 1: SCANNER SCREEN */
                  <div className="relative w-full h-full flex flex-col justify-center py-2">
                    
                    {/* CAMERA SIZED CONTAINER */}
                    <div className="w-full max-w-sm mx-auto aspect-square bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
                      
                      {/* html5-qrcode target div */}
                      <div id="qr-reader" className="w-full h-full object-cover"></div>
                      
                      {/* Laser scanner effect animation Overlay */}
                      {!scanResult && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-12">
                          <div className="flex justify-between">
                            <div className="w-6 h-6 border-t-2 border-l-2 border-red-600" />
                            <div className="w-6 h-6 border-t-2 border-r-2 border-red-600" />
                          </div>
                          <div className="w-full h-0.5 bg-red-600/60 shadow-[0_0_8px_#ef4444] animate-[bounce_2s_infinite]" />
                          <div className="flex justify-between">
                            <div className="w-6 h-6 border-b-2 border-l-2 border-red-600" />
                            <div className="w-6 h-6 border-b-2 border-r-2 border-red-600" />
                          </div>
                        </div>
                      )}

                      {/* SCAN OVERLAY RESULT (Full Overlay inside Camera window) */}
                      {scanResult && (
                        <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center animate-fade-in ${
                          scanResult.success 
                            ? 'bg-green-600 text-white' 
                            : 'bg-red-600 text-white'
                        }`}>
                          {scanResult.success ? (
                            <>
                              <CheckCircle2 size={64} className="mb-4 animate-scale-up text-white" />
                              <h2 className="text-xl font-black uppercase tracking-wider">Ticket OK</h2>
                              <p className="text-sm font-bold opacity-90 mt-1">{scanResult.holderName}</p>
                              <span className="block mt-4 text-[9px] uppercase tracking-widest font-black bg-black/25 px-2.5 py-1 rounded-full">
                                {scanResult.isOffline ? 'Lokal Entwertet (Offline)' : 'Entwertet (Online)'}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle size={64} className="mb-4 animate-scale-up text-white" />
                              <h2 className="text-xl font-black uppercase tracking-wider">
                                {scanResult.reason === 'already_checked_in' ? 'Doppelscan!' : 'Ungültig'}
                              </h2>
                              
                              <p className="text-xs opacity-90 mt-2 font-bold max-w-[80%] mx-auto">
                                {scanResult.reason === 'already_checked_in' && (
                                  <>Bereits entwertet!<br/><span className="text-[11px] font-medium block mt-1">Inhaber: {scanResult.holderName}</span></>
                                )}
                                {scanResult.reason === 'not_found' && 'Ticketcode nicht in diesem Event registriert.'}
                                {scanResult.reason === 'invalid_id' && 'Falsches QR-Format. Code entspricht keinem Ticket.'}
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Sync Queue Pending Stats Footer */}
                    {syncQueue && syncQueue.length > 0 && (
                      <div className="mt-4 flex items-center justify-center gap-2 select-none">
                        <Loader2 size={12} className="animate-spin text-amber-500" />
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                          {syncQueue.length} Scans in Warteschlange
                        </span>
                        {isOnline && (
                          <button
                            onClick={handleSyncQueue}
                            className="text-[9px] px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md font-bold hover:bg-amber-500/20 cursor-pointer"
                          >
                            Jetzt syncen
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* TAB 2: DASHBOARD / REAL-TIME LOG SCREEN */
                  <div className="h-full flex flex-col min-h-[40vh] space-y-4">
                    
                    {/* Search & Manuelle Einlassbox */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-3.5 text-zinc-500" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Gast oder Ticket-ID suchen..."
                          className="w-full pl-9 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                          style={{ fontSize: '16px' }} // iOS zoom prevention
                        />
                      </div>
                    </div>

                    {/* Manual Search Results list */}
                    {searchQuery && (
                      <div className="bg-zinc-900 border border-zinc-850 rounded-xl p-2 max-h-48 overflow-y-auto space-y-1.5">
                        <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest px-2 py-1 border-b border-zinc-800">
                          Suchergebnisse ({searchResults.length})
                        </span>
                        
                        {searchResults.map((t) => (
                          <div key={t.id} className="p-2 hover:bg-zinc-800/50 rounded-lg flex items-center justify-between gap-3 text-left">
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">{t.holder_name}</h5>
                              <p className="text-[8px] text-zinc-500 font-mono mt-0.5 truncate">{t.id}</p>
                            </div>
                            <div>
                              {t.status === 'checked_in' ? (
                                <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-[9px] text-green-400 font-bold">
                                  Checked In
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleManualCheckIn(t.id)}
                                  className="px-2.5 py-1 bg-white text-black text-[9px] font-extrabold rounded-md hover:bg-zinc-200 cursor-pointer"
                                >
                                  Einlassen
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {searchResults.length === 0 && (
                          <p className="text-xs text-zinc-600 text-center py-4">Kein passendes Ticket gefunden.</p>
                        )}
                      </div>
                    )}

                    {/* Checkin Log Timeline List */}
                    <div className="flex-1 flex flex-col min-h-0 border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-900/10">
                      <span className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-900/60 border-b border-zinc-900 px-3 py-2 text-left">
                        Einlass-Historie / Log
                      </span>
                      
                      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 max-h-[30vh]">
                        {checkInHistory.map((t) => (
                          <div 
                            key={t.id} 
                            className={`p-3 flex items-start justify-between gap-3 text-left transition-all ${
                              t.conflict_duplicate 
                                ? 'bg-red-500/10 hover:bg-red-500/15 border-l-4 border-l-red-600' 
                                : 'hover:bg-zinc-900/20'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs font-bold text-white">{t.holder_name}</h4>
                                {t.conflict_duplicate && (
                                  <span className="flex items-center gap-0.5 text-[8px] bg-red-600/20 text-red-500 font-black border border-red-500/25 px-1.5 py-0.25 rounded uppercase tracking-wider animate-pulse">
                                    <ShieldAlert size={8} /> Doppelscan-Alarm
                                  </span>
                                )}
                              </div>
                              <p className="text-[8px] text-zinc-500 font-mono mt-0.5 truncate">Ticket ID: {t.id}</p>
                            </div>
                            
                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-zinc-400 font-bold block">
                                {t.checked_in_at 
                                  ? new Date(t.checked_in_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                  : 'TBA'
                                }
                              </span>
                              <span className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest block mt-0.5">
                                {t.conflict_duplicate ? 'Fehlgeschlagen / Konflikt' : 'Einlass erteilt'}
                              </span>
                            </div>
                          </div>
                        ))}

                        {checkInHistory.length === 0 && (
                          <div className="py-12 flex flex-col items-center justify-center text-zinc-600 space-y-1">
                            <UserCheck size={24} className="opacity-40" />
                            <p className="text-xs">Noch keine Check-ins für dieses Event.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}
      
      {/* 5. FOOTER */}
      <div className="text-center text-[9px] text-zinc-600 border-t border-zinc-900 pt-3 mt-4 select-none">
        Cardpirates Scanner {userRole && `(${userRole.toUpperCase()})`} &bull; Logged in as: {user ? user.email : 'None'}
      </div>
    </div>
  );
}
