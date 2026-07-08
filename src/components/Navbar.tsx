import { Link } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { Button } from '@heroui/react';
import type { CustomerProfile } from '../services/supabase';
import WaterLogo from './WaterLogo';

interface NavbarProps {
  onLoginTrigger: () => void;
  currentUser?: CustomerProfile | null;
  onLogout?: () => void;
}

export default function Navbar({ onLoginTrigger, currentUser, onLogout }: NavbarProps) {
  return (
    <nav className="hidden md:block sticky top-0 z-40 w-full bg-zinc-950/10 backdrop-blur-sm border-b border-zinc-900/20 px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group select-none">
          <WaterLogo />
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
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
