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

const ModalDeducciones = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
 

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[900px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Deducciones</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <table className="table table-border align-middle text-gray-700 font-medium text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Novedad</th>
                <th className="border border-gray-300 px-4 py-2">Fecha de Solicitud</th>
                <th className="border border-gray-300 px-4 py-2">Valor</th>
                <th className="border border-gray-300 px-4 py-2">Estado</th>
                <th className="border border-gray-300 px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
           
              {[
                {
                  novedad: 'Novedad 1',
                  fechaSolicitud: '2025-01-01',
                  valor: 5000,
                  estado: 'Pendiente'
                },
                {
                  novedad: 'Novedad 2',
                  fechaSolicitud: '2024-12-15',
                  valor: 3000,
                  estado: 'Liquidado'
                },
                {
                  novedad: 'Novedad 3',
                  fechaSolicitud: '2023-11-10',
                  valor: 4500,
                  estado: 'Por Autorizar'
                }
              ].map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">{row.novedad}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.fechaSolicitud}</td>
                  <td className="border border-gray-300 px-4 py-2">${row.valor}</td>
                  <td className="border border-gray-300 px-4 py-2 w-36">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${
                        row.estado === 'Liquidado'
                          ? 'bg-green-500'
                          : row.estado === 'Pendiente'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    >
                      {row.estado}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button className="btn btn-sm btn-primary">Soporte</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-gray-700 font-sm">
              Valor Retefuente:{' '}
              <span className="text-sm font-bold">
                ${[5000, 3000, 4500].reduce((acc, val) => acc + val, 0)}
              </span>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalDeducciones };
