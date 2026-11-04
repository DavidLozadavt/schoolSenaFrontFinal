import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

interface Actividad {
    id: number;
    tituloActividad: string;
    descripcionActividad: string;
    tipoActividad: string;
    entregables: string;
    materia?: {
        codigo: string;
        nombreMateria: string;
    };
    persona?: {
        nombre1: string;
        apellido1: string;
    };
}

interface ActivityProgress {
    id: number;
    actividad: Actividad;
    nota?: number | null;
    estado: string;
    fechaEntrega?: string;
    entregablesRealizados?: string;
}

interface ModalMisActividadesProps {
    open: boolean;
    onClose: () => void;
    studentId: number;
    studentName: string;
    idMateria: string | number;
    idFicha: number;
}

const ModalMisActividades: React.FC<ModalMisActividadesProps> = ({
    open,
    onClose,
    studentId,
    studentName,
    idMateria,
    idFicha
}) => {
    const [activities, setActivities] = useState<ActivityProgress[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});

    useEffect(() => {
        if (open && studentId) {
            fetchStudentActivities();
        }
    }, [open, studentId, idFicha, idMateria]);

    const toggleDescription = (id: number) => {
        setExpandedDocs(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const fetchStudentActivities = async () => {
        setLoading(true);
        try {
            const params: Record<string, any> = { idPersona: studentId };
            if (idMateria) params.idMateria = idMateria;

            const response = await axios.get(`fichas/${idFicha}/actividades-estudiante`, {
                params
            });

            console.log('[ModalMisActividades] API params:', { idFicha, ...params }, 'Response:', response.data);

            let data: any[] = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                data = response.data.data;
            }

            const mappedData: ActivityProgress[] = data.map((item: any, index: number) => {
                const act = item.actividad || item;
                return {
                    id: item.id || index,
                    actividad: act,
                    nota: item.calificacionNumerica ?? item.nota ?? item.notaParcial ?? null,
                    estado: item.estado || ((item.calificacionNumerica ?? item.nota ?? item.notaParcial) != null ? 'CALIFICADA' : 'POR EVALUAR'),
                    fechaEntrega: item.fechaFinal || 'SIN FECHA',
                    entregablesRealizados: item.entregablesRealizados || '-'
                };
            });

            setActivities(mappedData);
        } catch (error) {
            console.error('Error fetching student activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const headers = ['Código', 'Instructor', 'Actividad', 'Descripción', 'Nota', 'Entregables', 'Rap', 'Fecha de entrega', 'Estado', 'Tipo', 'Acciones'];

    return (
        <Modal open={open} onClose={onClose} zIndex={1050}>
            <ModalContent className="max-w-[1200px] w-full top-[5%] p-6">
                <ModalHeader className="flex justify-between items-center mb-6">
                    <div className="flex-1 text-center">
                        <ModalTitle className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
                            Actividades Aprendiz
                        </ModalTitle>
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 uppercase">
                            {studentName}
                        </p>
                    </div>
                    <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
                        <KeenIcon icon="cross" />
                    </button>
                </ModalHeader>

                <ModalBody className="p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    {headers.map((h, i) => (
                                        <th
                                            key={h}
                                            className={`py-4 px-4 text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase ${['Nota', 'Entregables', 'Estado', 'Tipo', 'Acciones'].includes(h) ? 'text-center' : 'text-left'}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan={headers.length} className="py-20 text-center">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                                            <p className="mt-4 text-sm text-gray-500">Cargando actividades...</p>
                                        </td>
                                    </tr>
                                ) : activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={headers.length} className="py-20 text-center">
                                            <p className="text-sm text-gray-500 italic">No hay actividades asignadas para esta materia.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-coal-400/50 transition-colors">
                                            <td className="py-4 px-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">
                                                    {item.actividad.persona ? `${item.actividad.persona.nombre1} ${item.actividad.persona.apellido1}` : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 max-w-[180px]">
                                                <span className="text-xs font-bold text-gray-900 dark:text-white uppercase leading-tight">
                                                    {item.actividad.tituloActividad}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 max-w-[220px]">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className={`text-[10px] text-gray-600 dark:text-gray-400 uppercase font-medium leading-relaxed ${expandedDocs[item.id] ? '' : 'line-clamp-2'}`}>
                                                        {item.actividad.descripcionActividad || 'SIN DESCRIPCIÓN'}
                                                    </span>
                                                    {(item.actividad.descripcionActividad?.length || 0) > 40 && (
                                                        <button
                                                            onClick={() => toggleDescription(item.id)}
                                                            className="self-start text-[9px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 uppercase tracking-tight"
                                                        >
                                                            {expandedDocs[item.id] ? 'Ver menos' : 'Ver más'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className={`inline-flex items-center justify-center h-8 px-2 min-w-[32px] rounded-lg border shadow-sm ${
                                                    item.nota == null ? 'bg-gray-50 dark:bg-coal-300 border-gray-100 dark:border-coal-100' :
                                                    item.nota <= 3.5 ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' :
                                                    item.nota < 4.0 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' :
                                                    'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                                                }`}>
                                                    <span className={`text-[10px] font-bold uppercase whitespace-nowrap ${
                                                        item.nota == null ? 'text-gray-900 dark:text-white' :
                                                        item.nota <= 3.5 ? 'text-red-700 dark:text-red-400' :
                                                        item.nota < 4.0 ? 'text-yellow-700 dark:text-yellow-400' :
                                                        'text-green-700 dark:text-green-400'
                                                    }`}>
                                                        {item.nota != null ? item.nota : 'SIN EVALUAR'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                {item.actividad?.entregables || '-'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase truncate block max-w-[120px]">
                                                    {item.actividad.materia?.nombreMateria || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                                                {item.fechaEntrega}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                                                    {item.estado}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">
                                                {item.actividad.tipoActividad === 'cuestionario' ? 'Cuestionario' : (item.actividad.tipoActividad || '-')}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                                    <KeenIcon icon="eye" className="text-sm text-gray-600 dark:text-gray-300" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default ModalMisActividades;
