import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { ViajesModel } from '@/pages/transporte/cronograma-rutas/model/ViajesInterface';
import { DocumentoVigencia } from './MoldalDescuentosPlanillaViaje';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  idVehiculo?: number;
  viaje?: ViajesModel | null;
  documentosConductor?: DocumentoVigencia[];
}

interface DetalleRevision {
  id: number;
  nombre: string;
  tipoDetalle: string;
}

const ModalRevisionPreoperacional = ({ open, onClose, onSave, idVehiculo, viaje }: ModalProps) => {
  const [detalles, setDetalles] = useState<DetalleRevision[]>([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const [documentos, setDocumentos] = useState<DocumentoVigencia[]>([]);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);

  const [revisiones, setRevisiones] = useState<{
    [id: number]: {
      estado?: 'ACTIVO' | 'PENDIENTE' | 'RECHAZADO';
      observacion?: string;
      fechaLimite?: string;
    };
  }>({});

  const mapearEstadoVigencia = (estadoApi: string): 'vigente' | 'proximo_vencer' | 'vencido' => {
    const estado = estadoApi.toUpperCase();
    if (estado === 'VENCIDO') return 'vencido';
    if (estado === 'POR VENCER' || estado === 'PROXIMO A VENCER') return 'proximo_vencer';
    return 'vigente';
  };

  const getEstadoBadgeStyles = (estado: string) => {
    switch (estado) {
      case 'vigente':
        return {
          container: 'bg-green-10 border-green-200',
          icon: 'text-green-600',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-700'
        };
      case 'proximo_vencer':
        return {
          container: 'bg-yellow-10 border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      case 'vencido':
        return {
          container: 'bg-red-10 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-700'
        };
      default:
        return {
          container: 'bg-gray-10 border-gray-200',
          icon: 'text-gray-600',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-700'
        };
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'vigente':
        return 'Vigente';
      case 'proximo_vencer':
        return 'Próximo a vencer';
      case 'vencido':
        return 'Vencido';
      default:
        return 'Sin información';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'vigente':
        return 'check-circle';
      case 'proximo_vencer':
        return 'information-circle';
      case 'vencido':
        return 'cross-circle';
      default:
        return 'question-circle';
    }
  };

  useEffect(() => {
  if (open) {
    setDocumentos([]);
    setRevisiones({});
    fetchDetallesRevision();
  }
}, [open, viaje]);



  const fetchDetallesRevision = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/detalle_revision');
      setDetalles(res.data);

      if (viaje?.idConductor) {
        setLoadingDocumentos(true);
        try {
          const response = await axios.get(`/get_documents_alert_driver/${viaje.idConductor}`);

          const documentosConductor: DocumentoVigencia[] = response.data.map((doc: any) => ({
            nombre: doc.tipo_documento?.tituloDocumento || doc.tipoDocumento?.nombre,
            fechaVencimiento: doc.fecha_vigencia,
            estado: mapearEstadoVigencia(doc.estado_vigencia),
            tipo: 'conductor'
          }));

          setDocumentos(documentosConductor);
        } catch (docError) {
          console.error('Error al cargar documentos del conductor:', docError);
          enqueueSnackbar('No se pudieron cargar los documentos del conductor', {
            variant: 'warning'
          });
        } finally {
          setLoadingDocumentos(false);
        }
      }

      if (viaje?.vehiculo?.id) {
        setLoadingDocumentos(true);
        try {
          const resVehiculo = await axios.get(`/get_vehicle_documents_alert/${viaje.vehiculo.id}`);
          const documentosVehiculo: DocumentoVigencia[] = resVehiculo.data.map((doc: any) => ({
            nombre: doc.tipo_documento?.tituloDocumento || doc.tipoDocumento?.nombre,
            fechaVencimiento: doc.fecha_vigencia,
            estado: mapearEstadoVigencia(doc.estado_vigencia),
            tipo: 'vehiculo'
          }));

          setDocumentos((prev) => [...prev, ...documentosVehiculo]);
        } catch (error) {
          console.error('Error al cargar documentos del vehículo:', error);
          enqueueSnackbar('No se pudieron cargar los documentos del vehículo', {
            variant: 'warning'
          });
        } finally {
          setLoadingDocumentos(false);
        }
      }
    } catch (error) {
      enqueueSnackbar('Error al cargar los detalles de revisión', { variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const detallesAgrupados = detalles.reduce(
    (acc, detalle) => {
      const tipo = detalle.tipoDetalle || 'OTROS';
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(detalle);
      return acc;
    },
    {} as Record<string, DetalleRevision[]>
  );

  const handleEstadoChange = (id: number, estado: 'ACTIVO' | 'PENDIENTE' | 'RECHAZADO') => {
    setRevisiones((prev) => {
      const current = prev[id]?.estado;
      if (current === estado) {
        const updated = { ...prev };
        delete updated[id].estado;
        return updated;
      }
      return {
        ...prev,
        [id]: { ...prev[id], estado }
      };
    });
  };

  const handleObservacionChange = (id: number, value: string) => {
    setRevisiones((prev) => ({
      ...prev,
      [id]: { ...prev[id], observacion: value }
    }));
  };

  const handleFechaChange = (id: number, value: string) => {
    setRevisiones((prev) => ({
      ...prev,
      [id]: { ...prev[id], fechaLimite: value }
    }));
  };

  const handleSubmit = async () => {
    if (!idVehiculo && !viaje?.vehiculo?.id) {
      enqueueSnackbar('Debes seleccionar un vehículo antes de continuar.', {
        variant: 'warning'
      });
      return;
    }

    const detallesEnviar = detalles.map((item) => ({
      idDetalle: item.id,
      estado: revisiones[item.id]?.estado || null,
      observacion: revisiones[item.id]?.observacion || null,
      fechaLimite: revisiones[item.id]?.fechaLimite || null
    }));

    const payload = {
      idVehiculo: idVehiculo || viaje?.vehiculo?.id,
      idViaje: viaje?.id,
      detalles: detallesEnviar
    };

    try {
      await axios.post('/asignacion_revision_vehiculo', payload);
      enqueueSnackbar('Revisión guardada exitosamente', { variant: 'success' });

      const hayRechazo = detallesEnviar.some((d) => d.estado === 'RECHAZADO');

      if (hayRechazo && viaje?.id) {
        try {
          await axios.patch(`/viajes/${viaje.id}/remove-vehicle`, {
            observacion: 'Vehículo removido automáticamente por revisión rechazada'
          });
          enqueueSnackbar('Vehículo removido debido a revisión rechazada', {
            variant: 'warning'
          });
        } catch (error) {
          console.error('Error al remover el vehículo:', error);
          enqueueSnackbar('Error al remover el vehículo rechazado', {
            variant: 'error'
          });
        }
      }

      onClose();
      if (onSave) onSave(payload);
    } catch (error) {
      enqueueSnackbar('Error al guardar la revisión', { variant: 'error' });
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[910px] top-[10%] p-0 rounded-2xl shadow-lg overflow-hidden">
        <ModalHeader className="flex justify-between items-center border-b p-4">
          <ModalTitle className="text-lg font-semibold flex items-center gap-2">
            Revisión Preoperacional
          </ModalTitle>
          <button onClick={onClose} className="btn btn-sm btn-icon btn-light hover:bg-gray-100">
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-4">
          {loading ? (
            <p className="text-gray-500">Cargando detalles...</p>
          ) : (
            <>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Si algún ítem es marcado como "Rechazado", el vehículo será
                  removido automáticamente del viaje asociado.
                </p>
              </div>

              {/* 🔹 Documentos conductor y vehículo */}
              {documentos.length > 0 && (
                <div className="bg-gradient-to-br to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <KeenIcon icon="shield-tick" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800">Estado de Documentos</h3>
                  </div>

                  {loadingDocumentos ? (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-sm text-gray-500">Cargando documentos...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {documentos.map((doc, index) => {
                        const styles = getEstadoBadgeStyles(doc.estado);
                        const esVehiculo = doc.tipo === 'vehiculo';
                        return (
                          <div
                            key={index}
                            className={`${styles.container} rounded-lg p-3 border transition-all hover:shadow-md`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                <KeenIcon
                                  icon={esVehiculo ? 'car' : getEstadoIcon(doc.estado)}
                                  className={`${
                                    esVehiculo ? 'text-indigo-600' : styles.icon
                                  } text-lg mt-0.5`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-800 text-sm">{doc.nombre}</p>
                                  {doc.fechaVencimiento && (
                                    <p className={`text-xs ${styles.text} mt-0.5`}>
                                      Vence:{' '}
                                      {new Date(doc.fechaVencimiento).toLocaleDateString('es-CO')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span
                                className={`${styles.badge} px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap`}
                              >
                                {getEstadoTexto(doc.estado)}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1 italic">
                              {esVehiculo ? 'Documento del vehículo' : 'Documento del conductor'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 🔹 Detalles de revisión */}
              <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                {Object.entries(detallesAgrupados).map(([tipoDetalle, items]) => (
                  <div key={tipoDetalle} className="space-y-3">
                    <div className="bg-blue-50 border-l-4 border-blue-600 px-4 py-2 rounded">
                      <h3 className="font-bold text-blue-900 uppercase text-sm">{tipoDetalle}</h3>
                    </div>

                    <div className="space-y-3 pl-2">
                      {items.map((item) => {
                        const estado = revisiones[item.id]?.estado;
                        return (
                          <div key={item.id} className="p-4 border rounded-lg shadow-sm ">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-sm">{item.nombre}</span>

                              <div className="flex gap-4 items-center">
                                <label className="flex items-center gap-1 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={estado === 'ACTIVO'}
                                    onChange={() => handleEstadoChange(item.id, 'ACTIVO')}
                                    className="cursor-pointer"
                                  />
                                  Aprobado
                                </label>

                                <label className="flex items-center gap-1 text-sm cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={estado === 'PENDIENTE'}
                                    onChange={() => handleEstadoChange(item.id, 'PENDIENTE')}
                                    className="cursor-pointer"
                                  />
                                  Pendiente
                                </label>

                                <label className="flex items-center gap-1 text-sm text-red-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={estado === 'RECHAZADO'}
                                    onChange={() => handleEstadoChange(item.id, 'RECHAZADO')}
                                    className="cursor-pointer"
                                  />
                                  Rechazado
                                </label>
                              </div>
                            </div>

                            {(estado === 'PENDIENTE' || estado === 'RECHAZADO') && (
                              <div className="space-y-2 mt-3 border-t pt-3">
                                <textarea
                                  placeholder="Observación..."
                                  className="w-full border rounded p-2 text-sm resize-none"
                                  rows={2}
                                  value={revisiones[item.id]?.observacion || ''}
                                  onChange={(e) => handleObservacionChange(item.id, e.target.value)}
                                />

                                {estado === 'PENDIENTE' && (
                                  <input
                                    type="date"
                                    className="border rounded p-2 text-sm w-full"
                                    value={revisiones[item.id]?.fechaLimite || ''}
                                    onChange={(e) => handleFechaChange(item.id, e.target.value)}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Guardar Revisión
                </button>
              </div>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalRevisionPreoperacional;
