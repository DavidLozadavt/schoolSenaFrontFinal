import React, { useMemo } from 'react';
import { X } from 'lucide-react';
import logoSena from '/media/images/sena/logo-sena.png';
import { Instructor, HorarioMateria } from './interfaceInstructor';

interface HorarioMensualProps {
  isOpen: boolean;
  onClose: () => void;
  instructor: Instructor;
  periodo?: string; // "2025-12"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DIAS_LABEL = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

// idDia backend: 1=Lun … 6=Sab, 7=Dom  /  js getDay(): 0=Dom, 1=Lun … 6=Sab
function idDiaToJsDay(idDia: number): number {
  return idDia === 7 ? 0 : idDia;
}

function parseLocalDate(str: string): Date {
  const [y, m, d] = str.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatHora12(time: string): string {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mStr ?? '00'} ${ampm}`;
}

function buildMonthDays(year: number, month: number): (Date | null)[] {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1; // semana empieza en lunes
  const total = new Date(year, month + 1, 0).getDate();
  const arr: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= total; d++) arr.push(new Date(year, month, d));
  return arr;
}

/** Días del mes (números) en que aplica el horario según su idDia y rango de fechas */
function getDiasActivos(h: HorarioMateria, year: number, month: number): Set<number> {
  const jsDay = idDiaToJsDay(h.idDia);
  const start = parseLocalDate(h.fechaInicial);
  const end = parseLocalDate(h.fechaFinal);
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const from = start < firstOfMonth ? firstOfMonth : start;
  const to = end > lastOfMonth ? lastOfMonth : end;

  const active = new Set<number>();
  const cursor = new Date(from);
  while (cursor <= to) {
    if (cursor.getDay() === jsDay) active.add(cursor.getDate());
    cursor.setDate(cursor.getDate() + 1);
  }
  return active;
}

// ─── Agrupación de filas (una por franja horaria única) ───────────────────────
interface Fila {
  key: string;
  horaInicial: string;
  horaFinal: string;
  duracionHoras: number;
  diasActivos: number[]; // idDia 1-7 con horario en esta franja
  activosPorDia: Map<number, Set<number>>; // idDia → días del mes activos
  horasMes: number;
}

function agruparFilas(horarios: HorarioMateria[], year: number, month: number): Fila[] {
  const map = new Map<string, Fila>();

  for (const h of horarios) {
    const key = `${h.horaInicial}|${h.horaFinal}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        horaInicial: h.horaInicial,
        horaFinal: h.horaFinal,
        duracionHoras: h.duracionSesion, // ← duración de una sesión
        diasActivos: [],
        activosPorDia: new Map(),
        horasMes: 0
      });
    }

    const fila = map.get(key)!;
    const diasMes = getDiasActivos(h, year, month);

    if (!fila.diasActivos.includes(h.idDia)) fila.diasActivos.push(h.idDia);
    fila.activosPorDia.set(h.idDia, diasMes);
    fila.horasMes += diasMes.size * h.duracionSesion; // ← usa duracionSesion
  }

  return Array.from(map.values()).sort((a, b) => a.horaInicial.localeCompare(b.horaInicial));
}

// ─── Mini Calendario ──────────────────────────────────────────────────────────
const MiniCalendario: React.FC<{
  year: number;
  month: number;
  diasResaltados: Set<number>;
}> = ({ year, month, diasResaltados }) => {
  const days = buildMonthDays(year, month);
  return (
    <div className="min-w-[130px]">
      <div className="grid grid-cols-7 gap-0">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-[7px] font-black text-center text-gray-500 uppercase pb-0.5">
            {d}
          </div>
        ))}
        {days.map((date, i) =>
          date ? (
            <div key={i} className="flex items-center justify-center">
              <span
                className={`text-[8px] w-4 h-4 flex items-center justify-center rounded-sm font-semibold ${
                  diasResaltados.has(date.getDate()) ? 'bg-green-500 text-white' : 'text-gray-400'
                }`}
              >
                {date.getDate()}
              </span>
            </div>
          ) : (
            <div key={i} className="w-4 h-4" />
          )
        )}
      </div>
    </div>
  );
};

// ─── Componente Principal ─────────────────────────────────────────────────────
const HorarioMensual: React.FC<HorarioMensualProps> = ({
  isOpen,
  onClose,
  instructor,
  periodo
}) => {
  if (!isOpen) return null;

  const { persona } = instructor;
  const fullName = [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2]
    .filter(Boolean)
    .join(' ');

  const [year, month] = useMemo(() => {
    if (periodo) {
      const [y, m] = periodo.split('-').map(Number);
      return [y, m - 1];
    }
    const now = new Date();
    return [now.getFullYear(), now.getMonth()];
  }, [periodo]);

  const periodoLabel = new Date(year, month, 2).toLocaleDateString('es-CO', {
    month: 'long',
    year: 'numeric'
  });
  const nombreMes = new Date(year, month, 1)
    .toLocaleDateString('es-CO', { month: 'long' })
    .toUpperCase();

  const horarios = useMemo(
    () => instructor.horarios.filter((h) => h.estado === 'ASIGNADO'),
    [instructor.horarios]
  );

  const filas = useMemo(() => agruparFilas(horarios, year, month), [horarios, year, month]);
  const totalHorasMes = useMemo(() => filas.reduce((acc, f) => acc + f.horasMes, 0), [filas]);

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-200 dark:border-coal-300">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-coal-300 bg-white dark:bg-coal-500 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 dark:bg-yellow-500/10 rounded-lg">
              <i className="ki-outline ki-calendar text-yellow-600 dark:text-yellow-400 text-xl" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-gray-800 dark:text-white">
                Horario Mensual del Instructor
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{periodoLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-gray-400 border border-gray-200 dark:border-coal-300 rounded-full hover:bg-red-500 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-5 bg-gray-50 dark:bg-coal-600">
          {/* Encabezado estilo RMI */}
          <div className="mb-5 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
            <div className="bg-primary text-white text-center py-2">
              <p className="text-xs font-black uppercase tracking-widest">
                Horario Mensual del Instructor
              </p>
            </div>
            <div className="grid grid-cols-[auto_1fr] divide-x divide-gray-200 dark:divide-coal-300 bg-white dark:bg-coal-500">
              <div className="flex items-center justify-center px-4 py-3">
                <img src={logoSena} alt="SENA" className="h-16 w-auto object-contain" />
              </div>
              <div className="grid grid-cols-2 divide-x divide-gray-200 dark:divide-coal-300">
                <div className="divide-y divide-gray-200 dark:divide-coal-300">
                  <div className="px-4 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Nombre</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-white uppercase">
                      {fullName}
                    </p>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Cédula</p>
                    <p className="text-xs font-bold text-gray-800 dark:text-white">
                      {persona.identificacion}
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-coal-300">
                  <div className="px-4 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">
                      Correo Electrónico
                    </p>
                    <p className="text-xs font-bold text-gray-800 dark:text-white">
                      {persona.email}
                    </p>
                  </div>
                  <div className="px-4 py-2">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">
                      Número de Contacto
                    </p>
                    <p className="text-xs font-bold text-gray-800 dark:text-white">
                      {persona.celular}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de horario */}
          {filas.length === 0 ? (
            <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 text-sm">
              No hay horarios asignados para este periodo
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  {/* Fila 1: secciones HORARIO / MES / HORAS MES */}
                  <tr className="bg-primary text-white">
                    <th
                      colSpan={7}
                      className="px-3 py-2 text-center font-black uppercase tracking-widest border-r border-primary"
                    >
                      HORARIO
                      <div className="text-[9px] font-medium normal-case opacity-80">
                        Formato 24 horas
                      </div>
                    </th>
                    <th
                      colSpan={8}
                      className="px-3 py-2 text-center font-black uppercase tracking-widest border-r border-primary"
                    >
                      {nombreMes}
                    </th>
                    <th className="px-3 py-2 text-center font-black uppercase whitespace-nowrap leading-tight">
                      HORAS
                      <br />
                      MES
                    </th>
                  </tr>
                  {/* Fila 2: etiquetas de días */}
                  <tr className="bg-primary/80 text-white">
                    {DIAS_LABEL.map((d, i) => (
                      <th
                        key={i}
                        className="w-10 px-2 py-1.5 text-center font-black text-[10px] border-r border-cyan-300/50 last:border-r-0"
                      >
                        {d}
                      </th>
                    ))}
                    <th colSpan={8} className="px-2 py-1.5 border-l border-cyan-300/50" />
                    <th className="border-l border-cyan-300/50" />
                  </tr>
                </thead>

                <tbody>
                  {filas.map((fila, idx) => {
                    const diasMesUnion = new Set<number>();
                    fila.activosPorDia.forEach((dias) => dias.forEach((d) => diasMesUnion.add(d)));

                    return (
                      <tr
                        key={fila.key}
                        className={`border-t border-gray-200 dark:border-coal-300 ${
                          idx % 2 === 0
                            ? 'bg-white dark:bg-coal-500'
                            : 'bg-gray-50/60 dark:bg-coal-600'
                        }`}
                      >
                        {/* Columnas L M M J V S D */}
                        {[1, 2, 3, 4, 5, 6, 7].map((idDia) => (
                          <td
                            key={idDia}
                            className="px-1 py-3 text-center border-r border-gray-100 dark:border-coal-300 align-middle"
                            style={{ minWidth: 72 }}
                          >
                            {fila.diasActivos.includes(idDia) && (
                              <span className="block text-[10px] font-semibold text-gray-700 dark:text-gray-200 leading-tight whitespace-nowrap">
                                {formatHora12(fila.horaInicial)}
                                <br />
                                <span className="text-gray-400 dark:text-gray-500">-</span>
                                <br />
                                {formatHora12(fila.horaFinal)}
                              </span>
                            )}
                          </td>
                        ))}
                        {/* Mini calendario */}
                        <td
                          colSpan={8}
                          className="px-3 py-2 border-l border-gray-200 dark:border-coal-300 align-middle"
                        >
                          <MiniCalendario year={year} month={month} diasResaltados={diasMesUnion} />
                        </td>

                        {/* Horas del mes para esta franja */}
                        <td className="px-3 py-2 text-center border-l border-gray-200 dark:border-coal-300 align-middle">
                          <span className="text-sm font-black text-gray-800 dark:text-white">
                            {Math.round(fila.horasMes)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Fila total */}
                  <tr className="border-t-2 border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20">
                    <td
                      colSpan={7}
                      className="px-4 py-3 text-right font-black text-xs text-gray-700 dark:text-white uppercase tracking-wider border-r border-gray-200 dark:border-coal-300"
                    >
                      TOTAL HORAS FORMACIÓN MES
                    </td>
                    <td colSpan={8} className="border-l border-gray-200 dark:border-coal-300" />
                    <td className="px-3 py-3 text-center border-l border-primary">
                      <span className="text-lg font-black text-cyan-600 dark:text-primary">
                        {Math.round(totalHorasMes)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-coal-300 bg-white dark:bg-coal-500 flex justify-end gap-2 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all">
            <i className="ki-outline ki-file-down text-base" /> Exportar Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all">
            <i className="ki-outline ki-printer text-base" /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
          >
            <X size={13} /> Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default HorarioMensual;
