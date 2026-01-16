import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { FacturaInterface } from './models/FacturaInterface';

interface ModalProps {
  open: boolean;
  data?: FacturaInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTercero = ({ open, onClose, data, onSave }: ModalProps) => {

  const tables = [
    {
      status: 'Razón Social:',
      info: data?.tercero?.nombre || 'N/A'
    },
    {
      status: 'NIT:',
      info: `${data?.tercero?.identificacion || 'N/A'} - ${data?.tercero?.digitoVerficacion || 'N/A'}`
    },

    {
      status: 'Correo:',
      info: data?.tercero?.email || 'N/A'
    },

    {
      status: 'Responsable de IVA:',
      info: data?.tercero?.responsableIva ? 'Sí' : 'No'
    },
    {
      status: 'Retención:',
      info: data?.tercero?.retenciones ? 'Sí' : 'No'
    },
    {
      status: 'Dirección:',
      info: data?.tercero?.direccion || 'N/A'
    },
    {
      status: 'Teléfono:',
      info: data?.tercero?.telefono || 'N/A'
    }
  ];

  const renderTable = (table: any, index: any) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 pb-3.5 pe-5">{table.status}</td>
        <td
          className="text-sm text-gray-900 pb-4"
          dangerouslySetInnerHTML={{ __html: table.info }}
        />
      </tr>
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Tercero</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div className="card-body pt-4 pb-3">
            <table className="table-auto">
              <tbody>
                {tables.map((table, index) => {
                  return renderTable(table, index);
                })}
              </tbody>
            </table>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTercero };
