import { Fragment, useCallback, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import Spinner from '@/components/loaders/Spinner';
import {
  aprobarComprobanteInscripcion,
  ComprobanteInscripcionBandeja,
  fetchComprobantesInscripcion,
  rechazarComprobanteInscripcion
} from './comprobantesInscripcionApi';

const ComprobantesInscripcionPage = () => {
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ComprobanteInscripcionBandeja[]>([]);
  const [filtro, setFiltro] = useState('PENDIENTE_REVISION');
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchComprobantesInscripcion(filtro || undefined);
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la bandeja de comprobantes.');
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleAprobar = async (id: number) => {
    setProcesandoId(id);
    try {
      await aprobarComprobanteInscripcion(id);
      await cargar();
    } catch (err) {
      console.error(err);
      setError('No se pudo aprobar el comprobante.');
    } finally {
      setProcesandoId(null);
    }
  };

  const handleRechazar = async (id: number) => {
    const observacion = window.prompt('Indique el motivo del rechazo:');
    if (!observacion?.trim()) return;

    setProcesandoId(id);
    try {
      await rechazarComprobanteInscripcion(id, observacion.trim());
      await cargar();
    } catch (err) {
      console.error(err);
      setError('No se pudo rechazar el comprobante.');
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Comprobantes de inscripción" />
              <ToolbarDescription>
                Revise y apruebe comprobantes cargados por estudiantes desde el portal público.
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="py-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'PENDIENTE_REVISION', label: 'Pendientes' },
              { value: 'APROBADO', label: 'Aprobados' },
              { value: 'RECHAZADO', label: 'Rechazados' },
              { value: '', label: 'Todos' }
            ].map((opt) => (
              <button
                key={opt.value || 'all'}
                type="button"
                onClick={() => setFiltro(opt.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase ${
                  filtro === opt.value
                    ? 'border-primary bg-primary text-white'
                    : 'border-gray-200 dark:border-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-500">No hay comprobantes en esta bandeja.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-[10px] font-bold uppercase text-gray-500 dark:bg-coal-400">
                  <tr>
                    <th className="px-4 py-3">Estudiante</th>
                    <th className="px-4 py-3">Programa</th>
                    <th className="px-4 py-3">Archivo</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3">
                        <p className="font-bold">{item.nombreEstudiante}</p>
                        <p className="text-xs text-gray-500">{item.documento}</p>
                      </td>
                      <td className="px-4 py-3">{item.programa}</td>
                      <td className="px-4 py-3">
                        {item.urlArchivo ? (
                          <a
                            href={item.urlArchivo}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold uppercase text-primary"
                          >
                            {item.nombreArchivo ?? 'Ver archivo'}
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold uppercase">{item.estado}</span>
                      </td>
                      <td className="px-4 py-3">
                        {item.estado === 'PENDIENTE_REVISION' && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={procesandoId === item.id}
                              onClick={() => handleAprobar(item.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-bold uppercase text-white disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              type="button"
                              disabled={procesandoId === item.id}
                              onClick={() => handleRechazar(item.id)}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-[10px] font-bold uppercase text-red-700 disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                        {item.observacionRevision && (
                          <p className="mt-1 text-xs text-gray-500">{item.observacionRevision}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </Fragment>
  );
};

export default ComprobantesInscripcionPage;
