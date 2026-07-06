import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DetailPage from './pages/DetailPage';
import LoginModal from './components/LoginModal';
import type { ShopifyProduct } from './services/shopify';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ShopifyProduct | null>(null);

  const handleQuickBuyTrigger = (event: ShopifyProduct) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleCheckoutSuccess = (checkoutUrl: string) => {
    // Clean up modal state and redirect the user's browser directly to Shopify/PayPal checkout
    setModalOpen(false);
    window.location.href = checkoutUrl;
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-violet-600/30 selection:text-white">
        
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-4xl mx-auto py-6">
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
        <footer className="py-8 text-center text-xs text-slate-600 border-t border-slate-900/60 max-w-4xl mx-auto w-full">
          &copy; {new Date().getFullYear()} Cardpirates. All rights reserved. Powered by Shopify Storefront.
        </footer>
      </div>
    </Router>
  );
}

export default App;
