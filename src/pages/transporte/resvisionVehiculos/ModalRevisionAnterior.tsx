import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
interface ModalRevisionAnteriorProps {
   open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  idVehiculo?: number;

}

const ModalRevisionAnterior = (
    { open, idVehiculo, onClose }: ModalRevisionAnteriorProps
) => {
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && idVehiculo) {
      fetchRevision();
    }
  }, [open, idVehiculo]);

  const fetchRevision = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/vehiculos/${idVehiculo}/ultima_revision`);
      if (response.data.success) {
        setRevision(response.data);
      }
    } catch (err) {
      setError('Error al cargar la revisión anterior');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { class: string; text: string }> = {
      ACTIVO: { class: 'badge badge-success badge-outline', text: 'Aprobado' },
      RECHAZADO: { class: 'badge badge-danger badge-outline', text: 'Rechazado' },
      PENDIENTE: { class: 'badge badge-warning badge-outline', text: 'Pendiente' }
    };
    return badges[estado] || badges.PENDIENTE;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[700px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Revisión Anterior del Vehículo</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="px-0 py-5">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="flex flex-col items-center gap-3">
                <div className="spinner spinner-primary"></div>
                <span className="text-gray-600">Cargando revisión...</span>
              </div>
            </div>
          ) : error ? (
            <div className="px-4">
              <div className="alert alert-danger">
                <KeenIcon icon="information-circle" className="text-danger" />
                <span>{error}</span>
              </div>
            </div>
          ) : revision ? (
            <div className="space-y-4">
              {/* Header con fecha */}
              <div className="bg-gray-100 rounded-lg p-4 mx-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeenIcon icon="calendar" className="text-primary text-xl" />
                    <div>
                      <span className="text-sm text-gray-600">Fecha de Revisión</span>
                      <p className="font-semibold text-gray-900">
                        {new Date(revision.fechaRevision).toLocaleString('es-CO', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">Total Revisiones</span>
                    <p className="font-semibold text-gray-900 text-xl">{revision.data.length}</p>
                  </div>
                </div>
              </div>

              {/* Lista de detalles */}
              <div className="px-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <KeenIcon icon="questionnaire-tablet" className="text-primary" />
                  Detalles de la Revisión
                </h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {revision.data.map((item: any, index: number) => {
                    const badge = getEstadoBadge(item.estado);
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                                {index + 1}
                              </span>
                              <h4 className="font-medium text-gray-900">
                                {item.detalle_revision.nombre}
                              </h4>
                            </div>
                            {item.observacion && (
                              <div className="ml-8 mt-2  rounded p-2">
                                <span className="text-xs text-gray-600 font-medium">Observación:</span>
                                <p className="text-sm text-gray-700 mt-1">{item.observacion}</p>
                              </div>
                            )}
                          </div>
                          <div className={badge.class}>
                            {badge.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen */}
              <div className="border-gray-200 rounded-lg p-4 mx-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-success">
                      {revision.data.filter((i: any) => i.estado === 'ACTIVO').length}
                    </p>
                    <p className="text-xs text-gray-600">Aprobados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-danger">
                      {revision.data.filter((i: any) => i.estado === 'RECHAZADO').length}
                    </p>
                    <p className="text-xs text-gray-600">Rechazados</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-warning">
                      {revision.data.filter((i: any) => i.estado === 'PORREVISION').length}
                    </p>
                    <p className="text-xs text-gray-600">Pendientes</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <KeenIcon icon="information-circle" className="text-gray-400 text-5xl mb-3" />
              <p className="text-gray-600">No hay revisión anterior disponible</p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 px-4">
            <button className="btn btn-primary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalRevisionAnterior