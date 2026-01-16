import React, { useEffect, useState } from 'react';
import { Conecctions } from './model/ConexionesInterface';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';

import axios from 'axios';
import { KeenIcon } from '@/components/keenicons';

interface ModalProps {
  open: boolean;
  conecction?: Conecctions;
  onClose: () => void;
  onSave?: () => void;
}
const ModalConexiones = ({ open, conecction, onClose, onSave }: ModalProps) => {
  const [usc, setUsc] = useState(conecction?.usc || '');
  const [psc, setPsc] = useState(conecction?.psc || '');
  const [h, setH] = useState(conecction?.h || '');
  const [port, setPort] = useState(conecction?.port || '');
  const [nbd, setNbd] = useState(conecction?.nbd || '');
  const [nombre, setNombre] = useState(conecction?.psc || '');

  useEffect(() => {
    if (conecction) {
      setUsc(conecction.usc);
      setPsc(conecction.psc);
      setH(conecction.h);
      setPort(conecction.port);
      setNbd(conecction.nbd);
      setNombre(conecction.nombre);
    } else {
      setUsc('');
      setPsc('');
      setH('');
      setPort('');
      setNbd('');
      setNombre('');
    }
  }, [conecction, open]);

  const handleSave = async () => {
    try {
      if (conecction) {
        await axios.put(`conexiones_source/${conecction.id}`, {
          usc,
          psc,
          h,
          port,
          nbd,
          nombre
        });
      } else {
        await axios.post('conexiones_source', {
          usc,
          psc,
          h,
          port,
          nbd,
          nombre
        });
      }
      if (onSave) {
        onSave();
      }
      setNombre('');
      setPsc('');
      setH('');
      setPort('');
      setNbd('');
      setUsc('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleClose = () => {
    setUsc('');
    setPsc('');
    setH('');
    setPort('');
    setNbd('');
    setNombre('');
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{conecction ? 'Editar Conexion' : 'Nueva Conexion'}</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={handleClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="Usc"
            type="text"
            value={usc}
            onChange={(e) =>setUsc(e.target.value)}
          />
          <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="PSC"
            type="text"
            value={psc}
            onChange={(e) => setPsc(e.target.value)}
          />
           <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="H"
            type="text"
            value={h}
            onChange={(e) => setH(e.target.value)}
          />
            <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="Port"
            type="text"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
            <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="NBD"
            type="text"
            value={nbd}
            onChange={(e) => setNbd(e.target.value)}
          />
            <input
            className="input p-2 border border-gray-300 rounded-md w-[calc(100%-2rem)] mx-auto"
            placeholder="Nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={handleClose}>
              Cancelar
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalConexiones;
