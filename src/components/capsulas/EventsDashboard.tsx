import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, MapPin, ExternalLink, Clock, ChevronLeft, ChevronRight, Info, Video, Users } from 'lucide-react';
import { KeenIcon } from '@/components/keenicons';
import { ModalDetalleEvento } from './ModalDetalleEvento';

interface Evento {
  idEvento: number;
  nombre: string;
  descripcion?: string;
  fechaInicial: string;
  fechaFinal?: string;
  hora: string;
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

const EventsDashboard = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEventoDetalle, setSelectedEventoDetalle] = useState<Evento | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setShowAll(false);
  }, [selectedDate]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('eventos-multimedia');
        setEventos(res.data || []);
      } catch (err) {
        console.error('Error fetching dashboard events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Calendar Helpers
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust to Monday start
  };

  const getEventsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return eventos.filter(e => e.fechaInicial === dateStr);
  };

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${backendUrl}${normalizedUrl}`;
  };

  const selectedEvents = useMemo(() => getEventsForDate(selectedDate), [selectedDate, eventos]);
  
  // Design Tokens
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-white dark:bg-coal-400 rounded-3xl animate-pulse flex items-center justify-center border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Cargando Agenda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      
      {/* LEFT: CALENDAR GRID (7 columns) */}
      <div className="lg:col-span-7 bg-white dark:bg-coal-400 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white capitalize">
              {monthNames[currentMonth.getMonth()]} <span className="text-emerald-500">{currentMonth.getFullYear()}</span>
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calendario Institucional</p>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-coal-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-all border border-gray-100 dark:border-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-coal-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center justify-center text-gray-600 dark:text-gray-300 transition-all border border-gray-100 dark:border-gray-700">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-black text-gray-400 uppercase tracking-tighter">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 flex-1">
          {Array.from({ length: firstDayOfMonth(currentMonth) }).map((_, i) => (
            <div key={`blank-${i}`} className="aspect-square opacity-20" />
          ))}
          {Array.from({ length: daysInMonth(currentMonth) }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const isToday = new Date().toDateString() === date.toDateString();
            const dateEvents = getEventsForDate(date);
            const hasEvents = dateEvents.length > 0;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(date)}
                className={`
                  relative aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group
                  ${isSelected ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10 scale-105 z-10' : 'hover:bg-gray-50 dark:hover:bg-coal-500 border border-transparent'}
                  ${!isSelected && hasEvents ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' : ''}
                `}
              >
                <span className={`text-sm font-black ${isSelected ? 'text-white' : isToday ? 'text-emerald-500' : 'text-gray-700 dark:text-gray-300'}`}>
                  {day}
                </span>
                
                {hasEvents && !isSelected && (
                   <div className="absolute bottom-2 flex gap-0.5">
                      {dateEvents.slice(0, 3).map((e, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1.5 h-1.5 rounded-full ${e.tipoEvento === 'VIRTUAL' ? 'bg-blue-400' : 'bg-emerald-400'} animate-pulse`} 
                          style={{ animationDelay: `${idx * 200}ms` }}
                        />
                      ))}
                   </div>
                )}

                {/* Micro-tooltip on hover */}
                {hasEvents && !isSelected && (
                  <div className="absolute -top-1 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-coal-400 rounded-full shadow-sm" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: EVENT DETAILS (5 columns) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div className="bg-white dark:bg-coal-400 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-gray-800 p-6 flex-1 flex flex-col min-h-[320px]">
          <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                 <CalendarIcon className="w-5 h-5" />
               </div>
               <div>
                 <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase leading-none">
                   {selectedDate.getDate()} {monthNames[selectedDate.getMonth()]}
                 </h4>
                 <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Detalle del día</p>
               </div>
             </div>
             <span className="px-3 py-1 bg-gray-100 dark:bg-coal-500 rounded-full text-[10px] font-black text-gray-500 dark:text-gray-400">
                {selectedEvents.length} {selectedEvents.length === 1 ? 'Evento' : 'Eventos'}
             </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
            {selectedEvents.length > 0 ? (
              <>
                {selectedEvents.slice(0, showAll ? undefined : 3).map((evento) => (
                  <div 
                    key={evento.idEvento} 
                    onClick={() => {
                      setSelectedEventoDetalle(evento);
                      setModalOpen(true);
                    }}
                    className="group relative bg-gray-50/50 dark:bg-coal-500/30 rounded-[1.5rem] p-3 border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30 transition-all hover:bg-white dark:hover:bg-coal-500 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 animate-fade-in cursor-pointer"
                  >
                    <div className="flex gap-3">
                      {evento.url ? (
                        <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-sm">
                          <img src={getImageUrl(evento.url)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                        </div>
                      ) : (
                        <div className="shrink-0 w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
                          <KeenIcon icon="image" className="text-xl" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${evento.tipoEvento === 'VIRTUAL' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {evento.tipoEvento}
                          </span>
                          <span className="flex items-center gap-1 text-[8px] font-bold text-gray-400">
                            <Clock className="w-2.5 h-2.5" /> {evento.hora}
                          </span>
                        </div>
                        <h5 className="text-xs font-black text-gray-900 dark:text-white mb-0.5 group-hover:text-emerald-500 transition-colors line-clamp-1 uppercase leading-tight">
                          {evento.nombre}
                        </h5>
                        {evento.area && (
                          <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                            <MapPin className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="truncate">{evento.area.nombre}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                       <p className="text-[9px] text-gray-400 font-medium italic line-clamp-1 flex-1 pr-4">
                          {evento.descripcion || 'Sin descripción'}
                       </p>
                       {evento.linkRegistro && (
                          <a 
                            href={evento.linkRegistro} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                       )}
                    </div>
                  </div>
                ))}
                
                {selectedEvents.length > 3 && (
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="w-full py-2.5 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-800 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    {showAll ? (
                      <>Mostrar menos</>
                    ) : (
                      <>Ver {selectedEvents.length - 3} eventos más</>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                <div className="w-24 h-24 rounded-[2rem] bg-gray-50 dark:bg-coal-500 flex items-center justify-center mb-4 rotate-3 group-hover:rotate-0 transition-transform">
                  <KeenIcon icon="calendar-add" className="text-5xl text-gray-300" />
                </div>
                <h5 className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase">Día Libre</h5>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">No hay eventos programados</p>
              </div>
            )}
          </div>
        </div>

        {/* PROMO CARD / TIPS */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[2.5rem] p-6 text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
             <CalendarIcon className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <h4 className="text-lg font-black leading-tight mb-2 uppercase italic tracking-tighter">Agenda <br/> Institucional</h4>
            <p className="text-xs text-emerald-50/80 font-medium mb-4 leading-relaxed max-w-[180px]">Participa en las actividades y vive la experiencia SENA al máximo.</p>
            <div className="flex gap-4">
              <div className="flex flex-col">
                <span className="text-lg font-black">{eventos.length}</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Próximos</span>
              </div>
              <div className="w-px h-8 bg-white/20"></div>
              <div className="flex flex-col">
                <span className="text-lg font-black">{eventos.filter(e => e.tipoEvento === 'VIRTUAL').length}</span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Virtuales</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ModalDetalleEvento 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        evento={selectedEventoDetalle} 
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(16, 185, 129, 0.4); }
      `}</style>
    </div>
  );
};

export default EventsDashboard;
