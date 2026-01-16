import { useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import axios from 'axios';

interface ModalProps {
    open: boolean;
    vehiculo?: any;
    onClose: () => void;
    onSave?: (viaje: any) => void;
    idViaje: number;
}

enum DiasSemana {
    LUNES = 'LUNES',
    MARTES = 'MARTES',
    MIERCOLES = 'MIERCOLES',
    JUEVES = 'JUEVES',
    VIERNES = 'VIERNES',
    SABADO = 'SABADO',
    DOMINGO = 'DOMINGO',
}

const ModalAgendarViajes = ({ open, onClose, vehiculo, onSave, idViaje }: ModalProps) => {
    const { enqueueSnackbar } = useSnackbar();
    
    const [diaSeleccionado, setDiaSeleccionado] = useState<DiasSemana | null>(null);
    const [fecha, setFecha] = useState<string>('');
    const [hora, setHora] = useState<string>('');
    const [repetir, setRepetir] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const toggleDia = (dia: DiasSemana) => {
        if (diaSeleccionado === dia) {
            setDiaSeleccionado(null); 
        } else {
            setDiaSeleccionado(dia);
        }
    };

    const handleSave = async () => {
        if (!diaSeleccionado || !fecha || !hora) {
            enqueueSnackbar('Por favor, completa todos los campos requeridos.', {
                variant: 'warning', 
            });
            return;
        }

        const viaje = {
            idViaje,
            dia: diaSeleccionado,
            fecha,
            hora,
            repetir,
        };

        setIsLoading(true);

        try {
            const response = await axios.post('schedule_trip', viaje);

            if (response.status === 200 || response.status === 201) {
                enqueueSnackbar('¡Viaje agendado exitosamente!', {
                    variant: 'success',
                });
                if (onSave) {
                    onSave(viaje);
                }
                onClose();
            } else {
                enqueueSnackbar('Error al agendar el viaje. Por favor, intenta nuevamente.', {
                    variant: 'error', 
                });
            }
        } catch (error) {
            enqueueSnackbar('Error en la solicitud. Verifica tu conexión e intenta nuevamente.', {
                variant: 'error', 
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setDiaSeleccionado(null);
        setFecha('');
        setHora('');
        setRepetir(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isFormValid = diaSeleccionado && fecha && hora;

    return (
        <Modal open={open} onClose={handleClose}>
            <ModalContent className="max-w-[600px] top-[15%]">
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
                        {/* Sección de Fecha y Hora */}
                        <div>
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
                                        className="input w-full"
                                        disabled={isLoading}
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
                                        className="input w-full"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sección de Día de la Semana */}
                        <div>
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
                <div className="flex justify-between gap-3 px-6 py-4 border-t ">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-5 py-2 text-gray-700 transition-colors  border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default ModalAgendarViajes;