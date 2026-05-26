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

  const totalGeneral = estado
    ? estado.total_recibieron + estado.total_no_recibieron
    : 0;

  const porcentaje =
    totalGeneral > 0
      ? Math.round((estado!.total_recibieron / totalGeneral) * 100)
      : 0;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[580px] top-[6%] p-0 rounded-2xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-2xl">
        <ModalHeader className="px-7 py-5 border-b border-gray-100 dark:border-zinc-800/60 bg-gray-50/30 dark:bg-zinc-950/20">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25 transform -rotate-3">
              <KeenIcon icon="people" className="text-lg" />
            </div>
            <div className="min-w-0">
              <ModalTitle className="!text-sm !font-black !uppercase !tracking-wide">
                {estado ? (
                  <span className="truncate block max-w-[380px]">{estado.item.nombreItem}</span>
                ) : (
                  'Estado del ítem'
                )}
              </ModalTitle>
              <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">Registro de asistencia por invitado</p>
            </div>
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100/80 dark:bg-zinc-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-gray-400 hover:text-rose-500 transition-all duration-200 hover:rotate-90 shrink-0"
            onClick={onClose}
          >
            <KeenIcon icon="cross" className="text-sm" />
          </button>
        </ModalHeader>

        <ModalBody className="px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
              <span className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando estado…</span>
            </div>
          ) : !estado ? (
            <div className="py-10 text-center text-gray-400 text-sm">
              No se pudo cargar la información
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Time info */}
              {(estado.item.hora_inicio || estado.item.hora_fin) && (
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 px-1">
                  {estado.item.hora_inicio && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-zinc-800">
                      <KeenIcon icon="time" className="text-primary text-sm" />
                      Inicio: {fmtHora(estado.item.hora_inicio)}
                    </span>
                  )}
                  {estado.item.hora_fin && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-zinc-800">
                      <KeenIcon icon="flag" className="text-danger text-sm" />
                      Fin: {fmtHora(estado.item.hora_fin)}
                    </span>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span className="font-medium">
                    {estado.total_recibieron} de {totalGeneral} invitados
                  </span>
                  <span className="font-bold text-gray-700 dark:text-white text-sm">{porcentaje}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl border border-gray-200 dark:border-zinc-700 overflow-hidden">
                <button
                  onClick={() => setVista('recibieron')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200',
                    vista === 'recibieron'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Asistieron ({estado.total_recibieron})
                </button>
                <div className="w-px bg-gray-200 dark:bg-zinc-700" />
                <button
                  onClick={() => setVista('no_recibieron')}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold transition-all duration-200',
                    vista === 'no_recibieron'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                      : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                  )}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  Pendientes ({estado.total_no_recibieron})
                </button>
              </div>

              {/* Search */}
              {total > 5 && (
                <div className="relative">
                  <KeenIcon
                    icon="magnifier"
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Buscar invitado…"
                    value={buscar}
                    onChange={(e) => setBuscar(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 placeholder:text-gray-300"
                  />
                </div>
              )}

              {/* List */}
              <div className="max-h-72 overflow-y-auto rounded-xl border border-gray-100 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700">
                {lista.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                    <KeenIcon icon="people" className="text-2xl text-gray-200 dark:text-zinc-700" />
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
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {p.nombre?.charAt(0) ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                          {p.nombre}
                        </p>
                        {vista === 'recibieron' && p.fecha_scan && (
                          <p className="text-[10px] text-gray-400 flex items-center gap-1">
                            <KeenIcon icon="time" className="text-[9px]" />
                            {fmtFechaHora(p.fecha_scan)}
                          </p>
                        )}
                      </div>
                      <span
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          vista === 'recibieron'
                            ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        )}
                      >
                        {vista === 'recibieron' ? '✓' : '✗'}
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
