import { Link } from 'react-router-dom';
import { UserCheck, ShoppingBag } from 'lucide-react';
import { Button } from '@heroui/react';
import type { CustomerProfile } from '../services/supabase';

interface NavbarProps {
  onLoginTrigger: () => void;
  currentUser?: CustomerProfile | null;
  onLogout?: () => void;
  cartCount?: number;
  onOpenCart?: () => void;
}

export default function Navbar({ onLoginTrigger, currentUser, onLogout, cartCount = 0, onOpenCart }: NavbarProps) {
  return (
    <nav className="hidden md:block sticky top-0 z-40 w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900/40 px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group select-none">
          <span className="text-3xl font-medium text-white font-[Qwigley] tracking-wide lowercase first-letter:uppercase">
            Cardpirates
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          {/* Cart Icon Trigger */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white transition-all cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Warenkorb öffnen"
            >
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-black font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-xs font-black text-zinc-400">Hallo, {currentUser.first_name}!</span>
              <Button
                variant="outline"
                onPress={onLogout}
                className="bg-zinc-950 border border-zinc-900 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-bold px-3 py-2 flex items-center gap-2 cursor-pointer transition-all"
              >
                Abmelden
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onPress={onLoginTrigger}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold px-4 py-2.5 flex items-center gap-2"
            >
              <UserCheck size={14} className="text-white" />
              <span>Anmelden / Registrieren</span>
            </Button>
          )}
        </div>

      </div>
    </nav>
  );
}
