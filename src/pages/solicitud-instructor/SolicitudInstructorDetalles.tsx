import { KeenIcon, Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from "@/components";

interface Props {
    open: boolean;
    onClose: () => void;
    solicitud: any;
}

const SolicitudInstructorDetalles = ({ open, onClose, solicitud }: Props) => {
    if (!solicitud) return null;

    return (
        <Modal open={open} onClose={onClose}>
            <ModalContent className="max-w-2xl p-4">
                <ModalHeader>
                    <ModalTitle>Detalles de la Solicitud</ModalTitle>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:scale-105"
                    >
                        <KeenIcon icon="cross" />
                    </button>
                </ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
                        {/* Información de la Ficha */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-gray-600">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                                <KeenIcon icon="subtitle" className="text-2xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ficha y Programa</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{solicitud.ficha?.codigo}</span>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {solicitud.ficha?.asignacion?.programa?.nombrePrograma || solicitud.ficha?.programa?.nombrePrograma}
                                </span>
                            </div>
                        </div>

                        {/* Periodo */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-gray-600">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-success/10 text-success">
                                <KeenIcon icon="calendar" className="text-2xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Periodo de Solicitud</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Inicio: {solicitud.fechaInicio}</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Fin: {solicitud.fechaFin || 'No definida'}</span>
                            </div>
                        </div>

                        {/* Competencia */}
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-coal-500 border border-gray-100 dark:border-gray-600 md:col-span-2">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-info/10 text-info">
                                <KeenIcon icon="book-open" className="text-2xl" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Competencia Solicitada</span>
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                                    {solicitud.materia?.nombre || solicitud.materia?.nombreMateria || "Competencia por definir"}
                                </span>
                                <p className="text-xs text-gray-500 mt-4 italic">
                                    {solicitud.observacion || "Sin observaciones adicionales."}
                                </p>
                            </div>
                        </div>

                        {/* Instructor Asignado */}
                        {solicitud.contrato?.persona && (
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 md:col-span-2">
                                <div className="flex-shrink-0">
                                    {solicitud.contrato.persona.rutaFotoUrl ? (
                                        <img
                                            src={solicitud.contrato.persona.rutaFotoUrl}
                                            alt="Instructor"
                                            className="w-16 h-16 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white font-bold text-xl">
                                            {solicitud.contrato.persona.nombre1[0]} {solicitud.contrato.persona.apellido1[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Instructor Asignado</span>
                                    <span className="text-md font-black text-gray-800 dark:text-gray-100">
                                        {solicitud.contrato.persona.nombre1} {solicitud.contrato.persona.apellido1}
                                    </span>
                                    <div className="flex flex-col md:flex-row md:gap-4 mt-1">
                                        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <KeenIcon icon="sms" className="text-xs" /> {solicitud.contrato.persona.email}
                                        </span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                            <KeenIcon icon="phone" className="text-xs" /> {solicitud.contrato.persona.celular}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <div className="w-full flex justify-between items-center">
                    <div className="flex items-start gap-4 p-4">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Estado:</span>
                            <span className={`badge badge-sm font-bold ${solicitud.estado === 'PENDIENTE' ? 'badge-warning' :
                                solicitud.estado === 'ACEPTADO' ? 'badge-success' :
                                    'badge-danger'
                                }`}>
                                {solicitud.estado}
                            </span>
                        </div>
                    <button type="button" className="btn btn-light" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </ModalContent>
        </Modal>
    );
};

export default SolicitudInstructorDetalles;
