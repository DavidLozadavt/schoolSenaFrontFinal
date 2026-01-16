import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalContrato = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();


  const tables = [
    {
      status: 'Cargo:',
      info: 'Desarrollador Frontend'
    },
    {
      status: 'Tipo de Contrato:',
      info: 'Termino Fijo'
    },
    {
      status: 'Fecha de Contrato:',
      info: '2025-01-01'
    },
    {
      status: 'Fecha Final del Contrato:',
      info: '2025-12-31'
    },
    {
      status: 'Valor Total del Contrato:',
      info: '$50,000 COP'
    },
    {
      status: 'Sueldo Mensual:',
      info: '$4,166.67 COP'
    },
    {
      status: 'Objeto del Contrato:',
      info: 'Desarrollo y mantenimiento de aplicaciones web.'
    },
    {
      status: 'Observaciones:',
      info: 'Contrato renovable según desempeño.'
    },
    {
      status: 'Estado:',
      info: 'Activo'
    }
  ];

  const renderTable = (table:any, index:any) => {
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
          <ModalTitle>Contrato</ModalTitle>
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

export { ModalContrato };
