import { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { Conductor } from './model/ConductorInterface';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  vehiculo?: any;
  onClose: () => void;
  onSave?: (conductor: Conductor, auxiliar?: Conductor) => void;
  idViaje: number;
  viajeData?: any;
}

const ModalAsignarConductor = ({ open, onClose, onSave, idViaje, vehiculo }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState<'principal' | 'auxiliar'>('principal');
  const [searchTerm, setSearchTerm] = useState('');
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [filteredConductores, setFilteredConductores] = useState<Conductor[]>([]);
  const [selectedConductor, setSelectedConductor] = useState<Conductor | null>(null);
  const [selectedAuxiliar, setSelectedAuxiliar] = useState<Conductor | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const conductoresResp = await axios.get<Conductor[]>('get_all_drivers');
        setConductores(conductoresResp.data);
        setFilteredConductores(conductoresResp.data);

        const viajeResp = await axios.get(`/viajes/${idViaje}`);
        const viaje = viajeResp.data;

        if (viaje?.idConductor) {
          const conductorEncontrado = conductoresResp.data.find(c =>
            c.contrato?.some(ct => ct.id === viaje.idConductor)
          );
          if (conductorEncontrado) setSelectedConductor(conductorEncontrado);
        }

        if (viaje?.idConductorAuxiliar) {
          const auxiliarEncontrado = conductoresResp.data.find(c =>
            c.contrato?.some(ct => ct.id === viaje.idConductorAuxiliar)
          );
          if (auxiliarEncontrado) setSelectedAuxiliar(auxiliarEncontrado);
        }
      } catch (error) {
        console.error('Error obteniendo conductores o viaje:', error);
        enqueueSnackbar('Error cargando datos', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, idViaje, enqueueSnackbar]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = conductores.filter(conductor =>
        conductor.identificacion.includes(searchTerm) ||
        `${conductor.nombre1} ${conductor.apellido1}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredConductores(filtered);
    } else {
      setFilteredConductores(conductores);
    }
  }, [searchTerm, conductores]);

  const handleSelectConductor = (conductor: Conductor) => {
    setSelectedConductor(prev => (prev?.id === conductor.id ? null : conductor));
    if (selectedAuxiliar?.id === conductor.id) {
      setSelectedAuxiliar(null);
    }
  };

  const handleSelectAuxiliar = (conductor: Conductor) => {
    if (selectedConductor?.id === conductor.id) return;
    setSelectedAuxiliar(prev => (prev?.id === conductor.id ? null : conductor));
  };

  const handleSave = async () => {
    if (!selectedConductor) {
      enqueueSnackbar('Debes seleccionar un conductor principal', { variant: 'warning' });
      setActiveTab('principal');
      return;
    }

    try {
      const data = {
        idConductor: selectedConductor?.contrato?.[0]?.id ?? null,
        idConductorAuxiliar: selectedAuxiliar?.contrato?.[0]?.id ?? null,
      };

      await axios.put(`/update_driver_to_trip/${idViaje}`, data);
      enqueueSnackbar('Asignación guardada correctamente', { variant: 'success' });
      onSave && onSave(selectedConductor, selectedAuxiliar ?? undefined);
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error asignando conductor o auxiliar', { variant: 'error' });
    }
  };

  const ConductorList = ({
    conductoresList,
    selected,
    onSelect,
  }: {
    conductoresList: Conductor[];
    selected: Conductor | null;
    onSelect: (conductor: Conductor) => void;
  }) => (
    <div className="overflow-y-auto max-h-80 space-y-2">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : conductoresList.length > 0 ? (
        conductoresList.map((conductor) => {
          const isSelected = selected?.id === conductor.id;
          const isDisabled = activeTab === 'auxiliar' && selectedConductor?.id === conductor.id;
          
          return (
            <div
              key={conductor.id}
              className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg border ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed '
                  : isSelected
                  ? ' border-blue-400'
                  : 'border-gray-300'
              }`}
              onClick={() => !isDisabled && onSelect(conductor)}
            >
              <img
                src={conductor.rutaFotoUrl}
                alt={`${conductor.nombre1} ${conductor.apellido1}`}
                className="w-12 h-12 rounded-lg object-cover"
              />
              
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {`${conductor.nombre1} ${conductor.nombre2 || ''} ${conductor.apellido1 || ''}`.trim()}
                </p>
                <p className="text-sm text-gray-600">{conductor.identificacion}</p>
              </div>

              {isSelected && (
                <KeenIcon icon="check" className="text-blue-500 w-5 h-5" />
              )}
            </div>
          );
        })
      ) : (
        <div className="text-center py-8">
          <KeenIcon icon="magnifier" className="text-gray-400 w-8 h-8 mx-auto mb-2" />
          <p className="text-gray-500">No se encontraron conductores</p>
        </div>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[680px] top-[15%]">
        <ModalHeader className="px-6 py-4 border-b">
          <ModalTitle >{vehiculo ? 'Editar Vehículo asignado' : 'Asignar Conductor'}</ModalTitle>
         <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>


        <ModalBody className="space-y-4 p-5">
          {/* Búsqueda */}
          <div className="relative">
            <KeenIcon icon="magnifier" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              className="input pl-10 w-full"
              placeholder="Buscar por identificación o nombre..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'principal' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('principal')}
            >
              Conductor Principal
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === 'auxiliar' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveTab('auxiliar')}
            >
              Auxiliar (opcional)
            </button>
          </div>

          {/* Lista */}
          {activeTab === 'principal' && (
            <ConductorList
              conductoresList={filteredConductores}
              selected={selectedConductor}
              onSelect={handleSelectConductor}
            />
          )}
          {activeTab === 'auxiliar' && (
            <ConductorList
              conductoresList={filteredConductores}
              selected={selectedAuxiliar}
              onSelect={handleSelectAuxiliar}
            />
          )}

          {/* Resumen */}
          {(selectedConductor || selectedAuxiliar) && (
            <div className="rounded-lg p-3 space-y-1 text-sm">
              {selectedConductor && (
                <p className="font-medium">
                  Principal: {selectedConductor.nombre1} {selectedConductor.apellido1}
                </p>
              )}
              {selectedAuxiliar && (
                <p className="font-medium">
                  Auxiliar: {selectedAuxiliar.nombre1} {selectedAuxiliar.apellido1}
                </p>
              )}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-2">
            <button className="btn btn-light" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Asignar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalAsignarConductor;