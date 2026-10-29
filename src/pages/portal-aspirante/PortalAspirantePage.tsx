import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { iniciarPagoPortalAspirante, MetodoPagoPortal, verificarPagoPortalAspirante } from './portalAspiranteApi';
import { abrirCheckoutWompi } from './wompiCheckout';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  User,
  BookOpen,
  FileText,
  CreditCard,
  Lock
} from 'lucide-react';
import { toAbsoluteUrl } from '@/utils';

/** El aspirante ve la marca de la plataforma, no el nombre de la empresa en BD. */
const LOGO_SCHOOL = toAbsoluteUrl('/media/app/logoweb.png');

/* ─────────────────────────── types ─────────────────────────── */
interface SolicitudPortal {
  idFactura: number;
  numeroSolicitud: string;
  numeroFactura: string;
  nombreEstudiante: string;
  documento: string;
  email: string;
  telefono: string;
  nombrePrograma: string;
  codigoPrograma: string;
  fechaSolicitud: string;
  estado: string;
  estadoFactura: string;
  saldoPendiente: number;
  totalFactura: number;
}

interface EstudiantePortal {
  nombreCompleto: string;
  tipoDocumento: string;
  documento: string;
  email: string;
  celular?: string;
  telefono?: string;
}

interface PasarelaPagoPortal {
  disponible?: boolean;
  habilitarPSE?: boolean;
  habilitarTarjetas?: boolean;
}

interface PortalData {
  solicitud: SolicitudPortal;
  factura: Record<string, unknown>;
  estudiante: EstudiantePortal | null;
  nombreInstitucion: string;
  saldoPendiente?: number;
  valorTotal?: number;
  numeroFactura?: string;
  pdfUrl?: string;
  pasarelaPago?: PasarelaPagoPortal;
}

/* ─────────────────────────── helpers ─────────────────────────── */
const formatCOP = (val: number) =>
  val.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Wompi solo acepta códigos (CC, TI, CE...): "Cédula de Ciudadanía (CC)" → "CC". */
const codigoTipoDocumento = (tipo?: string): string => {
  const valor = (tipo ?? '').trim();
  const enParentesis = valor.match(/\(([A-Za-z]{2,4})\)/);
  if (enParentesis) return enParentesis[1].toUpperCase();
  return /^[A-Za-z]{2,4}$/.test(valor) ? valor.toUpperCase() : 'CC';
};

const estadoBadge = (estado: string) => {
  const e = (estado ?? '').toUpperCase();
  if (e.includes('APROBADA') || e.includes('PAGADA') || e.includes('APROBADO') || e.includes('PAGADO'))
    return { color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: <CheckCircle className="w-4 h-4" />, label: 'Aprobada' };
  if (e.includes('ANULADA') || e.includes('RECHAZADA') || e.includes('ANULADO') || e.includes('RECHAZADO'))
    return { color: 'bg-red-50 text-red-800 border-red-200', icon: <XCircle className="w-4 h-4" />, label: 'Rechazada' };
  return { color: 'bg-amber-50 text-amber-800 border-amber-200', icon: <Clock className="w-4 h-4" />, label: 'Pendiente de pago' };
};

/* ─────────────────────────── component ─────────────────────────── */
const PortalAspirantePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();

  // 1. Todos los Hooks de Estado al inicio
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iniciandoPago, setIniciandoPago] = useState<MetodoPagoPortal | null>(null);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [mensajeRetornoPago, setMensajeRetornoPago] = useState<string | null>(null);
  const [verificandoPago, setVerificandoPago] = useState(false);

  // Estados para validación de documento (Flujo de Seguridad)
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [documentoValidar, setDocumentoValidar] = useState('');
  const [isValidado, setIsValidado] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Estados para subida de comprobante
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [subiendoComprobante, setSubiendoComprobante] = useState(false);
  const [mensajeComprobante, setMensajeComprobante] = useState<{ tipo: 'success' | 'error', texto: string } | null>(null);
  const pagoEnCursoRef = useRef(false);

  const cargarPortal = useCallback(async (showLoader = true) => {
    if (!token) {
      setError('Enlace de acceso inválido.');
      if (showLoader) setLoading(false);
      return;
    }
    if (showLoader) setLoading(true);
    try {
      const res = await axios.get<PortalData>(`portal-aspirante/${token}`);
      setData(res.data);
      setError(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'El enlace de acceso es inválido o ha expirado.';
      setError(msg);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [token]);

  // 2. useEffect para cargar la información inicial usando el token
  useEffect(() => {
    cargarPortal();
  }, [cargarPortal]);

  // Consulta a Wompi el estado del pago y recarga el portal (respaldo del webhook).
  const verificarPago = useCallback(async () => {
    if (!token) return;
    setVerificandoPago(true);
    try {
      const res = await verificarPagoPortalAspirante(token);
      setMensajeRetornoPago(res.message);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
      setMensajeRetornoPago(
        axiosErr.response?.data?.error ?? axiosErr.response?.data?.message ?? 'No se pudo verificar el pago. Intente de nuevo.'
      );
    } finally {
      setVerificandoPago(false);
      cargarPortal(false);
    }
  }, [token, cargarPortal]);

  useEffect(() => {
    if (searchParams.get('pago') === 'retorno') {
      setMensajeRetornoPago('Verificando su pago en Wompi…');
      verificarPago();
    }
  }, [searchParams, verificarPago]);

  // 3. Manejadores de eventos
  const handleValidarIdentidad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    const docRegistrado = (data.estudiante?.documento ?? data.solicitud.documento ?? '').trim();
    if (documentoValidar.trim() === docRegistrado) {
      setIsValidado(true);
      setErrorValidacion(null);
    } else {
      setErrorValidacion('El número de identificación no coincide con el registrado en la inscripción.');
    }
  };

  const handleIniciarPagoWompi = async (metodo: MetodoPagoPortal) => {
    if (!token || !data || pagoEnCursoRef.current) return;
    pagoEnCursoRef.current = true;
    setIniciandoPago(metodo);
    setErrorPago(null);

    try {
      const checkout = await iniciarPagoPortalAspirante(token, metodo);
      abrirCheckoutWompi(checkout, {
        email: data.estudiante?.email ?? data.solicitud.email,
        fullName: data.estudiante?.nombreCompleto ?? data.solicitud.nombreEstudiante,
        phoneNumber: data.estudiante?.celular ?? data.estudiante?.telefono ?? data.solicitud.telefono,
        legalId: data.estudiante?.documento ?? data.solicitud.documento,
        legalIdType: codigoTipoDocumento(data.estudiante?.tipoDocumento)
      });
    } catch (err: unknown) {
      let msg = 'No se pudo iniciar el pago en línea. Intente de nuevo o suba un comprobante manual.';
      if (typeof err === 'string') {
        msg = err;
      } else if (err instanceof Error && err.message) {
        msg = err.message;
      } else {
        const axiosErr = err as { response?: { data?: { error?: string; message?: string } } };
        msg = axiosErr.response?.data?.error ?? axiosErr.response?.data?.message ?? msg;
      }
      setErrorPago(msg);
      pagoEnCursoRef.current = false;
      setIniciandoPago(null);
    }
  };

  const handleSubirComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprobanteFile || !data) return;
    setSubiendoComprobante(true);
    setMensajeComprobante(null);

    const formData = new FormData();
    formData.append('comprobante', comprobanteFile);

    try {
      await axios.post(`portal-aspirante/${token}/comprobante`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMensajeComprobante({ tipo: 'success', texto: 'Comprobante subido exitosamente. El equipo de administración revisará su pago.' });
      setComprobanteFile(null);
    } catch (err: unknown) {
      setMensajeComprobante({ tipo: 'error', texto: 'Error al subir el comprobante. Por favor intente nuevamente o contacte soporte.' });
    } finally {
      setSubiendoComprobante(false);
    }
  };

  // 4. Retornos tempranos de carga o error general
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-4 p-10 bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-700 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cargando su información…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-10 md:p-14 w-full max-w-lg text-center flex flex-col items-center gap-5">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Enlace inválido</h1>
          <p className="text-sm text-slate-500 leading-relaxed">{error ?? 'El enlace no es válido o ha expirado. Consulte con la institución para obtener un nuevo enlace.'}</p>
        </div>
      </div>
    );
  }

  // 5. Flujo No Validado (Formulario de Validación)
  if (!isValidado) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-between">
        <header className="w-full bg-white border-b border-slate-200/80 py-4 shadow-sm">
          <div className="max-w-md mx-auto px-5 flex items-center justify-between gap-3">
            <img src={LOGO_SCHOOL} alt="School by Virtual Technology" className="h-9 w-auto" />
            <span className="text-xs font-medium text-slate-500">Portal del aspirante</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-8 w-full max-w-md">
            <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center mb-5">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mb-2">Validación de Identidad</h1>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Por motivos de seguridad y confidencialidad, ingrese su número de documento para poder acceder a los detalles económicos de su inscripción.
            </p>

            <form onSubmit={handleValidarIdentidad} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tipo de Documento</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-600 transition-colors"
                >
                  <option value="CC">Cédula de Ciudadanía (CC)</option>
                  <option value="TI">Tarjeta de Identidad (TI)</option>
                  <option value="CE">Cédula de Extranjería (CE)</option>
                  <option value="PEP">PEP</option>
                  <option value="PPT">PPT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Número de Identificación</label>
                <input
                  type="text"
                  required
                  placeholder="Ingrese su documento registrado"
                  value={documentoValidar}
                  onChange={(e) => setDocumentoValidar(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 transition-colors"
                />
              </div>

              {errorValidacion && (
                <div className="bg-red-50 text-red-800 text-xs font-semibold p-3.5 rounded-xl border border-red-100 leading-relaxed">
                  {errorValidacion}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
              >
                Consultar
              </button>
            </form>
          </div>
        </main>

        <footer className="w-full border-t border-slate-200/60 py-5 text-center bg-white">
          <p className="text-xs font-semibold text-slate-500">
            School · Virtual Technology · Portal del aspirante
          </p>
        </footer>
      </div>
    );
  }

  // 6. Flujo Validado (Muestra de información del aspirante)
  const { solicitud, estudiante } = data;
  const badge = estadoBadge(solicitud.estado);
  const pendiente = data.saldoPendiente ?? solicitud.saldoPendiente ?? 0;
  const total = data.valorTotal ?? solicitud.totalFactura ?? 0;
  const numeroFactura = data.numeroFactura ?? solicitud.numeroFactura;
  const pdfUrl = data.pdfUrl;

  const estadoUpper = (solicitud.estado ?? '').toUpperCase();
  const estadoFacturaUpper = (solicitud.estadoFactura ?? '').toUpperCase();

  const mostrarSeccionEconomica =
    estadoUpper === 'FACTURA_GENERADA' ||
    estadoUpper === 'PENDIENTE_PAGO' ||
    estadoUpper === 'PAGO_EN_REVISION' ||
    estadoUpper === 'PENDIENTE' ||
    estadoFacturaUpper === 'PENDIENTE' ||
    pendiente > 0;

  const esPagoFinalizado =
    estadoUpper === 'PAGO_APROBADO' ||
    estadoUpper === 'INSCRIPCION_APROBADA' ||
    estadoUpper === 'APROBADA' ||
    (pendiente <= 0 && total > 0);

  const pasarela = data.pasarelaPago;
  const mostrarPSE = pasarela?.habilitarPSE === true;
  const mostrarTarjetas = pasarela?.habilitarTarjetas === true;
  const hayPagoEnLinea = pasarela?.disponible && (mostrarPSE || mostrarTarjetas) && pendiente > 0;

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200/80 shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_SCHOOL} alt="School by Virtual Technology" className="h-9 w-auto" />
            <span className="hidden sm:inline text-xs font-medium text-slate-500 border-l border-slate-200 pl-3">Portal del aspirante</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${badge.color}`}>
            {badge.icon}
            {badge.label}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-5">
        {/* Solicitud header card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
          <div className="bg-slate-800 px-6 py-5">
            <p className="text-slate-300 text-xs font-semibold mb-1">Solicitud de inscripción</p>
            <h1 className="text-white text-xl font-bold tracking-tight">{solicitud.nombrePrograma}</h1>
            <div className="flex flex-wrap gap-3 mt-3">
              <span className="text-xs font-semibold text-slate-100 bg-white/10 px-2.5 py-1 rounded-full">
                {solicitud.numeroSolicitud}
              </span>
              {numeroFactura && (
                <span className="text-xs font-semibold text-slate-100 bg-white/10 px-2.5 py-1 rounded-full">
                  Factura: {numeroFactura}
                </span>
              )}
              <span className="text-xs font-semibold text-slate-100 bg-white/10 px-2.5 py-1 rounded-full">
                {solicitud.fechaSolicitud}
              </span>
            </div>
          </div>
        </div>

        {/* INFORMACIÓN DE PAGO (Sección Económica) */}
        {mostrarSeccionEconomica && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <h2 className="text-sm font-semibold text-slate-800">Información de pago</h2>
              </div>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Descargar factura (PDF)
                </a>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Número de factura</p>
                  <p className="text-sm font-semibold text-slate-800">{numeroFactura ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Valor total</p>
                  <p className="text-sm font-semibold text-slate-800">{formatCOP(total)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">Saldo pendiente</p>
                  <p className="text-base font-bold text-slate-900">{formatCOP(pendiente)}</p>
                </div>
              </div>

              {mensajeRetornoPago && (
                <div className="p-3 rounded-xl text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                  {mensajeRetornoPago}
                </div>
              )}

              {/* Botones de Pasarelas de Pago (WOMPI Web Checkout) */}
              {hayPagoEnLinea && (
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-sm font-semibold text-slate-800 mb-1">Pagar en línea</p>
                  <p className="text-xs text-slate-500 mb-4">
                    Será redirigido a la página segura de Wompi. La institución no almacena datos de tarjetas ni cuentas bancarias.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {mostrarPSE && (
                      <button
                        type="button"
                        onClick={() => handleIniciarPagoWompi('PSE')}
                        disabled={iniciandoPago !== null}
                        className="flex-1 bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {iniciandoPago === 'PSE' ? 'Redirigiendo a Wompi…' : 'Pagar con PSE'}
                      </button>
                    )}
                    {mostrarTarjetas && (
                      <button
                        type="button"
                        onClick={() => handleIniciarPagoWompi('CARD')}
                        disabled={iniciandoPago !== null}
                        className="flex-1 bg-white border border-blue-700 text-blue-700 hover:bg-blue-50 font-semibold py-3 px-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CreditCard className="w-4 h-4" />
                        {iniciandoPago === 'CARD' ? 'Redirigiendo a Wompi…' : 'Pagar con tarjeta'}
                      </button>
                    )}
                  </div>
                  {errorPago && (
                    <div className="mt-3 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-100">
                      {errorPago}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={verificarPago}
                    disabled={verificandoPago}
                    className="mt-4 text-sm font-medium text-blue-700 hover:text-blue-900 underline-offset-2 hover:underline transition-colors disabled:opacity-50"
                  >
                    {verificandoPago ? 'Verificando pago…' : '¿Ya pagó en Wompi? Verificar el pago'}
                  </button>
                </div>
              )}

              {!hayPagoEnLinea && pendiente > 0 && (
                <div className="border-t border-slate-100 pt-5">
                  <p className="text-sm font-semibold text-slate-800 mb-3">Pagar en línea</p>
                  <div className="p-3 rounded-lg text-sm bg-amber-50 text-amber-900 border border-amber-100">
                    El pago en línea no está disponible en este momento. Realice el pago presencial o por transferencia y cargue el comprobante.
                  </div>
                </div>
              )}

              {/* Carga de Comprobante */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold text-slate-800 mb-1">Cargar comprobante de pago</p>
                <p className="text-xs text-slate-500 mb-3">Si pagó por transferencia o de forma presencial, adjunte el soporte en PDF o imagen.</p>
                <form onSubmit={handleSubirComprobante} className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setComprobanteFile(e.target.files?.[0] ?? null)}
                      className="flex-1 text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                    />
                    <button
                      type="submit"
                      disabled={!comprobanteFile || subiendoComprobante}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2.5 px-5 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {subiendoComprobante ? 'Cargando…' : 'Cargar comprobante'}
                    </button>
                  </div>
                  {mensajeComprobante && (
                    <div className={`p-3 rounded-xl text-xs font-semibold ${mensajeComprobante.tipo === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                      {mensajeComprobante.texto}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Factura Pagada / Estado Final */}
        {esPagoFinalizado && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-bold text-emerald-900">Pago recibido</p>
                <p className="text-sm text-emerald-800 mt-0.5">Registramos el pago de {formatCOP(total)}. Su inscripción continúa en validación final.</p>
              </div>
            </div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors shrink-0"
              >
                <FileText className="w-4 h-4" />
                Descargar factura (PDF)
              </a>
            )}
          </div>
        )}

        {/* Datos del aspirante */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <User className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-semibold text-slate-800">Datos del aspirante</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {[
              { label: 'Nombre completo', value: estudiante?.nombreCompleto ?? solicitud.nombreEstudiante },
              { label: 'Documento', value: `${estudiante?.tipoDocumento ?? ''} ${estudiante?.documento ?? solicitud.documento}`.trim() },
              { label: 'Correo', value: estudiante?.email ?? solicitud.email ?? '—' },
              { label: 'Teléfono', value: estudiante?.celular ?? estudiante?.telefono ?? solicitud.telefono ?? '—' },
            ].map((item) => (
              <div key={item.label} className="px-5 py-4">
                <p className="text-xs font-medium text-slate-500 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-slate-800 break-all">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Programa */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-700" />
            <h2 className="text-sm font-semibold text-slate-800">Programa académico</h2>
          </div>
          <div className="px-5 py-4">
            <p className="text-base font-bold text-slate-800">{solicitud.nombrePrograma}</p>
            {solicitud.codigoPrograma && (
              <p className="text-xs text-slate-400 font-semibold mt-1">{solicitud.codigoPrograma}</p>
            )}
          </div>
        </div>

        {/* Instrucciones de pago */}
        {pendiente > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <h2 className="text-sm font-semibold text-slate-800">¿Cómo realizar el pago?</h2>
            </div>
            <div className="px-5 py-5 space-y-3">
              {[
                {
                  num: 1,
                  texto: hayPagoEnLinea
                    ? `Pague ${formatCOP(pendiente)} en línea con PSE o tarjeta desde la sección de pago.`
                    : `Realice el pago de ${formatCOP(pendiente)} por el medio indicado por la institución.`
                },
                { num: 2, texto: 'Si pagó por transferencia o de forma presencial, cargue el comprobante en esta página.' },
                { num: 3, texto: 'El equipo administrativo validará el pago.' },
                { num: 4, texto: 'Recibirá la confirmación de su inscripción por correo electrónico.' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                    {step.num}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.texto}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contacto */}
        <div className="bg-white border border-slate-200/80 rounded-2xl px-5 py-4">
          <p className="text-sm text-slate-600">
            ¿Tiene preguntas sobre su inscripción? Comuníquese con el área de admisiones de la institución.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/60 py-5 text-center">
        <p className="text-xs font-medium text-slate-500">
          School · Virtual Technology · Portal del aspirante
        </p>
        <p className="text-xs text-slate-400 mt-1">Esta página es de acceso personal e intransferible.</p>
      </footer>
    </div>
  );
};

export default PortalAspirantePage;
