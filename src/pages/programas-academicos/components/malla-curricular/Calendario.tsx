import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  X,
  Trash2,
  Plus
} from "lucide-react";
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components';
import { enqueueSnackbar } from 'notistack';
import Swal from 'sweetalert2';
import AsignacionSesionModal from './AsignacionSesionModal';
import { ProfesorSelect } from './ProfesorSelect';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { getColombianHolidayDateSet, isColombianHoliday, toLocalDateKey, getColombianHolidayMap } from '@/utils/colombianHolidays';
import type { EventContentArg, EventClickArg } from '@fullcalendar/core';

interface CalendarioProps {
  isOpen: boolean;
  onClose: () => void;
  materia?: any;
  idFicha: number;
  onAddSchedule: () => void;
  cargarRaps?: () => void;
  modoRmi?: boolean;
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

const parseDate = (dateString: string): Date | null => {
  if (!dateString) return null;
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(dateString);
};

const format12h = (timeStr?: any) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return '';
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

// ─── Tooltip flotante ────────────────────────────────────────────────────────

interface TooltipData {
  ev: any;
  x: number;
  y: number;
}

const EventTooltip: React.FC<{ data: TooltipData; carouselIndex: number }> = ({ data, carouselIndex }) => {
  const { ev, x, y } = data;
  const hIni = ev.horaInicial || ev.horaInicio;
  const hFin = ev.horaFinal || ev.horaFin;
  const instructor = ev.instructor || ev.contrato?.persona;

  const TOOLTIP_W = 260;
  const TOOLTIP_H = 340; // estimado
  const OFFSET = 16;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

  // Preferir derecha, si no cabe ir a la izquierda
  const goLeft = x + OFFSET + TOOLTIP_W > vw - 8;
  const left = goLeft ? x - OFFSET - TOOLTIP_W : x + OFFSET;

  // Preferir abajo del cursor, si no cabe ir arriba
  const goUp = y + OFFSET + TOOLTIP_H > vh - 8;
  const top = goUp ? y - OFFSET - TOOLTIP_H : y + OFFSET;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.max(8, top),
    left: Math.max(8, left),
    zIndex: 9999,
    pointerEvents: 'none',
    width: TOOLTIP_W,
  };

  const materiaNombre = ev.gradoMateria?.materia?.nombreMateria || ev._materiaFallback || '';

  return (
    <div
      style={style}
      className="bg-white dark:bg-coal-300 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-600 overflow-hidden"
      // Pequeña animación de entrada con keyframes inline
    >
      {/* Carrusel foto */}
      <div className="h-28 w-full relative overflow-hidden bg-gray-100 dark:bg-coal-500 border-b dark:border-gray-600">
        <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: (!ev.isSharedSlot || carouselIndex === 0) ? 1 : 0 }}>
          {(instructor?.rutaFotoUrl || instructor?.rutaFoto) ? (
            <img src={instructor.rutaFotoUrl || instructor.rutaFoto} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>
          )}
          <div className="absolute top-0 left-0 bg-gray-800/60 text-white text-[7px] px-2 py-0.5 font-black rounded-br-lg">TITULAR</div>
        </div>
        {ev.isSharedSlot && ev.allAssignments?.length > 0 && (
          <div className="absolute inset-0 transition-opacity duration-700" style={{ opacity: carouselIndex === 1 ? 1 : 0 }}>
            {(ev.allAssignments?.[0]?.contrato?.persona?.rutaFotoUrl || ev.allAssignments?.[0]?.contrato?.persona?.rutaFoto) ? (
              <img src={ev.allAssignments?.[0]?.contrato?.persona?.rutaFotoUrl || ev.allAssignments?.[0]?.contrato?.persona?.rutaFoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>
            )}
            <div className="absolute top-0 right-0 bg-primary/80 text-white text-[7px] px-2 py-0.5 font-black uppercase rounded-bl-lg">{ev.allAssignments?.[0]?.tipoAsignacion || ''}</div>
          </div>
        )}
        {ev.isSharedSlot && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === 0 ? 'bg-white scale-125' : 'bg-white/40'}`} />
            <div className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === 1 ? 'bg-white scale-125' : 'bg-white/40'}`} />
          </div>
        )}
      </div>

      {/* Cuerpo del tooltip */}
      <div className="p-4 text-left">
        {/* Estado + Hora */}
        <div className="flex justify-between items-center mb-3 gap-2">
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${ev.estado === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-700' : ev.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
            {ev.estado || 'SIN ESTADO'}
          </span>
          <div className="flex items-center gap-1.5 text-primary shrink-0">
            <Clock size={12} className="shrink-0" />
            <span className="text-[11px] font-black tracking-wide whitespace-nowrap">{format12h(hIni)} – {format12h(hFin)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {/* Materia */}
          <div className="flex flex-col gap-1">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Materia / RAP</p>
            <p className="text-[11px] font-black leading-snug dark:text-white uppercase line-clamp-3">{materiaNombre}</p>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-100 dark:border-gray-700" />

          {/* Instructores */}
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Instructor</p>
            <div className="flex items-center gap-2 dark:text-white">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-coal-500 flex items-center justify-center shrink-0">
                <User size={13} className="text-gray-400" />
              </div>
              <span className="text-[11px] font-semibold leading-tight">
                {instructor
                  ? `${instructor.nombre1 || ''} ${instructor.apellido1 || ''}`
                  : <span className="text-orange-500 font-black uppercase text-[10px]">Sin asignar</span>}
              </span>
            </div>
          </div>

          {/* Instructores compartidos */}
          {ev.isSharedSlot && ev.allAssignments?.map((asig: any, aIdx: number) => (
            <div key={aIdx} className="flex flex-col gap-1 border-t border-gray-100 dark:border-gray-700 pt-2">
              <div className="flex items-center gap-2 dark:text-white">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User size={13} className="text-primary" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold leading-tight truncate">
                    {asig.contrato?.persona?.nombre1 || ''} {asig.contrato?.persona?.apellido1 || ''}
                  </span>
                  <span className="text-[9px] text-primary font-black uppercase">{asig.tipoAsignacion}</span>
                </div>
              </div>
              {asig.observacion && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 italic pl-8">
                  "{asig.observacion}"
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Componente principal ────────────────────────────────────────────────────

export const Calendario: React.FC<CalendarioProps> = ({
  isOpen,
  onClose,
  materia,
  idFicha,
  onAddSchedule,
  cargarRaps,
  modoRmi = false
}) => {
  const [horariosFicha, setHorariosFicha] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [asignacionSesionModal, setAsignacionSesionModal] = useState<boolean>(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horarioAsignacionSesion, setHorarioAsignacionSesion] = useState<any>(null);
  const [idMateriaAsignacion, setIdMateriaAsignacion] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [showProfesorModal, setShowProfesorModal] = useState(false);
  const [horarioParaAsignar, setHorarioParaAsignar] = useState<any>(null);

  // Carrusel
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Carga de horarios
  useEffect(() => {
    let isMounted = true;
    const cargarHorarios = async () => {
      if (!isOpen) return;
      setLoading(true);
      try {
        if (materia?.id && idFicha) {
          const response = await axios.get(`horarios/materia`, {params: {idFicha, idMateria:materia.id}});
          if (isMounted) setHorariosFicha(response.data || []);
        } else {
          const response = await axios.get(`horario/ficha/${idFicha}`);
          if (isMounted) setHorariosFicha(response.data.data || []);
        }
      } catch {
        if (isMounted) setHorariosFicha([]);
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };
    if (isOpen) cargarHorarios();
    return () => { isMounted = false; };
  }, [isOpen, idFicha, refreshTrigger, materia]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setHorariosFicha([]);
      setLoading(true);
      setInitialLoadComplete(false);
      setTooltip(null);
    }
  }, [isOpen]);

  // Procesar horarios
  const { asignados, sinAsignar } = useMemo(() => {
    if (!horariosFicha.length) return { asignados: [], sinAsignar: [] };
    return {
      asignados: horariosFicha.filter((h: any) => h.estado === 'ASIGNADO'),
      sinAsignar: horariosFicha.filter((h: any) => h.estado === 'PENDIENTE'),
    };
  }, [horariosFicha]);

  const holidayDates = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let minYear = currentYear;
    let maxYear = currentYear + 1;

    [...asignados, ...sinAsignar].forEach((h: any) => {
      const start = parseDate(h.fechaInicial || h.fechaInicio);
      const end = parseDate(h.fechaFinal || h.fechaFin);
      if (start) minYear = Math.min(minYear, start.getFullYear());
      if (end) maxYear = Math.max(maxYear, end.getFullYear());
    });

    return getColombianHolidayDateSet(minYear, maxYear);
  }, [asignados, sinAsignar]);

  const festivos = useMemo(
    () =>
      Array.from(holidayDates).map((dateOnly) => ({
        id: `holiday-${dateOnly}`,
        start: dateOnly,
        allDay: true,
        display: 'background',
        backgroundColor: 'rgba(233, 19, 19, 0.5)',
        extendedProps: { isHoliday: true },
      })),
    [holidayDates]
  );

  const holidayMap = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let minYear = currentYear;
    let maxYear = currentYear + 1;

    [...asignados, ...sinAsignar].forEach((h: any) => {
      const start = parseDate(h.fechaInicial || h.fechaInicio);
      const end = parseDate(h.fechaFinal || h.fechaFin);
      if (start) minYear = Math.min(minYear, start.getFullYear());
      if (end) maxYear = Math.max(maxYear, end.getFullYear());
    });

    return getColombianHolidayMap(minYear, maxYear);
  }, [asignados, sinAsignar]);

  // ── Convertir horarios recurrentes en eventos de FullCalendar ──────────────
  const fcEvents = useMemo(() => {
    const events: any[] = [];
    const materiaFallback = materia?.nombre || materia?.nombreMateria || '';

    const processHorario = (h: any, type: 'asignados' | 'sinAsignar') => {
      const fInicio = h.fechaInicial || h.fechaInicio;
      const fFin = h.fechaFinal || h.fechaFin;
      const start = parseDate(fInicio);
      const end = parseDate(fFin);
      if (!start || !end) return;

      const hIni = h.horaInicial || h.horaInicio || '00:00';
      const hFin = h.horaFinal || h.horaFin || '01:00';

      const idDiaRaw = h.dia?.id !== undefined ? h.dia.id : h.idDia;
      const jsDayFromId = idDiaRaw !== undefined ? (Number(idDiaRaw) === 7 ? 0 : Number(idDiaRaw)) : -1;
      const diaNombreRaw = h.dia?.dia?.toUpperCase() || h.dia_semana?.toUpperCase() || h.nombreDia?.toUpperCase();
      const jsDay = diaNombreRaw ? mapeoDias[diaNombreRaw] : jsDayFromId;
      if (jsDay === undefined || jsDay < 0) return;

      // Recorrer cada día del rango que coincida con el día de semana del horario
      const cursor = new Date(start);
      cursor.setHours(0, 0, 0, 0);
      const endNorm = new Date(end);
      endNorm.setHours(0, 0, 0, 0);

      while (cursor <= endNorm) {
        if (cursor.getDay() === jsDay) {
          const omitirPorFestivo = isColombianHoliday(cursor, holidayDates);

          if (!omitirPorFestivo) {
            const dateStr = toLocalDateKey(cursor);

            const assignments = h.asignacion_sesion || h.asignacionSesion || [];
            const activeAsignacion = assignments.find((asig: any) => {
              const s = parseDate(asig.fechaInicio);
              const e = parseDate(asig.fechaFin);
              if (!s || !e) return false;
              s.setHours(0, 0, 0, 0);
              e.setHours(0, 0, 0, 0);
              const c = new Date(cursor);
              c.setHours(0, 0, 0, 0);
              return c >= s && c <= e;
            });

            events.push({
              id: `${h.id}-${dateStr}`,
              start: `${dateStr}T${hIni}`,
              end: `${dateStr}T${hFin}`,
              extendedProps: {
                ...h,
                type,
                activeAsignacion,
                allInstructors: [h.instructor || h.contrato?.persona],
                allAssignments: activeAsignacion ? [activeAsignacion] : [],
                isSharedSlot: !!activeAsignacion,
                _materiaFallback: materiaFallback,
                _dateStr: dateStr,
              },
            });
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    };

    asignados.forEach(h => processHorario(h, 'asignados'));
    sinAsignar.forEach(h => processHorario(h, 'sinAsignar'));

    // Agrupar por slot (misma fecha + misma hora + mismo idGradoMateria)
    const grouped: any[] = [];
    events.forEach(ev => {
      const key = `${ev.start}-${ev.end}-${ev.extendedProps.idGradoMateria}`;
      const existing = grouped.find(g => `${g.start}-${g.end}-${g.extendedProps.idGradoMateria}` === key);
      if (existing) {
        const currentInstructor = ev.extendedProps.instructor || ev.extendedProps.contrato?.persona;
        if (currentInstructor) existing.extendedProps.allInstructors.push(currentInstructor);
        if (ev.extendedProps.activeAsignacion) existing.extendedProps.allAssignments.push(ev.extendedProps.activeAsignacion);
        existing.extendedProps.isSharedSlot =
          (existing.extendedProps.allAssignments?.length || 0) > 0 ||
          (existing.extendedProps.allInstructors?.length || 0) > 1;
      } else {
        grouped.push(ev);
      }
    });

    return grouped;
  }, [asignados, sinAsignar, materia, holidayDates]);

  // Colores por tipo
  const getEventColor = (type: string) => {
    switch (type) {
      case 'asignados': return { backgroundColor: '#eff6ff', borderColor: '#bfdbfe', textColor: '#1e40af' };
      case 'sinAsignar': return { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', textColor: '#374151' };
      default: return { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', textColor: '#374151' };
    }
  };

  // Renderizado personalizado del evento en la celda
const renderEventContent = (arg: EventContentArg) => {
  const ev = arg.event.extendedProps;
  
  if (ev.isHoliday) {
    return null;
  }

  const hIni = ev.horaInicial || ev.horaInicio;
  const hFin = ev.horaFinal || ev.horaFin;
  const colors = getEventColor(ev.type);

  return (
    <div
      className="w-full h-full px-1 py-0.5 rounded-[4px] text-[10px] font-bold border overflow-hidden cursor-default select-none"
      style={{ 
        backgroundColor: colors.backgroundColor, 
        borderColor: colors.borderColor, 
        color: colors.textColor 
      }}
      onMouseEnter={(e) => setTooltip({ ev, x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
      onMouseLeave={() => setTooltip(null)}
    >
      <div className="flex items-center gap-1 justify-center leading-tight">
        <span>{format12h(hIni)}-{format12h(hFin)}</span>
        {ev.isSharedSlot && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />}
      </div>
      
      {ev.isSharedSlot && (
        <div className="text-[7px] text-blue-500 mt-0.5 uppercase font-black text-center truncate">
          {ev.allAssignments?.[0]?.tipoAsignacion || ''}
        </div>
      )}

      {/* Botones de acción - SOLO para eventos normales */}
      {!modoRmi && (
        <div className="flex justify-center items-center gap-1 mt-0.5">
          {ev.estado === 'PENDIENTE' && (
            <button
              onMouseEnter={() => setTooltip(null)}
              onClick={(e) => {
                e.stopPropagation();
                setHorarioParaAsignar(ev);
                setShowProfesorModal(true);
              }}
              className="rounded-full bg-green-500/10 w-5 h-5 flex items-center justify-center text-green-700 hover:text-green-800 transition"
              title="Asignar profesor"
            >
              <User size={11} />
            </button>
          )}

          {!ev.isSharedSlot && ev.estado === 'ASIGNADO' && (
            <button
              onMouseEnter={() => setTooltip(null)}
              onClick={(e) => {
                e.stopPropagation();
                setFechaSeleccionada(ev._dateStr);
                setHorarioAsignacionSesion(ev);
                setIdMateriaAsignacion(ev.gradoMateria?.idMateria);
                setAsignacionSesionModal(true);
              }}
              className="rounded-full bg-blue-500/10 w-5 h-5 flex items-center justify-center text-blue-700 hover:text-blue-800 transition"
              title="Agregar asignación"
            >
              <Plus size={11} />
            </button>
          )}
          
          <button
            onMouseEnter={() => setTooltip(null)}
            onClick={(e) => { 
              e.stopPropagation(); 
              handleEliminarHorario(ev.id); 
            }}
            className="rounded-full bg-red-500/10 w-5 h-5 flex items-center justify-center text-red-500 hover:text-red-600 transition"
            title="Eliminar"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

  const handleEliminarHorario = async (idHorario: number) => {
    if (modoRmi) return;
    try {
      const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
      const isDarkMode = theme === 'dark';
      const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
      const color = isDarkMode ? 'white' : '#4B5675';
      const result = await Swal.fire({
        title: '¿Eliminar horario?',
        text: '¿Estás seguro de que deseas eliminar este horario?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: { confirmButton: 'btn btn-sm btn-danger', cancelButton: 'btn btn-sm btn-light' },
        background,
        color
      });
      if (!result.isConfirmed) return;
      const res = await axios.delete(`horarios/materia/${idHorario}`);
      setHorariosFicha(prev => prev.filter(h => h.id !== idHorario));
      enqueueSnackbar(res.data.message || "Horario eliminado correctamente", { variant: "success" });
      cargarRaps?.();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Error al eliminar horario", { variant: "error" });
    }
  };

  if (!isOpen) return null;

  if (loading || !initialLoadComplete) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
        <ModalContent className="w-full max-w-4xl h-[85vh] flex flex-col p-0 shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-600 rounded-2xl overflow-hidden">
          <ModalHeader className="px-6 pr-16 py-3 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-coal-500 shrink-0 border-b border-gray-100 dark:border-coal-600 relative z-[20]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><CalendarIcon size={20} /></div>
              <div className="min-w-0 text-left">
                <ModalTitle className="text-md font-black uppercase tracking-tight dark:text-white truncate">Calendario de Horarios</ModalTitle>
                <p className="text-3xs text-gray-500 font-semibold uppercase max-w-xl">{materia?.nombre || materia?.nombreMateria || ''}</p>
              </div>
            </div>
            <button onClick={onClose} className="absolute z-10 flex items-center justify-center w-8 h-8 text-gray-400 transition-all border rounded-full top-4 right-4 hover:bg-danger border-gray-200 hover:text-white hover:scale-110 shadow-sm">
              <X size={16} />
            </button>
          </ModalHeader>
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Cargando horarios...</p>
            </div>
          </div>
        </ModalContent>
      </div>
    );
  }

  return (
    <>
      {/* Tooltip flotante */}
      {tooltip && <EventTooltip data={tooltip} carouselIndex={carouselIndex} />}

      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
        <ModalContent className="w-full max-w-7xl h-[95vh] flex flex-col p-0 shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-600 rounded-2xl overflow-hidden">

          <ModalHeader className="px-6 pr-16 py-3 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-coal-500 shrink-0 border-b border-gray-100 dark:border-coal-600 relative z-[20]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><CalendarIcon size={20} /></div>
              <div className="min-w-0 text-left">
                <ModalTitle className="text-md font-black uppercase tracking-tight dark:text-white truncate">Calendario de Horarios</ModalTitle>
                <p className="text-3xs text-gray-500 font-semibold uppercase max-w-xl">{materia?.nombre || materia?.nombreMateria || ''}</p>
              </div>
            </div>
            <button onClick={onClose} className="absolute z-10 flex items-center justify-center w-8 h-8 text-gray-400 transition-all border rounded-full top-4 right-4 hover:bg-danger border-gray-200 hover:text-white hover:scale-110 shadow-sm">
              <X size={16} />
            </button>
          </ModalHeader>

          <ModalBody className="flex-grow bg-gray-50 dark:bg-coal-600 scroll-hide overflow-y-auto overflow-x-hidden p-4 pb-16">
            <style>{`
              /* Toolbar */
              .fc .fc-toolbar { margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem; }
              .fc .fc-toolbar-title { font-size: 0.875rem; font-weight: 900; text-transform: capitalize; }
              .fc .fc-button {
                padding: 0.25rem 0.75rem !important;
                font-size: 0.625rem !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                border-radius: 0.375rem !important;
                background-color: white !important;
                color: #6b7280 !important;
                border: 1px solid #e5e7eb !important;
                box-shadow: none !important;
              }
              .fc .fc-button:hover { background-color: #f3f4f6 !important; color: #374151 !important; }
              .fc .fc-button-active, .fc .fc-button:focus { background-color: white !important; color: var(--color-primary, #3b82f6) !important; border-color: var(--color-primary, #3b82f6) !important; outline: none !important; box-shadow: none !important; }
              .fc .fc-button-primary:not(:disabled).fc-button-active { background-color: white !important; color: var(--color-primary, #3b82f6) !important; }
              /* Cabecera días */
              .fc .fc-col-header-cell { background: rgba(249,250,251,0.5); }
              .fc .fc-col-header-cell-cushion { font-size: 0.625rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; text-decoration: none !important; }
              /* Número de día */
              .fc .fc-daygrid-day-number { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-decoration: none !important; }
              .fc .fc-day-today .fc-daygrid-day-number {
                background: var(--color-primary, #3b82f6);
                color: white;
                border-radius: 9999px;
                width: 1.25rem; height: 1.25rem;
                display: flex; align-items: center; justify-content: center;
                font-size: 0.65rem;
              }
              /* Celdas */
              .fc .fc-daygrid-day { min-height: 80px; }
              .fc td, .fc th { border-color: #f3f4f6 !important; }
              /* Evento */
              .fc .fc-daygrid-event { border-radius: 4px !important; margin: 1px 2px !important; background: transparent !important; border: none !important; }
              .fc .fc-event-main { padding: 0 !important; }
              .fc .fc-timegrid-event { border-radius: 4px !important; background: transparent !important; border: none !important; }
              /* Scrollbar oculto */
              .fc-scroller { scrollbar-width: none; }
              .fc-scroller::-webkit-scrollbar { display: none; }
              /* Dark mode básico */
              .dark .fc .fc-button { background-color: #2d2d3a !important; color: #9ca3af !important; border-color: #3f3f55 !important; }
              .dark .fc .fc-toolbar-title { color: white; }
              .dark .fc .fc-col-header-cell-cushion { color: #9ca3af; }
              .dark .fc .fc-daygrid-day-number { color: #9ca3af; }
              .dark .fc td, .dark .fc th { border-color: #3f3f55 !important; }
              .dark .fc .fc-col-header-cell { background: rgba(45,45,58,0.5); }

              .fc .fc-bg-event {
                opacity: 1 !important;
              }
              .fc .fc-bg-event .fc-event-title {
                display: none !important;
              }
            `}</style>

            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={esLocale}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              buttonText={{
                today: 'Hoy',
                month: 'Mes',
                week: 'Sem',
                day: 'Día',
              }}
              slotLabelFormat={{
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                meridiem: 'short' // AM/PM corto
              }}
              events={[...fcEvents, ...festivos]}
              dayMaxEvents={false}
              eventDisplay="block"
              eventContent={renderEventContent}
              editable={false}
              selectable={false}
              eventClick={(_arg: EventClickArg) => {/* manejado en renderEventContent */}}
              height="auto"
              moreLinkText={(n) => `+${n} más`}
              nowIndicator
              eventClassNames={(arg) =>
                arg.event.extendedProps?.isHoliday ? 'holiday-bg' : ''
              }
              dayCellContent={(arg) => {
                const key = toLocalDateKey(arg.date);
                const nombreFestivo = holidayMap.get(key);
                return (
                  <div className="w-full flex justify-between items-center gap-2">
                    {nombreFestivo && (
                      <span
                        className="text-[9px] font-semibold uppercase text-white truncate"
                        title={nombreFestivo}
                      >
                        {nombreFestivo}
                      </span>
                    )}
                    <span className="">{arg.dayNumberText}</span>
                  </div>
                );
              }}
            />
          </ModalBody>

          {!modoRmi && (
            <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-end gap-4 bg-white dark:bg-coal-500 rounded-b-2xl">
              
                <button
                  onClick={onAddSchedule}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary-active active:scale-95 transition-all shadow-md"
                >
                  <Plus size={14} />Programar Horario
                </button>
              
            </div>
          )}
        </ModalContent>

        {asignacionSesionModal && (
          <AsignacionSesionModal
            isOpen={asignacionSesionModal}
            onClose={() => setAsignacionSesionModal(false)}
            onSuccess={() => {
              setRefreshTrigger(prev => prev + 1);
              cargarRaps?.();
            }}
            idMateria={materia?.id}
            horario={horarioAsignacionSesion}
            fechaSeleccionada={fechaSeleccionada}
          />
        )}

        {/* Modal de Asignación de Profesor Principal */}
        {showProfesorModal && horarioParaAsignar && (
          <ProfesorSelect
            onClose={() => setShowProfesorModal(false)}
            idMateria={materia?.idMateria || materia?.id}
            onSelect={async (profesor) => {
              try {
                // Asignar el profesor al horario
                await axios.put('asignar/instructor', {
                  idContrato: profesor.value,
                  horarios: [horarioParaAsignar]
                });
                enqueueSnackbar('Profesor asignado correctamente', { variant: 'success' });
                setShowProfesorModal(false);
                // Recargar los horarios
                setRefreshTrigger(prev => prev + 1);
                cargarRaps?.();
              } catch (error: any) {
                enqueueSnackbar(error.response?.data?.message || 'Error al asignar profesor', { variant: 'error' });
              }
            }}
            placeholder="Selecciona un profesor"
          />
        )}
      </div>
    </>
  );
};