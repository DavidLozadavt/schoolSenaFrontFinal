import { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';

interface ModalProps {
  open: boolean;
  data?: any[];
  onClose: () => void;
  onSave?: () => void;
}

const ModalCobrosPolizas = ({ open, onClose, data, onSave }: ModalProps) => {
  const [showAll, setShowAll] = useState(false);
  const [valor, setValor] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const displayedData = showAll ? data : data?.slice(0, 5);
  const hasMore = (data?.length || 0) > 5;

  useEffect(() => {
    if (open) {
      setValor('');
      setShowAll(false);
    }
  }, [open]);

  const handleSave = async () => {
    if (!valor || parseFloat(valor) <= 0) {
      enqueueSnackbar('Por favor ingrese un valor válido', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        afiliaciones: data?.map((item) => ({
          id: item.id,
          idAfiliacion: item.idAfiliacion,
          idTercero: item.tercero?.id,
          placa: item.vehiculo?.placa,
          terceroNombre: item.tercero?.nombre,
          tipoAfiliacion: item.afiliacion?.tipo_afiliacion[0]?.tipoAfiliacion
        })),
        valor: parseFloat(valor)
      };

      await axios.post('store_cuenta_cobrar_poliza', payload);
      enqueueSnackbar('Cobro creado exitosamente', { variant: 'success' });

      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[900px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>
            Crear Cobro de Póliza
            {data && data.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({data.length} registro{data.length > 1 ? 's' : ''})
              </span>
            )}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-4 px-0 py-5">
          {loading && <Spinner />}
          <div className="px-4">
            <div className="overflow-x-auto">
              <table className="table table-border">
                <thead>
                  <tr>
                    <th className="text-left min-w-[50px]">#</th>
                    <th className="text-left min-w-[200px]">Nombre del Asociado</th>
                    <th className="text-left min-w-[120px]">Identificación</th>
                    <th className="text-left min-w-[150px]">Tipo Afiliación</th>
                    <th className="text-left min-w-[100px]">Placa</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedData && displayedData.length > 0 ? (
                    displayedData.map((item, index) => (
                      <tr key={item.id} className="">
                        <td className="text-gray-700">{index + 1}</td>
                        <td className="text-gray-900 font-medium">
                          {item.tercero?.nombre || 'N/A'}
                        </td>
                        <td className="text-gray-700">{item.tercero?.identificacion || 'N/A'}</td>
                        <td className="text-gray-700">
                          <span className="badge badge-sm badge-light-primary">
                            {item.afiliacion?.tipo_afiliacion[0]?.tipoAfiliacion || 'N/A'}
                          </span>
                        </td>
                        <td className="text-gray-900 font-semibold">
                          {item.vehiculo?.placa || 'N/A'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center text-gray-500 py-8">
                        No hay datos seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="flex justify-center mt-3">
                <button className="btn btn-sm btn-light" onClick={() => setShowAll(!showAll)}>
                  <KeenIcon icon={showAll ? 'up' : 'down'} className="text-sm" />
                  {showAll ? 'Ver menos' : `Ver más (${data!.length - 5} restantes)`}
                </button>
              </div>
            )}
          </div>

          <div className="px-4">
            <div className="border-t pt-4">
              <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-2">
                Valor del Cobro <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <NumericFormat
                  id="valor"
                  className="input input-sm flex-1"
                  placeholder="Ingrese el valor (ej: 1.000)"
                  value={valor}
                  onValueChange={(values) => setValor(values.value)}
                  thousandSeparator="."
                  decimalSeparator=","
                  allowNegative={false}
                  decimalScale={0}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Este valor se aplicará a todos los registros seleccionados
              </p>

              {valor && parseFloat(valor) > 0 && (
                <div className="mt-4 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total generado:</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {data?.length || 0} Propietario{(data?.length || 0) > 1 ? 's' : ''} × $
                        <NumericFormat
                          value={valor}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold ">
                        $
                        <NumericFormat
                          value={parseFloat(valor) * (data?.length || 0)}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                        />
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={loading || !valor || parseFloat(valor) <= 0}
            >
              {loading && <span className="spinner spinner-sm mr-2"></span>}
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalCobrosPolizas };
