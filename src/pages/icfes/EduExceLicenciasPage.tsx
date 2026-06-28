import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';

interface InstitucionEduexce {
  id_institucion_eduexce: number;
  nombre: string;
  codigo_dane?: string;
  email?: string;
  ciudad?: string;
  departamento?: string;
  licencia_activa: boolean;
  fecha_vigencia_fin?: string | null;
  acceso_panel?: boolean;
  total_aprendices: number;
}

type AccionKey = string;

function formatearFecha(fecha: string): string {
  const parte = String(fecha).slice(0, 10);
  const [anio, mes, dia] = parte.split('-');
  if (!anio || !mes || !dia) return parte;
  return `${dia}/${mes}/${anio}`;
}

function TextoVacio({ children }: { children: string }) {
  return <span className="text-xs text-gray-400">{children}</span>;
}

function CeldaVigencia({
  fecha,
  licenciaActiva
}: {
  fecha?: string | null;
  licenciaActiva: boolean;
}) {
  if (fecha) {
    return <span className="text-sm font-medium text-gray-800">{formatearFecha(fecha)}</span>;
  }

  if (licenciaActiva) {
    return <span className="badge badge-sm badge-light">Sin fecha</span>;
  }

  return <span className="badge badge-sm badge-light text-gray-500">Pendiente</span>;
}

const EduExceLicenciasPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [instituciones, setInstituciones] = useState<InstitucionEduexce[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [accionando, setAccionando] = useState<AccionKey | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga(null);
    try {
      const { data } = await axios.get<{ instituciones_eduexce: InstitucionEduexce[] }>('eduexce/licencias', {
        params: busqueda ? { q: busqueda } : {}
      });
      setInstituciones(data.instituciones_eduexce ?? []);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        status === 403
          ? 'Sesión sin permiso LICENCIA_ICFES. Cierre sesión y vuelva a entrar como Administrador VT.'
          : err?.response?.data?.error || 'No se pudo cargar las licencias';
      setErrorCarga(msg);
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [busqueda, enqueueSnackbar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalPages = Math.max(1, Math.ceil(instituciones.length / pageSize));
  const pagina = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return instituciones.slice(start, start + pageSize);
  }, [instituciones, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [instituciones.length, pageSize, busqueda]);

  const toggleLicencia = async (inst: InstitucionEduexce, activar: boolean) => {
    const key = `eduexce-${inst.id_institucion_eduexce}`;
    if (accionando !== null) return;

    if (!activar) {
      if (
        !window.confirm(
          `¿Desactivar licencia ICFES para "${inst.nombre}"? Los estudiantes no podrán usar la app EduExce.`
        )
      ) {
        return;
      }
    }

    setAccionando(key);
    try {
      const accion = activar ? 'activar' : 'desactivar';
      const { data } = await axios.post<{ message?: string }>(
        `eduexce/licencias/eduexce/${inst.id_institucion_eduexce}/${accion}`
      );
      enqueueSnackbar(data.message || 'Licencia actualizada', { variant: 'success' });
      await cargar();
    } catch (err: any) {
      enqueueSnackbar(err?.response?.data?.error || 'Error al actualizar licencia', { variant: 'error' });
    } finally {
      setAccionando(null);
    }
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Licencias ICFES — Virtual Technology" />
            <ToolbarDescription>
              Active o desactive el servicio EduExce por institución.
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>

        <div className="card mb-5 p-5 bg-primary-light border border-primary-clarity text-sm text-gray-700">
          <p>
            <strong>Administrador VT:</strong> aquí se otorga la <strong>licencia</strong> por institución EduExce.
            Al activarla, se crea el acceso al panel ICFES para el administrador de la institución.
          </p>
        </div>

        {errorCarga && !loading && (
          <div className="card mb-5 p-5 border border-danger-clarity bg-danger-light text-danger">
            <p className="font-medium mb-2">{errorCarga}</p>
            <button type="button" className="btn btn-sm btn-danger" onClick={cargar}>
              Reintentar
            </button>
          </div>
        )}

        <div className="card mb-8">
          <div className="card-header flex-wrap gap-3 justify-between">
            <h3 className="card-title">Instituciones EduExce</h3>
            <input
              type="text"
              className="input input-sm w-64"
              placeholder="Buscar institución, DANE o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : (
            <>
              <div className="card-body p-0 overflow-x-auto">
                <table className="table table-border align-middle">
                  <thead>
                    <tr>
                      <th>Institución</th>
                      <th>Código DANE</th>
                      <th>Ciudad</th>
                      <th>Estudiantes</th>
                      <th>Vigencia</th>
                      <th>Panel</th>
                      <th>Licencia ICFES</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagina.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-gray-500 py-6">
                          Sin instituciones
                        </td>
                      </tr>
                    ) : (
                      pagina.map((inst) => {
                        const key = `eduexce-${inst.id_institucion_eduexce}`;
                        return (
                          <tr key={inst.id_institucion_eduexce}>
                            <td>
                              <div className="font-medium text-gray-900">{inst.nombre}</div>
                              {inst.email && <div className="text-xs text-gray-500">{inst.email}</div>}
                            </td>
                            <td>
                              {inst.codigo_dane ? (
                                inst.codigo_dane
                              ) : (
                                <TextoVacio>No registrado</TextoVacio>
                              )}
                            </td>
                            <td>
                              {inst.ciudad ? inst.ciudad : <TextoVacio>No registrada</TextoVacio>}
                            </td>
                            <td>{inst.total_aprendices}</td>
                            <td>
                              <CeldaVigencia
                                fecha={inst.fecha_vigencia_fin}
                                licenciaActiva={inst.licencia_activa}
                              />
                            </td>
                            <td>
                              <span
                                className={`badge badge-sm ${
                                  inst.acceso_panel ? 'badge-success' : 'badge-light'
                                }`}
                              >
                                {inst.acceso_panel ? 'Creado' : 'Pendiente'}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center gap-3">
                                <span
                                  className={`badge badge-sm ${
                                    inst.licencia_activa ? 'badge-success' : 'badge-danger'
                                  }`}
                                >
                                  {inst.licencia_activa ? 'Activa' : 'Inactiva'}
                                </span>
                                <label className="switch switch-sm">
                                  <input
                                    type="checkbox"
                                    checked={inst.licencia_activa}
                                    disabled={accionando === key}
                                    onChange={(e) => toggleLicencia(inst, e.target.checked)}
                                  />
                                </label>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {instituciones.length > 0 && (
                <div className="card-footer flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-4 px-5 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Mostrar:</span>
                    <select
                      className="select select-sm w-20"
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>
                      {(currentPage - 1) * pageSize + 1}–
                      {Math.min(currentPage * pageSize, instituciones.length)} de {instituciones.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </Fragment>
  );
};

export { EduExceLicenciasPage };
