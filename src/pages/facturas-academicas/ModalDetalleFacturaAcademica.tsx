import { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import Spinner from '@/components/loaders/Spinner';

interface DetalleLinea {
  id: number;
  idFactura: number;
  idConfiguracionPago?: number | null;
  concepto?: string;
  detalle?: string;
  valor: number;
}

export interface FacturaAcademicaDetalle {
  id: number;
  numeroFactura: string;
  fecha: string;
  valor: number;
  valorSinIva?: number;
  valorIva?: number;
  estado: string;
  proceso?: { id: number; nombreProceso: string } | null;
  tercero?: { nombre?: string; identificacion?: string } | null;
  detalles: DetalleLinea[];
}

interface ModalProps {
  open: boolean;
  facturaId: number | null;
  onClose: () => void;
}

const formatCop = (valor: number) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(
    valor
  );

const ModalDetalleFacturaAcademica = ({ open, facturaId, onClose }: ModalProps) => {
  const [factura, setFactura] = useState<FacturaAcademicaDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !facturaId) {
      setFactura(null);
      return;
    }
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`facturas_academicas/${facturaId}`);
        const payload = res.data;
        setFactura(payload?.factura ?? payload);
      } catch {
        setError('No fue posible cargar el detalle de la factura.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, facturaId]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>
            {factura?.numeroFactura ? `Factura #${factura.numeroFactura}` : 'Factura'}
          </ModalTitle>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : factura ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Fecha</span>
                  <p className="font-medium">{String(factura.fecha).slice(0, 10)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Estado</span>
                  <p className="font-medium">{factura.estado}</p>
                </div>
                <div>
                  <span className="text-gray-500">Proceso</span>
                  <p className="font-medium">{factura.proceso?.nombreProceso ?? '—'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Total</span>
                  <p className="font-medium">${formatCop(Number(factura.valor) || 0)}</p>
                </div>
                {factura.tercero ? (
                  <div className="col-span-2">
                    <span className="text-gray-500">Tercero</span>
                    <p className="font-medium">
                      {(factura.tercero as { nombre?: string }).nombre ?? '—'}
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Conceptos
                </p>
                <table className="table table-sm table-bordered w-full text-sm">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th className="text-end">Valor</th>
                      <th className="text-end">Id config.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factura.detalles?.map((d) => (
                      <tr key={d.id}>
                        <td>{d.concepto ?? d.detalle}</td>
                        <td className="text-end">${formatCop(Number(d.valor) || 0)}</td>
                        <td className="text-end text-gray-500">
                          {d.idConfiguracionPago ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
            >
              Cerrar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalDetalleFacturaAcademica };
