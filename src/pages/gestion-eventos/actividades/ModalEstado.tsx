import { useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import clsx from 'clsx';

interface EstadoInvitado {
  id: number;
  nombre: string;
  fecha_scan?: string | null;
}

interface EstadoItem {
  item: {
    id: number;
    nombreItem: string;
    hora_inicio: string | null;
    hora_fin: string | null;
  };
  recibieron: EstadoInvitado[];
  no_recibieron: EstadoInvitado[];
  total_recibieron: number;
  total_no_recibieron: number;
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

interface ModalEstadoProps {
  open: boolean;
  onClose: () => void;
  itemId: number | null;
}

export const ModalEstado: React.FC<ModalEstadoProps> = ({ open, onClose, itemId }) => {
  const [estado, setEstado] = useState<EstadoItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [vista, setVista] = useState<'recibieron' | 'no_recibieron'>('recibieron');

  useEffect(() => {
    if (!open || !itemId) return;
    setBuscar('');
    setVista('recibieron');
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<EstadoItem>(`/items/${itemId}/estado`);
        setEstado(data);
      } catch {
        setEstado(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [open, itemId]);

  const lista = estado
    ? (vista === 'recibieron' ? estado.recibieron : estado.no_recibieron).filter((p) =>
        p.nombre?.toLowerCase().includes(buscar.toLowerCase())
      )
    : [];

  const total = estado
    ? vista === 'recibieron'
      ? estado.total_recibieron
      : estado.total_no_recibieron
    : 0;

  const porcentaje =
    estado && estado.total_recibieron + estado.total_no_recibieron > 0
      ? Math.round(
          (estado.total_recibieron / (estado.total_recibieron + estado.total_no_recibieron)) * 100
        )
      : 0;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[580px] top-[6%] p-4">
        <ModalHeader>
          <ModalTitle>
            {estado ? (
              <span className="truncate block max-w-[420px]">{estado.item.nombreItem}</span>
            ) : (
              'Estado del ítem'
            )}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="px-0 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
              <span className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              Cargando estado…
            </div>
          ) : !estado ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No se pudo cargar la información
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Info horario */}
              {(estado.item.hora_inicio || estado.item.hora_fin) && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 px-1">
                  {estado.item.hora_inicio && (
                    <span className="flex items-center gap-1.5">
                      <KeenIcon icon="time" className="text-primary text-sm" />
                      Inicio: {fmtHora(estado.item.hora_inicio)}
                    </span>
                  )}
                  {estado.item.hora_fin && (
                    <span className="flex items-center gap-1.5">
                      <KeenIcon icon="flag" className="text-danger text-sm" />
                      Fin: {fmtHora(estado.item.hora_fin)}
                    </span>
                  )}
                </div>
              )}

              {/* Barra de progreso */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>
                    {estado.total_recibieron} de{' '}
                    {estado.total_recibieron + estado.total_no_recibieron} invitados recibieron
                  </span>
                  <span className="font-semibold text-gray-700 dark:text-white">{porcentaje}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all duration-500"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              {/* Tabs recibieron / no recibieron */}
              <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <button
                  onClick={() => setVista('recibieron')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                    vista === 'recibieron'
                      ? 'bg-success/10 text-success'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-success inline-block" />
                  Recibieron ({estado.total_recibieron})
                </button>
                <div className="w-px bg-gray-200 dark:bg-zinc-700" />
                <button
                  onClick={() => setVista('no_recibieron')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
                    vista === 'no_recibieron'
                      ? 'bg-danger/10 text-danger'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-danger inline-block" />
                  Pendientes ({estado.total_no_recibieron})
                </button>
              </div>

              {/* Buscador */}
              {total > 5 && (
                <div className="relative">
                  <KeenIcon
                    icon="magnifier"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Buscar invitado…"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    className="input input-sm pl-9 rounded w-full"
                  />
                </div>
              )}

              {/* Lista */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700">
                {lista.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm">
                    {buscar
                      ? 'Sin resultados'
                      : vista === 'recibieron'
                        ? 'Nadie ha recibido este ítem aún'
                        : 'Todos han recibido este ítem'}
                  </div>
                ) : (
                  lista.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {p.nombre?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {p.nombre}
                        </p>
                        {vista === 'recibieron' && p.fecha_scan && (
                          <p className="text-xs text-gray-400">
                            Escaneado: {fmtFechaHora(p.fecha_scan)}
                          </p>
                        )}
                      </div>
                      <span
                        className={clsx(
                          'badge text-xs shrink-0',
                          vista === 'recibieron'
                            ? 'badge-outline badge-success'
                            : 'badge-outline badge-danger'
                        )}
                      >
                        {vista === 'recibieron' ? '✓ Recibido' : '✗ Pendiente'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
