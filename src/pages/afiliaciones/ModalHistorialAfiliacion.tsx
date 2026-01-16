import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { AfiliacionEstadoInterface } from './models/AfiliacionEstadoInterface';
import { ModalCreateTrazabilidad } from './ModalCreateTrazabilidad';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalHistorialAfiliacion = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [trazabilidades, setTrazabilidades] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchTrazabilidad = useCallback(async () => {
    if (!data?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`get_historial_afiliacion_by_id/${data?.id}`);
      setTrazabilidades(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const filteredTrazabilidad = trazabilidades.filter((item) =>
    Object.values(item).some(
      (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    fetchTrazabilidad();
  }, [fetchTrazabilidad]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[950px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Trazabilidad de la vinculación</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}

          <div>
            <div id="tab_1" className="p-2">
              <div className="flex justify-end mb-3">
                <button onClick={() => setModalOpen(true)} className="btn btn-sm btn-light">
                  Nueva observación
                </button>
              </div>

              {loading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : (
                <div className="card card-grid min-w-full mt-3">
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
                          <th className="px-4 py-2">Observación</th>
                          <th className="px-4 py-2">Fecha</th>
                          <th className="px-4 py-2 text-center">Archivo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrazabilidad.length > 0 ? (
                          filteredTrazabilidad.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2">{item.id}</td>
                              <td className="px-4 py-2">{item.observacion}</td>
                              <td className="px-4 py-2">
                                {new Date(item.created_at).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                              <td className="px-4 py-2 text-center">
                                {item.rutaUrl && (
                                  <a
                                    href={item.rutaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-light"
                                  >
                                    <KeenIcon icon="eye" />
                                  </a>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center py-4 text-gray-500">
                              No hay trazabilidades disponibles
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <ModalCreateTrazabilidad
            open={modalOpen}
            afiliacion={data}
            onClose={() => setModalOpen(false)}
            onSave={() => fetchTrazabilidad()}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalHistorialAfiliacion };
