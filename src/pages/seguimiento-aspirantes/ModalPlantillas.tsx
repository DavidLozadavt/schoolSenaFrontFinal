import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { useConfirm } from '@/hooks';
import { seguimientoAspirantesService, WhatsappPlantilla } from '@/services/seguimientoAspirantesService';

interface ModalPlantillasProps {
  open: boolean;
  onClose: () => void;
}

const ModalPlantillas = ({ open, onClose }: ModalPlantillasProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();

  const [plantillas, setPlantillas] = useState<WhatsappPlantilla[]>([]);
  const [loading, setLoading] = useState(false);
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchPlantillas = async () => {
    setLoading(true);
    try {
      const data = await seguimientoAspirantesService.getPlantillas();
      setPlantillas(data);
    } catch {
      enqueueSnackbar('Error al cargar las plantillas.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchPlantillas();
  }, [open]);

  const handleCrear = async () => {
    if (nombre.trim() === '' || mensaje.trim() === '') {
      enqueueSnackbar('Nombre y mensaje son obligatorios.', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      await seguimientoAspirantesService.crearPlantilla(nombre.trim(), mensaje.trim());
      enqueueSnackbar('Plantilla guardada correctamente.', { variant: 'success' });
      setNombre('');
      setMensaje('');
      fetchPlantillas();
    } catch (error: any) {
      enqueueSnackbar(error?.response?.data?.error || 'Error al guardar la plantilla.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEliminar = (id: number) => {
    confirmAction('¿Eliminar esta plantilla?', async () => {
      try {
        await seguimientoAspirantesService.eliminarPlantilla(id);
        enqueueSnackbar('Plantilla eliminada.', { variant: 'success' });
        fetchPlantillas();
      } catch {
        enqueueSnackbar('Error al eliminar la plantilla.', { variant: 'error' });
      }
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[6%] p-4 max-h-[90vh] flex flex-col">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <KeenIcon icon="messages" className="text-primary text-2xl" />
            Plantillas de WhatsApp
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="overflow-y-auto grow flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="form-label font-medium">
              Nombre (debe coincidir exacto con el nombre de la plantilla aprobada en Meta)
            </label>
            <input
              type="text"
              className="input input-sm"
              placeholder="seguimiento_interes_programa_sena_v2"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <label className="form-label font-medium mt-2">Mensaje (referencia, solo informativo)</label>
            <textarea
              className="textarea textarea-sm"
              rows={3}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
            />
            <button className="btn btn-sm btn-primary self-end mt-1" onClick={handleCrear} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar plantilla'}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">Plantillas registradas</h4>
            {loading ? (
              <p className="text-sm text-gray-400">Cargando...</p>
            ) : plantillas.length === 0 ? (
              <p className="text-sm text-gray-400">No hay plantillas registradas.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {plantillas.map((p) => (
                  <div key={p.id} className="flex items-center justify-between border border-gray-100 rounded-md p-2.5">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-900">{p.nombre}</span>
                      <span className="text-xs text-gray-500">{p.mensaje}</span>
                    </div>
                    <button
                      className="btn btn-xs btn-icon btn-light btn-danger"
                      onClick={() => handleEliminar(p.id)}
                    >
                      <KeenIcon icon="trash" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalPlantillas };
