import { useEffect, useState, useMemo } from 'react';
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
    <div className="flex gap-3 sm:gap-5 group">
      <div className="flex flex-col items-center pt-1" style={{ minWidth: 16 }}>
        <div
          className={clsx(
            'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-md shrink-0 transition-transform duration-200 group-hover:scale-125',
            dotColor
          )}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1.5 bg-gradient-to-b from-gray-300 to-transparent dark:from-zinc-600" />
        )}
      </div>

      <div className="card flex-1 mb-5 border border-gray-200 dark:border-zinc-700 transition-all duration-200 hover:shadow-md">
        <div className="card-body py-3 px-4 sm:py-4 sm:px-5">
          <div className="flex items-start sm:items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx('badge badge-outline text-xs font-semibold', badgeColor)}>
                #{String(index + 1).padStart(2, '0')}
              </span>
              {item.hora_inicio && (
                <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                  {fmtFechaHora(item.hora_inicio)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                className="btn btn-xs btn-icon btn-light-primary"
                title="Ver estado de invitados"
                onClick={() => onVerEstado(item.id)}
              >
                <KeenIcon icon="people" />
              </button>
              <button
                className="btn btn-xs btn-icon btn-light"
                title="Editar"
                onClick={() => onEditar(item)}
              >
                <KeenIcon icon="pencil" />
              </button>
              <button
                className="btn btn-xs btn-icon btn-light-danger"
                title="Eliminar"
                onClick={() => onEliminar(item.id)}
              >
                <KeenIcon icon="trash" />
              </button>
            </div>
          </div>

          <h5 className="text-sm sm:text-base font-semibold mt-2.5 text-gray-800 dark:text-white leading-tight">
            {item.nombreItem}
          </h5>

          {item.descripcion && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">
              {item.descripcion}
            </p>
          )}

          {(item.hora_inicio || item.hora_fin || dur > 0) && (
            <div className="flex flex-wrap gap-3 sm:gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 text-xs text-gray-500">
              {item.hora_inicio && (
                <span className="flex items-center gap-1.5">
                  <KeenIcon icon="time" className="text-primary text-sm" />
                  Inicio: {fmtHora(item.hora_inicio)}
                </span>
              )}
              {item.hora_fin && (
                <span className="flex items-center gap-1.5">
                  <KeenIcon icon="flag" className="text-danger text-sm" />
                  Fin: {fmtHora(item.hora_fin)}
                </span>
              )}
              {dur > 0 && (
                <span className="flex items-center gap-1.5">
                  <KeenIcon icon="timer" className="text-warning text-sm" />
                  {dur >= 60 ? `${Math.floor(dur / 60)}h ${dur % 60}min` : `${dur} min`}
                </span>
              )}
            </div>
          )}
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

  const fetchItems = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get<Item[]>('/items');
      setItems(data);
    } catch {
      enqueueSnackbar('Error al cargar actividades', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
    <div>
      {/* stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="card border border-gray-200 dark:border-zinc-700">
          <div className="card-body py-3 sm:py-4 px-4 sm:px-5 flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <KeenIcon icon="calendar-tick" className="text-primary text-lg sm:text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {items.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card border border-gray-200 dark:border-zinc-700">
          <div className="card-body py-3 sm:py-4 px-4 sm:px-5 flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <KeenIcon icon="timer" className="text-warning text-lg sm:text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Duración total
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {Math.floor(totalMinutos / 60)}h {totalMinutos % 60}m
              </p>
            </div>
          </div>
        </div>

        <div className="card border border-gray-200 dark:border-zinc-700 sm:col-span-2 lg:col-span-1">
          <div className="card-body py-3 sm:py-4 px-4 sm:px-5 flex items-center gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
              <KeenIcon icon="people" className="text-info text-lg sm:text-xl" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Con horario
              </p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">
                {items.filter((i) => i.hora_inicio).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* barra de acciones */}
      <div className="card mb-6 border border-gray-200 dark:border-zinc-700">
        <div className="card-body py-3 px-4 sm:px-5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <KeenIcon
                icon="magnifier"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              />
              <input
                type="text"
                placeholder="Buscar actividad…"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                className="input input-sm pl-9 rounded w-full"
              />
            </div>
            <button
              className="btn btn-sm btn-primary flex items-center gap-2 shrink-0"
              onClick={handleNuevo}
            >
              <KeenIcon icon="plus" />
              <span className="hidden xs:inline">Nueva actividad</span>
              <span className="xs:hidden">Nueva</span>
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <KeenIcon icon="loading" className="animate-spin text-2xl mr-2" />
          Cargando actividades…
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
