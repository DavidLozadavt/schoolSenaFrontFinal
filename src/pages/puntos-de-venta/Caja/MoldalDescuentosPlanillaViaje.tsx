import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { ViajesModel } from '@/pages/transporte/cronograma-rutas/model/ViajesInterface';
import { DescuentoPlanillaModel } from '@/pages/transporte/descuentos-planilla/model/DescuentoPlanillamodel';

 export interface DocumentoVigencia {
  nombre: string;
  fechaVencimiento: string | null;
  estado: 'vigente' | 'proximo_vencer' | 'vencido';
  tipo: 'conductor' | 'vehiculo';
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  idVehiculo?: number;
  viaje?: ViajesModel | null;
  documentosConductor?: DocumentoVigencia[];
}

const ModalDescuentosPlanillaViaje = ({
  open,
  onClose,
  onSave,
  idVehiculo,
  viaje,
  documentosConductor
}: ModalProps) => {
  const [detalles, setDetalles] = useState<DescuentoPlanillaModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDocumentos, setLoadingDocumentos] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [descuentosSeleccionados, setDescuentosSeleccionados] = useState<Set<number>>(new Set());
  const [documentos, setDocumentos] = useState<DocumentoVigencia[]>([]);

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
      fetchDetallesRevision();
      fetchDocumentosConductor();
      setDescuentosSeleccionados(new Set());
    }
  }, [open, viaje]);

  const fetchDocumentosConductor = async () => {
    if (!viaje?.idConductor) {
      setDocumentos([]);
      return;
    }

    setLoadingDocumentos(true);
    try {
      const res = await axios.get(`/get_documents_alert_driver/${viaje.idConductor}`);

      const documentosFormateados: DocumentoVigencia[] = res.data.map((doc: any) => ({
        nombre: doc.tipo_documento.tituloDocumento,
        fechaVencimiento: doc.fecha_vigencia,
        estado: mapearEstadoVigencia(doc.estado_vigencia)
      }));

      setDocumentos(documentosFormateados);
    } catch (error) {
      console.error('Error al cargar documentos del conductor:', error);
      setDocumentos([]);
    } finally {
      setLoadingDocumentos(false);
    }
  };

  const fetchDetallesRevision = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/descuentos_planilla');
      setDetalles(res.data);

      const obligatorios = res.data
        .filter((item: DescuentoPlanillaModel) => item.obligatorio === 1)
        .map((item: DescuentoPlanillaModel) => item.id);

      setDescuentosSeleccionados(new Set(obligatorios));
    } catch (error) {
      enqueueSnackbar('Error al cargar los detalles de revisión', {
        variant: 'error'
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (id: number, esObligatorio: boolean) => {
    if (esObligatorio && descuentosSeleccionados.has(id)) {
      enqueueSnackbar('No puedes desmarcar un descuento obligatorio', {
        variant: 'warning'
      });
      return;
    }

    setDescuentosSeleccionados((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!viaje?.id) {
      enqueueSnackbar('No hay un viaje seleccionado.', {
        variant: 'warning'
      });
      return;
    }

    const payload = {
      idViaje: viaje.id,
      descuentos: Array.from(descuentosSeleccionados).map((id) => {
        const descuento = detalles.find((d) => d.id === id);
        return {
          idDescuento: id,
          valor: descuento?.valor || null
        };
      })
    };

    try {
      await axios.post('/asignacion_descuentos_viaje', payload);
      enqueueSnackbar('Descuentos guardados exitosamente', { variant: 'success' });

      onClose();
      if (onSave) onSave(payload);
    } catch (error) {
      enqueueSnackbar('Error al guardar los descuentos', { variant: 'error' });
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[910px] top-[10%] p-0 rounded-2xl shadow-lg overflow-hidden">
        <ModalHeader className="flex justify-between items-center border-b p-4">
          <ModalTitle className="text-lg font-semibold flex items-center gap-2">
            Seleccionar Descuentos de Planilla
          </ModalTitle>
          <button onClick={onClose} className="btn btn-sm btn-icon btn-light hover:bg-gray-100">
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-4">
          {loading ? (
            <p className="text-gray-500">Cargando descuentos...</p>
          ) : (
            <>
              {documentos.length > 0 && (
                <div className="bg-gradient-to-br  to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <KeenIcon icon="shield-tick" className="text-blue-600 text-xl" />
                    <h3 className="font-semibold text-gray-800">
                      Estado de Documentos del Conductor
                    </h3>
                  </div>

                  {loadingDocumentos ? (
                    <div className="flex items-center justify-center py-4">
                      <p className="text-sm text-gray-500">Cargando documentos...</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {documentos.map((doc, index) => {
                        const styles = getEstadoBadgeStyles(doc.estado);
                        return (
                          <div
                            key={index}
                            className={`${styles.container} rounded-lg p-3 border transition-all hover:shadow-md`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1">
                                <KeenIcon
                                  icon={getEstadoIcon(doc.estado)}
                                  className={`${styles.icon} text-lg mt-0.5`}
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {documentos.some((doc) => doc.estado === 'vencido') && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-center gap-2">
                  <KeenIcon icon="information-3" className="text-yellow-600" />
                  <span>
                    Existen documentos vencidos. No puedes iniciar el viaje hasta que se actualicen.
                  </span>
                </div>
              )}

              <p className="text-sm text-gray-600">
                Selecciona los descuentos que aplican para este viaje.
              </p>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {detalles.map((item) => {
                  const esObligatorio = item.obligatorio === 1;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-lg shadow-sm transition ${
                        esObligatorio ? 'bg-red-20 border-red-220' : 'hover:bg-gray-50'
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={descuentosSeleccionados.has(item.id)}
                          onChange={() => handleCheckboxChange(item.id, esObligatorio)}
                          disabled={esObligatorio}
                          className={`w-4 h-4 rounded focus:ring-2 mt-1 ${
                            esObligatorio
                              ? 'text-red-600 cursor-not-allowed opacity-75'
                              : 'text-blue-600 focus:ring-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800">{item.nombre}</span>
                            {esObligatorio && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                Obligatorio
                              </span>
                            )}
                          </div>

                          <div className="flex gap-4 text-sm text-gray-600">
                            {item.valor && parseFloat(item.valor) > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Valor:</span>
                                <span className="text-gray-700">
                                  ${parseFloat(item.valor).toLocaleString('es-CO')}
                                </span>
                              </div>
                            )}

                            {item.porcentaje && item.porcentaje > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Porcentaje:</span>
                                <span className="text-gray-700">{item.porcentaje}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-sm text-gray-600">
                  {descuentosSeleccionados.size} descuento(s) seleccionado(s)
                </span>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    disabled={
                      descuentosSeleccionados.size === 0 ||
                      documentos.some((doc) => doc.estado === 'vencido')
                    }
                  >
                    Guardar Descuentos
                  </button>
                </div>
              </div>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalDescuentosPlanillaViaje;
