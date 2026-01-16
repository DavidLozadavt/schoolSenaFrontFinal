import { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { ViajesModel } from './model/ViajesInterface';

interface VehiculoSimplificado {
  id: string;
  placa: string;
  marca: string;
  modelo: string;
  foto: string;
  estado: string;
  tieneRechazo?: any;
  tienePendiente?: any;
  numeroOrden?: string;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: (vehiculo: VehiculoSimplificado, observacion: string) => void;
  idViaje: number;
  viaje?: ViajesModel | null;
}

const ModalAsignarVehiculo = ({ open, onClose, onSave, idViaje, viaje }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [searchTerm, setSearchTerm] = useState('');
  const [vehiculos, setVehiculos] = useState<VehiculoSimplificado[]>([]);
  const [filteredVehiculos, setFilteredVehiculos] = useState<VehiculoSimplificado[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoSimplificado | null>(null);
  const [observacion, setObservacion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [vehiculoAsignado, setVehiculoAsignado] = useState<VehiculoSimplificado | null>(null);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      axios
        .get('get_all_vehiculos')
        .then((response) => {
          const datosApi = response.data.map((vehiculo: any) => ({
            id: vehiculo.id.toString(),
            placa: vehiculo.placa,
            marca: vehiculo.marca.marca,
            modelo: vehiculo.modelo.modelo,
            foto: vehiculo.foto || '/public/media/images/default.png',
            estado: vehiculo.estado,
            tieneRechazo: vehiculo.tieneRechazo,
            tienePendiente: vehiculo.tienePendiente,
            numeroOrden: vehiculo.numeroOrden
          }));
          setVehiculos(datosApi);
          setFilteredVehiculos(datosApi);
          return axios.get(`/viajes/${idViaje}`);
        })
        .then((response) => {
          const vehiculoAsignado = response.data.vehiculo;
          if (vehiculoAsignado) {
            const vehiculo = {
              id: vehiculoAsignado.id.toString(),
              placa: vehiculoAsignado.placa,
              marca: vehiculoAsignado.marca.marca,
              modelo: vehiculoAsignado.modelo.modelo,
              foto: vehiculoAsignado.foto || '/public/media/images/default.png',
              estado: vehiculoAsignado.estado
            };
            setVehiculoAsignado(vehiculo);
          } else {
            setVehiculoAsignado(null);
            setSelectedVehiculo(null);
          }
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
          enqueueSnackbar('Error cargando vehículos', { variant: 'error' });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [open, idViaje, enqueueSnackbar]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = vehiculos.filter(
        (vehiculo) =>
          vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehiculo.numeroOrden?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredVehiculos(filtered);
    } else {
      setFilteredVehiculos(vehiculos);
    }
  }, [searchTerm, vehiculos]);

  const handleSelectVehiculo = (vehiculo: VehiculoSimplificado & { tieneRechazo?: boolean }) => {
    if (vehiculo.tieneRechazo) {
      enqueueSnackbar('Este vehículo tiene una revisión rechazada. No puede ser asignado.', {
        variant: 'warning'
      });
      return;
    }

    if (selectedVehiculo?.id === vehiculo.id) {
      setSelectedVehiculo(null);
      setObservacion('');
    } else {
      setSelectedVehiculo(vehiculo);
      setObservacion('');
    }
  };

  const handleRemoveVehiculo = async () => {
    if (!vehiculoAsignado) {
      enqueueSnackbar('No hay vehículo asignado para remover.', { variant: 'info' });
      return;
    }

    if (viaje?.estado !== 'Pendiente') {
      enqueueSnackbar('No se puede desasignar un vehículo de un viaje en curso o finalizado.', {
        variant: 'warning'
      });
      return;
    }

    if (!confirm('¿Seguro que deseas desasignar este vehículo del viaje?')) {
      return;
    }

    try {
      await axios.patch(`/viajes/${idViaje}/remove-vehicle`);
      enqueueSnackbar('Vehículo removido correctamente', { variant: 'info' });
      setVehiculoAsignado(null);
      setSelectedVehiculo(null);
    } catch (error) {
      console.error('Error removiendo vehículo:', error);
      enqueueSnackbar('Error removiendo vehículo', { variant: 'error' });
    }
  };

  const handleSave = () => {
    if (selectedVehiculo) {
      const data = {
        idVehiculo: selectedVehiculo.id
      };

      axios
        .patch(`/viajes/${idViaje}`, data)
        .then(() => {
          enqueueSnackbar('Vehículo asignado correctamente', { variant: 'success' });
          if (onSave) onSave(selectedVehiculo, observacion);
          onClose();
        })
        .catch((error) => {
          console.error('Error al asignar vehículo:', error);
          const mensaje = error.response?.data?.message || 'Error asignando vehículo';

          enqueueSnackbar(mensaje, { variant: 'error' });
        });
    }
  };

  useEffect(() => {
    if (vehiculos.length > 0 && vehiculoAsignado) {
      const match = vehiculos.find((v) => v.id === vehiculoAsignado.id.toString());
      if (match) {
        setSelectedVehiculo(match);
      } else {
        setSelectedVehiculo(null);
      }
    } else if (!vehiculoAsignado) {
      setSelectedVehiculo(null);
    }
  }, [vehiculos, vehiculoAsignado]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
       <ModalHeader className="px-6 py-4 border-b">
          <ModalTitle >Asignar Vehículo</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-5 py-5">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"
            />
            <input
              className="input pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Buscar por placa, numero de orden..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-80 space-y-2 pr-1">
              {filteredVehiculos.length > 0 ? (
                filteredVehiculos.map((vehiculo) => (
                  <div
                    key={vehiculo.id}
                    className={`group flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200
                    ${
                      vehiculo.tieneRechazo
                        ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                        : vehiculo.tienePendiente
                          ? 'border-orange-200  cursor-pointer'
                          : selectedVehiculo?.id === vehiculo.id ||
                              (!selectedVehiculo && viaje?.vehiculo?.id?.toString() === vehiculo.id)
                            ? 'border-blue-500  shadow-md cursor-pointer'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!vehiculo.tieneRechazo) handleSelectVehiculo(vehiculo);
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="relative">
                        <img
                          src={vehiculo.foto}
                          alt={`${vehiculo.marca} ${vehiculo.modelo}`}
                          className="w-14 h-14 rounded-lg object-cover border-2 border-white shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/public/media/images/default.png';
                          }}
                        />
                        {vehiculo.tieneRechazo && (
                          <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1" />
                        )}
                        {vehiculo.tienePendiente && !vehiculo.tieneRechazo && (
                          <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1" />
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          {vehiculo.marca} {vehiculo.modelo}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            {vehiculo.placa} || {vehiculo.numeroOrden}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              vehiculo.estado === 'ACTIVO'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {vehiculo.estado}
                          </span>

                          {vehiculo.tieneRechazo && (
                            <span className="text-xs text-red-600 font-medium bg-red-100 px-2 py-0.5 rounded-full">
                              Rechazado
                            </span>
                          )}

                          {vehiculo.tienePendiente && !vehiculo.tieneRechazo && (
                            <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-0.5 rounded-full">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                        vehiculo.tieneRechazo
                          ? 'bg-gray-300 opacity-50 cursor-not-allowed'
                          : selectedVehiculo?.id === vehiculo.id ||
                              (!selectedVehiculo && viaje?.vehiculo?.id?.toString() === vehiculo.id)
                            ? 'bg-blue-500'
                            : 'bg-gray-300'
                      }`}
                      onClick={(e) => {
                        if (vehiculo.tieneRechazo) return;
                        e.stopPropagation();
                        setSelectedVehiculo(selectedVehiculo?.id === vehiculo.id ? null : vehiculo);
                      }}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          selectedVehiculo?.id === vehiculo.id ||
                          (!selectedVehiculo && viaje?.vehiculo?.id?.toString() === vehiculo.id)
                            ? 'translate-x-5'
                            : 'translate-x-0.5'
                        }`}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <KeenIcon icon="magnifier" className="text-gray-400 w-8 h-8" />
                  </div>
                  <p className="text-gray-500 font-medium">No se encontraron vehículos</p>
                  <p className="text-sm text-gray-400 mt-1">Intenta con otro término de búsqueda</p>
                </div>
              )}
            </div>
          )}

          {selectedVehiculo && (
            <div className="grid gap-4 pt-4 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <KeenIcon
                  icon="information-2"
                  className="text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">
                    Vehículo seleccionado: {selectedVehiculo.marca} {selectedVehiculo.modelo}
                  </p>
                  <p className="text-xs text-blue-700 mt-1">Placa: {selectedVehiculo.placa}</p>
                </div>
              </div>

              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg input resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="Añade una observación (opcional)..."
                rows={3}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />

              <div className="flex gap-3 justify-end">
                <button
                  className="btn btn-light px-4"
                  onClick={() => {
                    setSelectedVehiculo(null);
                    setObservacion('');
                  }}
                >
                  Cancelar
                </button>

                <button
                  className="btn btn-primary px-6 shadow-sm hover:shadow-md transition-shadow"
                  onClick={handleSave}
                >
                  Asignar Vehículo
                </button>

                {vehiculoAsignado && (
                  <button
                    className="btn btn-danger px-4 shadow-sm hover:shadow-md transition-shadow"
                    onClick={handleRemoveVehiculo}
                  >
                    Remover Vehículo
                  </button>
                )}
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalAsignarVehiculo;
