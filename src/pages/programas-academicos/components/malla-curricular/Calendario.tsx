import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Info,
  X
} from "lucide-react";
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components';

interface CalendarioProps {
  isOpen: boolean;
  onClose: () => void;
  materia: any;
  idFicha: number;
  onAddSchedule: () => void;
}

const mapeoDias: { [key: string]: number } = {
  'DOMINGO': 0,
  'LUNES': 1,
  'MARTES': 2,
  'MIERCOLES': 3,
  'MIÉRCOLES': 3,
  'JUEVES': 4,
  'VIERNES': 5,
  'SABADO': 6,
  'SÁBADO': 6
};

const daysOfWeek = ["DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];
const months = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

// Helper para parsear fechas sin problemas de zona horaria
const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateString);
};

export const Calendario: React.FC<CalendarioProps> = ({
  isOpen,
  onClose,
  materia,
  idFicha,
  onAddSchedule
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Procesar horarios
  const { asignados, sinAsignar } = useMemo(() => {
    let a: any[] = [];
    let s: any[] = [];
    if (materia?.horarios && !Array.isArray(materia.horarios)) {
      a = materia.horarios.asignados || [];
      s = materia.horarios.sinAsignar || [];
    } else if (Array.isArray(materia?.horarios)) {
      a = materia.horarios.filter((h: any) => h.estado === 'ASIGNADO');
      s = materia.horarios.filter((h: any) => h.estado !== 'ASIGNADO');
    }
    return { asignados: a, sinAsignar: s };
  }, [materia]);

  // Función para obtener eventos de una fecha
  const getEventsForDate = (date: Date) => {
    const dayName = Object.keys(mapeoDias).find(key => mapeoDias[key] === date.getDay());
    if (!dayName) return [];

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const filterFn = (h: any) => {
      const fInicio = h.fechaInicial || h.fechaInicio;
      const fFin = h.fechaFinal || h.fechaFin;

      const start = parseDate(fInicio);
      const end = parseDate(fFin);
      if (!start || !end) return false;
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      const dayNum = date.getDay();
      const idDiaRaw = h.dia?.id !== undefined ? h.dia.id : h.idDia;
      const jsDayFromId = idDiaRaw !== undefined ? (idDiaRaw === 7 ? 0 : idDiaRaw) : -1;

      const matchDay = (h.dia?.dia?.toUpperCase() === dayName) ||
        (h.dia_semana?.toUpperCase() === dayName) ||
        (h.nombreDia?.toUpperCase() === dayName) ||
        (mapeoDias[h.dia_semana?.toUpperCase()] === dayNum) ||
        (jsDayFromId === dayNum);

      return matchDay && compareDate >= start && compareDate <= end;
    };

    return [
      ...asignados.filter(filterFn).map(h => ({ ...h, type: 'assigned' })),
      ...sinAsignar.filter(filterFn).map(h => ({ ...h, type: 'unassigned' }))
    ];
  };

  // Lógica de Mes
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [currentDate]);

  // Lógica de Semana
  const daysInWeek = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [currentDate]);

  if (!isOpen) return null;

  const navigate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(currentDate.getMonth() + amount);
    else if (viewMode === 'week') newDate.setDate(currentDate.getDate() + amount * 7);
    else newDate.setDate(currentDate.getDate() + amount);
    setCurrentDate(newDate);
  };

  return (
    <div className="fixed inset-0 !z-[40] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <ModalContent className="w-full max-w-5xl max-h-[95vh] flex flex-col p-0 overflow-visible">
        <ModalHeader className="px-6 pr-12 py-4 flex flex-col md:flex-row md:items-center justify-between relative !z-[10]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <CalendarIcon size={20} />
            </div>
            <div className="min-w-0 text-left">
              <ModalTitle className="text-md font-black uppercase tracking-tight dark:text-white truncate">
                Calendario de Horarios
              </ModalTitle>
              <p className="text-3xs text-gray-500 font-semibold uppercase max-w-xl">
                {materia.nombre || materia.nombreMateria}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 dark:bg-coal-400 p-1 rounded-lg">
            {(['month', 'week', 'day'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === mode
                  ? 'bg-white dark:bg-coal-600 shadow-sm text-primary'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
              >
                {mode === 'month' ? 'Mes' : mode === 'week' ? 'Sem' : 'Día'}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="absolute z-10 flex items-center justify-center w-8 h-8 text-gray-400 transition-all border rounded-full top-4 right-4 hover:bg-danger border-gray-200 hover:text-white hover:scale-110 shadow-sm"
          >
            <X size={16} />
          </button>
        </ModalHeader>

        <ModalBody className="flex-1 bg-gray-50 dark:bg-coal-600 custom-scrollbar !overflow-visible relative !z-[50]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold capitalize dark:text-white flex items-center">
              <ChevronLeft size={18} className="cursor-pointer text-gray-400 hover:text-primary transition-colors" onClick={() => navigate(-1)} />
              <span className="min-w-[140px] text-center">
                {viewMode === 'month' ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                  : viewMode === 'week' ? `${daysInWeek[0].getDate()} ${months[daysInWeek[0].getMonth()]} - ${daysInWeek[6].getDate()} ${months[daysInWeek[6].getMonth()]}`
                    : `${daysOfWeek[currentDate.getDay()]} ${currentDate.getDate()} ${months[currentDate.getMonth()]}`}
              </span>
              <ChevronRight size={18} className="cursor-pointer text-gray-400 hover:text-primary transition-colors" onClick={() => navigate(1)} />
            </h3>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-white dark:bg-coal-400 border border-gray-200 dark:border-gray-700 rounded-md text-[10px] font-bold uppercase transition-all dark:text-white hover:bg-gray-100">Hoy</button>
          </div>

          <div className="bg-white dark:bg-coal-400 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-visible">
            {viewMode === 'month' && (
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-coal-500/50 overflow-visible">
                {daysOfWeek.map(d => <div key={d} className="py-2 text-center text-[10px] font-black text-gray-400 uppercase">{d}</div>)}
              </div>
            )}

            <div className={viewMode === 'month' ? "grid grid-cols-7" : "divide-y divide-gray-100 dark:divide-gray-700"}>
              {(viewMode === 'month' ? daysInMonth : viewMode === 'week' ? daysInWeek : [currentDate]).map((date, i) => {
                if (!date) return <div key={i} className="h-20 border-r border-b border-gray-50 dark:border-coal-300" />;
                const events = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <div key={i} className={`min-h-[60px] m-1 border-r border-b border-gray-100 dark:border-gray-700 transition-all hover:bg-gray-50 dark:hover:bg-coal-500/50 relative group ${viewMode !== 'month' ? 'flex items-start gap-3 p-3 min-h-0' : ''}`}>
                    <span className={`text-xs font-semibold mb-1 inline-block h-5 w-5 rounded-full flex items-center justify-center transition-colors ${isToday ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400'}`}>{date.getDate()}</span>
                    <div className="space-y-0.5 w-full">
                      {events.map((ev, idx) => {
                        const hIni = ev.horaInicial || ev.horaInicio;
                        const hFin = ev.horaFinal || ev.horaFin;
                        const isFirstRow = i < 7;

                        return (
                          <div key={idx} className={`relative px-2 py-0.5 rounded-[4px] text-[9px] font-bold border transition-all hover:scale-[1.02] hover:shadow-sm group/event cursor-default ${ev.type === 'assigned' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'}`}>

                            {viewMode === 'month' ? (
                              <div className="truncate">{hIni?.substring(0, 5)} - {hFin?.substring(0, 5)}</div>
                            ) : (
                              <div className="flex items-center gap-2 py-0.5 overflow-visible">
                                {ev.type === 'assigned' && (
                                  <div className="w-6 h-6 rounded-full border border-white shrink-0 overflow-hidden bg-gray-200 bg-cover bg-center" style={{ backgroundImage: ev.instructor?.rutaFotoUrl ? `url(${ev.instructor.rutaFotoUrl})` : 'none' }}>
                                    {!ev.instructor?.rutaFotoUrl && <User size={12} className="m-auto mt-1.5 text-gray-400" />}
                                  </div>
                                )}
                                <div className="flex flex-col min-w-0">
                                  <span className="truncate leading-tight uppercase font-black tracking-tight">
                                    {hIni?.substring(0, 5)} - {hFin?.substring(0, 5)} • {ev.instructor?.nombre1 || 'Sin asignar'}
                                  </span>
                                  {ev.type === 'assigned' && ev.instructor?.email && (
                                    <span className="text-[8px] font-normal opacity-70 truncate lowercase tracking-normal">
                                      {ev.instructor.email}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Tooltip solo en vista Mes */}
                            {viewMode === 'month' && (
                              <div className={`absolute left-1/2 -translate-x-1/2 ${isFirstRow ? 'top-full' : 'bottom-full mb-2'} w-52 p-0 bg-white dark:bg-coal-300 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100 dark:border-gray-600 opacity-0 invisible group-hover/event:opacity-100 group-hover/event:visible transition-all duration-300 z-[400] pointer-events-none scale-90 group-hover/event:scale-100 ${isFirstRow ? 'origin-top' : 'origin-bottom'}`}>
                                {ev.type === 'assigned' && (
                                  <div className="h-28 w-full relative overflow-hidden rounded-t-2xl bg-gray-100 dark:bg-coal-500">
                                    {ev.instructor?.rutaFotoUrl ? (
                                      <img src={ev.instructor.rutaFotoUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>
                                    )}
                                  </div>
                                )}
                                <div className="p-2 text-left">
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 text-primary">
                                      <Clock size={12} className="shrink-0" />
                                      <span className="text-[10px] uppercase font-black tracking-wider">{hIni} - {hFin}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <p className="text-4xs text-gray-400 font-bold uppercase">Instructor</p>
                                      <div className="flex items-center gap-2 dark:text-white">
                                        <User size={12} className="text-gray-400 shrink-0" />
                                        <span className="text-[11px] font-bold leading-tight">
                                          {ev.type === 'assigned' ? `${ev.instructor?.nombre1 || ''} ${ev.instructor?.apellido1 || ''}` : <span className="text-orange-500 uppercase tracking-tighter">Sin asignar aún</span>}
                                        </span>
                                      </div>
                                    </div>
                                    {ev.type === 'assigned' && ev.instructor?.email && (
                                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 overflow-hidden">
                                        <Info size={10} className="shrink-0" /><span className="text-[9px] truncate italic">{ev.instructor.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className={`absolute ${isFirstRow ? 'bottom-full rotate-180 mb-0' : 'top-full'} left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-white dark:border-t-coal-300`}></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </ModalBody>
        
        <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-coal-500 rounded-b-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Asignado</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Pendiente</span></div>
          </div>
        {materia.idMateriaPadre != null && 
          <button onClick={onAddSchedule} className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary-active active:scale-95 transition-all shadow-md">
            <Plus size={14} />Programar Horario
          </button>
        }
        </div>
      </ModalContent>
    </div>
  );
};
