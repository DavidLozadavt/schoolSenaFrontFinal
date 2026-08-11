import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  X,
  Trash2,
  Plus,
  Ban,
  CheckCircle2
} from "lucide-react";
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components';
import { enqueueSnackbar } from 'notistack';
import Swal from 'sweetalert2';
import AsignacionSesionModal from './AsignacionSesionModal';
import ModalActividadFechaMotivo from '@/pages/ambiente-virtual/actividades/ModalActividadFechaMotivo';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { getColombianHolidayDateSet, isColombianHoliday, toLocalDateKey, getColombianHolidayMap } from '@/utils/colombianHolidays';
import type { EventContentArg, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { numeroTrimestreDesdeHorario, parseNumeroGrado } from './utils/trimestreNumeroGrado';

interface CalendarioProps {
  isOpen: boolean;
  onClose: () => void;
  materia: any;
  idFicha: number;
  /** Abre el modal existente de horario. Opcionalmente con fecha precargada desde el calendario. */
  onAddSchedule: (prefs?: { fechaInicio: string }) => void;
  cargarRaps?: () => void;
  modoRmi?: boolean;
  permiteEdicion?: boolean;
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

/**
 * idDia en BD (igual que generatePastSessions / HorariosMateria):
 * 1=Lunes … 6=Sábado, 7=Domingo → JS getDay(): 0=Domingo … 6=Sábado.
 */
const idDiaToJsDay = (idDiaRaw: any): number => {
  const id = Number(idDiaRaw);
  if (!Number.isFinite(id)) return -1;
  if (id === 7 || id === 0) return 0;
  if (id >= 1 && id <= 6) return id;
  return -1;
};

const normalizeDayName = (raw: any): string =>
  String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

/** Resuelve el día JS priorizando idDia (fuente de verdad del sistema). */
const resolveJsDay = (h: any): number => {
  const fromId = idDiaToJsDay(h?.dia?.id ?? h?.idDia);
  if (fromId >= 0) return fromId;

  const nombre = normalizeDayName(h?.dia?.dia || h?.dia_semana || h?.nombreDia);
  if (nombre && mapeoDias[nombre] !== undefined) return mapeoDias[nombre];
  // Sin tildes: MIERCOLES / SABADO
  if (nombre === 'MIERCOLES') return 3;
  if (nombre === 'SABADO') return 6;
  return -1;
};

const parseDate = (dateString: any): Date | null => {
  if (!dateString) return null;
  if (dateString instanceof Date && !isNaN(dateString.getTime())) {
    return new Date(dateString.getFullYear(), dateString.getMonth(), dateString.getDate());
  }
  const str = String(dateString);
  const parts = str.split('T')[0].split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
};

const normalizeHora = (timeStr?: any): string => {
  if (timeStr == null) return '';
  const s = String(timeStr);
  const match = s.match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const format12h = (timeStr?: any) => {
  const normalized = normalizeHora(timeStr);
  if (!normalized) return '';
  const parts = normalized.split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) return '';
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

/** Paleta estable por materia para distinguir bloques en el calendario. */
const COLORES_MATERIA = [
  { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
  { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
  { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },
  { bg: '#faf5ff', border: '#d8b4fe', text: '#6b21a8' },
  { bg: '#ecfeff', border: '#67e8f9', text: '#155e75' },
  { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' },
  { bg: '#fefce8', border: '#fde047', text: '#854d0e' },
];

const COLOR_INTERRUMPIDO = { bg: '#f3f4f6', border: '#e5e7eb', text: '#9ca3af' };

const COLOR_FINALIZADO = { bg: 'rgba(0,0,0,0.10)', border: 'rgba(0,0,0,0.18)', text: '#4b5563' };

const colorPorMateria = (idMateria?: number | null) => {
  const idx = Math.abs(Number(idMateria) || 0) % COLORES_MATERIA.length;
  return COLORES_MATERIA[idx];
};

const nombreMateriaHorario = (h: any, fallback = ''): string =>
  h?.gradoMateria?.materia?.nombreMateria ||
  h?.materia?.nombreMateria ||
  h?.rap ||
  h?._materiaFallback ||
  fallback ||
  'Sin competencia';

const instructorHorario = (h: any) =>
  h?.instructor || h?.contrato?.persona || h?.persona || null;

/**
 * Horario usable en calendario: basta fechaInicial + horas + día.
 * NO se exige fechaFinal (histórico sin cierre también debe verse).
 * NO se filtra por “hoy” ni solo futuros.
 */
const horarioEsRenderable = (h: any): boolean => {
  const fInicio = h?.fechaInicial || h?.fechaInicio;
  const hIni = normalizeHora(h?.horaInicial || h?.horaInicio);
  const hFin = normalizeHora(h?.horaFinal || h?.horaFin);
  const jsDay = resolveJsDay(h);
  return !!(fInicio && hIni && hFin && jsDay >= 0);
};

/** Rango de expansión del horario recurrente (pasado + futuro). */
const resolveRangoFechas = (h: any): { start: Date; end: Date } | null => {
  const start = parseDate(h?.fechaInicial || h?.fechaInicio);
  if (!start) return null;

  let end = parseDate(h?.fechaFinal || h?.fechaFin);
  if (!end) {
    // Sin fechaFinal: cubrir histórico desde inicio y proyección a 12 meses desde hoy
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    end = new Date(hoy);
    end.setFullYear(end.getFullYear() + 1);
    if (start > end) end = new Date(start);
  }

  if (end < start) end = new Date(start);
  return { start, end };
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
  const instructor = instructorHorario(ev);

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

  const materiaNombre = nombreMateriaHorario(ev);

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
        <div className="flex flex-col gap-1.5 mb-3">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${
              ev.estado === 'FINALIZADO' || ev.estado === 'EVALUADO'
                ? 'bg-black/10 text-gray-700 dark:bg-white/10 dark:text-gray-200'
                : ev.estado === 'INTERRUMPIDO'
                  ? 'bg-gray-100 text-gray-500 dark:bg-coal-500 dark:text-gray-400'
                  : ev.estado === 'PENDIENTE'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
            }`}>
              {ev.estado || 'SIN ESTADO'}
            </span>
            {ev.numeroTrimestre != null && (
              <span className="px-1.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wide bg-gray-100 dark:bg-coal-500 text-gray-600 dark:text-gray-300 shrink-0">
                T{ev.numeroTrimestre}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-primary">
            <Clock size={12} className="shrink-0" />
            <span className="text-[11px] font-black tracking-wide whitespace-nowrap">
              {format12h(hIni)} – {format12h(hFin)}
            </span>
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
  modoRmi = false,
  permiteEdicion = true
}) => {
  const [horariosFicha, setHorariosFicha] = useState<any[]>([]);
  const [maxNumeroTrimestreApi, setMaxNumeroTrimestreApi] = useState(0);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [asignacionSesionModal, setAsignacionSesionModal] = useState<boolean>(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [horarioAsignacionSesion, setHorarioAsignacionSesion] = useState<any>(null);
  const [idMateriaAsignacion, setIdMateriaAsignacion] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [modalCierreHorario, setModalCierreHorario] = useState<{
    modo: 'interrumpir' | 'finalizar';
    horario: any;
  } | null>(null);
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;

  // Carrusel
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev === 0 ? 1 : 0));
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  /**
   * Recarga horarios desde API y actualiza estado local (mismo patrón que eliminar:
   * mutar horariosFicha → fcEvents se recalcula → FullCalendar muestra el cambio).
   * No depende de `materia` para evitar cancelar el fetch al refrescar RAPs tras crear.
   */
  const refrescarHorariosFromApi = useCallback(async () => {
    if (!idFicha) {
      setHorariosFicha([]);
      setMaxNumeroTrimestreApi(0);
      setInitialLoadComplete(true);
      return;
    }
    try {
      const response = await axios.get(`horario/ficha/${idFicha}`);
      if (!isOpenRef.current) return;
      const data = response.data?.data || [];
      const maxApi = Number(response.data?.maxNumeroTrimestre) || 0;
      setHorariosFicha(Array.isArray(data) ? data : []);
      setMaxNumeroTrimestreApi(maxApi > 0 ? maxApi : 0);
    } catch {
      if (!isOpenRef.current) return;
      setHorariosFicha([]);
      setMaxNumeroTrimestreApi(0);
    } finally {
      if (isOpenRef.current) setInitialLoadComplete(true);
    }
  }, [idFicha]);

  // Carga inicial / cambio de ficha (modo planeación normal).
  useEffect(() => {
    if (!isOpen || modoRmi) return;
    void refrescarHorariosFromApi();
  }, [isOpen, idFicha, modoRmi, refrescarHorariosFromApi]);

  // modoRmi: sincroniza el subconjunto ya filtrado en materia.horarios.
  useEffect(() => {
    if (!isOpen || !modoRmi) return;
    if (materia?.horarios && !Array.isArray(materia.horarios)) {
      const horariosCombinados = [
        ...(materia.horarios.asignados || []),
        ...(materia.horarios.sinAsignar || []),
      ];
      setHorariosFicha(horariosCombinados);
    } else {
      setHorariosFicha([]);
    }
    setInitialLoadComplete(true);
  }, [isOpen, modoRmi, materia]);

  // Tras crear/guardar horario desde el modal: refrescar estado del calendario (sin F5).
  useEffect(() => {
    if (!isOpen) return;
    const onGuardado = (ev: Event) => {
      const detail = (ev as CustomEvent)?.detail;
      if (detail?.idFicha != null && Number(detail.idFicha) !== Number(idFicha)) return;
      if (modoRmi) {
        // En RMI el padre debe actualizar materia.horarios; pedimos recarga de RAPs.
        cargarRaps?.();
        return;
      }
      void refrescarHorariosFromApi();
      cargarRaps?.();
    };
    window.addEventListener('horario-materia-guardado', onGuardado);
    return () => window.removeEventListener('horario-materia-guardado', onGuardado);
  }, [isOpen, idFicha, modoRmi, refrescarHorariosFromApi, cargarRaps]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setHorariosFicha([]);
      setMaxNumeroTrimestreApi(0);
      setInitialLoadComplete(false);
      setTooltip(null);
    }
  }, [isOpen]);

  // Trimestre vigente = mayor numeroGrado (solo para edición y filtro de FINALIZADO).
  const maxNumeroTrimestre = useMemo(() => {
    let max = maxNumeroTrimestreApi > 0 ? maxNumeroTrimestreApi : 0;
    horariosFicha.forEach((h: any) => {
      const n = numeroTrimestreDesdeHorario(h);
      if (n != null && n > max) max = n;
    });
    return max;
  }, [horariosFicha, maxNumeroTrimestreApi]);

  // Historial completo de la ficha (todos los trimestres).
  // Excepción: en el trimestre vigente no se muestran RAP/horarios FINALIZADO|EVALUADO.
  const horariosProgramados = useMemo(
    () =>
      horariosFicha.filter((h) => {
        if (!horarioEsRenderable(h)) return false;
        const n = parseNumeroGrado(h?.numeroTrimestre) ?? numeroTrimestreDesdeHorario(h);
        const esTrimestreActual = maxNumeroTrimestre > 0 && n != null && n === maxNumeroTrimestre;
        if (esTrimestreActual) {
          const estado = String(h?.estado || '').toUpperCase();
          if (estado === 'FINALIZADO' || estado === 'EVALUADO') return false;
        }
        return true;
      }),
    [horariosFicha, maxNumeroTrimestre]
  );

  const puedeEditarHorarioPorTrimestre = (ev: any): boolean => {
    const n = parseNumeroGrado(ev?.numeroTrimestre) ?? numeroTrimestreDesdeHorario(ev);
    if (n == null || maxNumeroTrimestre <= 0) return false;
    return n === maxNumeroTrimestre;
  };

  const holidayDates = useMemo(() => {
    const currentYear = new Date().getFullYear();
    let minYear = currentYear;
    let maxYear = currentYear + 1;

    horariosProgramados.forEach((h: any) => {
      const rango = resolveRangoFechas(h);
      if (!rango) return;
      minYear = Math.min(minYear, rango.start.getFullYear());
      maxYear = Math.max(maxYear, rango.end.getFullYear());
    });

    return getColombianHolidayDateSet(minYear, maxYear);
  }, [horariosProgramados]);

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

    horariosProgramados.forEach((h: any) => {
      const rango = resolveRangoFechas(h);
      if (!rango) return;
      minYear = Math.min(minYear, rango.start.getFullYear());
      maxYear = Math.max(maxYear, rango.end.getFullYear());
    });

    return getColombianHolidayMap(minYear, maxYear);
  }, [horariosProgramados]);

  const horarioIncluyeFestivos = (h: any): boolean =>
    h.festivos === true || h.festivos === 1 || h.festivos === '1';

  // ── Expandir TODOS los horarios de la ficha (pasado, presente y futuro) ───
  const fcEvents = useMemo(() => {
    const events: any[] = [];

    const processHorario = (h: any) => {
      const rango = resolveRangoFechas(h);
      if (!rango) return;

      const hIni = normalizeHora(h.horaInicial || h.horaInicio);
      const hFin = normalizeHora(h.horaFinal || h.horaFin);
      if (!hIni || !hFin) return;

      const jsDay = resolveJsDay(h);
      if (jsDay < 0) return;

      const idMateria = h.gradoMateria?.idMateria ?? h.gradoMateria?.materia?.id ?? null;
      const nombreComp = nombreMateriaHorario(h);
      const type =
        h.estado === 'PENDIENTE' || !h.idContrato
          ? 'sinAsignar'
          : h.estado === 'FINALIZADO' || h.estado === 'EVALUADO'
            ? 'finalizado'
            : h.estado === 'INTERRUMPIDO'
              ? 'interrumpido'
              : 'asignados';
      const colors =
        type === 'interrumpido'
          ? COLOR_INTERRUMPIDO
          : type === 'finalizado'
            ? COLOR_FINALIZADO
            : colorPorMateria(idMateria);

      const cursor = new Date(rango.start);
      cursor.setHours(0, 0, 0, 0);
      const endNorm = new Date(rango.end);
      endNorm.setHours(0, 0, 0, 0);

      while (cursor <= endNorm) {
        if (cursor.getDay() === jsDay) {
          const omitirPorFestivo =
            !horarioIncluyeFestivos(h) && isColombianHoliday(cursor, holidayDates);

          if (!omitirPorFestivo) {
            const dateStr = toLocalDateKey(cursor);

            const assignments = h.asignacion_sesion || h.asignacionSesion || [];
            const activeAsignacion = (Array.isArray(assignments) ? assignments : []).find((asig: any) => {
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
              title: nombreComp,
              start: `${dateStr}T${hIni}`,
              end: `${dateStr}T${hFin}`,
              backgroundColor: colors.bg,
              borderColor: colors.border,
              textColor: colors.text,
              extendedProps: {
                ...h,
                type,
                horaInicial: hIni,
                horaFinal: hFin,
                instructor: instructorHorario(h),
                activeAsignacion,
                allInstructors: [instructorHorario(h)].filter(Boolean),
                allAssignments: activeAsignacion ? [activeAsignacion] : [],
                isSharedSlot: !!activeAsignacion,
                _materiaFallback: nombreComp,
                _dateStr: dateStr,
                _colors: colors,
                idHorarioMateria: Number(h.id),
                numeroTrimestre: numeroTrimestreDesdeHorario(h),
              },
            });
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    };

    horariosProgramados.forEach(processHorario);

    // Agrupar clones del mismo estado sin fusionar el histórico INTERRUMPIDO
    // con una nueva programación activa creada en la misma franja.
    const grouped: any[] = [];
    events.forEach(ev => {
      const estado = String(ev.extendedProps.estado || '').toUpperCase();
      const key = `${ev.start}-${ev.end}-${ev.extendedProps.idGradoMateria}-${estado}`;
      const existing = grouped.find(g => {
        const estadoAgrupado = String(g.extendedProps.estado || '').toUpperCase();
        return `${g.start}-${g.end}-${g.extendedProps.idGradoMateria}-${estadoAgrupado}` === key;
      });
      if (existing) {
        const currentInstructor = instructorHorario(ev.extendedProps);
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
  }, [horariosProgramados, holidayDates]);

  /** Si el mes actual no tiene clases, abrir en el mes más cercano con programación. */
  const calendarInitialDate = useMemo(() => {
    if (!fcEvents.length) return undefined;
    const now = new Date();
    const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (fcEvents.some((e) => String(e.start || '').startsWith(ymNow))) return undefined;

    const hoyMs = now.getTime();
    let bestStart: string | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    fcEvents.forEach((e) => {
      const startStr = String(e.start || '').slice(0, 10);
      const d = parseDate(startStr);
      if (!d) return;
      const dist = Math.abs(d.getTime() - hoyMs);
      if (dist < bestDist) {
        bestDist = dist;
        bestStart = startStr;
      }
    });
    return bestStart || undefined;
  }, [fcEvents]);

  // Renderizado: bloque académico (hora + competencia + instructor)
  const renderEventContent = (arg: EventContentArg) => {
    const ev = arg.event.extendedProps;

    if (ev.isHoliday) {
      return null;
    }

    const hIni = ev.horaInicial || ev.horaInicio;
    const hFin = ev.horaFinal || ev.horaFin;
    const colors = ev._colors || colorPorMateria(ev.gradoMateria?.idMateria);
    const nombre = nombreMateriaHorario(ev);
    const instructor = instructorHorario(ev);
    const nombreInstructor = instructor
      ? `${instructor.nombre1 || ''} ${instructor.apellido1 || ''}`.trim()
      : '';
    const numeroTrimestre =
      parseNumeroGrado(ev.numeroTrimestre) ?? numeroTrimestreDesdeHorario(ev);
    const eventoEditable = !modoRmi && puedeEditarHorarioPorTrimestre(ev);

    return (
      <div
        className="w-full h-full min-h-[44px] px-1.5 py-1 rounded-md text-[10px] font-bold border overflow-hidden cursor-default select-none flex flex-col gap-0.5"
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text,
        }}
        onMouseEnter={(e) => setTooltip({ ev, x: e.clientX, y: e.clientY })}
        onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
        onMouseLeave={() => setTooltip(null)}
      >
        <div className="flex items-center justify-between gap-1 leading-tight shrink-0">
          <div className="flex items-center gap-1 min-w-0">
            <Clock size={10} className="shrink-0 opacity-70" />
            <span className="whitespace-nowrap">{format12h(hIni)} – {format12h(hFin)}</span>
            {ev.isSharedSlot && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />}
          </div>
          {numeroTrimestre != null && (
            <span
              className="shrink-0 px-1 py-px rounded text-[8px] font-black tracking-wide uppercase bg-black/10 dark:bg-white/15 opacity-90"
              title={`Trimestre ${numeroTrimestre}`}
            >
              T{numeroTrimestre}
            </span>
          )}
        </div>

        <p className="leading-snug font-black uppercase line-clamp-2 text-[9px] tracking-wide">
          {nombre}
        </p>

        {nombreInstructor ? (
          <p className="text-[8px] font-semibold opacity-80 truncate leading-tight">
            {nombreInstructor}
          </p>
        ) : (
          <p className="text-[8px] font-black uppercase text-orange-500 truncate">Sin instructor</p>
        )}

        {ev.estado && (
          <p className="text-[7px] font-black uppercase opacity-60 truncate">{ev.estado}</p>
        )}

        {eventoEditable && (
          <div className="flex justify-end items-center gap-1 mt-auto pt-0.5">
            {!ev.isSharedSlot && ev.estado === 'ASIGNADO' && (
              <button
                onMouseEnter={() => setTooltip(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!puedeEditarHorarioPorTrimestre(ev)) {
                    enqueueSnackbar('Solo puede modificarse el trimestre actual.', { variant: 'warning' });
                    return;
                  }
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

            {(ev.estado === 'ASIGNADO' || ev.estado === 'PENDIENTE') && (
              <>
                <button
                  onMouseEnter={() => setTooltip(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!puedeEditarHorarioPorTrimestre(ev)) {
                      enqueueSnackbar('Solo puede modificarse el trimestre actual.', { variant: 'warning' });
                      return;
                    }
                    setModalCierreHorario({ modo: 'interrumpir', horario: ev });
                  }}
                  className="rounded-full bg-gray-500/10 w-5 h-5 flex items-center justify-center text-gray-600 hover:text-gray-800 transition"
                  title="Interrumpir horario"
                >
                  <Ban size={11} />
                </button>
                <button
                  onMouseEnter={() => setTooltip(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!puedeEditarHorarioPorTrimestre(ev)) {
                      enqueueSnackbar('Solo puede modificarse el trimestre actual.', { variant: 'warning' });
                      return;
                    }
                    setModalCierreHorario({ modo: 'finalizar', horario: ev });
                  }}
                  className="rounded-full bg-black/10 w-5 h-5 flex items-center justify-center text-gray-700 hover:text-gray-900 transition"
                  title="Finalizar horario"
                >
                  <CheckCircle2 size={11} />
                </button>
              </>
            )}

            <button
              onMouseEnter={() => setTooltip(null)}
              onClick={(e) => {
                e.stopPropagation();
                handleEliminarHorario(ev);
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

  /** Clic en día del calendario → abre el modal existente de horario con fecha/día precargados. */
  const abrirCreacionDesdeDia = (date: Date) => {
    if (modoRmi || !permiteEdicion) return;
    if (materia?.idMateriaPadre == null) return;

    if (!(Number(materia?.horasTotales) > 0)) {
      enqueueSnackbar('Debes configurar el total de horas del RAP', { variant: 'error' });
      return;
    }
    if (materia?.estado === 'FINALIZADO') {
      enqueueSnackbar('No se pueden programar horarios para un RAP finalizado', { variant: 'error' });
      return;
    }

    const ymd = toLocalDateKey(date);
    const fechaFinalRap = materia?.fechaFinalRap;
    if (fechaFinalRap) {
      const fin = parseDate(fechaFinalRap);
      const sel = parseDate(ymd);
      if (fin && sel && sel.getTime() > fin.getTime()) {
        enqueueSnackbar('No se pueden crear horarios después de la fecha final del RAP', {
          variant: 'error',
        });
        return;
      }
    }

    onAddSchedule({ fechaInicio: ymd });
  };

  const handleDateClick = (arg: DateClickArg) => {
    abrirCreacionDesdeDia(arg.date);
  };

  const handleEliminarHorario = async (ev: any) => {
    if (modoRmi) return;

    if (!puedeEditarHorarioPorTrimestre(ev)) {
      enqueueSnackbar('Solo puede modificarse el trimestre actual. Este horario pertenece a un trimestre histórico.', {
        variant: 'warning',
      });
      return;
    }

    const idHorario = Number(ev?.idHorarioMateria ?? ev?.id);
    if (!Number.isFinite(idHorario) || idHorario <= 0) {
      enqueueSnackbar('No se pudo identificar el horario a eliminar', { variant: 'error' });
      return;
    }

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

  const toDateInputValue = (raw: any): string => {
    if (!raw) return '';
    const str = String(raw);
    const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : '';
  };

  const handleCerrarHorarioSubmit = async (fecha: string, observacion: string) => {
    if (!modalCierreHorario) return;
    const idHorario = Number(
      modalCierreHorario.horario?.idHorarioMateria ?? modalCierreHorario.horario?.id
    );
    if (!Number.isFinite(idHorario) || idHorario <= 0) {
      throw new Error('No se pudo identificar el horario');
    }

    const fechaFinal = fecha.includes('T') ? fecha.split('T')[0] : fecha;
    const fechaFinalActual = toDateInputValue(
      modalCierreHorario.horario?.fechaFinal ?? modalCierreHorario.horario?.fechaFin
    );
    const fechaInicial = toDateInputValue(
      modalCierreHorario.horario?.fechaInicial ?? modalCierreHorario.horario?.fechaInicio
    );

    if (fechaFinalActual && fechaFinal > fechaFinalActual) {
      throw new Error('La fecha no puede ser mayor que la fecha final actual del horario.');
    }
    if (fechaInicial && fechaFinal < fechaInicial) {
      throw new Error('La fecha no puede ser anterior a la fecha inicial del horario.');
    }

    const endpoint =
      modalCierreHorario.modo === 'interrumpir'
        ? `horarios/materia/${idHorario}/interrumpir`
        : `horarios/materia/${idHorario}/finalizar`;

    try {
      const res = await axios.put(endpoint, {
        fechaFinal,
        observacion: observacion.trim() || undefined,
      });
      const nuevoEstado = modalCierreHorario.modo === 'interrumpir' ? 'INTERRUMPIDO' : 'FINALIZADO';
      setHorariosFicha((prev) =>
        prev.map((h) =>
          Number(h.id) === idHorario
            ? { ...h, fechaFinal, estado: nuevoEstado }
            : h
        )
      );
      enqueueSnackbar(
        res.data?.message ||
          (modalCierreHorario.modo === 'interrumpir'
            ? 'Horario interrumpido correctamente'
            : 'Horario finalizado correctamente'),
        { variant: 'success' }
      );
      setModalCierreHorario(null);
      void refrescarHorariosFromApi();
      cargarRaps?.();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; error?: string } } };
      throw new Error(
        ax.response?.data?.message ||
          ax.response?.data?.error ||
          'Error al actualizar el horario'
      );
    }
  };

  if (!isOpen) return null;

  // Solo la primera carga muestra spinner completo. Los refrescos mantienen FullCalendar montado
  // para no perder mes/semana/día ni el contexto del RAP.
  if (!initialLoadComplete) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
        <ModalContent className="w-full max-w-4xl h-[85vh] flex flex-col p-0 shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-600 rounded-2xl overflow-hidden">
          <ModalHeader className="px-6 pr-16 py-3 flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-coal-500 shrink-0 border-b border-gray-100 dark:border-coal-600 relative z-[20]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><CalendarIcon size={20} /></div>
              <div className="min-w-0 text-left">
                <ModalTitle className="text-md font-black uppercase tracking-tight dark:text-white truncate">Programación de la ficha</ModalTitle>
                <p className="text-3xs text-gray-500 font-semibold uppercase max-w-xl">
                  Vista completa · Entrada: {materia.nombre || materia.nombreMateria}
                </p>
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
                <ModalTitle className="text-md font-black uppercase tracking-tight dark:text-white truncate">Programación de la ficha</ModalTitle>
                <p className="text-3xs text-gray-500 font-semibold uppercase max-w-xl">
                  Vista completa · Entrada: {materia.nombre || materia.nombreMateria}
                  {maxNumeroTrimestre > 0 ? (
                    <span className="ml-2 text-primary">· Editable: T{maxNumeroTrimestre}</span>
                  ) : null}
                </p>
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
              .fc .fc-daygrid-day { min-height: 110px; }
              .fc .fc-daygrid-day-frame { min-height: 110px; }
              ${!modoRmi && permiteEdicion && materia?.idMateriaPadre != null ? `
              .fc .fc-daygrid-day:not(.fc-day-other) {
                cursor: pointer;
              }
              .fc .fc-daygrid-day:not(.fc-day-other):hover {
                background-color: rgba(59, 130, 246, 0.06) !important;
              }
              ` : ''}
              .fc td, .fc th { border-color: #f3f4f6 !important; }
              /* Evento bloque académico */
              .fc .fc-daygrid-event {
                border-radius: 6px !important;
                margin: 2px 3px !important;
                background: transparent !important;
                border: none !important;
                white-space: normal !important;
              }
              .fc .fc-daygrid-block-event .fc-event-main { padding: 0 !important; }
              .fc .fc-event-main { padding: 0 !important; }
              .fc .fc-timegrid-event {
                border-radius: 6px !important;
                background: transparent !important;
                border: none !important;
                box-shadow: none !important;
              }
              .fc .fc-timegrid-event .fc-event-main { padding: 0 !important; height: 100%; }
              .fc .fc-daygrid-event-harness { margin-top: 2px !important; }
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
              initialDate={calendarInitialDate}
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
              displayEventTime={false}
              eventContent={renderEventContent}
              editable={false}
              selectable={false}
              dateClick={!modoRmi && permiteEdicion ? handleDateClick : undefined}
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

          {!modoRmi && permiteEdicion && (
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
              void refrescarHorariosFromApi();
              cargarRaps?.();
            }}
            idMateria={materia.idMateria || materia.id}
            horario={horarioAsignacionSesion}
            fechaSeleccionada={fechaSeleccionada}
          />
        )}

        {modalCierreHorario && (
          <ModalActividadFechaMotivo
            open={!!modalCierreHorario}
            onClose={() => setModalCierreHorario(null)}
            zIndex={130}
            title={
              modalCierreHorario.modo === 'interrumpir'
                ? 'Interrumpir horario'
                : 'Finalizar horario'
            }
            fechaLabel={
              modalCierreHorario.modo === 'interrumpir'
                ? 'Fecha hasta la cual permanecerá interrumpido'
                : 'Fecha efectiva de finalización'
            }
            descripcionLabel="Motivo / observación"
            descripcionPlaceholder="Indique el motivo del cambio..."
            fechaInputType="date"
            initialFecha={toDateInputValue(
              modalCierreHorario.horario?.fechaFinal ?? modalCierreHorario.horario?.fechaFin
            )}
            submitButtonText="+ ACEPTAR"
            onSubmit={async (fecha, descripcion) => {
              await handleCerrarHorarioSubmit(fecha, descripcion);
            }}
          />
        )}
      </div>
    </>
  );
};
