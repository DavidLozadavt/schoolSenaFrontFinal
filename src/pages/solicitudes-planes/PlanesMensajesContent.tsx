import { Fragment, useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { MensajesPlan, planesMensajesService } from '@/services/planesMensajesService';

/** Formatea un número tolerando null/undefined (datos incompletos del backend). */
const formatearNumero = (valor?: number | string | null) =>
  Number(valor ?? 0).toLocaleString('es-CO');

const formatearPrecio = (valor: string | number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(valor ?? 0));

const PLAN_VACIO: Partial<MensajesPlan> = {
  nombre: '',
  cantidadMensajes: 500,
  precio: 0,
  descripcion: '',
  activo: true
};

/**
 * Administración del catálogo de planes (Administrador VT).
 */
const PlanesMensajesContent = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [planes, setPlanes] = useState<MensajesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState<Partial<MensajesPlan> | null>(null);

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      setPlanes(await planesMensajesService.getPlanes(true));
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cargar los planes.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGuardar = async () => {
    if (!editando) return;
    if (!editando.nombre?.trim()) {
      enqueueSnackbar('El nombre es obligatorio.', { variant: 'warning' });
      return;
    }

    setGuardando(true);
    try {
      if (editando.id) {
        await planesMensajesService.actualizarPlan(editando.id, editando);
        enqueueSnackbar('Plan actualizado.', { variant: 'success' });
      } else {
        await planesMensajesService.crearPlan(editando);
        enqueueSnackbar('Plan creado.', { variant: 'success' });
      }
      setEditando(null);
      await fetchPlanes();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al guardar el plan.', {
        variant: 'error'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleAlternarEstado = async (plan: MensajesPlan) => {
    try {
      await planesMensajesService.actualizarPlan(plan.id, { activo: !plan.activo });
      await fetchPlanes();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cambiar el estado.', {
        variant: 'error'
      });
    }
  };

  return (
    <Fragment>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Catálogo de planes</h3>
        <button
          className="btn btn-sm btn-primary flex items-center gap-1.5"
          onClick={() => setEditando({ ...PLAN_VACIO })}
        >
          <KeenIcon icon="plus" />
          Nuevo plan
        </button>
      </div>

      {editando && (
        <div className="card mb-4">
          <div className="card-body grid sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="form-label font-medium">Nombre</label>
              <input
                type="text"
                className="input input-sm"
                value={editando.nombre ?? ''}
                onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label font-medium">Cantidad de mensajes</label>
              <input
                type="number"
                min={1}
                className="input input-sm"
                value={editando.cantidadMensajes ?? 0}
                onChange={(e) =>
                  setEditando({ ...editando, cantidadMensajes: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label font-medium">Precio</label>
              <input
                type="number"
                min={0}
                className="input input-sm"
                value={Number(editando.precio ?? 0)}
                onChange={(e) => setEditando({ ...editando, precio: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label font-medium">Estado</label>
              <select
                className="select select-sm"
                value={editando.activo ? '1' : '0'}
                onChange={(e) => setEditando({ ...editando, activo: e.target.value === '1' })}
              >
                <option value="1">Activo</option>
                <option value="0">Inactivo</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="form-label font-medium">Descripción</label>
              <textarea
                className="textarea textarea-sm"
                rows={2}
                value={editando.descripcion ?? ''}
                onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setEditando(null)}
                disabled={guardando}
              >
                Cancelar
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleGuardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-400">
              <span className="spinner-border spinner-border-sm" />
              Cargando planes...
            </div>
          ) : (
            <table className="table table-sm align-middle text-sm">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Mensajes</th>
                  <th>Precio</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planes.map((plan) => (
                  <tr key={plan.id}>
                    <td className="font-semibold text-gray-900">{plan.nombre}</td>
                    <td>{formatearNumero(plan.cantidadMensajes)}</td>
                    <td>{formatearPrecio(plan.precio)}</td>
                    <td className="text-xs text-gray-500">{plan.descripcion || '—'}</td>
                    <td>
                      <span className={`badge badge-sm ${plan.activo ? 'badge-success' : 'badge-light'}`}>
                        {plan.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn btn-xs btn-icon btn-light"
                          title="Editar"
                          onClick={() => setEditando({ ...plan })}
                        >
                          <KeenIcon icon="pencil" />
                        </button>
                        <button
                          className="btn btn-xs btn-light"
                          title={plan.activo ? 'Desactivar' : 'Activar'}
                          onClick={() => handleAlternarEstado(plan)}
                        >
                          {plan.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Fragment>
  );
};

export { PlanesMensajesContent };
