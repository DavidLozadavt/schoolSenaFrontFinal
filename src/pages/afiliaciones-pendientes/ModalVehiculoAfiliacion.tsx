import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import { AfiliacionInterface, VehiculoInterface } from './models/AfiliacionInterface';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import { useConfirm } from '@/hooks';
import { ModalPropietarioAfiliacion } from './ModalPropietarioAfiliacion';
import { ModalConductorAfiliacion } from './ModalConductorAfiliacion';

import { ModalDetailVehiculo } from './ModalDetailVehiculo';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalVehiculoAfiliacion = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();
  const [error, setError] = useState('');
  const [modalPropietarioAfiliacion, setModalPropietarioAfiliacion] = useState<boolean>(false);
  const [modalConductorAfiliacion, setModalConductorAfiliacion] = useState<boolean>(false);
  const [modalCreateVehiculoAfiliacion, setModalCreateVehiculoAfiliacion] =
    useState<boolean>(false);
  const [vehiculo, setVehiculo] = useState<VehiculoInterface | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [vehiculos, setVehiculos] = useState<AfiliacionInterface[]>([]);

  const [modalDetailVehiculo, setModalDetailVehiculo] = useState<boolean>(false);


  const handleConfirmChangeStatus = (idVehiculo: number) => {
    confirmAction('Esta acción cambiara el estado del vehículo.', () => handleSave(idVehiculo));
  };

  const handleSave = async (idVehiculo: number) => {
    try {
      setLoading(true);
      await axios.put(`change_status_vehiculo/${idVehiculo}`);
      onSave();
      fetchVehiculos();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      enqueueSnackbar('Error al guardar el cambio de estado.', { variant: 'error' });
    }
  };

  const fetchVehiculos = useCallback(async () => {
    if (!data?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`get_vehiculos_by_id/${data?.id}`);
      setVehiculos([response.data]);
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const handleAfterSave = () => {
    fetchVehiculos();
  };

  const hasActiveVehicle = vehiculos.some((afiliacion) =>
    afiliacion.vehiculo?.some((data) => data.estado?.estado === 'ACTIVO')
  );

  useEffect(() => {
    fetchVehiculos();
  }, [fetchVehiculos]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[980px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Vehículos</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}
          <div className="min-w-full">
            <div className="flex justify-end py-2 gap-3">
            

              {/* <button
                onClick={() => setContratosModal(true)}
                className="btn btn-sm btn-light gap-2"
              >
                Contratos de Vinculación
              </button> */}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {vehiculos.map((afiliacion, index) =>
                afiliacion.vehiculo?.map((data, i) => (
                  <div
                    key={`${index}-${i}`}
                    onClick={() => {
                      setVehiculo(data);
                      setModalDetailVehiculo(true);
                    }}
                    className="relative card h-full flex flex-col border border-gray-200 cursor-pointer 
                   transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className=" card-body flex flex-col items-center flex-grow">
                      <img
                        className="w-full h-40 object-cover rounded-t-lg"
                        src={data.rutaUrl}
                        alt=""
                      />

                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <p
                          className="hover:text-primary-active text-base leading-5 font-medium text-gray-900 
               truncate max-w-[180px]"
                          title={data.tipo_vehiculo?.tipo}
                        >
                          Tipo de Vehículo: {data.tipo_vehiculo?.tipo}
                        </p>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <p className="hover:text-primary-active text-base leading-5 font-medium text-gray-900">
                          Placa: {data.placa}
                        </p>
                      </div>

                      <span className="text-gray-700 text-sm mt-2">{data.marca?.marca}</span>
                      <span className="text-gray-700 text-sm mt-2">{data.modelo?.modelo}</span>

                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmChangeStatus(data?.id);
                        }}
                        className={`badge text-sm badge-sm badge-outline cursor-pointer mt-2 ${
                          data.estado?.estado === 'INACTIVO' ? 'badge-danger' : 'badge-primary'
                        }`}
                      >
                        {data.estado?.estado}
                      </span>
                    </div>

                    <div className="card-footer flex justify-center gap-2 mt-auto p-3 items-center">
                      <a
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalPropietarioAfiliacion(true);
                          setVehiculo(data);
                        }}
                        className="btn btn-light btn-sm"
                        title="Propietarios"
                      >
                        <KeenIcon icon="users" />
                        Propietarios
                      </a>
                      <a
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalConductorAfiliacion(true);
                          setVehiculo(data);
                        }}
                        className="btn btn-light btn-sm"
                        title="Conductores"
                      >
                        <FontAwesomeIcon icon={faUserTie} />
                        Conductores
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <ModalPropietarioAfiliacion
            open={modalPropietarioAfiliacion}
            onClose={() => {
              setModalPropietarioAfiliacion(false);
            }}
            data={data}
            vehiculo={vehiculo}
          />

          <ModalConductorAfiliacion
            open={modalConductorAfiliacion}
            onClose={() => {
              setModalConductorAfiliacion(false);
            }}
            data={data}
            vehiculo={vehiculo}
          />

       

          <ModalDetailVehiculo
            open={modalDetailVehiculo}
            onClose={() => {
              setModalDetailVehiculo(false);
            }}
            vinculacion={data}
            data={vehiculo}
            onSave={handleAfterSave}
          />

          {/* <ModalContratoVinculacionContent
            open={contratosModal}
            onClose={() => {
              setContratosModal(false);
            }}
            data={data}
          /> */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalVehiculoAfiliacion };
