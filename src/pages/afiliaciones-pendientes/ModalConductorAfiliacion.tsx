import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import { AfiliacionInterface, VehiculoInterface } from './models/AfiliacionInterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie } from '@fortawesome/free-solid-svg-icons';
import { PersonaInterface } from '../contratacion/model/PersonaInterface';

import { useConfirm } from '@/hooks';
import { ModalDetailConductor } from './ModalDetailConductor';

interface ModalProps {
  open: boolean;
  data?: AfiliacionInterface;
  vehiculo?: VehiculoInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalConductorAfiliacion = ({ open, data, onClose, onSave, vehiculo }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conductores, setConductores] = useState<PersonaInterface[]>([]);
  const [conductor, setConductor] = useState<any | undefined>(undefined);
  const [modalDetailConductor, setModalDetailConductor] = useState<boolean>(false);

  const { confirmAction } = useConfirm();
  const fetchConductor = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`get_conductores_by_id/${data?.id}`);
      const afiliacion = response.data;
      setConductores(afiliacion[0]?.conductor || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const handleAfterSave = () => {
    fetchConductor();
  };

  const handleConfirmChangeStatus = (idConductor?: number) => {
    if (idConductor === undefined) return;
    confirmAction('Esta acción cambiará el estado del conductor.', () => handleSave(idConductor));
  };

  const handleSave = async (idConductor: number) => {
    try {
      await axios.put(`change_status_conductor/${idConductor}`, {
        idAfiliacion: data?.id
      });
      enqueueSnackbar('Cambio de estado guardado con éxito.', { variant: 'success' });
      fetchConductor();
    } catch (error: unknown) {
      enqueueSnackbar('Error al guardar el cambio de estado.', { variant: 'error' });
    }
  };

  useEffect(() => {
    fetchConductor();
  }, [fetchConductor]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[980px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Conductores</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}
          <div className="min-w-full">
            <div className="flex justify-end py-2">
            
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {conductores.map((conductor, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setConductor(conductor);
                    setModalDetailConductor(true);
                  }}
                  className="relative card h-full flex flex-col border border-gray-200 cursor-pointer
                    transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                >
                  <div className="card-body flex flex-col items-center flex-grow px-2 py-3">
                    <div className="mb-3 w-full flex justify-center">
                      <img
                        className="w-28 h-28 object-cover rounded-full border"
                        src={conductor.rutaFotoUrl}
                        alt=""
                      />
                    </div>

                    <div className="flex items-center justify-center gap-1.5 mb-3 mt-2">
                      <p className="hover:text-primary-active text-base leading-5 font-medium text-gray-900 truncate max-w-[180px]">
                        {conductor.nombre1} {conductor.apellido1}
                      </p>
                    </div>

                    <span className="text-gray-700 text-sm mt-2">Correo: {conductor.email}</span>

                    <span className="text-gray-700 text-sm mt-2">
                      Identificación: {conductor.identificacion}
                    </span>

                    <span className="text-gray-700 text-sm mt-2">
                      Celular: {conductor?.celular}
                    </span>

                    <span className="text-gray-700 text-sm mt-2">
                      Dirección: {conductor?.direccion}
                    </span>
                  </div>

                  <div className="card-footer flex justify-center gap-2 mt-auto p-3 items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmChangeStatus(conductor?.id);
                      }}
                      className="btn btn-light btn-sm"
                      disabled={conductor.pivot?.administrador === 'Si'}
                    >
                      <KeenIcon icon="trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

       

          <ModalDetailConductor
            open={modalDetailConductor}
            onClose={() => {
              setModalDetailConductor(false);
            }}
            data={conductor}
            onSave={handleAfterSave}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalConductorAfiliacion };
