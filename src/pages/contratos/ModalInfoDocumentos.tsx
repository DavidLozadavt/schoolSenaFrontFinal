import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

const ModalInfoDocumentos = ({ open, onClose }: ModalProps) => {
  const [tipoContratos, setTipoContratos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedContrato, setSelectedContrato] = useState<string>('');


    useEffect(() => {
      if (open) {
        setSelectedContrato('');
        setDocumentos([])
      
       ;
      }
    }, [open]);
  

  const fetchTipoContratos = async () => {
    try {
      const response = await axios.get('contrato-tipos-contrato');
      setTipoContratos(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchDocumentos = async (nombreProceso: string) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `contrato-tipo-documento?nombreProceso=${encodeURIComponent(nombreProceso)}`
      );
      setDocumentos(response.data);
    } catch (error) {
      console.log(error);
      setDocumentos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contratoId = e.target.value;
    setSelectedContrato(contratoId);

    const contrato = tipoContratos.find((tc) => String(tc.id) === contratoId);
    if (contrato) {
      fetchDocumentos(contrato.nombreTipoContrato);
    } else {
      setDocumentos([]);
    }
  };

  useEffect(() => {
    fetchTipoContratos();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Documentos</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="p-2">
            <span className="badge text-sm mb-3 w-full badge-outline badge-info justify-start">
              <KeenIcon icon="information-2" className="mr-2" />
              Selecciona un tipo de contrato para ver los documentos necesarios
            </span>

            <div className="flex items-center mb-4">
              <select
                name="idtipoContrato"
                className="select w-full"
                value={selectedContrato}
                onChange={handleSelectChange}
              >
                <option value="">Seleccione un tipo de contrato</option>
                {tipoContratos.map((tipoContrato) => (
                  <option key={tipoContrato.id} value={tipoContrato.id}>
                    {tipoContrato.nombreTipoContrato}
                  </option>
                ))}
              </select>
            </div>

            <div>
              {loading ? (
                <p className="text-center text-gray-500">Cargando documentos...</p>
              ) : documentos.length > 0 ? (
                <ul className="space-y-2">
                  {documentos.map((doc, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow "
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center  text-blue-600 rounded-full">
                        <img src={toAbsoluteUrl(`/media/file-types/pdf.svg`)} alt="" />
                      </div>

                      <span className="text-sm font-medium text-gray-800">
                        {doc.tipoDocumento?.tituloDocumento || 'Documento sin nombre'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-400">
                  No hay documentos para este tipo de contrato
                </p>
              )}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalInfoDocumentos };
