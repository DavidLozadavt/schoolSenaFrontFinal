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

const ModalVacaciones = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [rows, setRows] = useState([
    {
      seleccion: true,
      periodo: '2025',
      fechaSolicitud: '2025-01-10',
      fechaLiquidacion: '2025-01-15',
      fechaEjecucion: '2025-01-20',
      valor: 5000,
      estado: 'Liquidado'
    },
    {
      seleccion: false,
      periodo: '2024',
      fechaSolicitud: '2024-12-10',
      fechaLiquidacion: '2024-12-15',
      fechaEjecucion: '2024-12-20',
      valor: 3000,
      estado: 'Pendiente'
    },
    {
      seleccion: true,
      periodo: '2023',
      fechaSolicitud: '2023-11-10',
      fechaLiquidacion: '2023-11-15',
      fechaEjecucion: '2023-11-20',
      valor: 4500,
      estado: 'Por Autorizar'
    }
  ]);

  const totalValor = rows.filter((row) => row.seleccion).reduce((sum, row) => sum + row.valor, 0);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[900px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Vacaciones</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <table className="table table-border align-middle text-gray-700 font-medium text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2">Seleccionar</th>
                <th className="border border-gray-300 px-4 py-2">Periodo</th>
                <th className="border border-gray-300 px-4 py-2">Fecha Solicitud</th>
                <th className="border border-gray-300 px-4 py-2">Fecha Liquidación</th>
                <th className="border border-gray-300 px-4 py-2">Fecha Ejecución</th>
                <th className="border border-gray-300 px-4 py-2">Valor</th>
                <th className="border border-gray-300 px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="text-center">
                  <td className="border border-gray-300 px-4 py-2">
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={row.seleccion}
                        onChange={(e) => {
                          const updatedRows = [...rows];
                          updatedRows[index].seleccion = e.target.checked;
                          setRows(updatedRows);
                        }}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{row.periodo}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.fechaSolicitud}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.fechaLiquidacion}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.fechaEjecucion}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.valor}</td>
                  <td className="border border-gray-300 px-4 py-2">
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
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center">
            <div className="text-gray-700 font-sm">
              Valor: <span className="text-sm font-semibold">${totalValor}</span>
            </div>
          </div>
          <button className="btn p-3 btn-light w-20" onClick={() => alert('Liquidar')}>
            Liquidar
          </button>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalVacaciones };
