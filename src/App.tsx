import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { X } from 'lucide-react';
import BurgerMenu from './components/BurgerMenu';
import LandingPage from './pages/LandingPage';
import DetailPage from './pages/DetailPage';
import ScannerPage from './pages/ScannerPage';
import LoginModal from './components/LoginModal';
import type { ShopifyProduct } from './services/shopify';
import type { CustomerProfile } from './services/supabase';
import logoAnimVideo from './assets/cardpirates-logo-kleiner.mp4';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ShopifyProduct | null>(null);
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const logoAnimVideoUrl = (window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo;

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {
        console.error('Failed to parse saved user', err);
      }
    }
  }, []);

  // Parse query params for mock checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mock_checkout_success') === 'true') {
      const email = params.get('email') || '';
      setNotification({
        message: `Kauf erfolgreich! Dein Ticket wurde an ${email} gesendet. 🎉`,
        type: 'success'
      });
      // Clear URL search params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleQuickBuyTrigger = (event: ShopifyProduct) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleNavbarLoginTrigger = () => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleCheckoutSuccess = (checkoutUrl: string, profile?: CustomerProfile, actionType?: 'login' | 'register') => {
    setModalOpen(false);
    if (profile) {
      setCurrentUser(profile);
      localStorage.setItem('currentUser', JSON.stringify(profile));
      
      if (!checkoutUrl) {
        if (actionType === 'register') {
          setNotification({
            message: 'Registrierung erfolgreich! Willkommen in der Crew! Eine Bestätigungs-E-Mail wurde simuliert. 🎉',
            type: 'success'
          });
        } else {
          setNotification({
            message: 'Erfolgreich eingeloggt! Willkommen zurück! 👋',
            type: 'success'
          });
        }
      }
    }
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-black text-zinc-100 antialiased selection:bg-white/20 selection:text-white relative overflow-x-hidden">
        
        {/* Full Website Background Video (Only on Desktop) */}
        <div className="hidden md:block fixed inset-0 z-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover md:object-contain md:scale-[0.85] opacity-[0.35] grayscale brightness-150 contrast-125"
            src={logoAnimVideoUrl}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10" />
        </div>

        {/* Mobile Burger Menu Button */}
        <BurgerMenu 
          currentUser={currentUser} 
          onLoginTrigger={handleNavbarLoginTrigger} 
          onLogout={handleLogout} 
        />



        {/* Main Content Area */}
        <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto py-6">
          <Routes>
            <Route 
              path="/" 
              element={<LandingPage onQuickBuy={handleQuickBuyTrigger} currentUser={currentUser} onRegisterTrigger={handleNavbarLoginTrigger} />} 
            />
            <Route 
              path="/events/:handle" 
              element={<DetailPage onQuickBuy={handleQuickBuyTrigger} />} 
            />
            <Route 
              path="/scan" 
              element={<ScannerPage />} 
            />
          </Routes>
        </main>

        {/* Floating Toast Notification */}
        {notification && (
          <div className="fixed bottom-6 right-6 z-[100] animate-fade-in max-w-sm">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-start gap-3 text-left">
              <span className="flex h-2 w-2 translate-y-1.5 shrink-0 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-bold text-white uppercase tracking-wider">Benachrichtigung</p>
                <p className="text-xs text-zinc-300 leading-normal">{notification.message}</p>
              </div>
              <button 
                onClick={() => setNotification(null)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Unified Checkout Login/Registration Modal */}
        <LoginModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          event={selectedEvent}
          onSuccess={handleCheckoutSuccess}
        />

        {/* Footer */}
        <footer className="relative z-10 py-8 text-center text-xs text-slate-600 border-t border-slate-900/60 max-w-4xl mx-auto w-full">
          &copy; {new Date().getFullYear()} Cardpirates x Rohde Media. All rights reserved. Powered by Shopify Storefront.
        </footer>
      </div>
    </Router>
  );
}

export default App;
