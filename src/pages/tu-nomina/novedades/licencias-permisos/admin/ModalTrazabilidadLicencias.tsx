import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTrazabilidadLicencias = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [datos, setDatos] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    if (!data?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`get_trazability_licencias/${data?.id}`);
      setDatos(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const filteredTrazabilidad = datos.filter((item) =>
    Object.values(item).some(
      (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[950px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Trazabilidad de la solicitud de licencias</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}

          <div>
            <div id="tab_1" className="p-2">
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
                          <th className="px-4 py-2">Tipo Incapacidad</th>
                          <th className="px-4 py-2">Fecha Inicial</th>
                          <th className="px-4 py-2">Fecha Final</th>
                          <th className="px-4 py-2">Observación</th>
                          <th className="px-4 py-2">Fecha Registro</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredTrazabilidad.length > 0 ? (
                          filteredTrazabilidad.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2">{item.id}</td>

                              <td className="px-4 py-2">
                                {item.tipo_incapacidad?.tipoIncapacidad || '—'}
                              </td>

                              <td className="px-4 py-2">
                                {item.fechaInicial
                                  ? new Date(item.fechaInicial).toLocaleDateString('es-CO')
                                  : '—'}
                              </td>
                              <td className="px-4 py-2">
                                {item.fechaFinal
                                  ? new Date(item.fechaFinal).toLocaleDateString('es-CO')
                                  : '—'}
                              </td>

                              <td className="px-4 py-2">{item.observacion || '—'}</td>

                              <td className="px-4 py-2">
                                {new Date(item.fechaSolicitud).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-4 text-gray-500">
                              No hay datos disponibles
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
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTrazabilidadLicencias };
