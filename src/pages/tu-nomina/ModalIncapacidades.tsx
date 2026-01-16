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

const ModalIncapacidades = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();


  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[900px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Incapacidades y Licencias</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
        <table className="table table-border align-middle text-gray-700 font-medium text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Fecha Inicial</th>
                <th className="border border-gray-300 px-4 py-2">Fecha Final</th>
                <th className="border border-gray-300 px-4 py-2">Tipo</th>
                <th className="border border-gray-300 px-4 py-2">Valor</th>
                <th className="border border-gray-300 px-4 py-2">Observación</th>
                <th className="border border-gray-300 px-4 py-2">Estado</th>
                <th className="border border-gray-300 px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {/* Datos de prueba */}
              {[
                {
                  fechaInicial: '2025-01-01',
                  fechaFinal: '2025-01-10',
                  tipo: 'Accidente',
                  valor: 5000,
                  observacion: 'Accidente laboral ocurrido en la empresa',
                  estado: 'Pendiente'
                },
                {
                  fechaInicial: '2024-12-15',
                  fechaFinal: '2024-12-20',
                  tipo: 'Paternidad',
                  valor: 3000,
                  observacion: 'Permiso por paternidad',
                  estado: 'Liquidado'
                },
                {
                  fechaInicial: '2023-11-10',
                  fechaFinal: '2023-11-20',
                  tipo: 'Enfermedad',
                  valor: 4500,
                  observacion: 'Enfermedad común',
                  estado: 'Por Autorizar'
                }
              ].map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">{row.fechaInicial}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.fechaFinal}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.tipo}</td>
                  <td className="border border-gray-300 px-4 py-2">${row.valor}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.observacion}</td>
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

          <div className="flex justify-between items-center">
            <div className="text-gray-700 font-sm">
              Cantidad: <span className="text-sm font-bold">3</span>
            </div>
        
          </div>

          <div className="flex justify-between items-center">
            <div className="text-gray-700 font-sm">
              Valor: <span className="text-sm font-bold">$20000</span>
            </div>
        
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalIncapacidades };
