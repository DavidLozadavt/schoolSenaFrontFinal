import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  X,
  Trash2
} from "lucide-react";
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components';
import { enqueueSnackbar } from 'notistack';
import Swal from 'sweetalert2';
import AsignacionSesionModal from './AsignacionSesionModal';

interface CalendarioProps {
  isOpen: boolean;
  onClose: () => void;
  materia: any;
  idFicha: number;
  onAddSchedule: () => void;
  cargarRaps?: () => void;
  // Cuando viene desde el módulo de RMI el calendario es solo de lectura
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

const daysOfWeek = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
const months = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

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
  onAddSchedule,
  cargarRaps,
  modoRmi = false
}) => {
  // Mover el return null después de todos los hooks
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [horariosFicha, setHorariosFicha] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [asignacionSesionModal, setAsignacionSesionModal] = useState<boolean>(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horarioAsignacionSesion, setHorarioAsignacionSesion] = useState<any>(null);
  const [idMateriaAsignacion, setIdMateriaAsignacion] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Efecto para el carrusel de fotos en los tooltips
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

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

  // Efecto para cargar horarios - SOLO cuando se abre el modal
  useEffect(() => {
    let isMounted = true;

    const cargarHorarios = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        if (materia?.horarios && !Array.isArray(materia.horarios)) {
          const horariosCombinados = [
            ...(materia.horarios.asignados || []),
            ...(materia.horarios.sinAsignar || [])
          ];
          if (isMounted) {
            setHorariosFicha(horariosCombinados);
          }
        } else {
          const response = await axios.get(`horario/ficha/${idFicha}`);
          if (isMounted) {
            setHorariosFicha(response.data.data || []);
          }
        }
      } catch (error) {
        if (isMounted) {
          setHorariosFicha([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    if (isOpen) {
      cargarHorarios();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, idFicha, refreshTrigger, materia]);

  // Resetear estado cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setHorariosFicha([]);
      setLoading(true);
      setInitialLoadComplete(false);
      setCurrentDate(new Date());
      setViewMode('month');
    }
  }, [isOpen]);

  // Procesar horarios - usando useMemo
  const { asignados, sinAsignar } = useMemo(() => {
    if (!horariosFicha.length) {
      return { asignados: [], sinAsignar: [] };
    }

    const a = horariosFicha.filter((h: any) => h.estado === 'ASIGNADO');
    const s = horariosFicha.filter((h: any) => h.estado === 'PENDIENTE');

    return { asignados: a, sinAsignar: s };
  }, [horariosFicha]);

  // Función para obtener eventos de una fecha
  const getEventsForDate = useMemo(() => {
    return (date: Date) => {
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
        const jsDayFromId = idDiaRaw !== undefined ? (Number(idDiaRaw) === 7 ? 0 : Number(idDiaRaw)) : -1;

        const matchDay = (h.dia?.dia?.toUpperCase() === dayName) ||
          (h.dia_semana?.toUpperCase() === dayName) ||
          (h.nombreDia?.toUpperCase() === dayName) ||
          (mapeoDias[h.dia_semana?.toUpperCase()] === dayNum) ||
          (jsDayFromId === dayNum);

        return matchDay && compareDate >= start && compareDate <= end;
      };

      return [
        ...asignados.filter(filterFn).map(h => {
          const assignments = h.asignacion_sesion || h.asignacionSesion || [];
          const activeAsignacion = assignments.find((asig: any) => {
            const start = parseDate(asig.fechaInicio);
            const end = parseDate(asig.fechaFin);
            if (!start || !end) return false;
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return compareDate >= start && compareDate <= end;
          });
          return { ...h, type: 'asignados', activeAsignacion };
        }),
        ...sinAsignar.filter(filterFn).map(h => ({ ...h, type: 'sinAsignar' }))
      ];
    };
  }, [asignados, sinAsignar]);

  // Generar días del mes
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1;

    const arr = Array(offset).fill(null);
    for (let i = 1; i <= days; i++) arr.push(new Date(year, month, i));
    return arr;
  }, [currentDate]);

  const daysInWeek = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - (day === 0 ? 6 : day - 1);
    start.setDate(diff);
    return Array(7).fill(null).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const navigate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(currentDate.getMonth() + amount, 1);
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + amount * 7);
    } else {
      newDate.setDate(currentDate.getDate() + amount);
    }
    setCurrentDate(newDate);
  };

  const handleColors = (estado: string) => {
    switch (estado) {
      case 'asignados':
        return 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60';
      case 'sinAsignar':
        return 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800/60';
      case 'finalizados':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60';
      case 'interrumpidos':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60';
      case 'evaluados':
        return 'bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-400 dark:border-green-800/60';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200 dark:bg-gray-950/40 dark:text-gray-400 dark:border-gray-800/60';
    }
  };

  const handleEliminarHorario = async (idHorario: number) => {
    // En modo RMI no se permite eliminar horarios
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
        customClass: {
          confirmButton: 'btn btn-sm btn-danger',
          cancelButton: 'btn btn-sm btn-light'
        },
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
  }

  // Mostrar skeleton mientras carga
  if (!isOpen) return null;

  if (loading || !initialLoadComplete) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
        <ModalContent className="w-full max-w-4xl h-[85vh] flex flex-col p-0 shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-600 rounded-2xl overflow-hidden">
          <ModalHeader className="px-6 pr-16 py-3 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-coal-500 shrink-0 border-b border-gray-100 dark:border-coal-600 relative z-[20]">
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
            <button
              onClick={onClose}
              className="absolute z-10 flex items-center justify-center w-8 h-8 text-gray-400 transition-all border rounded-full top-4 right-4 hover:bg-danger border-gray-200 hover:text-white hover:scale-110 shadow-sm"
            >
              <X size={16} />
            </button>
          </ModalHeader>
          <div className="flex-grow flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Cargando horarios...
              </p>
            </div>
          </div>
        </ModalContent>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
      <ModalContent className="w-full max-w-6xl h-[85vh] flex flex-col p-0 shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-600 rounded-2xl overflow-hidden">

        <ModalHeader className="px-6 pr-16 py-3 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-coal-500 shrink-0 border-b border-gray-100 dark:border-coal-600 relative z-[20]">
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

        <ModalBody className="flex-grow bg-gray-50 dark:bg-coal-600 scroll-hide overflow-y-auto overflow-x-hidden p-6 pb-16">
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

          <div className="bg-white dark:bg-coal-400 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {viewMode != 'day' && (
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-coal-500/50">
                {daysOfWeek.map(d => <div key={d} className="py-2 text-center text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase">{d}</div>)}
              </div>
            )}

            <div className={viewMode === 'day' ? "divide-y divide-gray-100 dark:divide-gray-700" : "grid grid-cols-7"}>
              {(viewMode === 'month' ? daysInMonth : viewMode === 'week' ? daysInWeek : [currentDate]).map((date, i) => {
                if (!date) return <div key={i} className="h-20 border-r border-b border-gray-50 dark:border-coal-300" />;
                const events = getEventsForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();

                // Lógica de posición del tooltip para evitar recortes
                const colIndex = i % 7;
                const isRightCol = colIndex >= 4;
                const isBottomRow = i >= 21;

                return (
                  <div key={i} className={`min-h-[80px] m-1 border-r border-b border-gray-100 dark:border-gray-100 transition-all hover:bg-gray-50 dark:hover:bg-coal-500/50 relative group hover:z-[50] ${viewMode !== 'month' ? 'flex items-start gap-3 p-3 min-h-0' : ''}`}>
                    <span className={`text-xs font-semibold mb-1 inline-block h-5 w-5 rounded-full flex items-center justify-center transition-colors ${isToday ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400'}`}>{date.getDate()}</span>
                    <div className="space-y-0.5 w-full">
                      {events.map((ev, idx) => {
                        const hIni = ev.horaInicial || ev.horaInicio;
                        const hFin = ev.horaFinal || ev.horaFin;
                        const instructor = ev.instructor || ev.contrato?.persona;
                        const materiaNombre = ev.gradoMateria?.materia?.nombreMateria || materia.nombre || materia.nombreMateria;

                        return (
                          <div key={`${ev.id}-${idx}`} className={`relative px-2 py-0.5 rounded-[4px] ${viewMode === 'day' ? 'text-sm' : 'text-[10px]'} font-bold border transition-all hover:scale-[1.02] hover:shadow-sm group/event cursor-default hover:z-[60] ${handleColors(ev.type)}`}>
                            <div className="flex flex-col items-center justify-center">
                              <div>{format12h(hIni)} - {format12h(hFin)}</div>
                              {ev.activeAsignacion && (
                                <div className="text-[7px] text-primary-active mt-0.5 uppercase">
                                  {ev.activeAsignacion.tipoAsignacion}
                                </div>
                              )}
                            </div>
                            {!modoRmi && (
                              <div className='w-full flex justify-around items-center mb-1'>
                                {!ev.activeAsignacion && ev.estado == 'ASIGNADO' && (
                                  <div className='rounded-full bg-blue-500/5 w-6 h-6 flex items-center justify-center'>
                                    <button
                                      onClick={() => {
                                        setFechaSeleccionada(date.toISOString().split('T')[0]);
                                        setHorarioAsignacionSesion(ev);
                                        setIdMateriaAsignacion(ev.gradoMateria?.idMateria);
                                        setAsignacionSesionModal(true);
                                      }}
                                      className="text-blue-700 hover:text-blue-800 transition"
                                      title="Agregar asignación"
                                    >
                                      <Plus size={14} />
                                    </button>
                                  </div>)}

                                <div className='rounded-full bg-red-500/5 w-6 h-6 flex items-center justify-center'>
                                  <button
                                    onClick={() => handleEliminarHorario(ev.id)}
                                    className="text-red-500 hover:text-red-600 transition"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className={`absolute ${isBottomRow ? 'bottom-full mb-2' : 'top-full mt-2'} ${isRightCol ? 'right-0' : 'left-0'} ${viewMode === 'day' ? 'w-80' : 'w-60'} p-0 bg-white dark:bg-coal-300 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-600 opacity-0 invisible group-hover/event:opacity-100 group-hover/event:visible transition-all duration-200 z-[1000] pointer-events-none`}>
                              <div className="h-28 w-full relative overflow-hidden rounded-t-xl bg-gray-100 dark:bg-coal-500 border-b dark:border-gray-600">
                                {/* Carrusel de Fotos */}
                                <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: (!ev.activeAsignacion || carouselIndex === 0) ? 1 : 0 }}>
                                  {(instructor?.rutaFotoUrl || instructor?.rutaFoto) ? (
                                    <img src={instructor.rutaFotoUrl || instructor.rutaFoto} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>
                                  )}
                                  <div className="absolute top-0 left-0 bg-gray-800/60 text-white text-[7px] px-2 py-0.5 font-black rounded-br-lg">TITULAR</div>
                                </div>

                                {ev.activeAsignacion && (
                                  <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: carouselIndex === 1 ? 1 : 0 }}>
                                    {(ev.activeAsignacion.contrato?.persona?.rutaFotoUrl || ev.activeAsignacion.contrato?.persona?.rutaFoto) ? (
                                      <img src={ev.activeAsignacion.contrato.persona.rutaFotoUrl || ev.activeAsignacion.contrato.persona.rutaFoto} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>
                                    )}
                                    <div className="absolute top-0 right-0 bg-primary/80 text-white text-[7px] px-2 py-0.5 font-black uppercase rounded-bl-lg">{ev.activeAsignacion.tipoAsignacion}</div>
                                  </div>
                                )}

                                {/* Indicador de carrusel */}
                                {ev.activeAsignacion && (
                                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === 0 ? 'bg-white scale-125' : 'bg-white/40'}`} />
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${carouselIndex === 1 ? 'bg-white scale-125' : 'bg-white/40'}`} />
                                  </div>
                                )}
                              </div>

                              <div className="p-3 text-left">
                                <div className="flex justify-between items-start mb-2">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${ev.estado === 'FINALIZADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {ev.estado || 'SIN ESTADO'}
                                  </span>
                                  <div className="flex items-center gap-1 text-primary">
                                    <Clock size={10} className="shrink-0" />
                                    <span className="text-[9px] uppercase font-black tracking-wider">{format12h(hIni)} - {format12h(hFin)}</span>
                                  </div>
                                </div>

                                <div className="space-y-3 px-1">
                                  <div className="flex flex-col gap-0.5">
                                    <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">Materia / RAP</p>
                                    <p className="text-[10px] font-black leading-tight dark:text-white uppercase line-clamp-2">{materiaNombre}</p>
                                  </div>

                                  <div className="space-y-2">
                                    {/* INSTRUCTOR PRINCIPAL */}
                                    <div className="flex flex-col gap-0.5">
                                      <p className="text-[7px] text-gray-400 font-bold uppercase tracking-widest">Instructores</p>
                                      <div className="flex items-center gap-2 dark:text-white">
                                        <User size={12} className="text-gray-400 shrink-0" />
                                        <span className="text-[10px] font-bold leading-tight truncate">
                                          {instructor ? `${instructor.nombre1 || ''} ${instructor.apellido1 || ''}` : <span className="text-orange-500 uppercase">Sin asignar</span>}
                                        </span>
                                      </div>
                                    </div>


                                    {/* INSTRUCTOR SECUNDARIO */}
                                    {ev.activeAsignacion &&
                                      <div className="flex flex-col gap-0.5">
                                        <div className="flex items-center gap-2 dark:text-white">
                                          <User size={12} className="text-gray-400 shrink-0" />
                                          <span className="text-[10px] font-bold leading-tight truncate">
                                            {ev.activeAsignacion.contrato?.persona?.nombre1 || ''} {ev.activeAsignacion.contrato?.persona?.apellido1 || ''} <span className="text-orange-500 uppercase ml-2">({ev.activeAsignacion.tipoAsignacion})</span>
                                          </span>
                                        </div>
                                        {ev.activeAsignacion.observacion && (<p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">
                                          <span className="font-bold text-primary">Observación: </span>
                                          {ev.activeAsignacion.observacion}</p>)}
                                      </div>
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>
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

        {!modoRmi && (
          <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-end gap-4 bg-white dark:bg-coal-500 rounded-b-2xl">
            {materia.idMateriaPadre != null && (
              <button
                onClick={() => {
                  if (materia?.horasTotales > 0) {
                    if (materia?.estado === 'FINALIZADO') {
                      enqueueSnackbar('No se pueden programar horarios para un RAP finalizado', { variant: 'error' });
                    } else {
                      onAddSchedule();
                    }
                  } else {
                    enqueueSnackbar('Debes configurar el total de horas del RAP', { variant: 'error' });
                  }
                }}
                className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-primary-active active:scale-95 transition-all shadow-md"
              >
                <Plus size={14} />Programar Horario
              </button>
            )}
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
          idMateria={materia.idMateria || materia.id}
          horario={horarioAsignacionSesion}
          fechaSeleccionada={fechaSeleccionada}
        />
      )}
    </div>
  );
};