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
import { ModalCreateConductorAfiliacion } from './ModalCreateConductorAfiliacion';
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
  const [modalCreateConductorAfiliacion, setModalCreateConductorAfiliacion] =
    useState<boolean>(false);
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
              <div className="relative w-auto">
                <button
                  onClick={() => setModalCreateConductorAfiliacion(true)}
                  className="btn btn-sm btn-light"
                >
                  Agregar Conductor
                </button>
              </div>
            </div>
            <div className="mt-2">
              {conductores.map((conductor, index) => (
                <div
                  key={index}
                  onClick={() => {
                    setConductor(conductor);
                    setModalDetailConductor(true);
                  }}
                  className="
                  mt-4
                  flex items-center gap-4 p-5
                  border border-gray-100 rounded-2xl
                  bg-gradient-to-br 
                  shadow hover:shadow-lg hover:-translate-y-1
                  transition-all duration-200
                  cursor-pointer backdrop-blur-sm
                "
                >
                  <img
                    className="w-28 h-28 object-cover rounded-full border"
                    src={conductor.rutaFotoUrl}
                    alt="foto"
                  />

                  <div className="flex flex-col flex-grow">
                    <p className="text-base font-semibold text-gray-900">
                      {conductor.nombre1} {conductor.apellido1}
                    </p>

                    <p className="text-sm text-gray-600">
                      Identificación: <span className="font-bold">{conductor.identificacion}</span>
                    </p>

                    <p className="text-sm text-gray-600">
                      Correo: <span className="font-semibold">{conductor.email}</span>
                    </p>

                    <p className="text-sm text-gray-600">Celular: {conductor?.celular}</p>

                    <p className="text-sm text-gray-500">Dirección: {conductor?.direccion}</p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmChangeStatus(conductor?.id);
                      }}
                      className="btn btn-light btn-sm"
                    >
                      <KeenIcon icon="trash" />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ModalCreateConductorAfiliacion
            open={modalCreateConductorAfiliacion}
            onClose={() => {
              setModalCreateConductorAfiliacion(false);
            }}
            afiliacion={data}
            vehiculo={vehiculo}
            onSave={handleAfterSave}
          />

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
