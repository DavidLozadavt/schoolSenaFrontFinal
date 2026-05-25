import { Scanner } from '@yudiel/react-qr-scanner';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';

interface Invitado {
  id: number;
  nombre: string;
  email: string;
  celularContacto: string;
  saldo: number;
  parentesco?: string;
}

interface ItemActividad {
  id: number;
  nombreItem: string;
  descripcion: string | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  recibido: boolean;
  fecha_scan: string | null;
}

const fmtHora = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

export const ScannerTab: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [invitado, setInvitado] = useState<Invitado | null>(null);
  const [items, setItems] = useState<ItemActividad[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [lastScan, setLastScan] = useState('');
  const [token, setToken] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  const [idEventoSeleccionado, setIdEventoSeleccionado] = useState<number | string>('');
  const [eventos, setEventos] = useState<{ idEvento: number; nombre: string }[]>([]);

  useEffect(() => {
    // Cargar la lista de eventos para el escáner
    axios
      .get('/eventos-multimedia?per_page=100')
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setEventos(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('Error al cargar eventos:', err));
  }, []);

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    setCameraError(error?.message || String(error));
    enqueueSnackbar('Error de cámara: Asegúrate de estar en localhost o HTTPS y dar permisos.', { variant: 'error' });
  };

  const handleScan = async (result: any) => {
    const value = result?.[0]?.rawValue;
    if (!value || value === lastScan) return;
    setLastScan(value);

    const tok = value.split('/').pop();
    setToken(tok);

    try {
      setLoading(true);
      await axios.get(`/invitado/token/${tok}/auto-claim`);
      
      const params = idEventoSeleccionado ? { idEvento: idEventoSeleccionado } : {};
      const res = await axios.get(`/invitado/token/${tok}/items`, { params });
      
      setInvitado(res.data.hermano);
      setItems(res.data.items);
    } catch {
      enqueueSnackbar('Error al leer QR', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (item: ItemActividad) => {
    try {
      setTogglingId(item.id);
      const res = await axios.post(`/invitado/token/${token}/item/${item.id}/toggle`);
      const updated = res.data.data;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, recibido: updated.recibido, fecha_scan: updated.fecha_scan }
            : i
        )
      );
    } catch {
      enqueueSnackbar('Error al actualizar actividad', { variant: 'error' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleVolver = () => {
    setInvitado(null);
    setItems([]);
    setLastScan('');
    setToken('');
  };

  const recibidos = items.filter((i) => i.recibido).length;
  const iniciales = invitado?.nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  if (invitado) {
    return (
      <div className="w-full max-w-lg mx-auto px-2 sm:px-0 flex flex-col gap-4 pb-8">
        <button
          className="btn btn-sm btn-light self-start flex items-center gap-2"
          onClick={handleVolver}
        >
          <KeenIcon icon="arrow-left" />
          <span className="hidden xs:inline">Volver al scanner</span>
          <span className="xs:hidden">Volver</span>
        </button>

        <div className="card border border-gray-200 dark:border-zinc-700">
          <div className="card-body py-4 px-4 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {iniciales}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base text-gray-800 dark:text-white truncate">
                  {invitado.nombre}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {invitado.email || '—'} · {invitado.celularContacto || '—'}
                </p>
              </div>
              <span className="badge badge-outline badge-success text-xs shrink-0 hidden sm:inline-flex">
                ✓ Registrado
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-zinc-700 text-center">
              <div>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">
                  Saldo
                </p>
                <p
                  className={`font-semibold ${
                    (invitado.saldo ?? 0) > 0
                      ? 'text-red-500 font-bold text-base sm:text-lg'
                      : 'text-green-500 text-sm sm:text-base'
                  }`}
                >
                  ${(invitado.saldo ?? 0).toLocaleString('es-CO')}
                </p>
              </div>
              {invitado.parentesco && (
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">
                    Parentesco
                  </p>
                  <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white truncate">
                    {invitado.parentesco}
                  </p>
                </div>
              )}
              <div className={invitado.parentesco ? '' : 'col-span-2 sm:col-span-1'}>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-medium">
                  Actividades
                </p>
                <p className="font-semibold text-sm sm:text-base text-gray-800 dark:text-white">
                  {recibidos}/{items.length}
                </p>
              </div>
            </div>

            <div className="sm:hidden mt-3">
              <span className="badge badge-outline badge-success text-xs">✓ Registrado</span>
            </div>
          </div>
        </div>

        <div className="card border border-gray-200 dark:border-zinc-700">
          <div className="card-body py-4 px-4 sm:px-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-sm text-gray-700 dark:text-white">Actividades</p>
              <span className="text-xs text-gray-400 font-medium">
                {recibidos}/{items.length} recibidos
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Marque cada ítem que el invitado ha recibido
            </p>

            {items.length > 0 && (
              <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${(recibidos / items.length) * 100}%` }}
                />
              </div>
            )}

            {items.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin actividades disponibles</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                {items.map((item) => {
                  const hora = fmtHora(item.hora_inicio);
                  const isToggling = togglingId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={clsx(
                        'flex items-center gap-3 py-3 transition-opacity',
                        item.recibido && 'opacity-80'
                      )}
                    >
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={isToggling}
                        className={clsx(
                          'relative inline-flex items-center w-10 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none',
                          item.recibido ? 'bg-success' : 'bg-gray-200 dark:bg-zinc-600',
                          isToggling && 'opacity-50 cursor-wait'
                        )}
                        title={item.recibido ? 'Quitar recibido' : 'Marcar como recibido'}
                      >
                        <span
                          className={clsx(
                            'inline-block w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                            item.recibido ? 'translate-x-5' : 'translate-x-1'
                          )}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={clsx(
                            'text-sm font-medium leading-tight',
                            item.recibido
                              ? 'text-gray-400 line-through dark:text-zinc-500'
                              : 'text-gray-800 dark:text-white'
                          )}
                        >
                          {item.nombreItem}
                        </p>
                        {hora && (
                          <span className="text-xs text-gray-400 mt-0.5 inline-block">{hora}</span>
                        )}
                      </div>

                      <span
                        className={clsx(
                          'badge text-xs shrink-0',
                          item.recibido
                            ? 'badge-outline badge-success'
                            : 'badge-outline badge-secondary'
                        )}
                      >
                        {isToggling ? '...' : item.recibido ? '✓' : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-2 sm:px-0">
      {isScannerActive ? (
        <>
          <div className="w-full rounded-xl overflow-hidden shadow border border-gray-200 dark:border-zinc-700">
            <Scanner onScan={handleScan} onError={handleCameraError} constraints={{ facingMode: 'environment' }} />
          </div>

          <button
            onClick={() => {
              setIsScannerActive(false);
              setCameraError(null);
            }}
            className="btn btn-sm btn-light border border-gray-250 flex items-center gap-2 bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 rounded-xl"
          >
            <KeenIcon icon="cross" /> Detener escáner
          </button>
        </>
      ) : (
        <div className="card border border-gray-200 dark:border-zinc-700 w-full p-6 text-center flex flex-col items-center gap-5 shadow-lg bg-white dark:bg-zinc-800 rounded-2xl">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <KeenIcon icon="scan" className="text-2xl animate-pulse" />
          </div>
          <div>
            <h4 className="font-semibold text-lg text-gray-800 dark:text-white">Escáner de Asistencia</h4>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed">
              El sistema requiere acceso a la cámara para poder escanear los códigos QR de los invitados de forma rápida.
            </p>
          </div>

          <div className="w-full text-left">
            <label className="block mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Filtrar Actividades por Evento
            </label>
            <select
              value={idEventoSeleccionado}
              onChange={(e) => setIdEventoSeleccionado(e.target.value)}
              className="select select-sm rounded-xl w-full bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-gray-800 dark:text-white"
            >
              <option value="">-- Todos los eventos (Global) --</option>
              {eventos.map((e) => (
                <option key={e.idEvento} value={e.idEvento}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setIsScannerActive(true);
                setCameraError(null);
              }}
              className="btn btn-primary flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <KeenIcon icon="scan" /> Iniciar Escáner
            </button>
          </div>
        </div>
      )}

      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs text-center w-full">
          <p className="font-bold mb-1">No se pudo acceder a la cámara</p>
          <p className="opacity-90 leading-relaxed">
            Para usar el escáner, necesitas estar en un contexto seguro (<strong>localhost</strong> o <strong>HTTPS</strong>) y otorgar permisos de cámara en el navegador.
          </p>
        </div>
      )}

      {isScannerActive && (
        loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
            <KeenIcon icon="loading" className="animate-spin" />
            Cargando información…
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center animate-fade-in">
            Apunta la cámara al código QR del invitado
          </p>
        )
      )}
    </div>
  );
};

export default ScannerTab;
