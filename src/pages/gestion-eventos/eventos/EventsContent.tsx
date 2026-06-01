import React, { useEffect, useMemo, useState } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ExternalLink, Trash2, Edit3, Image as ImageIcon, Clock } from 'lucide-react';

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


interface EventsContentProps {
  reload: boolean;
}

const EventsContent = ({ reload }: EventsContentProps) => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const { confirmAction } = useConfirm();

  const fetchData = async (page = 1, search = searchTerm, archived = isArchived) => {
    setLoading(true);
    try {
      const response = await axios.get(`eventos-multimedia?page=${page}&per_page=6&search=${search}&archived=${archived}`);
      const responseData = response.data;
      if (responseData) {
        if (Array.isArray(responseData)) {
          setEventos(responseData);
          setPagination({
            total: responseData.length,
            current_page: 1,
            last_page: 1,
            per_page: responseData.length
          });
        } else if (responseData.data && Array.isArray(responseData.data)) {
          setEventos(responseData.data);
          setPagination(responseData);
        } else {
          setEventos([]);
          setPagination(null);
        }
      } else {
        setEventos([]);
        setPagination(null);
      }
      setCurrentPage(page);
    } catch (err) {
      console.error('Error al obtener eventos:', err);
      setError('Error al cargar eventos');
      setEventos([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, searchTerm, isArchived);
  }, [reload, isArchived]);

  const toggleArchive = () => {
    setIsArchived(!isArchived);
    setCurrentPage(1);
  };

  const deleteEvento = async (id: number) => {
    confirmAction('¿Eliminar este evento permanentemente?', async () => {
      try {
        await axios.delete(`eventos-multimedia/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
        setError('Error al eliminar');
      }
    });
  };

  const filteredData = useMemo(() => {
    return eventos; // El backend ya filtra por searchTerm
  }, [eventos]);

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${backendUrl}${normalizedUrl}`;
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

  const getCategoryBadgeClass = (tipo: string) => {
    const normalized = tipo ? tipo.toUpperCase() : '';
    if (normalized === 'PRESENCIAL') {
      return 'from-emerald-500 to-teal-600 shadow-emerald-500/20';
    } else if (normalized === 'VIRTUAL') {
      return 'from-blue-500 to-indigo-600 shadow-blue-500/20';
    }
    return 'from-orange-500 to-rose-600 shadow-orange-500/20';
  };

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);

  const fetchAttendees = async (eventId: number) => {
    setLoadingAttendees(true);
    try {
      const response = await axios.get(`eventos-multimedia/${eventId}/attendees`);
      setAttendees(response.data);
    } catch (error) {
      console.error('Error fetching attendees:', error);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleViewAttendees = (eventId: number) => {
    setSelectedEventId(eventId);
    setShowAttendeesModal(true);
    fetchAttendees(eventId);
  };

  if (loading && eventos.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mr-3" />
        <span className="text-neutral-500 font-medium">Cargando eventos...</span>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-extrabold flex items-center gap-2 text-neutral-900 dark:text-slate-50">
            <Calendar className={`w-7 h-7 ${isArchived ? 'text-neutral-400' : 'text-orange-500'}`} />
            {isArchived ? 'Eventos Finalizados' : 'Eventos Próximos'}
            <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-400">
              ({pagination?.total || 0} eventos)
            </span>
          </h2>
          {isArchived && (
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 italic">
              Historial de eventos marcados como finalizados
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
          <button
            onClick={toggleArchive}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg ${
              isArchived 
                ? 'bg-orange-500 text-white shadow-orange-500/20' 
                : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-100 dark:border-white/5'
            }`}
          >
            <KeenIcon icon="archive" className="text-sm" />
            {isArchived ? 'Ver Activos' : 'Ver Archivo'}
          </button>

          <div className="relative flex items-center flex-1 sm:flex-initial min-w-[240px]">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar eventos..."
              className="pl-8 input input-sm w-full focus:ring-orange-500/20"
              value={searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setSearchTerm(val);
                fetchData(1, val, isArchived);
              }}
            />
          </div>
        </div>
      </div>

      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredData.map((evento) => (
            <div
              key={evento.idEvento}
              className="group relative bg-white dark:bg-zinc-900/90 rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-white/5 shadow-md hover:shadow-[0_25px_60px_rgba(249,115,22,0.15)] dark:hover:shadow-[0_25px_60px_rgba(249,115,22,0.08)] transition-all duration-500 hover:-translate-y-2.5 flex flex-col h-full"
            >
              {/* Media Preview Section */}
              <div className="relative h-60 overflow-hidden shrink-0">
                {evento.url ? (
                  <img
                    src={getImageUrl(evento.url)}
                    alt={evento.nombre}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 via-rose-500 to-indigo-600 flex items-center justify-center">
                    <Calendar className="w-16 h-16 text-white/25 animate-pulse" />
                  </div>
                )}
                
                {/* Floating Glass Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                  <div className={`px-4 py-2 bg-gradient-to-r ${getCategoryBadgeClass(evento.tipoEvento)} rounded-2xl flex items-center gap-2 shadow-lg border border-white/20 text-white`}>
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{evento.tipoEvento}</span>
                  </div>
                  {evento.area && (
                    <div className="px-4 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center gap-2 shadow-lg">
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span className="text-[8px] font-black text-white uppercase tracking-widest truncate max-w-[120px]">{evento.area.nombre}</span>
                    </div>
                  )}
                </div>

                {/* Gradient Overlay for Date */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-8 z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-500/30">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Fecha Evento</span>
                      <span className="text-sm font-black text-white uppercase italic tracking-wide">{formatDateSpanish(evento.fechaInicial)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-neutral-50 leading-[1.1] tracking-tighter group-hover:text-orange-500 transition-colors uppercase italic truncate w-full">
                    {evento.nombre}
                  </h3>
                </div>
                
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-2 px-3.5 py-2 bg-neutral-50 dark:bg-white/[0.02] rounded-xl border border-neutral-100 dark:border-white/5 shadow-inner">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-[10px] font-black text-neutral-600 dark:text-neutral-400 uppercase tracking-tighter tabular-nums">
                      {formatTime(evento.hora)}{evento.hora_final ? ` - ${formatTime(evento.hora_final)}` : ''}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-6 leading-relaxed font-medium italic border-l-2 border-orange-500/30 dark:border-orange-500/20 pl-4">
                  {evento.descripcion || 'Este evento institucional aún no cuenta con una descripción detallada.'}
                </p>

                {/* Action Buttons - Premium Experience */}
                <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-white/5">
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <button
                      onClick={() => navigate(`/gestion-eventos/show/${evento.idEvento}`)}
                      className="group/btn relative h-14 bg-neutral-950 dark:bg-white text-white dark:text-black font-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-neutral-900/10"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <KeenIcon icon="eye" className="text-xl group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] uppercase tracking-[0.2em] group-hover:text-white transition-colors">Ver</span>
                      </div>
                    </button>

                    <button
                      onClick={() => handleViewAttendees(evento.idEvento)}
                      className="group/btn relative h-14 bg-emerald-500 text-white font-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                      <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                      <div className="relative z-10 flex items-center justify-center gap-3">
                        <KeenIcon icon="users" className="text-xl group-hover/btn:scale-110 transition-transform" />
                        <span className="text-[10px] uppercase tracking-[0.2em]">Inscritos</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-around px-2 py-1 bg-neutral-50 dark:bg-white/[0.02] rounded-2xl border border-neutral-100 dark:border-white/5 shadow-inner">
                    <button
                      onClick={() => navigate(`/gestion-eventos/editar/${evento.idEvento}`)}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-neutral-500 hover:text-orange-500 transition-all group/sub"
                    >
                      <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 shadow-sm group-hover/sub:bg-orange-500 group-hover/sub:text-white transition-all shadow-[0_2px_5px_rgba(0,0,0,0.05)]">
                        <Edit3 className="w-3.5 h-3.5" />
                      </div>
                      Gestionar
                    </button>

                    <div className="w-px h-6 bg-neutral-200 dark:bg-white/10" />

                    <button
                      onClick={() => deleteEvento(evento.idEvento)}
                      className="flex-1 py-3 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.15em] text-neutral-500 hover:text-rose-500 transition-all group/sub"
                    >
                      <div className="p-1.5 rounded-lg bg-white dark:bg-neutral-800 shadow-sm group-hover/sub:bg-rose-500 group-hover/sub:text-white transition-all shadow-[0_2px_5px_rgba(0,0,0,0.05)]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </div>
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-neutral-50 dark:bg-neutral-800/50 rounded-[40px] border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm mb-6">
            <Calendar className="w-12 h-12 text-orange-500 opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">No hay eventos registrados</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
            Comienza publicando un nuevo evento institucional para mantener a la comunidad informada.
          </p>
          <button 
            onClick={() => navigate('/gestion-eventos/nuevo')}
            className="btn btn-primary mt-8 rounded-2xl px-8"
          >
            Crear Primer Evento
          </button>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total > 0 && (
        <div className="flex flex-col items-center gap-4 mt-12">
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => fetchData(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-sm btn-light rounded-xl disabled:opacity-50"
            >
              Anterior
            </button>
            
            <div className="flex gap-2">
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => fetchData(page)}
                  className={`px-4 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    currentPage === page 
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                      : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-orange-50 border border-neutral-200 dark:border-neutral-800'
                  }`}
                >
                  Página {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchData(currentPage + 1)}
              disabled={currentPage === pagination.last_page}
              className="btn btn-sm btn-light rounded-xl disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <p className="text-xs text-neutral-500 font-medium">
            Mostrando {eventos.length} de {pagination.total} eventos totales
          </p>
        </div>
      )}
      {/* Modal de Inscritos - Rediseño Premium */}
      {showAttendeesModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md" onClick={() => setShowAttendeesModal(false)} />
          <div className="relative w-full max-w-lg bg-white/90 dark:bg-neutral-900/90 backdrop-blur-2xl rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/20 animate-zoom-in">
            
            {/* Header con gradiente sutil */}
            <div className="p-8 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between bg-gradient-to-br from-emerald-500/5 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.3)] transform -rotate-3">
                   <KeenIcon icon="users" className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-neutral-900 dark:text-white italic">Comunidad Inscrita</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">Lista de Asistencia</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowAttendeesModal(false)}
                className="p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full transition-all hover:rotate-90 text-neutral-400"
              >
                <KeenIcon icon="cross" className="text-xl" />
              </button>
            </div>

            <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar">
              {loadingAttendees ? (
                <div className="py-20 flex flex-col items-center justify-center gap-6">
                   <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse" />
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent relative z-10" />
                   </div>
                   <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] animate-pulse">Sincronizando datos...</p>
                </div>
              ) : attendees.length > 0 ? (
                <div className="space-y-4">
                  {attendees.map((at, idx) => (
                    <div key={idx} className="p-5 rounded-[2rem] bg-white dark:bg-white/[0.02] border border-neutral-100 dark:border-white/5 flex items-center gap-5 group hover:border-emerald-500/30 hover:shadow-xl transition-all duration-300 translate-y-0 hover:-translate-y-1">
                       <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center font-black text-lg shadow-lg group-hover:rotate-12 transition-transform">
                          {at.persona?.nombre1?.charAt(0) || '?'}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-neutral-800 dark:text-white uppercase truncate tracking-tight">
                            {at.persona?.nombre1} {at.persona?.nombre2} {at.persona?.apellido1} {at.persona?.apellido2}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                             <div className="w-1 h-1 bg-neutral-300 rounded-full" />
                             <p className="text-[9px] font-bold text-neutral-400 truncate tracking-wide">{at.persona?.email}</p>
                          </div>
                       </div>
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-[7px] font-black uppercase px-2.5 py-1 bg-emerald-500 text-white rounded-lg shadow-sm">Confirmado</span>
                          <p className="text-[8px] font-bold text-neutral-300 uppercase tracking-tighter">
                            {at.fechaRegistro ? new Date(at.fechaRegistro).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                          </p>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center space-y-6">
                   <div className="w-24 h-24 rounded-[2.5rem] bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-6 opacity-30 group">
                      <KeenIcon icon="users" className="text-5xl text-neutral-400 group-hover:scale-110 transition-transform" />
                   </div>
                   <div>
                     <h4 className="text-lg font-black uppercase text-neutral-400 tracking-tighter italic">Sin inscritos aún</h4>
                     <p className="text-[10px] text-neutral-500 max-w-[240px] mx-auto font-bold uppercase tracking-widest leading-relaxed mt-2">Invita a la comunidad a participar compartiendo el enlace oficial.</p>
                   </div>
                </div>
              )}
            </div>

            {/* Footer con estadísticas rápidas */}
            <div className="p-8 bg-neutral-50 dark:bg-black/20 border-t border-neutral-100 dark:border-white/5 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-black italic text-neutral-900 dark:text-white">{attendees.length} Usuarios</span>
               </div>
               <button 
                onClick={() => setShowAttendeesModal(false)}
                className="px-10 py-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-neutral-100 transition-all shadow-sm active:scale-95"
               >
                 Cerrar
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsContent;
