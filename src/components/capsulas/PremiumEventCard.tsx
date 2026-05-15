import React, { useState, useEffect, useMemo } from 'react';
import { Clock, MapPin, Calendar, ArrowRight, Video, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

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
    const startDate = new Date(`${evento.fechaInicial}T${evento.hora}`);
    // If hora_final is missing, assume 2 hours after start
    const endDateStr = evento.hora_final || (() => {
       const [h, m] = evento.hora.split(':').map(Number);
       const endH = (h + 2) % 24;
       return `${endH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    })();
    const endDate = new Date(`${evento.fechaInicial}T${endDateStr}`);

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
    // Robust parsing to avoid timezone shifts (YYYY-MM-DD)
    const [year, month, day] = evento.fechaInicial.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    return {
      day: date.getDate(),
      month: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).toUpperCase()
    };
  }, [evento.fechaInicial]);

  const mainColor = evento.tipoEvento === 'VIRTUAL' ? 'blue' : 'emerald';
  const accentGradient = evento.tipoEvento === 'VIRTUAL' 
    ? 'from-blue-600 via-indigo-600 to-purple-600' 
    : 'from-emerald-500 via-teal-500 to-cyan-500';

  return (
    <div
      onClick={() => onClick?.(evento)}
      className={`relative shrink-0 w-[150px] sm:w-[180px] md:w-[200px] aspect-[9/16] rounded-[2.5rem] overflow-hidden group cursor-pointer transition-all duration-700 snap-start shadow-2xl bg-black border border-white/5 hover:border-white/20 ${status === 'finished' ? 'opacity-70' : ''}`}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        {evento.url ? (
          <>
            <img 
              src={getImageUrl(evento.url)} 
              alt={evento.nombre} 
              className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${status === 'finished' ? 'grayscale' : 'grayscale-[20%] group-hover:grayscale-0'}`} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
          </>
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${accentGradient} opacity-40 flex items-center justify-center`}>
            <Calendar className="w-12 h-12 text-white/10" />
          </div>
        )}
      </div>

      {/* Top Info */}
      <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-10">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 min-w-[45px] flex flex-col items-center shadow-xl">
          <span className={`text-[10px] font-black text-${mainColor}-400 leading-none mb-1 tracking-tighter`}>{dateData.month}</span>
          <span className="text-xl font-black text-white leading-none tracking-tighter">{dateData.day}</span>
        </div>
        
        <div className="flex flex-col gap-2 items-end">
          <div className="p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 text-white shadow-lg">
             {evento.tipoEvento === 'VIRTUAL' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Main Status Overlay (Always Visible) */}
      <div className="absolute top-20 left-5 right-5 z-20">
        {status === 'live' && (
          <div className="bg-red-500/90 backdrop-blur-md border border-red-400/50 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
             <Zap className="w-3 h-3 text-white fill-white" />
             <span className="text-[8px] font-black text-white tracking-[0.15em] uppercase">En Vivo Ahora</span>
          </div>
        )}
        {status === 'finished' && (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 flex items-center gap-2">
             <CheckCircle2 className="w-3 h-3 text-gray-400" />
             <span className="text-[8px] font-black text-white/60 tracking-[0.15em] uppercase">Evento Finalizado</span>
          </div>
        )}
        {status === 'pending' && timeLeft && (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 shadow-lg">
             <Clock className="w-3 h-3 text-emerald-400 animate-pulse" />
             <span className="text-[8px] font-black text-white tracking-widest uppercase">
                {timeLeft.days > 0 ? `Faltan ${timeLeft.days}D` : `Inicia en ${timeLeft.hours}H ${timeLeft.minutes}M`}
             </span>
          </div>
        )}
      </div>

      {/* Countdown Large Overlay (Hover) */}
      {status === 'pending' && timeLeft && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:-translate-y-1/2">
           <div className="flex gap-2">
              {[{v: timeLeft.days, l: 'D'}, {v: timeLeft.hours, l: 'H'}, {v: timeLeft.minutes, l: 'M'}].map((t, i) => (
                <div key={i} className="flex flex-col items-center bg-black/60 backdrop-blur-xl border border-white/10 w-10 h-10 rounded-xl justify-center shadow-2xl">
                  <span className="text-xs font-black text-white leading-none">{t.v}</span>
                  <span className="text-[6px] font-bold text-white/40 uppercase">{t.l}</span>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Bottom Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
             <div className={`w-1 h-4 bg-gradient-to-b ${accentGradient} rounded-full`} />
             <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">{evento.tipoEvento}</span>
          </div>

          <h4 className="text-white font-black text-base sm:text-lg leading-[1.1] uppercase tracking-tighter line-clamp-2 italic">
            {evento.nombre}
          </h4>

          <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10 transition-all duration-700">
            <div className="flex items-center gap-2 text-white/70 text-[9px] font-bold">
              <Clock className={`w-3.5 h-3.5 text-${mainColor}-400`} />
              <span>{evento.hora} {evento.hora_final ? `- ${evento.hora_final}` : ''}</span>
            </div>
            {evento.area && (
              <div className="flex items-center gap-2 text-white/70 text-[9px] font-bold">
                <MapPin className={`w-3.5 h-3.5 text-${mainColor}-400`} />
                <span className="truncate">{evento.area.nombre}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="absolute bottom-6 right-6 z-20 transition-all duration-700">
         <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-2xl group-hover:scale-110">
            <ArrowRight className="w-4 h-4" />
         </div>
      </div>
    </div>
  );
};
