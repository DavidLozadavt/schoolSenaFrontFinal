import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { Download, QrCode, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface Hermano {
  nombre: string;
  email: string;
  celularContacto: string;
  parentesco?: string;
  saldo?: number;
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

const fmtFechaHora = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const fmtHora = (iso: string | null) => {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
};

export const InvitadoPublic: React.FC = () => {
  const { token } = useParams();
  const [hermano, setHermano] = useState<Hermano | null>(null);
  const [items, setItems] = useState<ItemActividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#18181b' // dark zinc-900 background
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `Pase_${hermano?.nombre?.replace(/\s+/g, '_') || 'Invitado'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Error rendering ticket card:', err);
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await axios.get(`/invitado/token/${token}/items`);
        setHermano(res.data.hermano);
        setItems(res.data.items);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-zinc-900 px-4">
        <p className="text-gray-400 text-sm animate-pulse">Cargando…</p>
      </div>
    );
  }

  if (error || !hermano) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 dark:bg-zinc-900 px-4">
        <div className="flex flex-col items-center justify-center text-center gap-3 bg-white dark:bg-zinc-800 rounded-2xl shadow-md p-8 w-full max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>

          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Invitado no encontrado
          </h2>

          <p className="text-sm text-gray-400">El enlace no es válido o ya expiró</p>

          <button onClick={() => window.location.reload()} className="mt-2 btn btn-sm btn-light">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const recibidos = items.filter((i) => i.recibido);
  const pendientes = items.filter((i) => !i.recibido);
  const porcentaje = items.length > 0 ? Math.round((recibidos.length / items.length) * 100) : 0;

  const iniciales = hermano.nombre
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const statsItems = [
    { label: 'Celular', value: hermano.celularContacto || '—' },
    ...(hermano.parentesco ? [{ label: 'Parentesco', value: hermano.parentesco }] : []),
    { label: 'Recibidos', value: `${recibidos.length}/${items.length}` }
  ];

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-zinc-900 flex justify-center px-3 sm:px-6 py-6">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl flex flex-col gap-4">
        {/* Ticket Digital QR del Invitado */}
        <div className="bg-gradient-to-r from-orange-500 to-rose-600 rounded-3xl p-6 text-white shadow-xl flex flex-col gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-orange-200 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-orange-100">Credencial Oficial</span>
            </div>
            <button
              onClick={() => setShowTicket(!showTicket)}
              className="text-[10px] font-black uppercase tracking-widest bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl transition-all"
            >
              {showTicket ? 'Ocultar Pase' : 'Ver Pase QR'}
            </button>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-xl font-black italic tracking-tighter text-center uppercase">
              {hermano.nombre}
            </h2>
            <p className="text-[10px] font-bold text-orange-200 uppercase tracking-widest mt-1">
              {hermano.email || 'Invitado Registrado'}
            </p>
          </div>

          {showTicket && (
            <div className="flex flex-col items-center gap-5 mt-4 p-5 rounded-2xl bg-white/95 text-neutral-900 border border-white/20 animate-zoom-in relative z-10 shadow-2xl">
              {/* Captured card container for html2canvas */}
              <div 
                ref={ticketRef} 
                className="w-full max-w-[280px] bg-zinc-900 text-white rounded-3xl p-6 flex flex-col items-center gap-4 text-center border border-white/10 shadow-2xl"
              >
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                  <span className="text-[9px] font-black text-orange-500 uppercase tracking-[0.2em]">Pase de Entrada</span>
                </div>
                
                <h3 className="text-lg font-black tracking-tight text-white uppercase italic leading-none">{hermano.nombre}</h3>
                
                <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  <QRCodeCanvas 
                    value={`${window.location.origin}/invitado/${token}`} 
                    size={160} 
                    level="H" 
                  />
                </div>
                
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
                  Presenta este QR en la entrada del evento para confirmar asistencia
                </p>
              </div>

              <button
                onClick={handleDownloadTicket}
                disabled={downloading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 active:scale-95"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    Generando imagen...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Guardar en Galería (PNG)
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-4 sm:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold text-sm sm:text-base shrink-0">
              {iniciales}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white leading-tight truncate">
                {hermano.nombre}
              </h1>
              <p className="text-xs text-gray-500 truncate">{hermano.email || '—'}</p>
            </div>
          </div>

          <div
            className="pt-4 border-t border-gray-100 dark:border-zinc-700 grid text-center gap-2"
            style={{ gridTemplateColumns: `repeat(${statsItems.length}, minmax(0, 1fr))` }}
          >
            {statsItems.map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] sm:text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-white mt-0.5 truncate">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progreso</span>
                <span>{porcentaje}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-700"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {recibidos.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block shrink-0" />
              Recibidos ({recibidos.length})
            </p>
            <div className="divide-y divide-gray-100 dark:divide-zinc-700">
              {recibidos.map((item) => (
                <div key={item.id} className="py-3 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-green-600 dark:text-green-400 text-xs">✓</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                      {item.nombreItem}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {fmtHora(item.hora_inicio) && (
                        <span className="text-xs text-gray-400">
                          Programado: {fmtHora(item.hora_inicio)}
                        </span>
                      )}
                      {item.fecha_scan && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Escaneado: {fmtFechaHora(item.fecha_scan)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pendientes.length > 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-4 sm:p-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-zinc-500 inline-block shrink-0" />
              Pendientes ({pendientes.length})
            </p>
            <div className="divide-y divide-gray-100 dark:divide-zinc-700">
              {pendientes.map((item) => (
                <div key={item.id} className="py-3 flex items-start gap-3 opacity-60">
                  <div className="w-5 h-5 rounded-full border border-gray-300 dark:border-zinc-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300 truncate">
                      {item.nombreItem}
                    </p>
                    {fmtHora(item.hora_inicio) && (
                      <span className="text-xs text-gray-400">
                        Programado: {fmtHora(item.hora_inicio)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {items.length === 0 && (
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm p-8 text-center">
            <p className="text-gray-400 text-sm">No hay actividades disponibles</p>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">✔ Invitado registrado</p>
      </div>
    </div>
  );
};

export default InvitadoPublic;
