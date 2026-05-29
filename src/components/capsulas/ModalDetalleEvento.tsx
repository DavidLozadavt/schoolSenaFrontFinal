import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { X, Calendar, Clock, MapPin, Share2, Info, Bell, Video, Link as LinkIcon, Timer, Sparkles, Map, AlertCircle, CheckCircle2, Copy, ExternalLink, ArrowRight, Eye, CalendarPlus } from 'lucide-react';
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
  idFormularioInterno?: number | string;
  id_formulario_interno?: number | string;
}


interface ModalDetalleEventoProps {
  evento: Evento;
  onClose: () => void;
}

const ModalDetalleEvento: React.FC<ModalDetalleEventoProps> = ({ evento, onClose }) => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [eventStatus, setEventStatus] = useState<'pending' | 'live' | 'finished' | 'cancelled'>('pending');
  const [isRegistered, setIsRegistered] = useState(false);
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [actividades, setActividades] = useState<any[]>([]);
  const [loadingActividades, setLoadingActividades] = useState(false);

  useEffect(() => {
    const fetchActividades = async () => {
      setLoadingActividades(true);
      try {
        const response = await axios.get('/items', { params: { idEvento: evento.idEvento } });
        setActividades(response.data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoadingActividades(false);
      }
    };
    if (evento.idEvento) {
      fetchActividades();
    }
  }, [evento.idEvento]);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let [hoursStr, minutesStr] = parts;
    let hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const formatDateSpanish = (dateStr?: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split(' ')[0].split('T')[0];
    const parts = cleanDate.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const monthNames = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    return `${day} ${monthNames[monthIdx] || month}, ${year}`;
  };

  const getGoogleCalendarUrl = () => {
    if (!evento) return '';
    try {
      const cleanStartDate = evento.fechaInicial.replace(/[-:]/g, '').split('T')[0];
      const cleanStartTime = (evento.hora || '00:00:00').replace(/[-:]/g, '') + '00';
      const cleanEndDate = (evento.fechaFinal || evento.fechaInicial).replace(/[-:]/g, '').split('T')[0];
      const cleanEndTime = (evento.hora_final || '23:59:59').replace(/[-:]/g, '') + '00';
      
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(evento.nombre)}&dates=${cleanStartDate}T${cleanStartTime}/${cleanEndDate}T${cleanEndTime}&details=${encodeURIComponent(evento.descripcion || '')}&location=${encodeURIComponent(evento.area?.nombre || '')}`;
    } catch (e) {
      console.error(e);
      return '#';
    }
  };

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
      window.dispatchEvent(new CustomEvent('event-registration-updated', { detail: { idEvento: evento.idEvento, inscrito: true } }));
    } catch (error) {
      console.error('Error registering:', error);
      enqueueSnackbar('Error al confirmar la inscripción', { variant: 'error' });
    } finally {
      setLoadingRegistration(false);
    }
  };

  const handleExternalFormClick = () => {
    const internalFormId = evento.idFormularioInterno || evento.id_formulario_interno;
    if (internalFormId) {
      onClose();
      navigate(`/formulario-publico/${internalFormId}`, {
        state: { fromEventId: evento.idEvento }
      });
    } else {
      window.open(evento.linkRegistro || evento.formUrl, '_blank');
      if (!isRegistered) {
        setShowConfirmButton(true);
      }
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
    const shareUrl = `${window.location.origin}/evento/${evento.idEvento}`;
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
        <div className="relative w-full md:w-[45%] h-64 md:h-auto shrink-0 group overflow-hidden">
          {eventImageUrl && (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <img 
                src={eventImageUrl} 
                alt="Atmosphere" 
                className="w-full h-full object-cover blur-2xl opacity-20 scale-125 translate-y-4" 
              />
            </div>
          )}
          {eventImageUrl ? (
            <>
              <img 
                src={eventImageUrl} 
                alt={evento.nombre} 
                className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-105 relative z-10"
              />
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-neutral-950 via-neutral-950/40 to-transparent z-20" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-rose-500 to-orange-500 flex items-center justify-center overflow-hidden relative z-10">
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
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
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

             <div className="space-y-6 w-full min-w-0">
                 <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-200 dark:to-neutral-400 tracking-tight leading-[1] break-words [word-break:break-word] w-full">
                   {evento.nombre}
                 </h2>
                 <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-white/5 px-4.5 py-3 rounded-3xl border border-neutral-200/40 dark:border-white/5 shadow-sm">
                       <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-orange-500" />
                       </div>
                       <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest leading-none">Inicio del Evento</span>
                          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mt-1 uppercase tracking-tight">
                             {formatDateSpanish(evento.fechaInicial)} a las {formatTime(evento.hora)}
                          </span>
                       </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-neutral-50 dark:bg-white/5 px-4.5 py-3 rounded-3xl border border-neutral-200/40 dark:border-white/5 shadow-sm">
                       <div className="w-8 h-8 bg-rose-500/10 rounded-xl flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-rose-500" />
                       </div>
                       <div className="flex flex-col text-left">
                          <span className="text-[8px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest leading-none">Finalización</span>
                          <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mt-1 uppercase tracking-tight">
                             {formatDateSpanish(evento.fechaFinal || evento.fechaInicial)} a las {evento.hora_final ? formatTime(evento.hora_final) : 'TBD'}
                          </span>
                       </div>
                    </div>

                     {evento.area && (
                      <div className="flex items-center gap-3 bg-neutral-50 dark:bg-white/5 px-4.5 py-3 rounded-3xl border border-neutral-200/40 dark:border-white/5 shadow-sm">
                         <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin className="w-4 h-4 text-blue-500" />
                         </div>
                         <div className="flex flex-col text-left">
                            <span className="text-[8px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest leading-none">Lugar / Ubicación</span>
                            <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 mt-1 uppercase truncate max-w-[150px] tracking-tight">{evento.area.nombre}</span>
                         </div>
                      </div>
                     )}

                     <a
                        href={getGoogleCalendarUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-4.5 py-3 rounded-3xl border border-orange-500/20 shadow-sm transition-all duration-300 hover:-translate-y-0.5 active:scale-95 text-[10px] font-black uppercase tracking-widest shrink-0"
                     >
                        <CalendarPlus className="w-4 h-4" />
                        Agendar en Google
                     </a>
                 </div>
              </div>

             {/* Description */}
             <div className="space-y-3 w-full min-w-0">
                <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.3em] flex items-center gap-2">
                   <Info className="w-3.5 h-3.5" />
                   Sobre el Evento
                </span>
                <div className="relative w-full min-w-0">
                   <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                      {evento.descripcion || 'No se ha proporcionado una descripción detallada para este evento.'}
                   </p>
                </div>
             </div>

             {/* Cronograma de Actividades */}
             <div className="space-y-6 pt-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.1)]">
                      <Clock className="w-4 h-4" />
                   </div>
                   <h3 className="text-lg font-black uppercase text-neutral-900 dark:text-white tracking-tighter">
                      Cronograma de Actividades
                   </h3>
                </div>

                {loadingActividades ? (
                   <div className="space-y-4">
                      {[1, 2].map((i) => (
                         <div key={i} className="animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-3xl p-5 space-y-3">
                            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4" />
                            <div className="h-4 bg-neutral-300 dark:bg-neutral-600 rounded w-3/4" />
                            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
                         </div>
                      ))}
                   </div>
                ) : actividades.length > 0 ? (
                   <div className="relative pl-6 border-l-2 border-orange-500/20 space-y-6">
                      {actividades.map((act, index) => {
                         const actDate = act.hora_inicio ? new Date(act.hora_inicio) : null;
                         const actDateStr = actDate 
                            ? actDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })
                            : '';
                         const startStr = act.hora_inicio
                            ? new Date(act.hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                            : '';
                         const endStr = act.hora_fin
                            ? new Date(act.hora_fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                            : '';

                         return (
                            <div key={act.id || index} className="relative group">
                               {/* Timeline Dot */}
                               <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 border-4 border-orange-500 group-hover:scale-125 transition-transform duration-300" />

                               <div className="bg-neutral-50/50 dark:bg-white/[0.02] backdrop-blur-md rounded-3xl p-5 border border-neutral-200/40 dark:border-white/5 shadow-sm hover:border-orange-500/20 hover:shadow-md transition-all duration-300">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                     <span className="text-[9px] font-black text-orange-500 tracking-widest uppercase">
                                        Actividad #{index + 1}
                                     </span>
                                     <div className="flex flex-wrap gap-2">
                                        {actDateStr && (
                                           <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase flex items-center gap-1.5 bg-white dark:bg-neutral-850 px-2.5 py-1 rounded-lg border border-neutral-200/30 dark:border-white/5 shadow-sm">
                                              <Calendar className="w-3 h-3 text-orange-500" />
                                              {actDateStr}
                                           </span>
                                        )}
                                        {(startStr || endStr) && (
                                           <span className="text-[9px] font-black text-neutral-400 dark:text-neutral-500 uppercase flex items-center gap-1.5 bg-white dark:bg-neutral-850 px-2.5 py-1 rounded-lg border border-neutral-200/30 dark:border-white/5 shadow-sm">
                                              <Clock className="w-3 h-3 text-rose-500" />
                                              {startStr} {endStr ? `- ${endStr}` : ''}
                                           </span>
                                        )}
                                     </div>
                                  </div>

                                  <h4 className="text-base font-bold text-neutral-800 dark:text-white mt-3 leading-snug tracking-tight">
                                     {act.nombreItem}
                                  </h4>
                                  
                                  {act.descripcion && (
                                     <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed font-medium">
                                        {act.descripcion}
                                     </p>
                                  )}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                ) : (
                   <div className="flex items-center gap-4.5 p-5 rounded-3xl bg-neutral-50/50 dark:bg-white/[0.02] border border-dashed border-neutral-300/60 dark:border-white/5 shadow-inner">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400 shrink-0 shadow-sm">
                         <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col text-left">
                         <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">Sin actividades programadas</span>
                         <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5 leading-snug uppercase tracking-tight">Este evento se desarrollará en una única sesión general.</span>
                      </div>
                   </div>
                )}
             </div>

             {/* Countdown / Status */}
             {eventStatus === 'pending' && timeLeft && (
                <div className="p-6 sm:p-8 rounded-[3rem] bg-neutral-950 dark:bg-black/40 border border-white/5 text-white flex flex-col lg:flex-row gap-6 items-center justify-between shadow-2xl relative overflow-hidden group w-full min-w-0">
                   <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <div className="flex flex-col items-center lg:items-start relative z-10 text-center lg:text-left">
                      <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em]">Faltan</span>
                      <span className="text-2xl font-black italic uppercase tracking-tighter mt-1">Para el Inicio</span>
                   </div>
                   <div className="flex flex-wrap gap-4 sm:gap-6 justify-center relative z-10 w-full lg:w-auto">
                      {[
                        { v: timeLeft.d, l: 'Días' },
                        { v: timeLeft.h, l: 'Horas' },
                        { v: timeLeft.m, l: 'Min' },
                        { v: timeLeft.s, l: 'Seg' }
                      ].map((u, i) => (
                        <div key={i} className="flex flex-col items-center min-w-[45px] sm:min-w-[50px]">
                           <span className="text-3xl sm:text-4xl font-black tabular-nums tracking-tighter leading-none">{String(u.v).padStart(2, '0')}</span>
                           <span className="text-[8px] font-black text-white/30 uppercase tracking-widest mt-1 sm:mt-2">{u.l}</span>
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
                    className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 animate-pulse mb-2"
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

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/evento/${evento.idEvento}`);
                    }}
                    className="flex-1 sm:flex-[2] h-16 bg-neutral-100/60 hover:bg-neutral-200/60 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] backdrop-blur-md text-neutral-800 dark:text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 border border-neutral-200/40 dark:border-white/5 shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-orange-500 shrink-0" />
                    Detalles Completos
                  </button>

                  {loadingCheck ? (
                    <div className="flex-1 sm:flex-[3] h-16 bg-neutral-100 dark:bg-white/5 rounded-3xl flex items-center justify-center border border-neutral-200 dark:border-white/10">
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-orange-500 border-t-transparent mr-3" />
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Sincronizando...</span>
                    </div>
                  ) : isRegistered ? (
                    <div className="flex-1 sm:flex-[3] h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Usuario Inscrito
                    </div>
                  ) : (evento.linkRegistro || evento.formUrl || evento.idFormularioInterno || evento.id_formulario_interno) && eventStatus !== 'finished' && eventStatus !== 'cancelled' ? (
                    <button 
                      onClick={handleExternalFormClick}
                      className="flex-1 sm:flex-[3] h-16 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                      Inscribirme Ahora
                      <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
                    </button>
                  ) : eventStatus === 'finished' ? (
                    <div className="flex-1 sm:flex-[3] h-16 bg-neutral-200 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 border border-dashed border-neutral-300 dark:border-white/10">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Evento Finalizado
                    </div>
                  ) : eventStatus === 'cancelled' ? (
                    <div className="flex-1 sm:flex-[3] h-16 bg-neutral-200 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 border border-dashed border-neutral-300 dark:border-white/10">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Evento Cancelado
                    </div>
                  ) : (
                    <div className="flex-1 sm:flex-[3] h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Sin Registro Previo</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleShare} 
                    className="w-full sm:w-16 h-16 rounded-3xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 border border-neutral-200/40 dark:border-white/5 text-neutral-600 dark:text-white shadow-sm flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
                    title="Compartir"
                  >
                    <Share2 className="w-5 h-5" />
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
