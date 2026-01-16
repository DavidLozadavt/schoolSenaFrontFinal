import React, { useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  onClose: () => void;
}

const ModalCopiaTickets = ({ open, onClose }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [cc, setCc] = useState('');
  const [tercero, setTercero] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const buscarTickets = async () => {
    if (!cc.trim()) {
      enqueueSnackbar('Por favor ingresa una cédula válida.', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/get_tickets_by_cc', { cc });
      setTercero(response.data.tercero);
      setTickets(response.data.tickets);
    } catch (error: any) {
      setTercero(null);
      setTickets([]);
      enqueueSnackbar(error.response?.data?.error || 'No se encontraron tickets para esta cédula.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generarCopiaTicket = async () => {
    if (!selectedTicket || !tercero) {
      enqueueSnackbar('Selecciona un ticket para generar la copia.', { variant: 'warning' });
      return;
    }

    try {
      const response = await axios.post(
        '/generate_ticket_copia',
        { cc: tercero.identificacion, idTicket: selectedTicket },
        { responseType: 'blob' }
      );

      const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(fileURL, '_blank');
    } catch (error) {
      enqueueSnackbar('Error al generar la copia del tiquete.', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{'Generar Copia de Tiquete'}</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={() => {
              setTercero(null);
              setTickets([]);
              setSelectedTicket(null);
              setCc('');
              onClose();
            }}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="space-y-4 px-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cédula del tercero:</label>
              <div className="flex gap-2">
                <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarTickets();
                    }
                }}
                placeholder="Ingrese la cédula"
                className="input input-bordered w-full"
                />

                <button className="btn btn-primary whitespace-nowrap" onClick={buscarTickets} disabled={loading}>
                  {loading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>

            {tercero && (
              <div className="border rounded-lg p-3 ">
                <p className="text-sm"><strong>Nombre:</strong> {tercero.nombre}</p>
                <p className="text-sm"><strong>Identificación:</strong> {tercero.identificacion}</p>
              </div>
            )}

            {tickets.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-sm">Últimos tickets:</p>
                <ul className="space-y-2">
                  {tickets.map((t) => (
                    <li
                      key={t.id}
                      className={`p-3 border rounded-lg cursor-pointer hover ${
                        selectedTicket === t.id ? 'border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedTicket(t.id)}
                    >
                      <p className="text-sm font-medium">
                        {t.viaje?.ruta?.ciudad_origen?.descripcion} → {t.viaje?.ruta?.ciudad_destino?.descripcion}
                      </p>
                      <p className="text-xs text-gray-500">
                        Fecha: {new Date(t.created_at).toLocaleString()} | Cantidad: {t.cantidad}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedTicket && (
              <button className="btn btn-success w-full mt-4" onClick={generarCopiaTicket}>
                <KeenIcon icon="printer" className="mr-2" />
                Generar Copia del Tiquete
              </button>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalCopiaTickets;
