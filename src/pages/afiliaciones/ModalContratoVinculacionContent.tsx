import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import { ModalContratoVinculacion } from './ModalContratoVinculacion';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalContratoVinculacionContent = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [contratos, setContratos] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchContratos = useCallback(async () => {
    if (!data?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`contratos_vinculacion/${data?.id}`);
      setContratos(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const filteredContratos = contratos.filter((item) =>
    Object.values(item).some(
      (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  useEffect(() => {
    fetchContratos();
  }, [fetchContratos]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[950px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Contratos</ModalTitle>
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
                  Nuevo contrato
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
                          placeholder="Buscar contratos"
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
      <th className="px-4 py-2">Número Contrato</th> {/* 👈 nueva columna */}
      <th className="px-4 py-2">Observación</th>
      <th className="px-4 py-2">Fecha inicio</th>
      <th className="px-4 py-2">Fecha final</th>
      <th className="px-4 py-2 text-center">Archivo</th>
    </tr>
  </thead>
  <tbody>
    {filteredContratos.length > 0 ? (
      filteredContratos.map((item, index) => (
        <tr key={index}>
          <td className="px-4 py-2">{item.id}</td>
          <td className="px-4 py-2">{item.numeroContrato}</td> {/* 👈 mostrado */}
          <td className="px-4 py-2">{item.observacion}</td>
          <td className="px-4 py-2">
            {new Date(item.fechaInicio).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </td>
          <td className="px-4 py-2">
            {new Date(item.fechaFinal).toLocaleDateString('es-CO', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            })}
          </td>
          <td className="px-4 py-2 text-center">
            {item.urlRutaArchivo && (
              <a
                href={item.urlRutaArchivo}
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
        <td colSpan={6} className="text-center py-4 text-gray-500">
          No hay contratos disponibles
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

          <ModalContratoVinculacion
            open={modalOpen}
            vinculacion={data}
            onClose={() => setModalOpen(false)}
            onSave={() => fetchContratos()}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalContratoVinculacionContent };