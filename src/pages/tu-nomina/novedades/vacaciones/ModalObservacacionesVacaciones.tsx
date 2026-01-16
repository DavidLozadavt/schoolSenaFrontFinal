import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { useAuthContext } from '@/auth';
import { DropdownChatMessageOut } from '@/partials/dropdowns/chat/DropdownChatMessageOut';
import { DropdownChatMessageIn } from '@/partials/dropdowns/chat/DropdownChatMessageIn';
import { IDropdownMessage } from '@/partials/dropdowns/chat/types';
import { CommentsIzq } from './blocks/CommentsIzq';
import { CommentsDer } from './blocks/CommentsDer';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalObservacacionesVacaciones = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const authContext = useAuthContext();
  const { persona } = authContext;
  const messagesRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState<number>(300);

  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [observacion, setObservacion] = useState<string>('');

  const fetchObservaciones = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`observaciones_solicitud_vacac?idSolicitud=${data?.id}`);
      setObservaciones(response.data);
    } catch (error) {
      setError('Error al cargar las observaciones.');
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  useEffect(() => {
    if (open && data?.id) {
      fetchObservaciones();
    }
  }, [open, data?.id, fetchObservaciones]);

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter' && observacion.trim()) {
      handleSave();
    }
  };

  const handleSave = async () => {
    const payload = {
      observacion,
      idSolicitud: data?.id
    };

    try {
      await axios.post('observaciones_solicitud_vacac', payload);

      enqueueSnackbar('Observación enviada con éxito.', { variant: 'success' });
      if (onSave) onSave();
      fetchObservaciones();
      // onClose();

      setObservacion('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Error al guardar los datos.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const buildMessages = () => {
    if (!observaciones || observaciones.length === 0) {
      return <p className="text-center text-gray-500">Aún no hay observaciones</p>;
    }
  
    return (
      <div className="flex flex-col gap-5 py-5">
        {observaciones.map((observacion, index) => {
          if (observacion.usuario.idpersona === persona.id) {
            return (
              <CommentsDer
                key={index}
                text={observacion.observacion}
                time={observacion.fecha}
                avatar={observacion?.usuario?.persona?.rutaFotoUrl}
                read={true}
              />
            );
          } else {
            return (
              <CommentsIzq
                key={index}
                text={observacion.observacion}
                time={observacion.fecha}
                avatar={observacion.usuario.persona.rutaFotoUrl}
              />
            );
          }
        })}
      </div>
    );
  };
  

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line
  }, [buildMessages()]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Observaciones</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div
            ref={messagesRef}
            className="scrollable-y-auto overflow-y-auto"
            style={{ maxHeight: `${scrollableHeight}px` }}
          >
            {buildMessages()}
          </div>
          <div className="relative grow mt-2.5 w-full">
            <img
              src={persona?.rutaFotoUrl}
              className="rounded-full size-[30px] absolute left-0 top-2/4 -translate-y-2/4 ms-2.5"
              alt=""
            />
            <input
              type="text"
              placeholder="Escribe una observación..."
              className="input h-auto py-4 ps-12 pe-20 bg-transparent w-full"
              value={observacion}
              onKeyDown={handleKeyDown}
              onChange={(e) => setObservacion(e.target.value)}
            />
            <div className="flex items-center gap-2.5 absolute right-3 top-1/2 -translate-y-1/2">
              <button
                onClick={handleSave}
                className="btn btn-dark btn-sm"
                disabled={!observacion.trim()}
              >
                Enviar
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalObservacacionesVacaciones };
