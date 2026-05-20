import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Calendar, Clock, MapPin, Share2, Info, Bell, Video, Link as LinkIcon, Timer, Sparkles, Map, AlertCircle, CheckCircle2, Copy, ExternalLink, ArrowRight } from 'lucide-react';
import { useSnackbar } from 'notistack';
import { KeenIcon } from '@/components';

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
  esPublico?: boolean;
  idArea?: number;
  area?: {
    id?: number;
    nombre: string;
  };
  formUrl?: string;
  formProvider?: string;
}


interface ModalDetalleEventoProps {
  evento: Evento;
  onClose: () => void;
}

const ModalDetalleEvento: React.FC<ModalDetalleEventoProps> = ({ evento, onClose }) => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [eventStatus, setEventStatus] = useState<'pending' | 'live' | 'finished' | 'cancelled'>('pending');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${normalizedUrl}`;
  };

  const checkRegistration = async () => {
    setLoadingCheck(true);
    try {
      const response = await axios.get(`eventos-multimedia/${evento.idEvento}/check-registration`);
      setIsRegistered(response.data.inscrito);
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setLoadingCheck(false);
    }
  };

  const handleRegister = async () => {
    setLoadingRegistration(true);
    try {
      await axios.post(`eventos-multimedia/${evento.idEvento}/register`);
      setIsRegistered(true);
      setShowConfirmButton(false);
      enqueueSnackbar('¡Inscripción confirmada! Te avisaremos cuando empiece.', { variant: 'success' });
    } catch (error) {
      console.error('Error registering:', error);
      enqueueSnackbar('Error al confirmar la inscripción', { variant: 'error' });
    } finally {
      setLoadingRegistration(false);
    }
  };

  const handleExternalFormClick = () => {
    window.open(evento.linkRegistro || evento.formUrl, '_blank');
    if (!isRegistered) {
      setShowConfirmButton(true);
    }
  };

  useEffect(() => {
    checkRegistration();
    
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

      // Alerta de evento por comenzar (si faltan menos de 5 minutos y está inscrito)
      if (isRegistered && now < startDate && startDate.getTime() - now.getTime() < 5 * 60 * 1000) {
        // Podríamos usar una notificación persistente aquí
      }

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
  }, [evento, isRegistered]);

  const eventImageUrl = getImageUrl(evento.url);

  const statusConfig = {
    pending: { label: 'Próximamente', color: 'bg-primary', icon: <Sparkles className="w-3 h-3 fill-current" /> },
    live: { label: 'En Vivo', color: 'bg-rose-500 animate-pulse', icon: <Video className="w-3 h-3 fill-current" /> },
    finished: { label: 'Finalizado', color: 'bg-gray-500', icon: <CheckCircle2 className="w-3 h-3" /> },
    cancelled: { label: 'Cancelado', color: 'bg-orange-600', icon: <AlertCircle className="w-3 h-3" /> }
  };

  const currentStatus = statusConfig[eventStatus];

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/multimedia/eventos/show/${evento.idEvento}`;
    navigator.clipboard.writeText(shareUrl);
    enqueueSnackbar('Enlace del evento copiado al portapapeles', { 
      variant: 'success',
      anchorOrigin: { vertical: 'bottom', horizontal: 'center' }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in overflow-hidden">
      <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-2xl" onClick={onClose} />

      <div className="relative w-full max-w-5xl bg-white/90 dark:bg-neutral-900/90 backdrop-blur-3xl rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.6)] border border-white/20 animate-zoom-in flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Section: Cinematic Visuals */}
        <div className="relative w-full md:w-[45%] h-64 md:h-auto shrink-0 group">
          {eventImageUrl ? (
            <>
              <img 
                src={eventImageUrl} 
                alt={evento.nombre} 
                className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-rose-500 to-orange-500 flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 opacity-20 animate-pulse bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
               <Sparkles className="w-24 h-24 text-white/20 animate-bounce" />
            </div>
          )}

          {/* Floating Badges */}
          <div className="absolute top-8 left-8 z-20 space-y-3">
            <div className={`px-5 py-2.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 backdrop-blur-2xl border border-white/30 text-white ${currentStatus.color}`}>
               <div className="relative flex items-center justify-center">
                 <div className="absolute w-full h-full bg-white rounded-full animate-ping opacity-30" />
                 {currentStatus.icon}
               </div>
               {currentStatus.label}
            </div>
            
            <div className="px-5 py-2.5 rounded-[1.5rem] bg-black/40 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] w-fit shadow-xl">
              {evento.tipoEvento}
            </div>

            {isRegistered && (
              <div className="px-5 py-2.5 rounded-[1.5rem] bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-3 animate-bounce">
                <CheckCircle2 className="w-4 h-4" />
                Inscrito
              </div>
            )}
          </div>

          {/* Event Date Floating Info */}
          <div className="absolute bottom-8 left-8 z-20">
             <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] flex flex-col items-center justify-center text-white shadow-2xl transform hover:rotate-6 transition-transform">
                   <span className="text-xl font-black italic">{new Date(evento.fechaInicial).getDate()}</span>
                   <span className="text-[8px] font-black uppercase tracking-widest">{new Date(evento.fechaInicial).toLocaleDateString('es-ES', { month: 'short' })}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.3em]">Comienza el</span>
                   <span className="text-lg font-black text-white uppercase italic tracking-tighter">{new Date(evento.fechaInicial).toLocaleDateString('es-ES', { weekday: 'long' })}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Section: Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-10 py-8 border-b border-neutral-100 dark:border-white/5">
             <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
                <span className="text-[11px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em]">Experiencia Exclusiva</span>
             </div>
             <button 
              onClick={onClose} 
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-neutral-50 dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 text-neutral-400 transition-all hover:rotate-90"
             >
               <X className="w-6 h-6" />
             </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-10 py-8 space-y-10">
             {isRegistered && eventStatus === 'pending' && timeLeft && timeLeft.h === 0 && timeLeft.m < 10 && (
               <div className="p-6 rounded-[2.5rem] bg-gradient-to-r from-orange-500 to-rose-600 text-white flex items-center gap-6 shadow-[0_15px_30px_rgba(249,115,22,0.3)] animate-bounce">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                    <Bell className="w-8 h-8 animate-swing" />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.1em]">¡Prepárate!</p>
                    <p className="text-[11px] opacity-90 font-bold uppercase tracking-widest mt-1">Iniciamos en solo {timeLeft.m} minutos</p>
                  </div>
               </div>
             )}

             <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter leading-[0.9] italic transform -skew-x-6">
                  {evento.nombre}
                </h2>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-2 bg-neutral-50 dark:bg-white/5 px-4 py-2 rounded-xl">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-[11px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest">{evento.hora} {evento.hora_final ? `- ${evento.hora_final}` : ''}</span>
                   </div>
                   {evento.area && (
                     <div className="flex items-center gap-2 bg-neutral-50 dark:bg-white/5 px-4 py-2 rounded-xl">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="text-[11px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-widest truncate max-w-[200px]">{evento.area.nombre}</span>
                     </div>
                   )}
                </div>
             </div>

             {/* Description */}
             <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-transparent rounded-full" />
                <div className="pl-8 space-y-4 text-base leading-relaxed text-neutral-600 dark:text-neutral-400 font-medium italic">
                   {evento.descripcion || 'Descubre una experiencia única diseñada para nuestra comunidad académica. No te pierdas ningún detalle.'}
                </div>
             </div>

             {/* Countdown / Status */}
             {eventStatus === 'pending' && timeLeft && (
                <div className="p-8 rounded-[3rem] bg-neutral-950 dark:bg-black/40 border border-white/5 text-white flex items-center justify-between shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="flex flex-col relative z-10">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Faltan</span>
                      <span className="text-2xl font-black italic uppercase tracking-tighter mt-1">Para el Inicio</span>
                   </div>
                   <div className="flex gap-6 relative z-10">
                      {[
                        { v: timeLeft.d, l: 'Días' },
                        { v: timeLeft.h, l: 'Horas' },
                        { v: timeLeft.m, l: 'Min' },
                        { v: timeLeft.s, l: 'Seg' }
                      ].map((u, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[50px]">
                           <span className="text-4xl font-black tabular-nums tracking-tighter leading-none">{String(u.v).padStart(2, '0')}</span>
                           <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-2">{u.l}</span>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>

          {/* Footer Actions */}
          <div className="p-10 bg-neutral-50 dark:bg-black/20 border-t border-neutral-100 dark:border-white/5">
             <div className="flex flex-col gap-4">
                {showConfirmButton && !isRegistered && (
                  <button 
                    onClick={handleRegister}
                    disabled={loadingRegistration}
                    className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_15px_30px_rgba(16,185,129,0.3)] animate-pulse"
                  >
                    {loadingRegistration ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Confirmar Inscripción
                      </>
                    )}
                  </button>
                )}

                <div className="flex gap-4">
                  {loadingCheck ? (
                    <div className="flex-[3] h-16 bg-neutral-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-neutral-200 dark:border-white/10">
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-orange-500 border-t-transparent mr-3" />
                      <span className="text-xs font-black uppercase text-neutral-400 tracking-widest">Sincronizando...</span>
                    </div>
                  ) : isRegistered ? (
                    <div className="flex-[3] h-16 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 border border-emerald-500/20 shadow-inner">
                      <CheckCircle2 className="w-5 h-5" />
                      Usuario Inscrito
                    </div>
                  ) : (evento.linkRegistro || evento.formUrl) && eventStatus !== 'finished' && eventStatus !== 'cancelled' ? (
                    <button 
                      onClick={handleExternalFormClick}
                      className="flex-[3] h-16 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_15px_30px_rgba(249,115,22,0.3)] hover:scale-[1.02] active:scale-95"
                    >
                      <Sparkles className="w-5 h-5" />
                      Inscribirme Ahora
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </button>
                  ) : (
                    <div className="flex-[3] h-16 bg-neutral-200 dark:bg-white/10 text-neutral-400 font-black text-xs uppercase tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 border border-dashed border-neutral-300 dark:border-white/10">
                      <AlertCircle className="w-5 h-5" />
                      Inscripciones Cerradas
                    </div>
                  )}
                  
                  <button 
                    onClick={handleShare} 
                    className="w-16 h-16 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-white shadow-sm hover:bg-neutral-50 transition-all hover:scale-110 active:scale-90 flex items-center justify-center"
                    title="Compartir"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalDetalleEvento;
