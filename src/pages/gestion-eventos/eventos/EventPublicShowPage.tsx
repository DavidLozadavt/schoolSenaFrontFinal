import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container } from '@/components/container';
import ExternalFormEmbed, { FormProvider } from './ExternalFormEmbed';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ChevronLeft, 
  ExternalLink, 
  Globe, 
  Users, 
  Tag, 
  FileText,
  CalendarCheck,
  CheckCircle2,
  Share2,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

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
    nombre: string;
  };
  formUrl?: string;
  formProvider?: string;
  idFormularioInterno?: number | string;
}

export const EventPublicShowPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loadingRegistration, setLoadingRegistration] = useState(false);
  const [loadingCheck, setLoadingCheck] = useState(true);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [eventStatus, setEventStatus] = useState<'pending' | 'live' | 'finished' | 'cancelled'>('pending');

  useEffect(() => {
    if (!evento) return;
    
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

  const checkRegistration = async () => {
    setLoadingCheck(true);
    try {
      const response = await axios.get(`eventos-multimedia/${id}/check-registration`);
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
      await axios.post(`eventos-multimedia/${id}/register`);
      setIsRegistered(true);
      setShowConfirmButton(false);
      enqueueSnackbar('¡Inscripción confirmada! Te avisaremos cuando empiece el evento.', { variant: 'success' });
    } catch (error) {
      console.error('Error registering:', error);
      enqueueSnackbar('Error al confirmar la inscripción', { variant: 'error' });
    } finally {
      setLoadingRegistration(false);
    }
  };

  const handleExternalFormClick = () => {
    if (evento) {
      if (evento.formProvider === 'interno' && evento.idFormularioInterno) {
        navigate(`/formulario-publico/${evento.idFormularioInterno}`, {
          state: { fromEventId: evento.idEvento }
        });
      } else {
        window.open(evento.linkRegistro || evento.formUrl, '_blank');
        if (!isRegistered) {
          setShowConfirmButton(true);
        }
      }
    }
  };

  const handleShare = () => {
    if (evento) {
      const shareUrl = `${window.location.origin}/evento/${evento.idEvento}`;
      navigator.clipboard.writeText(shareUrl);
      enqueueSnackbar('Enlace del evento copiado al portapapeles', { variant: 'success' });
    }
  };

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const response = await axios.get(`eventos-multimedia/${id}`);
        setEvento(response.data);

        // Cargar las actividades del evento específico
        const actResponse = await axios.get(`/items`, { params: { idEvento: id } });
        setActividades(actResponse.data || []);
      } catch (error) {
        console.error('Error fetching event details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvento();
    checkRegistration();
  }, [id]);

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${backendUrl}${normalizedUrl}`;
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!evento) {
    return (
      <Container>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-800">Evento no encontrado</h2>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary mt-4"
          >
            Volver al Inicio
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8 animate-fade-in max-w-5xl mx-auto">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-orange-500 transition-colors mb-8 group"
        >
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-orange-100 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">Volver a la cartelera</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-8">
            {/* Poster / Image Section */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-neutral-100 dark:bg-neutral-800 aspect-[16/9]">
              {evento.url ? (
                <img 
                  src={getImageUrl(evento.url)} 
                  alt={evento.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 via-rose-500 to-indigo-600">
                  <CalendarCheck className="w-24 h-24 text-white/20 animate-pulse" />
                </div>
              )}
              <div className="absolute top-6 left-6 flex gap-3">
                <span className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-xl shadow-lg uppercase tracking-widest">
                  {evento.tipoEvento}
                </span>
                <span className={`px-4 py-2 text-white text-xs font-bold rounded-xl shadow-lg uppercase tracking-widest ${
                  evento.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-blue-500'
                }`}>
                  {evento.estado}
                </span>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-neutral-100 dark:border-neutral-800">
              <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-200 dark:to-neutral-400 tracking-tight leading-[1] mb-6 leading-tight">
                {evento.nombre}
              </h1>

              <div className="flex flex-wrap gap-4 mb-10">
                <div className="flex items-center gap-3 px-5 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                  <Tag className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Evento Institucional</span>
                </div>
                {evento.area && (
                  <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                    <MapPin className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{evento.area.nombre}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 px-5 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-800/30">
                  <Users className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                    {evento.esPublico ? 'Público General' : 'Solo Personal'}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white">
                  <FileText className="w-6 h-6 text-orange-500" />
                  Descripción del Evento
                </h3>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap leading-relaxed">
                  {evento.descripcion || 'No se ha proporcionado una descripción detallada para este evento.'}
                </p>
              </div>

              {/* Timeline de Actividades del Evento */}
              <div className="mt-12 space-y-6 border-t border-neutral-100 dark:border-neutral-800 pt-8 animate-fade-in-up">
                <h3 className="text-xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white mb-6">
                  <CalendarCheck className="w-6 h-6 text-green-500" />
                  Cronograma de Actividades
                </h3>
                
                {actividades.length > 0 ? (
                  <div className="relative pl-6 border-l-2 border-orange-500/20 space-y-8">
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
                        <div key={act.id} className="relative group">
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
              
              {/* External Form Section */}
              {evento.formUrl && (
                <div className="mt-12 animate-fade-in-up">
                  <ExternalFormEmbed 
                    url={evento.formUrl} 
                    provider={(evento.formProvider as FormProvider) || 'other'} 
                    title={evento.nombre}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Details Card */}
            <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 shadow-sm border border-neutral-100 dark:border-neutral-800 sticky top-8">
              <h4 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                Detalles de Programación
              </h4>

              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/10 shrink-0">
                    <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Inicio del Evento</p>
                    <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                      {formatDateSpanish(evento.fechaInicial)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-500/10 shrink-0">
                    <Calendar className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Finalización</p>
                    <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                      {formatDateSpanish(evento.fechaFinal || evento.fechaInicial)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/10 shrink-0">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Horario</p>
                    <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                      {formatTime(evento.hora)} {evento.hora_final ? `- ${formatTime(evento.hora_final)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-green-100 dark:bg-green-500/10 shrink-0">
                    <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Modalidad</p>
                    <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">{evento.tipoEvento}</p>
                  </div>
                </div>
              </div>

              {eventStatus === 'pending' && timeLeft && (
                <div className="mt-8 p-5 rounded-3xl bg-neutral-950 dark:bg-black/60 text-white flex flex-col gap-4 items-center justify-center shadow-lg relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-100" />
                  <div className="flex flex-col items-center relative z-10 text-center">
                    <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.4em]">FALTAN</span>
                    <span className="text-base font-black italic uppercase tracking-tighter mt-1">Para iniciar</span>
                  </div>
                  <div className="flex gap-4 justify-center relative z-10">
                    {[
                      { v: timeLeft.d, l: 'Días' },
                      { v: timeLeft.h, l: 'Hrs' },
                      { v: timeLeft.m, l: 'Min' },
                      { v: timeLeft.s, l: 'Seg' }
                    ].map((u, i) => (
                      <div key={i} className="flex flex-col items-center min-w-[35px]">
                        <span className="text-xl font-black tabular-nums tracking-tighter leading-none">{String(u.v).padStart(2, '0')}</span>
                        <span className="text-[7px] font-black text-white/30 uppercase tracking-widest mt-1.5">{u.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registro / Inscripción del Usuario */}
              <div className="mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
                {showConfirmButton && !isRegistered && (
                  <button 
                    onClick={handleRegister}
                    disabled={loadingRegistration}
                    className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 animate-pulse"
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
                    <div className="flex-1 h-16 bg-neutral-100 dark:bg-white/5 rounded-3xl flex items-center justify-center border border-neutral-200 dark:border-white/10">
                      <div className="animate-spin rounded-full h-5 w-5 border-3 border-orange-500 border-t-transparent mr-3" />
                      <span className="text-[10px] font-black uppercase text-neutral-400 tracking-widest">Sincronizando...</span>
                    </div>
                  ) : isRegistered ? (
                    <div className="flex-1 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      Usuario Inscrito
                    </div>
                  ) : (evento.linkRegistro || evento.formUrl || (evento.formProvider === 'interno' && evento.idFormularioInterno)) && evento.estado !== 'FINALIZADO' && evento.estado !== 'CANCELADO' ? (
                    <button 
                      onClick={handleExternalFormClick}
                      className="flex-1 h-16 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 shadow-lg shadow-orange-500/20"
                    >
                      <Sparkles className="w-4 h-4 shrink-0 animate-pulse" />
                      Inscribirme Ahora
                      <ArrowRight className="w-4 h-4 ml-0.5 shrink-0" />
                    </button>
                  ) : evento.estado === 'FINALIZADO' ? (
                    <div className="flex-1 h-16 bg-neutral-200 dark:bg-white/10 text-neutral-400 dark:text-neutral-500 font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 border border-dashed border-neutral-300 dark:border-white/10">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Evento Finalizado
                    </div>
                  ) : (
                    <div className="flex-1 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20">
                      <Calendar className="w-4 h-4 shrink-0" />
                      <span>Sin Registro Previo</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleShare} 
                    className="w-16 h-16 rounded-3xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-850 dark:hover:bg-neutral-800 border border-neutral-200/40 dark:border-white/5 text-neutral-600 dark:text-white shadow-sm flex items-center justify-center shrink-0 transition-all duration-300 hover:scale-110 active:scale-95 hover:rotate-12"
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
    </Container>
  );
};

export default EventPublicShowPage;
