import { useEffect, useMemo, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { VentasPendientes } from '../models/VentasPendientesModel';
import Spinner from '@/components/loaders/Spinner';

interface ModalPendientesProps {
  open: boolean;
  onClose: () => void;
  onSelectVenta: (venta: VentasPendientes) => void;
}

const ModalVentasPendientes = ({ open, onClose, onSelectVenta }: ModalPendientesProps) => {
  const [ventas, setVentas] = useState<VentasPendientes[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios
        .get('get_shoppingcart_productos_pos')
        .then((res) => {
          setVentas(res.data);
        })
        .catch((err) => {
          console.error('Error al obtener ventas pendientes:', err);
        })
        .finally(() => setLoading(false));
      setSearchTerm('');
    }
  }, [open]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return ventas;
    return ventas.filter(
      (venta) =>
        venta.tercero?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        venta.asignaciones?.some((a) =>
          a.producto?.modelo?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        venta.id.toString().includes(searchTerm)
    );
  }, [ventas, searchTerm]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[1000px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Ventas Pendientes</ModalTitle>
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
                    placeholder="Buscar ventas pendientes..."
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
                    <th className="px-4 py-2">Productos</th>
                    <th className="px-4 py-2">Cantidad</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((venta) => (
                    <tr key={venta.id}>
                      <td className="px-4 py-2">{venta.id}</td>
                      <td className="px-4 py-2">
                        <ul className="list-disc list-inside text-sm">
                          {venta.asignaciones?.map((a, i) => <li key={i}>{a.producto?.modelo}</li>)}
                        </ul>
                      </td>
                      <td className="px-4 py-2">
                        <ul className="list-disc list-inside text-sm">
                          {venta.asignaciones?.map((a, i) => <li key={i}>{a.cantidad}</li>)}
                        </ul>
                      </td>
                      <td className="px-4 py-2">{venta.tercero?.nombre || 'N/A'}</td>
                      <td className="px-4 py-2 uppercase">{venta.estado || 'N/A'}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => onSelectVenta(venta)}
                        >
                          <KeenIcon icon="eye" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredData.length === 0 && !loading && (
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

export { ModalVentasPendientes };
