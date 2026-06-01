import { Scanner } from '@yudiel/react-qr-scanner';
import { useState, useEffect, useRef, useCallback } from 'react';
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

interface ScanLog {
  nombre: string;
  token: string;
  timestamp: Date;
  itemsReclamados: number;
  totalItems: number;
  hasSaldo: boolean;
}

interface HistorialItemScan {
  idItem: number;
  nombreItem: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  fecha_scan?: string;
}

interface HistorialHermano {
  id: number;
  nombre: string;
  email: string | null;
  celular: string | null;
  qr_token: string;
  escaneados: HistorialItemScan[];
  pendientes: HistorialItemScan[];
  total_escaneados: number;
  total_pendientes: number;
  total_items: number;
}

const fmtHora = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

const fmtTimestamp = (d: Date) =>
  d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const fmtFechaScan = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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

  // Manual token input
  const [manualToken, setManualToken] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Scan history (session)
  const [scanHistory, setScanHistory] = useState<ScanLog[]>([]);
  const scanCountRef = useRef(0);

  // Historial global (backend)
  const [showHistorial, setShowHistorial] = useState(false);
  const [historialData, setHistorialData] = useState<HistorialHermano[]>([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialFilter, setHistorialFilter] = useState<'todos' | 'escaneados' | 'pendientes'>('todos');
  const [historialSearch, setHistorialSearch] = useState('');
  const [expandedHermano, setExpandedHermano] = useState<number | null>(null);

  useEffect(() => {
    axios
      .get('/eventos-multimedia?per_page=100')
      .then((res) => {
        const list = res.data?.data || res.data || [];
        setEventos(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('Error al cargar eventos:', err));
  }, []);

  const fetchHistorial = useCallback(async () => {
    try {
      setHistorialLoading(true);
      const params = idEventoSeleccionado ? { idEvento: idEventoSeleccionado } : {};
      const res = await axios.get('/invitado/historial-scan', { params });
      setHistorialData(res.data.data || []);
    } catch {
      enqueueSnackbar('Error al cargar historial de escaneos', { variant: 'error' });
    } finally {
      setHistorialLoading(false);
    }
  }, [idEventoSeleccionado, enqueueSnackbar]);

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    setCameraError(error?.message || String(error));
    enqueueSnackbar('Error de cámara: Asegúrate de estar en localhost o HTTPS y dar permisos.', { variant: 'error' });
  };

  const playSuccessSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.start(ctx.currentTime);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.error('Audio chime error:', e);
    }
  }, []);

  const processToken = useCallback(async (tok: string) => {
    if (!tok) return;
    setToken(tok);

    try {
      setLoading(true);
      const claimParams = idEventoSeleccionado ? { params: { idEvento: idEventoSeleccionado } } : {};
      await axios.get(`/invitado/token/${tok}/auto-claim`, claimParams);
      
      const params = idEventoSeleccionado ? { idEvento: idEventoSeleccionado } : {};
      const res = await axios.get(`/invitado/token/${tok}/items`, { params });
      
      setInvitado(res.data.hermano);
      setItems(res.data.items);
      playSuccessSound();

      // Log the scan
      const itemsData = res.data.items as ItemActividad[];
      const recibidos = itemsData.filter((i) => i.recibido).length;
      scanCountRef.current += 1;
      setScanHistory((prev) => [
        {
          nombre: res.data.hermano.nombre,
          token: tok,
          timestamp: new Date(),
          itemsReclamados: recibidos,
          totalItems: itemsData.length,
          hasSaldo: (res.data.hermano.saldo ?? 0) > 0,
        },
        ...prev.slice(0, 49), // keep last 50
      ]);

      enqueueSnackbar('¡Ingreso y actividades reclamadas con éxito!', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al leer QR — Token inválido o invitado no encontrado', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [idEventoSeleccionado, enqueueSnackbar, playSuccessSound]);

  const handleScan = async (result: any) => {
    const value = result?.[0]?.rawValue;
    if (!value || value === lastScan) return;
    setLastScan(value);
    const tok = value.split('/').pop();
    processToken(tok);
  };

  const handleManualSubmit = () => {
    const tok = manualToken.trim().split('/').pop() || '';
    if (!tok) return;
    setManualToken('');
    setShowManualInput(false);
    setLastScan(tok);
    processToken(tok);
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

  const handleClaimAll = async () => {
    try {
      setLoading(true);
      const params = idEventoSeleccionado ? { idEvento: idEventoSeleccionado } : {};
      await axios.post(`/invitado/token/${token}/claim-all`, null, { params });
      
      const res = await axios.get(`/invitado/token/${token}/items`, { params });
      setItems(res.data.items);
      playSuccessSound();
      enqueueSnackbar('¡Asistencia completa registrada con éxito!', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al registrar la asistencia completa', { variant: 'error' });
    } finally {
      setLoading(false);
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

  // ─── Guest detail view ──────────────────────────
  if (invitado) {
    return (
      <div className="w-full max-w-lg mx-auto px-2 sm:px-0 flex flex-col gap-6 pb-8">
        <button
          className="group/btn relative h-10 px-5 bg-white dark:bg-zinc-900 text-gray-750 dark:text-gray-200 border border-gray-200 dark:border-zinc-800 font-black rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-sm self-start flex items-center gap-2"
          onClick={handleVolver}
        >
          <KeenIcon icon="arrow-left" className="text-base" />
          <span className="text-[9px] uppercase tracking-[0.2em] font-black">Volver al escáner</span>
        </button>

        {/* Guest Profile Card */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-sm p-6 overflow-hidden relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center font-black text-xl shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform shrink-0">
              {iniciales}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-neutral-800 dark:text-white uppercase truncate tracking-tight">
                {invitado.nombre}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-gray-400">
                <span className="font-bold">{invitado.email || '—'}</span>
                {invitado.celularContacto && (
                  <>
                    <span className="text-gray-300 dark:text-zinc-700">•</span>
                    <span>{invitado.celularContacto}</span>
                  </>
                )}
              </div>
            </div>
            <div className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-455 rounded-xl border border-emerald-500/10 text-[9px] font-black uppercase tracking-wider shrink-0 hidden sm:block">
              ✓ Registrado
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-gray-100 dark:border-zinc-800/60 text-center">
            <div className="bg-gray-50/50 dark:bg-zinc-950/20 py-2.5 rounded-2xl border border-gray-100 dark:border-zinc-800/40">
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Saldo</p>
              <p
                className={clsx(
                  'font-black italic text-lg leading-none',
                  (invitado.saldo ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'
                )}
              >
                ${(invitado.saldo ?? 0).toLocaleString('es-CO')}
              </p>
            </div>
            {invitado.parentesco && (
              <div className="bg-gray-50/50 dark:bg-zinc-950/20 py-2.5 rounded-2xl border border-gray-100 dark:border-zinc-800/40">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Parentesco</p>
                <p className="font-black text-sm text-neutral-700 dark:text-white uppercase truncate px-2 leading-tight">
                  {invitado.parentesco}
                </p>
              </div>
            )}
            <div className={clsx(
              'bg-gray-50/50 dark:bg-zinc-950/20 py-2.5 rounded-2xl border border-gray-100 dark:border-zinc-800/40',
              !invitado.parentesco && 'col-span-2'
            )}>
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black mb-0.5">Asistencias</p>
              <p className="font-black text-base text-neutral-800 dark:text-white leading-none">
                {recibidos}<span className="text-xs font-normal text-gray-400">/{items.length}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Activities List Card */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-sm p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-neutral-800 dark:text-white">Registro de Actividades</h4>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400">
                {recibidos}/{items.length} Reclamados
              </span>
              {items.length > 0 && recibidos < items.length && (
                <button
                  onClick={handleClaimAll}
                  disabled={loading}
                  className="group/btn relative h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/10 flex items-center gap-1.5"
                >
                  <KeenIcon icon="check-double" className="text-xs group-hover/btn:scale-110 transition-transform" />
                  <span>Reclamar todo</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 mb-5 leading-relaxed pl-4 border-l-2 border-orange-500/20">
            Registra de forma manual cada una de las actividades o marca todo como reclamado en un solo paso.
          </p>

          {items.length > 0 && (
            <div className="w-full h-2 bg-gray-100 dark:bg-zinc-800 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(recibidos / items.length) * 100}%` }}
              />
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-400 space-y-3">
              <KeenIcon icon="calendar-remove" className="text-3xl text-gray-300 dark:text-zinc-700" />
              <p className="text-xs font-medium">Sin actividades vinculadas a este evento</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-800/60 max-h-[360px] overflow-y-auto pr-1">
              {items.map((item) => {
                const hora = fmtHora(item.hora_inicio);
                const isToggling = togglingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={clsx(
                      'flex items-center gap-4 py-4 transition-all',
                      item.recibido ? 'opacity-70 bg-gray-50/20 dark:bg-zinc-950/5' : ''
                    )}
                  >
                    {/* Premium Slide Toggle */}
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={isToggling}
                      className={clsx(
                        'relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-300 shrink-0 focus:outline-none border border-transparent shadow-inner',
                        item.recibido ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-zinc-800',
                        isToggling && 'opacity-50 cursor-wait'
                      )}
                      title={item.recibido ? 'Quitar recibido' : 'Marcar como recibido'}
                    >
                      <span
                        className={clsx(
                          'inline-block w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-300',
                          item.recibido ? 'translate-x-5.5' : 'translate-x-1'
                        )}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <p
                        className={clsx(
                          'text-sm font-bold leading-snug transition-colors',
                          item.recibido
                            ? 'text-gray-400 line-through dark:text-zinc-500'
                            : 'text-gray-800 dark:text-white'
                        )}
                      >
                        {item.nombreItem}
                      </p>
                      {hora && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mt-1.5 rounded-xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                          <KeenIcon icon="time" className="text-xs shrink-0" />
                          <span className="font-black text-[9px] uppercase tracking-wider">{hora}</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={clsx(
                        'px-2.5 py-1 rounded-xl text-[9px] font-black uppercase shrink-0 transition-colors',
                        item.recibido
                          ? 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/10'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500'
                      )}
                    >
                      {isToggling ? '...' : item.recibido ? 'Listo' : 'Ped.'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Scanner main view ──────────────────────────
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto px-2 sm:px-0 py-4">
      {isScannerActive ? (
        <>
          <div className="w-full rounded-[2rem] overflow-hidden shadow-2xl border border-neutral-100 dark:border-white/5 relative bg-black">
            <Scanner onScan={handleScan} onError={handleCameraError} constraints={{ facingMode: 'environment' }} />
            {/* Pulsing Target Overlay */}
            <div className="absolute inset-0 border-[3px] border-orange-500/30 rounded-[2rem] pointer-events-none animate-pulse" />
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => {
                setIsScannerActive(false);
                setCameraError(null);
              }}
              className="flex-1 group/btn relative h-12 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2"
            >
              <KeenIcon icon="cross" className="text-base" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-black">Detener escáner</span>
            </button>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-gray-250 dark:border-zinc-850 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-gray-300 shadow-sm shrink-0"
              title="Ingresar token manual"
            >
              <KeenIcon icon="keyboard" className="text-xl" />
            </button>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 p-8 text-center flex flex-col items-center gap-6 shadow-sm w-full relative">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 shadow-[0_10px_20px_rgba(249,115,22,0.15)] animate-pulse shrink-0 transform -rotate-3">
            <KeenIcon icon="scan" className="text-3xl" />
          </div>
          <div>
            <h3 className="font-black text-xl text-neutral-800 dark:text-white uppercase italic tracking-wide">Escáner de Asistencia</h3>
            <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto leading-relaxed italic border-l-2 border-orange-500/20 pl-4">
              El sistema utilizará la cámara trasera del dispositivo para validar instantáneamente el QR de cada invitado.
            </p>
          </div>

          <div className="w-full text-left" ref={eventSelectRef}>
            <label className="block mb-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Filtrar Actividades por Evento
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpenEventSelect(!isOpenEventSelect)}
                className="w-full pl-4 pr-10 py-3 text-left text-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 cursor-pointer flex items-center justify-between"
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
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={() => {
                setIsScannerActive(true);
                setCameraError(null);
              }}
              className="flex-1 group/btn relative h-12 bg-orange-500 hover:bg-orange-600 text-white font-black rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
            >
              <div className="absolute inset-0 bg-orange-600 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
              <div className="relative z-10 flex items-center gap-2">
                <KeenIcon icon="scan" className="text-base group-hover/btn:scale-110 transition-transform" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-black">Iniciar Escáner</span>
              </div>
            </button>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-gray-300 shadow-sm shrink-0"
              title="Ingreso manual de token"
            >
              <KeenIcon icon="keyboard" className="text-xl" />
            </button>
            <button
              onClick={() => { setShowHistorial(true); fetchHistorial(); }}
              className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-gray-500 dark:text-gray-300 shadow-sm shrink-0"
              title="Historial de escaneos"
            >
              <KeenIcon icon="time" className="text-xl" />
            </button>
          </div>
        </div>
      )}

      {/* Manual Token Input */}
      {showManualInput && (
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 p-6 shadow-sm w-full">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Ingreso manual de token</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              placeholder="Pega el token o URL del QR…"
              className="flex-1 px-4 py-3 text-sm rounded-2xl border border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualToken.trim() || loading}
              className="h-12 px-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black flex items-center justify-center shadow-lg shadow-orange-500/20 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeenIcon icon="check" className="text-lg" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2.5 pl-3 border-l border-orange-500/20">
            Permite ingresar manualmente el identificador del QR cuando existan problemas de cámara.
          </p>
        </div>
      )}

      {cameraError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 p-5 rounded-[2rem] text-xs text-center w-full shadow-sm">
          <p className="font-bold mb-1.5 uppercase tracking-wider text-[10px]">No se pudo acceder a la cámara</p>
          <p className="opacity-90 leading-relaxed font-medium italic">
            Asegúrate de estar en un contexto seguro (<strong>localhost</strong> o <strong>HTTPS</strong>) y otorgar permisos de cámara al navegador.
          </p>
        </div>
      )}

      {isScannerActive && (
        loading ? (
          <div className="flex items-center gap-2.5 text-xs text-gray-400 animate-pulse font-bold uppercase tracking-wider mt-2">
            <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            Cargando información del QR…
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center animate-fade-in font-medium italic mt-2">
            Apunta la cámara al código QR del invitado para registrar su ingreso.
          </p>
        )
      )}

      {/* Scan History Log */}
      {scanHistory.length > 0 && (
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 p-6 shadow-sm w-full">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <KeenIcon icon="time" className="text-orange-500 text-sm animate-pulse" />
              Historial de escaneos ({scanHistory.length})
            </p>
            <button
              onClick={() => setScanHistory([])}
              className="text-[9px] font-black uppercase tracking-wider text-rose-500 hover:underline transition-colors"
            >
              Limpiar
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-150 dark:divide-zinc-800/60 pr-1">
            {scanHistory.map((log, i) => (
              <div
                key={i}
                onClick={() => processToken(log.token)}
                className="flex items-center gap-3.5 py-3 group cursor-pointer hover:bg-neutral-50 dark:hover:bg-zinc-800/40 px-2 rounded-xl transition-all"
                title="Haga clic para ver detalles y registrar actividades"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                  {log.nombre.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-800 dark:text-white truncate group-hover:text-orange-500 transition-colors">{log.nombre}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {fmtTimestamp(log.timestamp)} · <span className="font-bold text-neutral-600 dark:text-zinc-400">{log.itemsReclamados}/{log.totalItems} act.</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {log.hasSaldo && (
                    <span className="px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/10 text-rose-550 text-[8px] font-black uppercase tracking-wider">$ Pend.</span>
                  )}
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xs font-bold">✓</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════ HISTORIAL GLOBAL PANEL ═══════ */}
      {showHistorial && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-gray-100 dark:border-zinc-800/60 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                    <KeenIcon icon="time" className="text-xl" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-800 dark:text-white uppercase tracking-tight">Historial de Escaneos</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                      {historialData.length} invitados · {historialData.reduce((a, h) => a + h.total_escaneados, 0)} escaneados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistorial(false)}
                  className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  <KeenIcon icon="cross" className="text-base" />
                </button>
              </div>

              {/* Search + Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <KeenIcon icon="magnifier" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    value={historialSearch}
                    onChange={(e) => setHistorialSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
                <div className="flex gap-1.5 bg-gray-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
                  {(['todos', 'escaneados', 'pendientes'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setHistorialFilter(f)}
                      className={clsx(
                        'px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all',
                        historialFilter === f
                          ? 'bg-white dark:bg-zinc-700 text-orange-600 dark:text-orange-400 shadow-sm'
                          : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-white'
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 pt-3">
              {historialLoading ? (
                <div className="flex items-center justify-center py-16">
                  <span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (() => {
                const filtered = historialData
                  .filter((h) => {
                    if (historialFilter === 'escaneados') return h.total_escaneados > 0;
                    if (historialFilter === 'pendientes') return h.total_pendientes > 0;
                    return true;
                  })
                  .filter((h) => h.nombre.toLowerCase().includes(historialSearch.toLowerCase()));

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-16 text-gray-400 space-y-3">
                      <KeenIcon icon="search-list" className="text-3xl text-gray-300 dark:text-zinc-700" />
                      <p className="text-xs font-medium">No se encontraron resultados</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {filtered.map((h) => {
                      const isExpanded = expandedHermano === h.id;
                      const pct = h.total_items > 0 ? Math.round((h.total_escaneados / h.total_items) * 100) : 0;

                      return (
                        <div
                          key={h.id}
                          className="bg-gray-50/50 dark:bg-zinc-800/30 rounded-2xl border border-gray-100 dark:border-zinc-800/40 overflow-hidden transition-all"
                        >
                          {/* Row */}
                          <button
                            onClick={() => setExpandedHermano(isExpanded ? null : h.id)}
                            className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                              {h.nombre.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-neutral-800 dark:text-white truncate">{h.nombre}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {h.email || h.celular || 'Sin contacto'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0">
                              <div className="text-right hidden sm:block">
                                <p className="text-xs font-black text-neutral-700 dark:text-white">{h.total_escaneados}/{h.total_items}</p>
                                <p className="text-[9px] text-gray-400 uppercase tracking-wider">{pct}%</p>
                              </div>
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center">
                                {h.total_pendientes === 0 ? (
                                  <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-base font-bold">✓</span>
                                ) : h.total_escaneados > 0 ? (
                                  <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px] font-black">~</span>
                                ) : (
                                  <span className="w-8 h-8 rounded-full bg-gray-200/50 dark:bg-zinc-700/50 text-gray-400 flex items-center justify-center text-[10px] font-black">—</span>
                                )}
                              </div>
                              <KeenIcon
                                icon="down"
                                className={clsx('text-xs text-gray-400 transition-transform duration-200', isExpanded && 'rotate-180')}
                              />
                            </div>
                          </button>

                          {/* Expanded detail */}
                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-gray-100 dark:border-zinc-800/40">
                              {/* Progress */}
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full my-3 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>

                              {/* Escaneados */}
                              {h.escaneados.length > 0 && (
                                <div className="mb-3">
                                  <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Escaneados ({h.escaneados.length})
                                  </p>
                                  <div className="space-y-1">
                                    {h.escaneados.map((item) => (
                                      <div key={item.idItem} className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px] shrink-0">✓</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-neutral-700 dark:text-white truncate">{item.nombreItem}</p>
                                          {item.fecha_scan && (
                                            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                                              {fmtFechaScan(item.fecha_scan)}
                                            </p>
                                          )}
                                        </div>
                                        {item.hora_inicio && (
                                          <span className="text-[9px] font-bold text-gray-400 shrink-0">
                                            {fmtHora(item.hora_inicio)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Pendientes */}
                              {h.pendientes.length > 0 && (
                                <div>
                                  <p className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                    Pendientes ({h.pendientes.length})
                                  </p>
                                  <div className="space-y-1">
                                    {h.pendientes.map((item) => (
                                      <div key={item.idItem} className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-gray-50/50 dark:bg-zinc-800/30">
                                        <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-400 flex items-center justify-center text-[10px] shrink-0">—</span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 truncate">{item.nombreItem}</p>
                                        </div>
                                        {item.hora_inicio && (
                                          <span className="text-[9px] font-bold text-gray-400 shrink-0">
                                            {fmtHora(item.hora_inicio)}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 pt-0 border-t border-gray-100 dark:border-zinc-800/60 shrink-0">
              <button
                onClick={fetchHistorial}
                disabled={historialLoading}
                className="w-full h-10 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 mt-3"
              >
                <KeenIcon icon="arrows-circle" className={clsx('text-sm', historialLoading && 'animate-spin')} />
                Refrescar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerTab;
