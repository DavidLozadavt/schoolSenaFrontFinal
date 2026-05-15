import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Share2, Info, Bell, Video, Link as LinkIcon, Timer, Sparkles, Map, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Evento {
  idEvento: number;
  nombre: string;
  descripcion: string;
  fechaInicial: string;
  fechaFinal?: string;
  hora: string;
  hora_final?: string;
  url?: string;
  linkRegistro?: string;
  tipoEvento: string;
  estado: string;
  area?: {
    nombre: string;
  };
}

interface ModalDetalleEventoProps {
  evento: Evento;
  onClose: () => void;
}

const ModalDetalleEvento: React.FC<ModalDetalleEventoProps> = ({ evento, onClose }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [eventStatus, setEventStatus] = useState<'pending' | 'live' | 'finished' | 'cancelled'>('pending');

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${normalizedUrl}`;
  };

  useEffect(() => {
    const calculateStatusAndTimer = () => {
      if (evento.estado === 'CANCELADO') {
        setEventStatus('cancelled');
        return;
      }

      const now = new Date();
      const startStr = `${evento.fechaInicial.split('T')[0]}T${evento.hora}`;
      const endStr = evento.hora_final 
        ? `${(evento.fechaFinal || evento.fechaInicial).split('T')[0]}T${evento.hora_final}`
        : null;
      
      const startDate = new Date(startStr);
      const endDate = endStr ? new Date(endStr) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

      if (now < startDate) {
        setEventStatus('pending');
        const diff = startDate.getTime() - now.getTime();
        setTimeLeft({
          d: Math.floor(diff / (1000 * 60 * 60 * 24)),
          h: Math.floor((diff / (1000 * 60 * 60)) % 24),
          m: Math.floor((diff / (1000 * 60)) % 60),
          s: Math.floor((diff / 1000) % 60)
        });
      } else if (now >= startDate && now <= endDate) {
        setEventStatus('live');
        setTimeLeft(null);
      } else {
        setEventStatus('finished');
        setTimeLeft(null);
      }
    };

    calculateStatusAndTimer();
    const timer = setInterval(calculateStatusAndTimer, 1000);
    return () => clearInterval(timer);
  }, [evento]);

  const eventImageUrl = getImageUrl(evento.url);

  const statusConfig = {
    pending: { label: 'Próximamente', color: 'bg-primary', icon: <Sparkles className="w-3 h-3 fill-current" /> },
    live: { label: 'En Vivo', color: 'bg-rose-500 animate-pulse', icon: <Video className="w-3 h-3 fill-current" /> },
    finished: { label: 'Finalizado', color: 'bg-gray-500', icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { label: 'Cancelado', color: 'bg-orange-600', icon: <AlertCircle className="w-3 h-3" /> }
  };

  const currentStatus = statusConfig[eventStatus];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-coal-500/80 backdrop-blur-2xl" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white dark:bg-coal-400 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.6)] border border-white/10 animate-slide-up flex flex-col lg:flex-row max-h-[90vh]">
        
        {/* Left Section: Image (Desktop) / Header Image (Mobile) */}
        <div className="relative w-full lg:w-[45%] h-48 lg:h-auto shrink-0 group overflow-hidden">
          {eventImageUrl ? (
            <img 
              src={eventImageUrl} 
              alt={evento.nombre} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary via-purple-600 to-indigo-700 flex items-center justify-center">
               <Sparkles className="w-20 h-20 text-white/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/60 via-transparent to-transparent" />
          
          {/* Status Badge Over Image */}
          <div className="absolute top-6 left-6 z-20">
            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 border border-white/20 text-white ${currentStatus.color}`}>
               {currentStatus.icon}
               {currentStatus.label}
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-6 right-6 lg:hidden z-30 p-2 rounded-xl bg-white/10 backdrop-blur-md text-white border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section: Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-coal-400">
          {/* Top Bar (Desktop Only) */}
          <div className="hidden lg:flex items-center justify-between p-8 pb-4">
             <div className="px-4 py-1.5 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.2em] border border-primary/20">
                {evento.tipoEvento}
             </div>
             <button 
               onClick={onClose}
               className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-all hover:rotate-90"
             >
               <X className="w-6 h-6" />
             </button>
          </div>

          {/* Main Info */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 pt-4 lg:pt-0">
             <div className="space-y-6">
                <div className="space-y-2">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic">Evento SENA</p>
                   <h2 className="text-3xl lg:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-[0.9] italic">
                     {evento.nombre}
                   </h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fecha</p>
                         <p className="text-[11px] font-bold text-gray-700 dark:text-white truncate uppercase">{new Date(evento.fechaInicial).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                         <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Hora</p>
                         <p className="text-[11px] font-bold text-gray-700 dark:text-white truncate uppercase">{evento.hora}</p>
                      </div>
                   </div>
                </div>

                {evento.area && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <MapPin className="w-6 h-6 text-primary" />
                    <div>
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ubicación</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-white uppercase italic">{evento.area.nombre}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-[2px] bg-primary rounded-full" />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Descripción</p>
                   </div>
                   <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed font-medium italic">
                     {evento.descripcion || 'Sin descripción detallada disponible.'}
                   </p>
                </div>

                {/* Countdown (Compact) */}
                {eventStatus === 'pending' && timeLeft && (
                  <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <Timer className="w-8 h-8 text-primary/40" />
                        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Inicia en</span>
                     </div>
                     <div className="flex gap-4">
                        {[
                          { v: timeLeft.d, l: 'D' },
                          { v: timeLeft.h, l: 'H' },
                          { v: timeLeft.m, l: 'M' },
                          { v: timeLeft.s, l: 'S' }
                        ].map((u, i) => (
                          <div key={i} className="flex flex-col items-center">
                             <span className="text-xl font-black text-primary leading-none">{String(u.v).padStart(2, '0')}</span>
                             <span className="text-[7px] font-black text-primary/40 uppercase">{u.l}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                )}

                {/* Status Messages */}
                {eventStatus === 'cancelled' && (
                  <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/30 flex items-center gap-4 text-orange-600">
                    <AlertCircle className="w-8 h-8" />
                    <p className="text-xs font-black uppercase tracking-wider italic">Este evento ha sido cancelado. Lamentamos los inconvenientes.</p>
                  </div>
                )}
                {eventStatus === 'finished' && (
                  <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center gap-4 text-gray-500">
                    <CheckCircle2 className="w-8 h-8" />
                    <p className="text-xs font-black uppercase tracking-wider italic">Este evento ya ha finalizado. ¡Gracias por participar!</p>
                  </div>
                )}
             </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 lg:p-8 bg-gray-50/50 dark:bg-white/2 border-t border-black/5 dark:border-white/5">
             <div className="flex gap-3">
                {evento.linkRegistro && eventStatus !== 'finished' && eventStatus !== 'cancelled' ? (
                  <a 
                    href={evento.linkRegistro}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    Registrarse
                  </a>
                ) : (
                  <div className="flex-1 bg-gray-100 dark:bg-white/5 text-gray-400 font-black text-[9px] uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 border border-black/5">
                    <Info className="w-3.5 h-3.5" />
                    Información General
                  </div>
                )}
                <button className="p-4 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-gray-600 dark:text-white shadow-sm hover:-translate-y-1 transition-all">
                  <Share2 className="w-5 h-5" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleEvento;
