import { Link } from 'react-router-dom';
import { UserCheck } from 'lucide-react';
import { Button } from '@heroui/react';

interface NavbarProps {
  onLoginTrigger: () => void;
}

export default function Navbar({ onLoginTrigger }: NavbarProps) {
  return (
    <nav className="hidden md:block sticky top-0 z-40 w-full bg-zinc-950/10 backdrop-blur-sm border-b border-zinc-900/20 px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group select-none">
          <span className="text-3xl font-medium text-white font-[Qwigley] tracking-wide lowercase first-letter:uppercase">
            Cardpirates
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onPress={onLoginTrigger}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold px-4 py-2.5 flex items-center gap-2"
          >
            <UserCheck size={14} className="text-white" />
            <span>Anmelden / Registrieren</span>
          </Button>
        </div>

      </div>
    </nav>
  );
}
