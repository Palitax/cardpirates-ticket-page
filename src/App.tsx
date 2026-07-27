import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BurgerMenu from './components/BurgerMenu';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import DetailPage from './pages/DetailPage';
import ScannerPage from './pages/ScannerPage';
import TicketsPage from './pages/TicketsPage';
import ProfilePage from './pages/ProfilePage';
import LoginModal from './components/LoginModal';
import CartDrawer from './components/CartDrawer';
import type { CartItem } from './components/CartDrawer';
import { shopifyService } from './services/shopify';
import type { ShopifyProduct } from './services/shopify';
import type { CustomerProfile } from './services/supabase';
import { supabase, profileService, notificationService } from './services/supabase';
import { newsletterService } from './services/newsletterService';
import logoAnimVideo from './assets/cardpirates-logo-kleiner.mp4';
import './App.css';

interface ConditionalBurgerMenuProps {
  currentUser: CustomerProfile | null;
  onLoginTrigger: () => void;
  onLogout: () => void;
  onProfileUpdate: (profile: CustomerProfile) => void;
  cartCount: number;
  onOpenCart: () => void;
}

function ConditionalBurgerMenu({ currentUser, onLoginTrigger, onLogout, onProfileUpdate, cartCount, onOpenCart }: ConditionalBurgerMenuProps) {
  const location = useLocation();
  if (location.pathname === '/scan') return null;
  return (
    <BurgerMenu 
      currentUser={currentUser} 
      onLoginTrigger={onLoginTrigger} 
      onLogout={onLogout} 
      onProfileUpdate={onProfileUpdate}
      cartCount={cartCount}
      onOpenCart={onOpenCart}
    />
  );
}

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ShopifyProduct | null>(null);
  const [currentUser, setCurrentUser] = useState<CustomerProfile | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cardpirates_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loadingCartCheckout, setLoadingCartCheckout] = useState(false);
  const [cartCheckoutError, setCartCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('cardpirates_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (item: CartItem) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.variantId === item.variantId);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }
      return [...prev, item];
    });
    setNotification({
      message: `${item.eventTitle} wurde zum Warenkorb hinzugefügt! 🛒`,
      type: 'success',
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(variantId);
      return;
    }
    setCartItems((prev) => prev.map((item) => (item.variantId === variantId ? { ...item, quantity } : item)));
  };

  const handleRemoveCartItem = (variantId: string) => {
    setCartItems((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  const handleCartCheckout = async (subscribeNewsletter: boolean = true) => {
    if (cartItems.length === 0) return;

    if (!currentUser) {
      setIsCartOpen(false);
      setModalOpen(true);
      return;
    }

    setLoadingCartCheckout(true);
    setCartCheckoutError(null);

    try {
      // 0. Handle Newsletter Opt-In if checked
      const checkoutEmail = currentUser?.email || '';
      if (subscribeNewsletter && checkoutEmail) {
        newsletterService.subscribe(checkoutEmail, 'checkout').catch((e) => console.warn(e));
      }

      // 1. Generate & Save tickets for user in Supabase & LocalStorage
      const key = `purchased_tickets_${currentUser.shopify_customer_id}`;
      const savedTicketsRaw = localStorage.getItem(key);
      const savedTickets = savedTicketsRaw ? JSON.parse(savedTicketsRaw) : [];

      const holderName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Gast';

      for (const item of cartItems) {
        let firstTicketId = '';
        for (let i = 0; i < item.quantity; i++) {
          const ticketId = crypto.randomUUID();
          if (!firstTicketId) firstTicketId = ticketId;

          if (supabase) {
            try {
              const { error: insertErr } = await supabase
                .from('tickets')
                .insert({
                  id: ticketId,
                  event_id: item.eventId,
                  holder_name: holderName,
                  status: 'open',
                  organizer_email: item.organizerEmail || null
                });
              if (insertErr) {
                console.error('Failed to insert ticket to Supabase:', insertErr);
              }
            } catch (err) {
              console.warn('Network error writing ticket to Supabase:', err);
            }
          }

          const ticketNumber = `CP-${Math.floor(100000 + Math.random() * 900000)}`;
          const displayVariantTitle = item.variantTitle.toLowerCase().includes('privat') ? 'Einzelticket' : item.variantTitle;

          savedTickets.push({
            id: ticketId,
            event_id: item.eventId,
            title: `${item.eventTitle} - ${displayVariantTitle}`,
            date: item.date,
            location: item.location,
            image: item.image,
            purchaseDate: new Date().toISOString(),
            status: 'active',
            ticketNumber: ticketNumber,
            firstName: currentUser.first_name,
            lastName: currentUser.last_name
          });
        }

        // Trigger booking notification email to Event Organizer
        notificationService.sendBookingNotification({
          ticketId: firstTicketId,
          eventTitle: item.eventTitle,
          eventDate: item.date,
          holderName,
          buyerEmail: checkoutEmail,
          quantity: item.quantity,
          price: `${(parseFloat(item.price.amount) * item.quantity).toFixed(2)} ${item.price.currencyCode || 'EUR'}`,
          organizerEmail: item.organizerEmail
        }).catch(err => console.warn('Notification send failed:', err));
      }

      localStorage.setItem(key, JSON.stringify(savedTickets));

      // 2. Create Shopify Checkout Link
      const checkoutData = {
        firstName: currentUser?.first_name || '',
        lastName: currentUser?.last_name || '',
        address1: currentUser?.address_line_1 || '',
        city: currentUser?.city || '',
        zip: currentUser?.zip_code || '',
        country: currentUser?.country || 'DE',
        company: currentUser?.company_name || '',
      };

      const checkoutUrl = await shopifyService.createCheckoutLink(
        cartItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        checkoutEmail,
        checkoutData
      );

      // Clear local cart
      setCartItems([]);

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Fehler beim Erstellen der Kasse.');
      }
    } catch (err: any) {
      setCartCheckoutError(err.message || 'Fehler beim Erstellen der Kasse.');
    } finally {
      setLoadingCartCheckout(false);
    }
  };

  const logoAnimVideoUrl = (window as any).ShopifyAssets?.logoAnimVideoUrl || logoAnimVideo;

  useEffect(() => {
    const checkSession = async () => {
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const email = session.user.email || '';
            const mockCustomerId = `shopify-cust-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
            const profile = await profileService.getProfile(mockCustomerId);
            if (profile) {
              setCurrentUser(profile);
              localStorage.setItem('currentUser', JSON.stringify(profile));
              return;
            }
          }
        } catch (e) {
          console.warn('Error reading active Supabase session:', e);
        }
      }
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (err) {
          console.error('Failed to parse saved user', err);
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mock_checkout_success') === 'true') {
      const email = params.get('email') || '';
      setNotification({
        message: `Kauf erfolgreich! Dein Ticket wurde an ${email} gesendet. 🎉`,
        type: 'success'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleNavbarLoginTrigger = () => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleQuickBuyTrigger = (event: ShopifyProduct) => {
    const defaultVariant = event.variants.nodes[0];
    if (defaultVariant && defaultVariant.availableForSale !== false) {
      handleAddToCart({
        id: defaultVariant.id,
        eventId: event.id,
        eventTitle: event.title,
        variantId: defaultVariant.id,
        variantTitle: defaultVariant.title,
        price: defaultVariant.price,
        quantity: 1,
        availableForSale: defaultVariant.availableForSale,
        image: event.images.nodes[0]?.url,
        date: event.eventDate?.value,
        location: event.eventLocation?.value,
      });
    } else {
      setSelectedEvent(event);
      setModalOpen(true);
    }
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn(e);
      }
    }
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleCheckoutSuccess = (checkoutUrl: string, profile?: CustomerProfile, actionType?: 'login' | 'register') => {
    setModalOpen(false);
    if (profile) {
      setCurrentUser(profile);
      localStorage.setItem('currentUser', JSON.stringify(profile));
      if (!checkoutUrl) {
        setNotification({
          message: actionType === 'register' ? 'Registrierung erfolgreich!' : 'Erfolgreich eingeloggt!',
          type: 'success'
        });
      }
    }
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    }
  };

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-black text-zinc-100 antialiased selection:bg-white/20 selection:text-white relative overflow-x-hidden">
        
        <div className="hidden md:block fixed inset-0 z-0 w-full h-full overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover md:object-contain md:scale-[0.55] opacity-[0.10] grayscale brightness-150 contrast-125"
            src={logoAnimVideoUrl}
          />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/10" />
        </div>

        <Navbar
          onLoginTrigger={handleNavbarLoginTrigger}
          currentUser={currentUser}
          onLogout={handleLogout}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
        />

        <ConditionalBurgerMenu 
          currentUser={currentUser} 
          onLoginTrigger={handleNavbarLoginTrigger} 
          onLogout={handleLogout} 
          onProfileUpdate={(profile) => {
            setCurrentUser(profile);
            localStorage.setItem('currentUser', JSON.stringify(profile));
          }}
          cartCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
        />

        <main className={`relative z-10 flex-1 w-full max-w-4xl mx-auto py-6 ${modalOpen ? 'hidden md:block' : ''}`}>
          <Routes>
            <Route 
              path="/" 
              element={<LandingPage onQuickBuy={handleQuickBuyTrigger} currentUser={currentUser} onRegisterTrigger={handleNavbarLoginTrigger} />} 
            />
            <Route 
              path="/events/:handle" 
              element={<DetailPage onQuickBuy={handleQuickBuyTrigger} currentUser={currentUser} onRegisterTrigger={handleNavbarLoginTrigger} />} 
            />
            <Route 
              path="/scan" 
              element={<ScannerPage />} 
            />
            <Route 
              path="/meine-tickets" 
              element={<TicketsPage currentUser={currentUser} />} 
            />
            <Route 
              path="/profil" 
              element={
                <ProfilePage 
                  currentUser={currentUser} 
                  onProfileUpdate={(profile) => {
                    setCurrentUser(profile);
                    localStorage.setItem('currentUser', JSON.stringify(profile));
                  }} 
                />
              } 
            />
          </Routes>
        </main>

        {/* Floating Toast Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.7}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 200) {
                  setNotification(null);
                }
              }}
              className="fixed top-16 left-4 right-4 md:top-6 md:left-1/2 md:-translate-x-1/2 md:right-auto md:max-w-md w-[calc(100%-2rem)] md:w-auto z-[100] cursor-grab active:cursor-grabbing select-none"
            >
              <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-2 w-2 shrink-0 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Benachrichtigung</p>
                    <p className="text-xs text-white font-semibold leading-normal truncate">{notification.message}</p>
                  </div>
                </div>

                <button 
                  onClick={() => setNotification(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
                  aria-label="Benachrichtigung schließen"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <LoginModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          event={selectedEvent}
          currentUser={currentUser}
          onLogout={handleLogout}
          onSuccess={handleCheckoutSuccess}
          onAddToCart={handleAddToCart}
        />

        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateCartQuantity}
          onRemoveItem={handleRemoveCartItem}
          onCheckout={handleCartCheckout}
          loadingCheckout={loadingCartCheckout}
          checkoutError={cartCheckoutError}
        />

        <footer className={`relative z-10 py-8 text-center text-xs text-slate-600 border-t border-slate-900/60 max-w-4xl mx-auto w-full ${modalOpen ? 'hidden md:block' : ''}`}>
          &copy; {new Date().getFullYear()} Cardpirates x Rohde Media. All rights reserved. Powered by Shopify Storefront.
        </footer>
      </div>
    </Router>
  );
}

export default App;
