import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DetailPage from './pages/DetailPage';
import LoginModal from './components/LoginModal';
import type { ShopifyProduct } from './services/shopify';
import logoAnimVideo from './assets/Logo-animiert.mp4';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ShopifyProduct | null>(null);

  const logoAnimVideoUrl = (window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo;

  const handleQuickBuyTrigger = (event: ShopifyProduct) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleNavbarLoginTrigger = () => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleCheckoutSuccess = (checkoutUrl: string) => {
    setModalOpen(false);
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-white relative">
        
        {/* Full Website Background Video */}
        <div className="fixed inset-0 z-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-[0.18]"
            src={logoAnimVideoUrl}
          />
          <div className="absolute inset-0 bg-[#0b0f19]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-transparent to-[#0b0f19]/20" />
        </div>

        {/* Navigation Bar */}
        <Navbar onLoginTrigger={handleNavbarLoginTrigger} />

        {/* Main Content Area */}
        <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto py-6">
          <Routes>
            <Route 
              path="/" 
              element={<LandingPage onQuickBuy={handleQuickBuyTrigger} />} 
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
