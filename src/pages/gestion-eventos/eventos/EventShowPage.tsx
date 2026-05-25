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
  CalendarCheck
} from 'lucide-react';
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
  esPublico: boolean;
  area?: {
    nombre: string;
  };
  formUrl?: string;
  formProvider?: string;
  idFormularioInterno?: number | string;
}

export const EventShowPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [actividades, setActividades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, [id]);

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${backendUrl}${normalizedUrl}`;
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
            onClick={() => navigate('/gestion-eventos')}
            className="btn btn-primary mt-4"
          >
            Volver a eventos
          </button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-8 animate-fade-in">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/gestion-eventos')}
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
                <div className="w-full h-full flex items-center justify-center">
                  <CalendarCheck className="w-24 h-24 text-neutral-300" />
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
              <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white mb-6 leading-tight">
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
                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                  {evento.descripcion || 'No se ha proporcionado una descripción detallada para este evento.'}
                </p>
              </div>

              {/* Timeline de Actividades del Evento */}
              {actividades.length > 0 && (
                <div className="mt-12 space-y-6 border-t border-neutral-100 dark:border-neutral-800 pt-8 animate-fade-in-up">
                  <h3 className="text-xl font-bold flex items-center gap-3 text-neutral-900 dark:text-white mb-6">
                    <CalendarCheck className="w-6 h-6 text-green-500" />
                    Cronograma de Actividades
                  </h3>
                  
                  <div className="relative pl-6 border-l-2 border-orange-500/30 space-y-8">
                    {actividades.map((act, index) => {
                      const dur = act.hora_inicio && act.hora_fin
                        ? Math.max(0, Math.round((new Date(act.hora_fin).getTime() - new Date(act.hora_inicio).getTime()) / 60000))
                        : 0;

                      const startStr = act.hora_inicio
                        ? new Date(act.hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                        : '';
                      const endStr = act.hora_fin
                        ? new Date(act.hora_fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div key={act.id} className="relative group">
                          {/* Indicador de Punto del Timeline */}
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white dark:bg-neutral-900 border-4 border-orange-500 group-hover:scale-125 transition-transform duration-300" />

                          <div className="bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-xs font-bold text-orange-500 tracking-wider uppercase">
                                Actividad #{index + 1}
                              </span>
                              {(startStr || endStr) && (
                                <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {startStr} {endStr ? `- ${endStr}` : ''}
                                  {dur > 0 && ` (${dur} min)`}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base font-bold text-neutral-800 dark:text-white mt-2 leading-snug">
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
                </div>
              )}
              
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
                    <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Fecha</p>
                    <p className="text-base font-bold text-neutral-800 dark:text-neutral-200">
                      {new Date(evento.fechaInicial).toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
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
                      {evento.hora} {evento.hora_final ? `- ${evento.hora_final}` : ''}
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

              {evento.linkRegistro && (
                <div className="mt-10 pt-8 border-t border-neutral-100 dark:border-neutral-800">
                  <a 
                    href={evento.linkRegistro} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-orange-500/20 group"
                  >
                    <span>Inscribirse al Evento</span>
                    <ExternalLink className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </a>
                  <p className="text-center text-[10px] text-neutral-400 mt-4 uppercase font-bold tracking-tighter">
                    Requiere registro previo
                  </p>
                </div>
              )}

              <div className="mt-6">
                <button
                  onClick={() => navigate(`/gestion-eventos/editar/${evento.idEvento}`)}
                  className="btn btn-light w-full py-4 rounded-2xl flex items-center justify-center gap-3"
                >
                  <KeenIcon icon="pencil" className="text-lg" />
                  <span>Editar Evento</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default EventShowPage;
