import { Fragment, useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { useConfirm } from '@/hooks';
import { MensajesPlan, planesMensajesService } from '@/services/planesMensajesService';

const formatearPrecio = (valor: string | number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(valor ?? 0));

const COLORES = [
  { valor: '', etiqueta: 'Sin color' },
  { valor: 'primary', etiqueta: 'Azul (primary)' },
  { valor: 'success', etiqueta: 'Verde (success)' },
  { valor: 'info', etiqueta: 'Celeste (info)' },
  { valor: 'warning', etiqueta: 'Naranja (warning)' },
  { valor: 'danger', etiqueta: 'Rojo (danger)' },
  { valor: 'dark', etiqueta: 'Oscuro (dark)' }
];

const PLAN_VACIO: Partial<MensajesPlan> = {
  nombre: '',
  cantidadMensajes: 500,
  precio: 0,
  descripcion: '',
  activo: true,
  orden: 0,
  recomendado: false,
  color: '',
  etiqueta: ''
};

/**
 * CRUD completo del catálogo de planes (Mejora 4). Módulo propio del
 * Administrador VT, protegido por GESTION_PLANES_MENSAJES.
 */
const PlanesMensajesAdminContent = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();

  const [planes, setPlanes] = useState<MensajesPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState<Partial<MensajesPlan> | null>(null);

  const fetchPlanes = async () => {
    setLoading(true);
    try {
      setPlanes(await planesMensajesService.adminListarPlanes());
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
    if (!editando.cantidadMensajes || editando.cantidadMensajes < 1) {
      enqueueSnackbar('La cantidad de mensajes debe ser mayor que cero.', { variant: 'warning' });
      return;
    }

    setGuardando(true);
    try {
      if (editando.id) {
        await planesMensajesService.adminActualizarPlan(editando.id, editando);
        enqueueSnackbar('Plan actualizado.', { variant: 'success' });
      } else {
        await planesMensajesService.adminCrearPlan(editando);
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
      await planesMensajesService.adminActualizarPlan(plan.id, { activo: !plan.activo });
      enqueueSnackbar(plan.activo ? 'Plan desactivado.' : 'Plan activado.', { variant: 'success' });
      await fetchPlanes();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cambiar el estado.', {
        variant: 'error'
      });
    }
  };

  const handleRecomendado = async (plan: MensajesPlan) => {
    try {
      await planesMensajesService.adminActualizarPlan(plan.id, { recomendado: !plan.recomendado });
      await fetchPlanes();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al marcar el plan.', {
        variant: 'error'
      });
    }
  };

  const handleEliminar = (plan: MensajesPlan) => {
    confirmAction(
      `¿Eliminar el plan "${plan.nombre}"? Si tiene compras asociadas solo se desactivará.`,
      async () => {
        try {
          const respuesta = await planesMensajesService.adminEliminarPlan(plan.id);
          enqueueSnackbar(respuesta.message, {
            variant: respuesta.tieneCompras ? 'warning' : 'success'
          });
          await fetchPlanes();
        } catch (error: any) {
          enqueueSnackbar(error?.response?.data?.error || 'Error al eliminar el plan.', {
            variant: 'error'
          });
        }
      }
    );
  };

  return (
    <Fragment>
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <h3 className="text-base font-semibold text-gray-900">Catálogo de planes</h3>
          <span className="text-2xs text-gray-500">
            Los planes con compras asociadas no pueden eliminarse: solo desactivarse.
          </span>
        </div>
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
            <div className="flex flex-col gap-1.5">
              <label className="form-label font-medium">Orden de visualización</label>
              <input
                type="number"
                min={0}
                className="input input-sm"
                value={editando.orden ?? 0}
                onChange={(e) => setEditando({ ...editando, orden: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label font-medium">Color</label>
              <select
                className="select select-sm"
                value={editando.color ?? ''}
                onChange={(e) => setEditando({ ...editando, color: e.target.value })}
              >
                {COLORES.map((color) => (
                  <option key={color.valor} value={color.valor}>
                    {color.etiqueta}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label font-medium">Etiqueta visual</label>
              <input
                type="text"
                maxLength={60}
                className="input input-sm"
                placeholder="Más vendido"
                value={editando.etiqueta ?? ''}
                onChange={(e) => setEditando({ ...editando, etiqueta: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm"
                  checked={!!editando.recomendado}
                  onChange={(e) => setEditando({ ...editando, recomendado: e.target.checked })}
                />
                Marcar como recomendado
              </label>
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
          ) : planes.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">No hay planes registrados.</p>
          ) : (
            <table className="table table-sm align-middle text-sm">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Nombre</th>
                  <th>Mensajes</th>
                  <th>Precio</th>
                  <th>Etiqueta</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {planes.map((plan) => (
                  <tr key={plan.id}>
                    <td className="text-xs text-gray-500">{plan.orden ?? 0}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{plan.nombre}</span>
                        {plan.recomendado && (
                          <span className="badge badge-sm badge-primary">Recomendado</span>
                        )}
                      </div>
                    </td>
                    <td>{plan.cantidadMensajes.toLocaleString('es-CO')}</td>
                    <td>{formatearPrecio(plan.precio)}</td>
                    <td>
                      {plan.etiqueta ? (
                        <span className={`badge badge-sm badge-${plan.color || 'light'}`}>
                          {plan.etiqueta}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-xs text-gray-500">{plan.descripcion || '—'}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${plan.activo ? 'badge-success' : 'badge-light'}`}
                      >
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
                          className="btn btn-xs btn-icon btn-light"
                          title={plan.recomendado ? 'Quitar recomendado' : 'Marcar recomendado'}
                          onClick={() => handleRecomendado(plan)}
                        >
                          <KeenIcon icon="star" />
                        </button>
                        <button
                          className="btn btn-xs btn-light"
                          title={plan.activo ? 'Desactivar' : 'Activar'}
                          onClick={() => handleAlternarEstado(plan)}
                        >
                          {plan.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="btn btn-xs btn-icon btn-light btn-danger"
                          title="Eliminar"
                          onClick={() => handleEliminar(plan)}
                        >
                          <KeenIcon icon="trash" />
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

export { PlanesMensajesAdminContent };
