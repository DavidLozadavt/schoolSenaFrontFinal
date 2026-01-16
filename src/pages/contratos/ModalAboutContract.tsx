import { useCallback, useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import axios from 'axios';
import { KeenIcon } from '@/components';

interface IAboutTable {
  status: string;
  info: string;
}
interface IAboutTables extends Array<IAboutTable> {}

interface ModalProps {
  open: boolean;
  idContract?: number | null;
  onClose: () => void;
}

const ModalAboutContract = ({ idContract, open, onClose }: ModalProps) => {
  const [contrato, setContrato] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchContrato = useCallback(async () => {
    if (!idContract) return;

    setLoading(true);
    try {
      const response = await axios.get(`contratos_by_id?idContrato=${idContract}`);
      setContrato(response.data);
    } catch (error) {
      setError('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  }, [idContract]);

  useEffect(() => {
    fetchContrato();
  }, [fetchContrato]);

  const contratoActivo = contrato?.[0] || {};

  const tables: IAboutTables = [
    {
      status: 'Cargo:',
      info: contratoActivo?.salario?.rol?.name || 'N/A'
    },
    {
      status: 'Tipo de Contrato:',
      info: contratoActivo?.tipoContrato?.nombreTipoContrato || 'N/A'
    },
    {
      status: 'Fecha de Contrato:',
      info: contratoActivo?.fechaContratacion || 'N/A'
    },
    {
      status: 'Fecha Final del Contrato:',
      info: contratoActivo?.fechaFinalContrato || 'N/A'
    },
    {
      status: 'Sueldo Mensual:',
      info: contratoActivo?.salario?.valor || 'N/A'
    },
    {
      status: 'Valor Total del Contrato:',
      info: contratoActivo?.valorTotalContrato || 'N/A'
    },
    {
      status: 'Objeto del Contrato:',
      info: contratoActivo?.objetoContrato	 || 'N/A'
    },
    ...(contratoActivo?.observacion
      ? [
          {
            status: 'Observaciones:',
            info: contratoActivo?.observacion
          }
        ]
      : []),
    {
      status: 'Estado:',
      info: contratoActivo?.estado?.estado || 'N/A'
    },
       {
      status: 'Area:',
      info: contratoActivo?.area?.nombre || 'N/A'
    },
    {
      status: 'Acta de Extensión:',
      info:
        contratoActivo?.archivoContrato?.[0]?.rutaArchivoContratoUrl
          ? `<a href="${contratoActivo?.archivoContrato?.[0]?.rutaArchivoContratoUrl}" target="_blank" class="text-gray-800 hover:text-primary-active">Revisar Acta</a>`
          : 'No hay un acta disponible'
    }
  ];

  const renderTable = (table: IAboutTable, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 pb-3.5 pe-3">{table.status}</td>
        <td
          className="text-sm text-gray-900 pb-3.5"
          dangerouslySetInnerHTML={{ __html: table.info }}
        />
      </tr>
    );
  };



  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[700px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Acerca del Contrato Pasado</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="card">
            <div className="card-body pt-4 pb-3">
              <table className="table-auto">
                <tbody>
                  {tables.map((table, index) => {
                    return renderTable(table, index);
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>

  
  );
};

export { ModalAboutContract };
