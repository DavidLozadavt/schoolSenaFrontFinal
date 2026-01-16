import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useCallback, useEffect, useState, useMemo } from 'react';
import Spinner from '@/components/loaders/Spinner';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalInformacionPago = ({ open, onClose, data, onSave }: ModalProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [trazabilidad, setTrazabilidad] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTrazabilidad = useCallback(async () => {
    if (!data?.transacciones?.[0]?.id) return;

    setLoading(true);
    try {
      const response = await axios.get(
        `pagos_abonos_cuentas_por_cobrar/${data?.transacciones[0].id}`
      );
      setTrazabilidad(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [data?.transacciones]);

  useEffect(() => {
    if (open) {
      fetchTrazabilidad();
      setSearchTerm('');
    }
  }, [open, fetchTrazabilidad]);

  const filteredTrazabilidad = useMemo(() => {
    if (!searchTerm) return trazabilidad;

    return trazabilidad.filter((item) => {
      const id = item.id?.toString() || '';
      const fechaPago = item.fechaPago || '';
      const valor = item.valor?.toString() || '';
      const numeroFact = item.numeroFact?.toString() || '';

      return (
        id.includes(searchTerm) ||
        fechaPago.includes(searchTerm) ||
        valor.includes(searchTerm) ||
        numeroFact.includes(searchTerm)
      );
    });
  }, [searchTerm, trazabilidad]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[1000px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Trazabilidad de Pagos</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-6 px-0 py-5">
          <div className="card card-grid min-w-full">
            {loading && <Spinner />}
            <div className="card-header flex-wrap py-2 justify-end">
              <div className="flex gap-6">
                <div className="relative">
                  <KeenIcon
                    icon="magnifier"
                    className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
                  />
                  <input
                    type="text"
                    placeholder="Buscar Trazabilidad"
                    className="input input-sm pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="card-table">
              <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Código</th>

                    <th className="px-4 py-2">Fecha de Registro</th>
                    <th className="px-4 py-2">Valor</th>
                    <th className="px-4 py-2">Comprobante</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrazabilidad.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">{item.id || 'N/A'}</td>
                      <td className="px-4 py-2">{item.fechaReg || 'N/A'}</td>
                      <td className="px-4 py-2">
                        $
                        {new Intl.NumberFormat('es-ES', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(parseFloat(item.valor || 0))}
                      </td>

                      <td className="px-4 py-2 text-center">
                        {item.rutaComprobanteUrl && (
                          <a
                            href={item.rutaComprobanteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-light"
                          >
                            <KeenIcon icon="eye" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTrazabilidad.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-500">
                        No se encontraron resultados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalInformacionPago };
