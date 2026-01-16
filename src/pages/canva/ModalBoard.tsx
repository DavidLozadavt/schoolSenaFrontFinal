import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
interface ModalProps {
  open: boolean;
  board?: any;
  onClose: () => void;
  onSave?: () => void;
}
const colors = ['#23146d', '#080611', '#3e22cf', '#3a374a'];

const ModalBoard = ({ open, onClose, board, onSave }: ModalProps) => {
  const [nombreBoard, setNombreBoard] = useState('');
  const [background, setBackground] = useState(colors[0]);

  useEffect(() => {
    if (board) {
      setNombreBoard(board.nombreBoard);
      setBackground(board.background);
    } else {
      setNombreBoard('');
      setBackground(colors[0]);
    }
  }, [board]);

  useEffect(() => {
    if (open && !board) {
      setNombreBoard('');
      setBackground(colors[0]);
    }
  }, [open, board]);

  const handleSave = async () => {
    try {
      const data = {
        nombreBoard: nombreBoard,
        background: background
      };

      if (board) {
        await axios.post(`update_board/${board.id}`, data);
      } else {
        await axios.post('store_board', data);
      }

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{board ? 'Editar Tablero' : 'Nuevo Tablero'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="Ingrese el nombre del tablero"
            type="text"
            value={nombreBoard}
            onChange={(e) => setNombreBoard(e.target.value)}
          />
          <p className="text-center">Seleccionar Color de Fondo</p>

          <div className="flex gap-3 justify-center">
            {colors.map((color) => (
              <div
                key={color}
                onClick={() => setBackground(color)}
                className="w-10 h-10 rounded-full cursor-pointer"
                style={{
                  backgroundColor: color,
                  border: background === color ? '3px solid #000' : '2px solid transparent',
                  transition: 'border 0.2s ease'
                }}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button disabled={!nombreBoard.trim()} className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalBoard };
