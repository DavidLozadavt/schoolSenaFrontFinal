import React, { useState, useEffect, useMemo } from 'react';
import { Clock, MapPin, Calendar, ArrowRight, Video, Zap, CheckCircle2, AlertCircle, Timer, Sparkles } from 'lucide-react';

interface Evento {
  idEvento: number;
  nombre: string;
  descripcion?: string;
  fechaInicial: string;
  fechaFinal?: string;
  hora: string;
  hora_final?: string;
  url?: string;
  linkRegistro?: string;
  tipoEvento: string;
  estado: string;
  esPublico: boolean;
  area?: {
    id: number;
    nombre: string;
  };
}

interface PremiumEventCardProps {
  evento: Evento;
  onClick?: (evento: Evento) => void;
}

export const PremiumEventCard: React.FC<PremiumEventCardProps> = ({ evento, onClick }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [status, setStatus] = useState<'pending' | 'live' | 'finished'>('pending');

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${normalizedUrl}`;
  };

  useEffect(() => {
    const startDate = new Date(`${evento.fechaInicial.split('T')[0]}T${evento.hora}`);
    const endDateStr = evento.hora_final || (() => {
       const [h, m] = evento.hora.split(':').map(Number);
       const endH = (h + 2) % 24;
       return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    })();
    const endDate = new Date(`${evento.fechaInicial.split('T')[0]}T${endDateStr}`);

    const calculateTime = () => {
      const now = new Date();
      if (now > endDate) {
        setStatus('finished');
        setTimeLeft(null);
        return;
      }
      if (now >= startDate && now <= endDate) {
        setStatus('live');
        setTimeLeft(null);
        return;
      }
      setStatus('pending');
      const difference = startDate.getTime() - now.getTime();
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [evento.fechaInicial, evento.hora, evento.hora_final]);

  const dateData = useMemo(() => {
    const [year, month, day] = evento.fechaInicial.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return {
      day: date.getDate(),
      month: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).toUpperCase()
    };
  }, [evento.fechaInicial]);

  const accentGradient = evento.tipoEvento === 'VIRTUAL' 
    ? 'from-blue-600 via-indigo-600 to-purple-600' 
    : 'from-emerald-500 via-teal-500 to-cyan-500';

  return (
    <div
      onClick={() => onClick?.(evento)}
      className={`relative shrink-0 w-[140px] sm:w-[160px] aspect-[9/16] rounded-[2rem] overflow-hidden group cursor-pointer transition-all duration-500 snap-start shadow-xl bg-black border border-white/10 hover:border-white/30 hover:scale-[1.02] active:scale-95 ${status === 'finished' ? 'grayscale opacity-80' : ''}`}
    >
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        {evento.url ? (
          <>
            <img 
              src={getImageUrl(evento.url)} 
              alt={evento.nombre} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${accentGradient} opacity-40`} />
        )}
      </div>

      {/* Glass Overlay for Content */}
      <div className="absolute inset-x-0 bottom-0 p-4 z-10 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex flex-col gap-2">
          {/* Status Label (Mini) */}
          <div className="flex items-center gap-1.5 mb-1">
             <div className={`w-1.5 h-1.5 rounded-full ${status === 'live' ? 'bg-rose-500 animate-pulse' : status === 'finished' ? 'bg-gray-500' : 'bg-primary shadow-[0_0_8px_rgba(255,255,255,0.5)]'}`} />
             <span className="text-[7px] font-black text-white/60 uppercase tracking-[0.2em]">
                {status === 'live' ? 'En Vivo' : status === 'finished' ? 'Terminado' : 'Pendiente'}
             </span>
          </div>

          <h4 className="text-white font-black text-xs sm:text-sm leading-tight uppercase tracking-tighter line-clamp-2 italic drop-shadow-lg">
            {evento.nombre}
          </h4>

          <div className="flex flex-col gap-1 mt-1 opacity-80">
            <div className="flex items-center gap-2 text-white text-[8px] font-bold">
              <Clock className="w-3 h-3 text-white/50" />
              <span>{evento.hora}</span>
            </div>
            {evento.area && (
              <div className="flex items-center gap-2 text-white text-[8px] font-bold">
                <MapPin className="w-3 h-3 text-white/50" />
                <span className="truncate">{evento.area.nombre}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Date Badge (Top Left) */}
      <div className="absolute top-3 left-3 z-20">
         <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-[35px] flex flex-col items-center shadow-2xl">
            <span className="text-[7px] font-black text-white/60 leading-none mb-0.5 tracking-tighter">{dateData.month}</span>
            <span className="text-sm font-black text-white leading-none tracking-tighter">{dateData.day}</span>
         </div>
      </div>

      {/* Floating Type Badge (Top Right) */}
      <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl">
            {evento.tipoEvento === 'VIRTUAL' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
         </div>
      </div>

      {/* Hover Status Indicator */}
      <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
         {status === 'pending' && timeLeft && (
           <div className="flex flex-col items-center gap-1 bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-2xl">
              <p className="text-[7px] font-black text-white/40 uppercase tracking-[0.2em]">Comienza en</p>
              <p className="text-xs font-black text-white italic tracking-widest">{timeLeft.days > 0 ? `${timeLeft.days}D ${timeLeft.hours}H` : `${timeLeft.hours}H ${timeLeft.minutes}M`}</p>
           </div>
         )}
         {status === 'live' && (
            <div className="w-10 h-10 rounded-full bg-rose-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]">
               <Zap className="w-5 h-5 fill-white animate-pulse" />
            </div>
         )}
      </div>

      {/* Mini Progress Bar (Bottom) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-20 overflow-hidden">
         <div className={`h-full bg-gradient-to-r ${accentGradient} transition-all duration-500`} style={{ width: status === 'finished' ? '100%' : status === 'live' ? '50%' : '0%' }} />
      </div>
    </div>
  );
};

export default PremiumEventCard;
