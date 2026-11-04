import { useEffect, useState } from 'react';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { useConfirm } from '@/hooks';
import {
  BADGE_ESTADO_META,
  ETIQUETA_ESTADO_META,
  EstadoMeta,
  PlantillaMeta,
  plantillasMetaService
} from '@/services/plantillasMetaService';
import { FormularioPlantillaMeta } from './FormularioPlantillaMeta';

const ESTADOS: EstadoMeta[] = [
  'APPROVED',
  'PENDING',
  'IN_REVIEW',
  'REJECTED',
  'PAUSED',
  'DISABLED'
];

const formatearFecha = (valor?: string | null) =>
  valor ? new Date(valor).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const BadgeEstado = ({ estado }: { estado: EstadoMeta }) => (
  <span className={`badge badge-sm ${BADGE_ESTADO_META[estado] ?? 'badge-light'}`}>
    {ETIQUETA_ESTADO_META[estado] ?? estado} · {estado}
  </span>
);

/**
 * Administrador completo de plantillas sincronizadas con Meta.
 * Vive dentro del modal "Plantillas de WhatsApp" sin sustituir la
 * administración local existente.
 */
const AdministradorPlantillasMeta = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();

  const [plantillas, setPlantillas] = useState<PlantillaMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [detalle, setDetalle] = useState<PlantillaMeta | null>(null);

  const [buscar, setBuscar] = useState('');
  const [categoria, setCategoria] = useState('');
  const [estado, setEstado] = useState('');
  const [idioma, setIdioma] = useState('');

  const fetchPlantillas = async () => {
    setLoading(true);
    try {
      setPlantillas(
        await plantillasMetaService.listar({
          buscar: buscar || undefined,
          categoria: categoria || undefined,
          estado: estado || undefined,
          idioma: idioma || undefined
        })
      );
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al cargar las plantillas de Meta.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantillas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, estado, idioma]);

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      const respuesta = await plantillasMetaService.sincronizar();
      enqueueSnackbar(respuesta.message, { variant: 'success' });
      await fetchPlantillas();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al sincronizar con Meta.', {
        variant: 'error'
      });
    } finally {
      setSincronizando(false);
    }
  };

  const handleSincronizarUna = async (plantilla: PlantillaMeta) => {
    try {
      const respuesta = await plantillasMetaService.sincronizarUna(plantilla.id);
      enqueueSnackbar(respuesta.message, { variant: 'success' });
      await fetchPlantillas();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al sincronizar la plantilla.', {
        variant: 'error'
      });
    }
  };

  const handleEliminar = (plantilla: PlantillaMeta) => {
    confirmAction(
      `¿Eliminar localmente la plantilla "${plantilla.nombre}"? Seguirá existiendo en Meta.`,
      async () => {
        try {
          await plantillasMetaService.eliminarLocal(plantilla.id);
          enqueueSnackbar('Plantilla eliminada localmente.', { variant: 'success' });
          await fetchPlantillas();
        } catch (error: any) {
          enqueueSnackbar(error?.response?.data?.error || 'Error al eliminar la plantilla.', {
            variant: 'error'
          });
        }
      }
    );
  };

  const handleCopiarNombre = async (nombre: string) => {
    try {
      await navigator.clipboard.writeText(nombre);
      enqueueSnackbar(`Nombre "${nombre}" copiado al portapapeles.`, { variant: 'success' });
    } catch {
      enqueueSnackbar('No se pudo copiar el nombre.', { variant: 'error' });
    }
  };

  if (creando) {
    return (
      <FormularioPlantillaMeta
        onCancelar={() => setCreando(false)}
        onCreada={() => {
          setCreando(false);
          fetchPlantillas();
        }}
      />
    );
  }

  if (detalle) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-800">Detalle de la plantilla</h4>
          <button className="btn btn-xs btn-light" onClick={() => setDetalle(null)}>
            <KeenIcon icon="arrow-left" />
            Volver al listado
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Nombre:</span>{' '}
            <strong className="text-gray-900">{detalle.nombre}</strong>
          </div>
          <div>
            <span className="text-gray-500">Estado Meta:</span>{' '}
            <BadgeEstado estado={detalle.estadoMeta} />
          </div>
          <div>
            <span className="text-gray-500">Categoría:</span> {detalle.categoria}
          </div>
          <div>
            <span className="text-gray-500">Idioma:</span> {detalle.idioma}
          </div>
          <div>
            <span className="text-gray-500">Template ID:</span> {detalle.metaTemplateId ?? '—'}
          </div>
          <div>
            <span className="text-gray-500">Usuario creador:</span> {detalle.creadoPorNombre ?? '—'}
          </div>
          <div>
            <span className="text-gray-500">Fecha creación:</span> {formatearFecha(detalle.created_at)}
          </div>
          <div>
            <span className="text-gray-500">Última sincronización:</span>{' '}
            {formatearFecha(detalle.ultimaSincronizacion)}
          </div>
          <div>
            <span className="text-gray-500">Fecha aprobación:</span>{' '}
            {formatearFecha(detalle.fechaAprobacion)}
          </div>
        </div>

        {detalle.motivoRechazo && (
          <div className="rounded-md border border-danger/30 bg-danger/5 p-2 text-sm text-danger">
            Motivo de rechazo: {detalle.motivoRechazo}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-gray-700">Contenido</span>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-2 text-sm whitespace-pre-wrap">
            {detalle.contenido || '—'}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase text-gray-700">
            Respuesta completa de Meta (auditoría)
          </span>
          <pre className="max-h-52 overflow-auto rounded-md border border-gray-200 bg-gray-900 p-2 text-2xs text-gray-100">
            {JSON.stringify(detalle.respuestaMeta ?? {}, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-sm btn-primary flex items-center gap-1.5" onClick={() => setCreando(true)}>
          <KeenIcon icon="plus" />
          Crear plantilla
        </button>
        <button
          className="btn btn-sm btn-light flex items-center gap-1.5"
          onClick={handleSincronizar}
          disabled={sincronizando}
        >
          {sincronizando ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Sincronizando...
            </>
          ) : (
            <>
              <KeenIcon icon="arrows-circle" />
              Sincronizar plantillas
            </>
          )}
        </button>
        <span className="text-2xs text-gray-500 ms-auto">
          {plantillas.length} plantilla(s) · solo las <strong>APPROVED</strong> pueden usarse para
          enviar.
        </span>
      </div>

      {/* Buscador y filtros */}
      <div className="grid sm:grid-cols-4 gap-2">
        <div className="flex items-center gap-1.5 sm:col-span-2">
          <input
            type="text"
            className="input input-sm grow"
            placeholder="Buscar por nombre o contenido..."
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchPlantillas()}
          />
          <button className="btn btn-sm btn-icon btn-light" onClick={fetchPlantillas}>
            <KeenIcon icon="magnifier" />
          </button>
        </div>
        <select
          className="select select-sm"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="UTILITY">Utility</option>
          <option value="MARKETING">Marketing</option>
          <option value="AUTHENTICATION">Authentication</option>
        </select>
        <select className="select select-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map((item) => (
            <option key={item} value={item}>
              {ETIQUETA_ESTADO_META[item]}
            </option>
          ))}
        </select>
        <select className="select select-sm" value={idioma} onChange={(e) => setIdioma(e.target.value)}>
          <option value="">Todos los idiomas</option>
          <option value="es">es</option>
          <option value="es_ES">es_ES</option>
          <option value="es_MX">es_MX</option>
          <option value="en">en</option>
          <option value="en_US">en_US</option>
        </select>
      </div>

      {/* Listado */}
      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-400">
          <span className="spinner-border spinner-border-sm" />
          Cargando plantillas...
        </div>
      ) : plantillas.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-8 text-center">
          <KeenIcon icon="messages" className="text-3xl text-gray-300" />
          <p className="text-sm text-gray-500">No hay plantillas que coincidan con los filtros.</p>
          <p className="text-2xs text-gray-400">
            Use “Sincronizar plantillas” para importar las que ya existan en Meta.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-sm align-middle text-sm">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Idioma</th>
                <th>Estado Meta</th>
                <th>Creación</th>
                <th>Últ. sincronización</th>
                <th>Creador</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plantillas.map((plantilla) => (
                <tr key={plantilla.id}>
                  <td className="font-semibold text-gray-900">{plantilla.nombre}</td>
                  <td>{plantilla.categoria}</td>
                  <td>{plantilla.idioma}</td>
                  <td>
                    <BadgeEstado estado={plantilla.estadoMeta} />
                  </td>
                  <td className="text-xs text-gray-500">{formatearFecha(plantilla.created_at)}</td>
                  <td className="text-xs text-gray-500">
                    {formatearFecha(plantilla.ultimaSincronizacion)}
                  </td>
                  <td className="text-xs text-gray-500">{plantilla.creadoPorNombre ?? '—'}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="btn btn-xs btn-icon btn-light"
                        title="Ver detalle"
                        onClick={() => setDetalle(plantilla)}
                      >
                        <KeenIcon icon="eye" />
                      </button>
                      <button
                        className="btn btn-xs btn-icon btn-light"
                        title="Sincronizar"
                        onClick={() => handleSincronizarUna(plantilla)}
                      >
                        <KeenIcon icon="arrows-circle" />
                      </button>
                      <button
                        className="btn btn-xs btn-icon btn-light"
                        title="Copiar nombre"
                        onClick={() => handleCopiarNombre(plantilla.nombre)}
                      >
                        <KeenIcon icon="copy" />
                      </button>
                      <button
                        className="btn btn-xs btn-icon btn-light btn-danger"
                        title="Eliminar localmente"
                        onClick={() => handleEliminar(plantilla)}
                      >
                        <KeenIcon icon="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export { AdministradorPlantillasMeta };
