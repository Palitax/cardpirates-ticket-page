import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date(targetDate) - +new Date();
    let timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: false
    };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    } else {
      timeLeft.isExpired = true;
    }

    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-xs font-semibold tracking-wide uppercase">
        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
        Event gestartet
      </div>
    );
  }

  if (timeLeft.days > 7) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80 text-center">
        <span className="text-sm font-bold text-sky-400 tracking-tight">{timeLeft.days}</span>
        <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">Tage bis zum Event</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center p-2.5 bg-slate-900/60 backdrop-blur-md rounded-xl border border-slate-800/80">
      <div className="flex flex-col">
        <span className="text-sm font-bold text-sky-400 tracking-tight">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Tage</span>
      </div>
      <div className="flex flex-col border-l border-slate-800/80">
        <span className="text-sm font-bold text-slate-200 tracking-tight">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Std</span>
      </div>
      <div className="flex flex-col border-l border-slate-800/80">
        <span className="text-sm font-bold text-slate-200 tracking-tight">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Min</span>
      </div>
      <div className="flex flex-col border-l border-slate-800/80">
        <span className="text-sm font-bold text-rose-400 tracking-tight animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Sek</span>
      </div>
    </div>
  );
}
