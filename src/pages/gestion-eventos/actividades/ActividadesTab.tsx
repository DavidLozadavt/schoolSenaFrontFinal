import { useEffect, useState, useMemo, useRef } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import Swal from 'sweetalert2';
import clsx from 'clsx';
import { ModalEstado } from './ModalEstado';
import { ModalForm } from './ModalForm';

interface Item {
  id: number;
  nombreItem: string;
  descripcion: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  seleccionar: boolean;
  created_at?: string;
}

const fmtHora = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const fmtFechaHora = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const duracionMin = (inicio: string | null, fin: string | null): number => {
  if (!inicio || !fin) return 0;
  return Math.max(0, Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 60000));
};

const getSwalTheme = () => {
  const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
  const isDark = theme === 'dark';
  return {
    background: isDark ? '#1B1C22' : '#F9F9F9',
    color: isDark ? 'white' : '#4B5675',
    iconColor: isDark ? 'white' : '#4B5675'
  };
};

const DOT_COLORS = ['bg-primary', 'bg-info', 'bg-success', 'bg-warning', 'bg-danger'];
const BADGE_COLORS = [
  'badge-primary',
  'badge-info',
  'badge-success',
  'badge-warning',
  'badge-danger'
];

interface TimelineCardProps {
  item: Item;
  index: number;
  isLast: boolean;
  onEditar: (item: Item) => void;
  onEliminar: (id: number) => void;
  onVerEstado: (id: number) => void;
}

const TimelineCard: React.FC<TimelineCardProps> = ({
  item,
  index,
  isLast,
  onEditar,
  onEliminar,
  onVerEstado
}) => {
  const dur = duracionMin(item.hora_inicio, item.hora_fin);
  const dotColor = DOT_COLORS[index % DOT_COLORS.length];
  const badgeColor = BADGE_COLORS[index % BADGE_COLORS.length];

  return (
    <div className="flex gap-4 sm:gap-6 group">
      {/* Sleek Connector Pin */}
      <div className="flex flex-col items-center pt-2 shrink-0 w-8">
        <div
          className={clsx(
            'w-4 h-4 rounded-full border-[3px] border-white dark:border-zinc-950 shadow-[0_0_10px_rgba(0,0,0,0.1)] shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_12px_rgba(249,115,22,0.3)]',
            dotColor === 'bg-primary' ? 'bg-orange-500' : dotColor
          )}
        />
        {!isLast && (
          <div className="w-[2px] flex-1 mt-2.5 bg-gradient-to-b from-gray-200 dark:from-zinc-800 to-transparent" />
        )}
      </div>

      {/* Premium Content Box */}
      <div className="flex-1 mb-6 bg-white dark:bg-zinc-900/90 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-stretch">
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
              <div className="flex items-center gap-2.5">
                <span className={clsx('px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400')}>
                  Actividad #{String(index + 1).padStart(2, '0')}
                </span>
                {item.hora_inicio && (
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-800/40 px-2 py-0.5 rounded-lg">
                    <KeenIcon icon="calendar" className="text-sm" />
                    {fmtFechaHora(item.hora_inicio)}
                  </span>
                )}
              </div>
            </div>

            <h4 className="text-base sm:text-lg font-black text-neutral-800 dark:text-white leading-tight uppercase italic tracking-wide group-hover:text-orange-500 transition-colors">
              {item.nombreItem}
            </h4>

            {item.descripcion && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 leading-relaxed font-medium italic pl-3 border-l-2 border-orange-500/20 max-w-xl">
                {item.descripcion}
              </p>
            )}
          </div>

          {(item.hora_inicio || item.hora_fin || dur > 0) && (
            <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-gray-100 dark:border-zinc-800/60">
              {item.hora_inicio && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  <KeenIcon icon="time" className="text-sm shrink-0" />
                  <span className="font-black text-[9px] uppercase tracking-[0.1em]">Inicio: {fmtHora(item.hora_inicio)}</span>
                </span>
              )}
              {item.hora_fin && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">
                  <KeenIcon icon="flag" className="text-sm shrink-0" />
                  <span className="font-black text-[9px] uppercase tracking-[0.1em]">Fin: {fmtHora(item.hora_fin)}</span>
                </span>
              )}
              {dur > 0 && (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                  <KeenIcon icon="timer" className="text-sm shrink-0" />
                  <span className="font-black text-[9px] uppercase tracking-[0.1em]">{dur >= 60 ? `${Math.floor(dur / 60)}h ${dur % 60}m` : `${dur} min`}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Action Buttons Sidebar */}
        <div className="bg-gray-50/50 dark:bg-black/10 px-5 py-4 sm:py-0 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-zinc-800 flex sm:flex-col justify-center gap-3 shrink-0">
          <button
            className="flex-1 sm:flex-initial group/btn relative h-10 w-full sm:w-11 bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center rounded-xl shadow-md transition-all hover:scale-[1.05] active:scale-95"
            title="Ver estado de invitados"
            onClick={() => onVerEstado(item.id)}
          >
            <KeenIcon icon="people" className="text-lg" />
          </button>
          
          <button
            className="flex-1 sm:flex-initial group/btn relative h-10 w-full sm:w-11 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-orange-500 hover:text-white flex items-center justify-center rounded-xl border border-gray-200 dark:border-zinc-700 transition-all hover:scale-[1.05] active:scale-95"
            title="Editar"
            onClick={() => onEditar(item)}
          >
            <KeenIcon icon="pencil" className="text-lg" />
          </button>

          <button
            className="flex-1 sm:flex-initial group/btn relative h-10 w-full sm:w-11 bg-rose-50/50 dark:bg-rose-950/20 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-100 dark:border-rose-950/30 flex items-center justify-center rounded-xl transition-all hover:scale-[1.05] active:scale-95"
            title="Eliminar"
            onClick={() => onEliminar(item.id)}
          >
            <KeenIcon icon="trash" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ActividadesTab: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [itemEditar, setItemEditar] = useState<Item | null>(null);

  const [estadoOpen, setEstadoOpen] = useState(false);
  const [estadoItemId, setEstadoItemId] = useState<number | null>(null);

  const [idEventoSeleccionado, setIdEventoSeleccionado] = useState<number | string>('');
  const [eventos, setEventos] = useState<{ idEvento: number; nombre: string }[]>([]);
  const [isOpenEventSelect, setIsOpenEventSelect] = useState(false);
  const eventSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventSelectRef.current && !eventSelectRef.current.contains(event.target as Node)) {
        setIsOpenEventSelect(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = idEventoSeleccionado ? { idEvento: idEventoSeleccionado } : {};
      const { data } = await axios.get<Item[]>('/items', { params });
      setItems(data);
    } catch {
      enqueueSnackbar('Error al cargar actividades', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar la lista de eventos para filtrar
    axios
      .get('/eventos-multimedia?per_page=100')
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setEventos(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('Error al cargar eventos:', err));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [idEventoSeleccionado]);

  const itemsFiltrados = useMemo(() => {
    const texto = buscar.toLowerCase();
    return items
      .filter(
        (i) =>
          !texto ||
          i.nombreItem.toLowerCase().includes(texto) ||
          (i.descripcion ?? '').toLowerCase().includes(texto)
      )
      .sort((a, b) => {
        const fa = a.hora_inicio ? new Date(a.hora_inicio).getTime() : a.id * 1e12;
        const fb = b.hora_inicio ? new Date(b.hora_inicio).getTime() : b.id * 1e12;
        return fa - fb;
      });
  }, [items, buscar]);

  const totalMinutos = items.reduce((acc, i) => acc + duracionMin(i.hora_inicio, i.hora_fin), 0);

  const handleEliminar = (id: number) => {
    const theme = getSwalTheme();
    Swal.fire({
      title: '¿Eliminar actividad?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: theme.background,
      color: theme.color,
      iconColor: theme.iconColor,
      customClass: {
        confirmButton: 'btn btn-sm btn-danger',
        cancelButton: 'btn btn-sm btn-light'
      }
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        await axios.delete(`/items/${id}`);
        enqueueSnackbar('Actividad eliminada', { variant: 'success' });
        fetchItems();
      } catch {
        enqueueSnackbar('Error al eliminar', { variant: 'error' });
      }
    });
  };

  const handleEditar = (item: Item) => {
    setItemEditar(item);
    setModalOpen(true);
  };

  const handleNuevo = () => {
    setItemEditar(null);
    setModalOpen(true);
  };

  const handleVerEstado = (id: number) => {
    setEstadoItemId(id);
    setEstadoOpen(true);
  };

  return (
    <div className="py-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-6 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(249,115,22,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
              <KeenIcon icon="calendar-tick" className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Total Actividades">Total Actividades</p>
              <p className="text-2xl font-black text-neutral-800 dark:text-white italic leading-none">{items.length}</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-6 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-warning text-white flex items-center justify-center shadow-[0_10px_20px_rgba(245,158,11,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
              <KeenIcon icon="timer" className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Duración Total">Duración Total</p>
              <p className="text-2xl font-black text-neutral-800 dark:text-white italic leading-none">
                {Math.floor(totalMinutos / 60)}h {totalMinutos % 60}m
              </p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-6 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-info text-white flex items-center justify-center shadow-[0_10px_20px_rgba(6,182,212,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
              <KeenIcon icon="time" className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Con Horario">Con Horario</p>
              <p className="text-2xl font-black text-neutral-800 dark:text-white italic leading-none">
                {items.filter((i) => i.hora_inicio).length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-6 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-success text-white flex items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
              <KeenIcon icon="verify" className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Programadas">Programadas</p>
              <p className="text-2xl font-black text-neutral-800 dark:text-white italic leading-none">
                {items.filter((i) => i.hora_inicio).length > 0
                  ? Math.round((items.filter((i) => i.hora_inicio).length / items.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* barra de acciones */}
      <div className="bg-white dark:bg-zinc-900/90 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-sm p-6 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <KeenIcon
              icon="magnifier"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            />
            <input
              type="text"
              placeholder="Buscar actividad por nombre o descripción…"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
            />
          </div>
          <div className="relative flex-1 min-w-[260px]" ref={eventSelectRef}>
            <button
              type="button"
              onClick={() => setIsOpenEventSelect(!isOpenEventSelect)}
              className="w-full pl-4 pr-10 py-3 text-left text-sm rounded-2xl border border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <span className="truncate">
                {idEventoSeleccionado 
                  ? eventos.find(e => String(e.idEvento) === String(idEventoSeleccionado))?.nombre || '-- Todos los eventos (Global) --'
                  : '-- Todos los eventos (Global) --'}
              </span>
              <KeenIcon
                icon="down"
                className={`text-gray-450 transition-transform duration-200 text-xs ${isOpenEventSelect ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpenEventSelect && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xl max-h-60 overflow-y-auto no-scrollbar animate-fade-in">
                <div className="p-1.5 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIdEventoSeleccionado('');
                      setIsOpenEventSelect(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl transition-all duration-150 ${
                      idEventoSeleccionado === ''
                        ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    -- Todos los eventos (Global) --
                  </button>
                  {eventos.map((e) => (
                    <button
                      key={e.idEvento}
                      type="button"
                      onClick={() => {
                        setIdEventoSeleccionado(e.idEvento);
                        setIsOpenEventSelect(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-sm rounded-xl transition-all duration-150 truncate ${
                        String(idEventoSeleccionado) === String(e.idEvento)
                          ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold'
                          : 'text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      {e.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            className="group/btn relative h-12 px-6 bg-orange-500 text-white font-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto"
            onClick={handleNuevo}
          >
            <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            <div className="relative z-10 flex items-center gap-2">
              <KeenIcon icon="plus" className="text-base group-hover/btn:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-black">Nueva actividad</span>
            </div>
          </button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <KeenIcon icon="loading" className="animate-spin text-2xl mr-2" />
          <span>Cargando actividades…</span>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <KeenIcon icon="calendar-remove" className="text-4xl" />
          <p className="text-sm">No hay actividades registradas</p>
          <button className="btn btn-sm btn-light-primary mt-2" onClick={handleNuevo}>
            Crear primera actividad
          </button>
        </div>
      ) : (
        <div className="relative pl-1 sm:pl-2">
          {itemsFiltrados.map((item, index) => (
            <TimelineCard
              key={item.id}
              item={item}
              index={index}
              isLast={index === itemsFiltrados.length - 1}
              onEditar={handleEditar}
              onEliminar={handleEliminar}
              onVerEstado={handleVerEstado}
            />
          ))}
        </div>
      )}

      {/* Modal Formulario */}
      <ModalForm
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchItems}
        itemEditar={itemEditar}
        defaultIdEvento={idEventoSeleccionado ? Number(idEventoSeleccionado) : null}
      />

      {/* Modal Estado por item */}
      <ModalEstado
        open={estadoOpen}
        onClose={() => {
          setEstadoOpen(false);
          setEstadoItemId(null);
        }}
        itemId={estadoItemId}
      />
    </div>
  );
};

export default ActividadesTab;
