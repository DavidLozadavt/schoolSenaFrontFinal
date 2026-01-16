import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import axios from 'axios';

interface ModalProps {
    open: boolean;
    vehiculo?: any;
    onClose: () => void;
    onSave?: (viaje: any) => void;
}

enum DiasSemana {
    LUNES = 'LUNES',
    MARTES = 'MARTES',
    MIERCOLES = 'MIERCOLES',
    JUEVES = 'JUEVES',
    VIERNES = 'VIERNES',
    SABADO = 'SABADO',
    DOMINGO = 'DOMINGO'
}

const ModalNuevoViaje = ({ open, onClose, vehiculo, onSave }: ModalProps) => {
    const { enqueueSnackbar } = useSnackbar();

    const [diaSeleccionado, setDiaSeleccionado] = useState<DiasSemana | null>(null);
    const [fecha, setFecha] = useState<string>('');
    const [hora, setHora] = useState<string>('');
    const [repetir, setRepetir] = useState<boolean>(false);
    const [rutasIda, setRutasIda] = useState<any[]>([]); 
    const [rutasVuelta, setRutasVuelta] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [rutaSeleccionada, setRutaSeleccionada] = useState<any>(null);
    const [rutaTipo, setRutaTipo] = useState<'ida' | 'vuelta' | null>(null);
    const [showInfo, setShowInfo] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    useEffect(() => {
        if (open && searchTerm.length > 2) {
            setIsSearching(true);
            axios
                .get(`rutas?search=${encodeURIComponent(searchTerm)}`)
                .then((response) => {
                    if (Array.isArray(response.data)) {
                        const rutasIdaTemp: any[] = [];
                        const rutasVueltaTemp: any[] = [];

                        response.data.forEach((ruta) => {
                            if (ruta.rutaIda) {
                                rutasIdaTemp.push({ ...ruta.rutaIda, tipo: 'ida' });
                            }
                            if (ruta.rutaVuelta) {
                                rutasVueltaTemp.push({ ...ruta.rutaVuelta, tipo: 'vuelta' });
                            }
                        });

                        setRutasIda(rutasIdaTemp);
                        setRutasVuelta(rutasVueltaTemp);
                    } else {
                        setRutasIda([]);
                        setRutasVuelta([]);
                    }
                })
                .catch((error) => {
                    console.error('Error al obtener las rutas:', error);
                    setRutasIda([]);
                    setRutasVuelta([]);
                })
                .finally(() => {
                    setIsSearching(false);
                });
        } else {
            setRutasIda([]);
            setRutasVuelta([]);
        }
    }, [searchTerm, open]);

    useEffect(() => {
        if (!open) {
            resetForm();
        }
    }, [open]);

    const resetForm = () => {
        setRutaSeleccionada(null);
        setSearchTerm('');
        setRutaTipo(null);
        setDiaSeleccionado(null);
        setFecha('');
        setHora('');
        setRepetir(false);
    };

    const toggleDia = (dia: DiasSemana) => {
        setDiaSeleccionado(diaSeleccionado === dia ? null : dia);
    };

    const handleSave = async () => {
        if (!diaSeleccionado || !fecha || !hora || !rutaSeleccionada || !rutaTipo) {
            enqueueSnackbar('Por favor, completa todos los campos requeridos.', {
                variant: 'warning'
            });
            return;
        }

        const viaje = {
            dia: diaSeleccionado,
            fecha,
            hora,
            repetir,
            idRuta: rutaSeleccionada.id,
            tipoRuta: rutaTipo
        };

        setIsLoading(true);

        try {
            const response = await axios.post('save_trip_agenda', viaje);
            if (response.status === 200 || response.status === 201) {
                enqueueSnackbar('¡Viaje agendado exitosamente!', { variant: 'success' });
                onSave?.(viaje);
                onClose();
            } else {
                enqueueSnackbar('Error al agendar el viaje.', { variant: 'error' });
            }
        } catch (error) {
            enqueueSnackbar('Error de conexión. Intenta nuevamente.', { variant: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isFormValid = diaSeleccionado && fecha && hora && rutaSeleccionada && rutaTipo;

    return (
        <Modal open={open} onClose={handleClose}>
            <ModalContent className="max-w-[700px] top-[10%]">
                <ModalHeader className="px-6 py-4 border-b">
                    <ModalTitle className="text-lg font-semibold">
                        {vehiculo ? 'Editar viaje agendado' : 'Agendar nuevo viaje'}
                    </ModalTitle>
                    <button 
                        className="btn btn-sm btn-icon btn-light btn-clear shrink-0" 
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <KeenIcon icon="cross" />
                    </button>
                </ModalHeader>

                <ModalBody className="px-6 py-6">
                    <div className="space-y-6">
                        {/* Sección de Búsqueda de Ruta */}
                        <div>
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">
                                Seleccionar Ruta <span className="text-red-500">*</span>
                            </h3>
                            
                            <div className="relative">
                                <div className="relative">
                                    <KeenIcon 
                                        icon="magnifier" 
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" 
                                    />
                                    <input
                                        type="text"
                                        placeholder="Buscar por ciudad de origen o destino..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={isLoading || rutaSeleccionada !== null}
                                         className="pl-8 input input-sm"
                                    />
                                    {isSearching && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <svg className="w-5 h-5 text-blue-500 animate-spin" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Ruta Seleccionada */}
                                {rutaSeleccionada && (
                                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-1 text-xs font-semibold rounded ${
                                                rutaTipo === 'ida' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                                            }`}>
                                                {rutaTipo === 'ida' ? 'IDA' : 'VUELTA'}
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">
                                                {rutaSeleccionada.ciudad_origen?.descripcion} → {rutaSeleccionada.ciudad_destino?.descripcion}
                                            </span>
                                        </div>
                                        <button
                                            className="p-1.5 text-red-500 hover:bg-red-100 rounded transition-colors"
                                            onClick={() => {
                                                setRutaSeleccionada(null);
                                                setSearchTerm('');
                                                setRutaTipo(null);
                                            }}
                                            disabled={isLoading}
                                        >
                                            <KeenIcon icon="cross" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Resultados de búsqueda */}
                            {searchTerm.length > 2 && !rutaSeleccionada && (
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    {/* Rutas de Ida */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <h4 className="text-sm font-semibold text-gray-700">Rutas de Ida</h4>
                                        </div>
                                        <div className="border rounded-lg overflow-hidden  max-h-64 overflow-y-auto">
                                            {rutasIda.length > 0 ? (
                                                rutasIda.map((ruta, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-green-50 transition-colors group"
                                                        onClick={() => {
                                                            setRutaSeleccionada(ruta);
                                                            setRutaTipo('ida');
                                                        }}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-gray-700">
                                                                {ruta.ciudad_origen?.descripcion}
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <KeenIcon icon="arrow-right" className="text-xs text-gray-400" />
                                                                <div className="text-xs text-gray-500">
                                                                    {ruta.ciudad_destino?.descripcion}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowInfo(true);
                                                            }}
                                                        >
                                                            <KeenIcon icon="eye" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    {isSearching ? 'Buscando...' : 'No hay rutas de ida disponibles'}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rutas de Vuelta */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                            <h4 className="text-sm font-semibold text-gray-700">Rutas de Vuelta</h4>
                                        </div>
                                        <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                            {rutasVuelta.length > 0 ? (
                                                rutasVuelta.map((ruta, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-purple-50 transition-colors group"
                                                        onClick={() => {
                                                            setRutaSeleccionada(ruta);
                                                            setRutaTipo('vuelta');
                                                        }}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="text-sm font-medium text-gray-700">
                                                                {ruta.ciudad_origen?.descripcion}
                                                            </div>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <KeenIcon icon="arrow-right" className="text-xs text-gray-400" />
                                                                <div className="text-xs text-gray-500">
                                                                    {ruta.ciudad_destino?.descripcion}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowInfo(true);
                                                            }}
                                                        >
                                                            <KeenIcon icon="eye" />
                                                        </button>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 text-center text-sm text-gray-500">
                                                    {isSearching ? 'Buscando...' : 'No hay rutas de vuelta disponibles'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {searchTerm.length > 0 && searchTerm.length <= 2 && !rutaSeleccionada && (
                                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-xs text-yellow-700">
                                        Escribe al menos 3 caracteres para buscar rutas
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Sección de Fecha y Hora */}
                        <div className="pt-4 border-t">
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">Fecha y Hora</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Fecha <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={fecha}
                                        onChange={(e) => setFecha(e.target.value)}
                                        disabled={isLoading}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">
                                        Hora <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={hora}
                                        onChange={(e) => setHora(e.target.value)}
                                        disabled={isLoading}
                                         className="input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección de Día de la Semana */}
                        <div className="pt-4 border-t">
                            <label className="block mb-3 text-sm font-semibold text-gray-700">
                                Día de la semana <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-7 gap-2">
                                {Object.values(DiasSemana).map((dia) => (
                                    <button
                                        key={dia}
                                        onClick={() => !isLoading && toggleDia(dia)}
                                        disabled={isLoading}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200 ${
                                            diaSeleccionado === dia 
                                                ? 'bg-blue-500 border-blue-500 text-white shadow-md' 
                                                : ' border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <span className="text-xs font-bold">{dia.slice(0, 3)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sección de Repetir */}
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between p-4 rounded-lg ">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">
                                        Repetir semanalmente
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">
                                        El viaje se repetirá cada {diaSeleccionado ? diaSeleccionado.toLowerCase() : 'semana'}
                                    </p>
                                </div>
                                 <button
                                    onClick={() => !isLoading && setRepetir(!repetir)}
                                    disabled={isLoading}
                                    className={`relative w-14 h-7 rounded-full transition-colors duration-200 ${
                                        repetir ? 'bg-blue-500' : 'bg-gray-300'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                                            repetir ? 'translate-x-7' : 'translate-x-0'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </ModalBody>

                {/* Footer con botones */}
                <div className="flex justify-between gap-3 px-6 py-4 border-t">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-5 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isFormValid || isLoading}
                        className={`px-5 py-2 text-white rounded-lg transition-all ${
                            isFormValid && !isLoading
                                ? 'bg-blue-500 hover:bg-blue-600 shadow-sm hover:shadow-md' 
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Guardando...
                            </span>
                        ) : (
                            'Guardar viaje'
                        )}
                    </button>
                </div>
            </ModalContent>
        </Modal>
    );
};

export default ModalNuevoViaje;