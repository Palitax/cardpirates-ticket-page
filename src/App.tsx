import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BurgerMenu from './components/BurgerMenu';
import LandingPage from './pages/LandingPage';
import DetailPage from './pages/DetailPage';
import LoginModal from './components/LoginModal';
import type { ShopifyProduct } from './services/shopify';
import type { CustomerProfile } from './services/supabase';
import logoAnimVideo from './assets/Logo-animiert.mp4';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ShopifyProduct | null>(null);
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);

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

  const handleCheckoutSuccess = (checkoutUrl: string, profile?: CustomerProfile) => {
    setModalOpen(false);
    if (profile) {
      setCurrentUser(profile);
      localStorage.setItem('currentUser', JSON.stringify(profile));
    }
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-black text-zinc-100 antialiased selection:bg-white/20 selection:text-white relative">
        
        {/* Full Website Background Video (Only on Desktop) */}
        <div className="hidden md:block fixed inset-0 z-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover md:object-contain md:scale-[0.85] opacity-[0.35] grayscale brightness-110"
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

        {/* Navigation Bar */}
        <Navbar onLoginTrigger={handleNavbarLoginTrigger} />

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
          </Routes>
        </main>

        {/* Unified Checkout Login/Registration Modal */}
        <LoginModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          event={selectedEvent}
          onSuccess={handleCheckoutSuccess}
        />

        {/* Footer */}
        <footer className="relative z-10 py-8 text-center text-xs text-slate-600 border-t border-slate-900/60 max-w-4xl mx-auto w-full">
          &copy; {new Date().getFullYear()} Cardpirates. All rights reserved. Powered by Shopify Storefront.
        </footer>
      </div>
    </Router>
  );
}

export default App;
