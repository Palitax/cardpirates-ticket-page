import { useState, useEffect } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice } from '../utils/formatters';

export interface CartItem {
  id: string; // unique cart item id (e.g. variantId)
  eventId: string;
  eventTitle: string;
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  availableForSale: boolean;
  image?: string;
  date?: string;
  location?: string;
  organizerEmail?: string;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onRemoveItem: (variantId: string) => void;
  onCheckout: (subscribeNewsletter?: boolean) => void;
  loadingCheckout?: boolean;
  checkoutError?: string | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  loadingCheckout = false,
  checkoutError = null,
}: CartDrawerProps) {
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPriceNum = cartItems.reduce((sum, item) => sum + parseFloat(item.price.amount) * item.quantity, 0);
  const currencyCode = cartItems[0]?.price.currencyCode || 'EUR';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-md bg-zinc-950 border-l border-zinc-800/80 h-full flex flex-col shadow-2xl z-10 text-zinc-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-900 select-none">
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={20} className="text-white" />
              <h2 className="text-lg font-black text-white tracking-tight">Warenkorb</h2>
              <span className="bg-white/10 text-white border border-white/15 px-2 py-0.5 rounded-full text-xs font-bold">
                {totalItemCount}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Error Message */}
          {checkoutError && (
            <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
              {checkoutError}
            </div>
          )}

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12 select-none">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                  <ShoppingBag size={28} />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Dein Warenkorb ist leer</p>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
                    Wähle ein Event aus und lege Tickets in deinen Warenkorb.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Events durchstöbern
                </button>
              </div>
            ) : (
              cartItems.map((item) => {
                const itemSubtotalNum = parseFloat(item.price.amount) * item.quantity;
                const displayVariantTitle = item.variantTitle.toLowerCase().includes('privat')
                  ? 'Einzelticket'
                  : item.variantTitle;

                return (
                  <div
                    key={item.variantId}
                    className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex gap-3.5 relative group transition-all"
                  >
                    {/* Item Image */}
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.eventTitle}
                        className="w-16 h-16 rounded-xl object-cover border border-zinc-800 shrink-0"
                      />
                    )}

                    {/* Item Info */}
                    <div className="flex-1 min-w-0 space-y-1.5 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-extrabold text-white truncate leading-snug">
                          {item.eventTitle}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.variantId)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1 shrink-0 cursor-pointer"
                          title="Entfernen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="inline-block px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[10px] font-bold text-zinc-300">
                        {displayVariantTitle}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Quantity Selector */}
                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-1">
                          <button
                            onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                            className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white px-1 select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                            disabled={item.quantity >= 10}
                            className={`w-5 h-5 flex items-center justify-center font-bold text-xs transition-colors ${item.quantity >= 10 ? 'text-zinc-600 cursor-not-allowed opacity-50' : 'text-zinc-400 hover:text-white cursor-pointer'}`}
                            title={item.quantity >= 10 ? 'Maximal 10 Tickets pro Event erlaubt' : 'Menge erhöhen'}
                          >
                            +
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-xs font-black text-white">
                          {formatPrice(itemSubtotalNum, item.price.currencyCode)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-zinc-900 bg-zinc-950 space-y-4 text-left">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                  <span>Zwischensumme:</span>
                  <span className="text-white text-base font-black">
                    {formatPrice(totalPriceNum, currencyCode)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Inkl. MwSt. Versandfreie digitale Tickets mit sofortiger Bereitstellung.
                </p>
              </div>

              {/* Newsletter Opt-In Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs text-zinc-300 cursor-pointer hover:border-zinc-700 transition-all select-none">
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={(e) => setSubscribeNewsletter(e.target.checked)}
                  className="mt-0.5 rounded border-zinc-700 text-white focus:ring-0 accent-red-600 shrink-0 cursor-pointer"
                />
                <span className="leading-snug text-[11px] text-zinc-300">
                  Ich möchte den Cardpirates Newsletter abonnieren, um exklusive Event-Updates zu erhalten.
                </span>
              </label>

              <button
                type="button"
                onClick={() => onCheckout(subscribeNewsletter)}
                disabled={loadingCheckout}
                className="w-full py-4 rounded-xl bg-white hover:bg-zinc-200 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-extrabold text-sm border border-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-[0.98]"
              >
                {loadingCheckout ? (
                  <span>Kasse wird geladen...</span>
                ) : (
                  <>
                    <span>Weiter zur Kasse (PayPal / Kreditkarte)</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
