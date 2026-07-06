import { Link } from 'react-router-dom';
import { Skull, UserCheck } from 'lucide-react';

interface NavbarProps {
  onLoginTrigger: () => void;
}

export default function Navbar({ onLoginTrigger }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group select-none">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-xl shadow-lg shadow-violet-600/10 group-hover:scale-105 transition-transform duration-300">
            <Skull size={18} />
          </div>
          <span className="text-md font-black tracking-wider text-white uppercase font-sans">
            Card<span className="text-violet-500">pirates</span>
          </span>
        </Link>

        {/* Navigation Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLoginTrigger}
            className="flex items-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold tracking-wide transition-all select-none active:scale-[0.98]"
          >
            <UserCheck size={14} className="text-violet-400" />
            Login / Register
          </button>
        </div>

      </div>
    </nav>
  );
}
