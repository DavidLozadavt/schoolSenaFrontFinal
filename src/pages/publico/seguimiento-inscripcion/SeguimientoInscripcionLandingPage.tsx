import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { consultarSeguimientoInscripcion } from './seguimientoInscripcionApi';
import PortalSeguimientoView from './PortalSeguimientoView';
import { PortalSeguimientoInscripcion, TIPOS_DOCUMENTO_PORTAL } from './seguimientoInscripcionTypes';

const SeguimientoInscripcionLandingPage = () => {
  const navigate = useNavigate();
  const [tipoDocumento, setTipoDocumento] = useState(TIPOS_DOCUMENTO_PORTAL[2]);
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portal, setPortal] = useState<PortalSeguimientoInscripcion | null>(null);

  const handleConsultar = async (e: FormEvent) => {
    e.preventDefault();
    const doc = documento.trim();
    if (!doc) {
      setError('Ingrese su número de documento.');
      return;
    }
    if (!email.trim()) {
      setError('Ingrese su correo electrónico.');
      return;
    }

    setLoading(true);
    setError('');
    setPortal(null);
    try {
      const res = await consultarSeguimientoInscripcion({
        documento: doc,
        tipoDocumento: tipoDocumento || undefined,
        email: email.trim()
      });

      if (res.redirectPath && res.token) {
        navigate(res.redirectPath);
        return;
      }

      setPortal(res);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se encontró inscripción con esos datos.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12">
      {!portal ? (
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-black uppercase tracking-wide text-slate-900">
              Seguimiento de inscripción
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Consulte el estado de su solicitud con su identificación. Si ya recibió factura, podrá
              descargarla y cargar comprobantes de pago.
            </p>

            <form onSubmit={handleConsultar} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Tipo de documento</span>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  {TIPOS_DOCUMENTO_PORTAL.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Número de documento</span>
                <input
                  type="text"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ej. 1234567890"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold uppercase text-slate-500">Correo electrónico</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="El mismo registrado en su formulario"
                />
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-xs font-bold uppercase text-white disabled:opacity-50"
              >
                {loading ? 'Consultando…' : 'Consultar inscripción'}
              </button>
            </form>

            <p className="mt-6 text-xs text-slate-500">
              Si recibió un enlace por correo, ábralo directamente; no necesita buscar por documento.
            </p>
          </div>
        </div>
      ) : (
        <PortalSeguimientoView data={portal} token={portal.token} onActualizar={setPortal} />
      )}
    </div>
  );
};

export default SeguimientoInscripcionLandingPage;
