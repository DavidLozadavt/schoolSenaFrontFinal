import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface TrazabilidadItem {
  id: number | string;
  fechaInicial?: string;
  fechaFinal?: string | null;
  observacion?: string;
  dias_diferencia?: number;
  estado?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  idDistribucion?: string | number | null;
}

const ModalTrazabilidad: React.FC<Props> = ({ isOpen, onClose, idDistribucion }) => {
  const [trazabilidades, setTrazabilidades] = useState<TrazabilidadItem[]>([]);
  const [numReg, setNumReg] = useState<number>(10);
  const [pageActual, setPageActual] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && idDistribucion) {
      obtenerTrazabilidad();
    } else if (!isOpen) {
      setTrazabilidades([]);
      setPageActual(1);
      setError(null);
    }
  }, [isOpen, idDistribucion]);

  const obtenerTrazabilidad = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/trazabilidad_producto_almacen/${idDistribucion}`);
      setTrazabilidades(Array.isArray(res.data) ? res.data : []);
      setPageActual(1);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la trazabilidad.');
      setTrazabilidades([]);
    } finally {
      setLoading(false);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(trazabilidades.length / Math.max(1, numReg)));

  useEffect(() => {
    if (pageActual > totalPaginas) {
      setPageActual(totalPaginas);
    }
  }, [trazabilidades.length, numReg, totalPaginas, pageActual]);

  const handleClose = () => {
    setTrazabilidades([]);
    setPageActual(1);
    setError(null);
    onClose();
  };

  const pageItems = trazabilidades.slice((pageActual - 1) * numReg, pageActual * numReg);

  return (
    <Modal open={isOpen}>
      <ModalContent className="max-w-[750px] top-[10%] p-3 relative text-sm">
        <ModalHeader className="py-2">
          <ModalTitle className="text-gray-900 dark:text-white text-lg">Trazabilidad</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="px-4 py-3 text-gray-900 dark:text-white text-sm">
          <div className=" dark:border-neutral-700 rounded-md shadow bg-inherit">
            {/* Header */}
            <div className="flex justify-between items-center px-3 py-2 border-b dark:border-neutral-700">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                Historial de Movimientos
              </h3>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto p-3 text-base">
              {loading ? (
                <div className="text-center py-5 text-sm">Cargando trazabilidad...</div>
              ) : error ? (
                <div className="text-center text-red-500 py-5 text-sm">{error}</div>
              ) : trazabilidades.length === 0 ? (
                <div className="text-center py-5 text-sm">No hay registros de trazabilidad.</div>
              ) : (
                <table className="table-auto w-full border-collapse border border-gray-300 dark:border-neutral-700 text-base">
                  <thead>
                    <tr className="bg-sky-100 dark:bg-neutral-700 text-gray-800  text-1xl ">
                      <th className="border px-2 py-1">Código</th>
                      <th className="border px-2 py-1">Fecha Inicial</th>
                      <th className="border px-2 py-1">Fecha Final</th>
                      <th className="border px-2 py-1">Observación</th>
                      <th className="border px-2 py-1">Días</th>
                      <th className="border px-2 py-1">Estado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageItems.map((item) => (
                      <tr key={String(item.id)} className="text-center text-sm">
                        <td className="border px-2 py-1">{item.id}</td>
                        <td className="border px-2 py-1">{item.fechaInicial ?? '---'}</td>
                        <td className="border px-2 py-1">{item.fechaFinal ?? '---'}</td>
                        <td className="border px-2 py-1">{item.observacion ?? '---'}</td>
                        <td className="border px-2 py-1">{item.dias_diferencia ?? '---'}</td>

                        <td
                          className={`border px-2 py-1 font-semibold ${
                            item.estado?.toUpperCase() === 'RECHAZADO'
                              ? 'text-red-500'
                              : item.estado?.toUpperCase() === 'APROBADO'
                                ? 'text-green-500'
                                : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {item.estado ?? '---'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginación */}
            {trazabilidades.length > 0 && (
              <div className="flex justify-center items-center gap-2 py-3 text-sm">
                <button
                  disabled={pageActual <= 1}
                  onClick={() => setPageActual((p) => Math.max(1, p - 1))}
                  className={`px-2 py-1 rounded-md border text-sm dark:border-gray-600 ${
                    pageActual <= 1
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-gray-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  « Prev
                </button>

                <span className="px-3 py-1 bg-sky-600 text-white rounded-md shadow text-xs">
                  {pageActual} / {totalPaginas}
                </span>

                <button
                  disabled={pageActual >= totalPaginas}
                  onClick={() => setPageActual((p) => Math.min(totalPaginas, p + 1))}
                  className={`px-2 py-1 rounded-md border text-sm dark:border-gray-600 ${
                    pageActual >= totalPaginas
                      ? 'opacity-40 cursor-not-allowed'
                      : 'hover:bg-gray-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  Next »
                </button>
              </div>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalTrazabilidad;
