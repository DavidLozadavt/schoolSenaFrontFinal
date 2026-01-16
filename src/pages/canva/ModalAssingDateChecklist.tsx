import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
interface ModalProps {
  open: boolean;
  users?: any;
  idChecklist?: number | null;
  onClose: () => void;
  onSave?: () => void;
}

const AssingDateChecklist = ({ open, onClose, users, idChecklist, onSave }: ModalProps) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setSelectedDate('');
      setSelectedTime('');
    }
  }, [open]);

  const handleSave = async () => {
    if (!selectedDate || !selectedTime) {
      enqueueSnackbar('La fecha y la hora son obligatorias.', {
        variant: 'solid',
        state: 'warning'
      });

      return;
    }

    try {
      const data = {
        idCheckListItem: idChecklist,
        endDateCheck: selectedDate,
        endTimeCheck: selectedTime
      };

      await axios.post(`store_check_item_detail/${idChecklist}`, data);

      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[350px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Asignar Fecha</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <form>
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Fecha Final
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1 input block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                Hora Final
              </label>
              <input
                type="time"
                id="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mt-1 input block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
          </form>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { AssingDateChecklist };
