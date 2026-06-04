import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Spinner from '@/components/loaders/Spinner';
import { fetchSeguimientoPorToken } from './seguimientoInscripcionApi';
import PortalSeguimientoView from './PortalSeguimientoView';
import { PortalSeguimientoInscripcion } from './seguimientoInscripcionTypes';

const SeguimientoInscripcionTokenPage = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PortalSeguimientoInscripcion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const portal = await fetchSeguimientoPorToken(token);
      setData(portal);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'No se pudo cargar el seguimiento.';
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Spinner />
        <p className="mt-3 text-sm text-slate-500">Cargando inscripción…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-red-700">{error || 'Enlace no válido.'}</p>
          <Link
            to="/seguimiento-inscripcion"
            className="mt-4 inline-block text-xs font-bold uppercase text-primary"
          >
            Buscar por documento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <PortalSeguimientoView data={data} token={token} onActualizar={setData} />
    </div>
  );
};

export default SeguimientoInscripcionTokenPage;
