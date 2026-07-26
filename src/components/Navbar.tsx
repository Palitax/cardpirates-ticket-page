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
    <div className="hidden md:flex fixed top-6 right-6 z-40 items-center gap-3 select-none">
      {/* Cart Icon Trigger */}
      {onOpenCart && (
        <button
          onClick={onOpenCart}
          className="relative p-2.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700 text-white transition-all cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px] shadow-lg shadow-black/20"
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
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 shadow-lg shadow-black/20">
          <span className="text-xs font-bold text-zinc-300">Hallo, {currentUser.first_name}!</span>
          <Button
            variant="outline"
            onPress={onLogout}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            Abmelden
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onPress={onLoginTrigger}
          className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700 text-zinc-200 hover:text-white rounded-xl text-xs font-bold px-4 py-2.5 flex items-center gap-2 shadow-lg shadow-black/20"
        >
          <UserCheck size={14} className="text-white" />
          <span>Anmelden / Registrieren</span>
        </Button>
      )}
    </div>
  );
}
