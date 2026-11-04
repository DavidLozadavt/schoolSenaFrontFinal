import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { KeenIcon } from '@/components';
import ModalMisActividades from './modal/ModalMisActividades';

interface Persona {
    id: number;
    identificacion: string;
    nombre1: string;
    nombre2?: string | null;
    apellido1: string;
    apellido2?: string | null;
    email: string;
    rutaFotoUrl?: string;
}

interface Matricula {
    id: number;
    person: Persona;
}

interface Materia {
    id: number;
    nombreMateria: string;
    descripcion: string;
    codigo: string;
}

interface StudentData {
    id: number;
    idFicha: number;
    estado: string;
    notaParcial?: number | null;
    porcentaje_avance?: number | null;
    matricula: Matricula;
    materia: Materia;
    ficha?: any;
}

interface CalificacionesFichaViewProps {
    idFicha: number;
    idMateria: string | number;
    idInstructor?: number;
    instructorAsignado?: string;
}

const CalificacionesFichaView: React.FC<CalificacionesFichaViewProps> = ({ idFicha, idMateria, idInstructor, instructorAsignado = 'NO ASIGNADO' }) => {
    const [students, setStudents] = useState<StudentData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

    // States for toggling "Ver más"
    const [expandedCompetencies, setExpandedCompetencies] = useState<Record<number, boolean>>({});
    const [expandedRAPs, setExpandedRAPs] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const fetchStudents = async () => {
            if (!idInstructor && (!idFicha || !idMateria)) return;

            setLoading(true);
            setError(null);

            try {
                const idMateriaNumber = typeof idMateria === 'string' ? parseInt(idMateria) : idMateria;

                if (idInstructor) {
                    const response = await axios.get(`calificaciones_ficha_by_instructor/${idInstructor}`, {
                        params: {
                            idFicha: idFicha,
                            idMateria: 0, // Envíamos 0 para mostrar todos los RAPs de la ficha en la vista general
                            page: 1,
                            per_page: 500,
                            search: ''
                        }
                    });

                    const data = Array.isArray(response.data)
                        ? response.data
                        : Array.isArray(response.data?.data)
                            ? response.data.data
                            : [];

                    setStudents(data);
                } else {
                    const requestData = {
                        idMateria: idMateriaNumber,
                        idFicha: idFicha
                    };

                    const dataEncoded = JSON.stringify(requestData);

                    const response = await axios.get('get_student_by_id_materia', {
                        params: { data_encoded: dataEncoded }
                    });

                    if (Array.isArray(response.data)) {
                        setStudents(response.data);
                    } else {
                        setStudents([]);
                    }
                }
            } catch (err: any) {
                console.error('Error fetching students for grades:', err);
                setError('Error al cargar la lista de aprendices.');
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [idFicha, idMateria, idInstructor]);

    const toggleCompetency = (id: number) => {
        setExpandedCompetencies(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleRAP = (id: number) => {
        setExpandedRAPs(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const getFullName = (student: StudentData): string => {
        const persona = student.matricula?.person;
        if (!persona) return 'Sin nombre';
        return `${persona.nombre1} ${persona.nombre2 || ''} ${persona.apellido1} ${persona.apellido2 || ''}`.trim().toUpperCase();
    };

    const getStudentPhoto = (student: StudentData): string => {
        const API_URL = import.meta.env.VITE_APP_API_URL || '';
        const baseUrl = API_URL.endsWith('/api/') ? API_URL.slice(0, -5) : API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

        if (student.matricula?.person?.rutaFotoUrl) {
            const ruta = student.matricula.person.rutaFotoUrl;
            return ruta.startsWith('http') ? ruta : `${baseUrl}${ruta.startsWith('/') ? '' : '/'}${ruta}`;
        }
        return '/media/avatars/blank.png';
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const name = getFullName(student).toLowerCase();
            const id = student.matricula?.person?.identificacion || '';
            const materia = student.materia?.nombreMateria?.toLowerCase() || '';
            const search = searchTerm.toLowerCase();

            return name.includes(search) || id.includes(search) || materia.includes(search);
        });
    }, [students, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    const paginatedStudents = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredStudents, currentPage]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <p className="mt-4 text-sm text-gray-500">Cargando aprendices...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <KeenIcon icon="shield-cross" className="text-4xl text-red-500 mb-2" />
                <p className="text-sm text-red-500">{error}</p>
            </div>
        );
    }

    const handleOpenActivities = (student: StudentData) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleExportExcel = () => {
        if (!filteredStudents.length) return;

        const dataToExport = filteredStudents.map(student => ({
            'APRENDIZ': getFullName(student),
            'IDENTIFICACIÓN': student.matricula?.person?.identificacion || 'N/A',
            'FICHA': student.ficha?.codigo || 'N/A',
            'COMPETENCIA': student.materia?.nombreMateria || 'N/A',
            'RAP': student.materia?.descripcion || 'SIN DESCRIPCIÓN',
            'PORCENTAJE': student.porcentaje_avance !== undefined && student.porcentaje_avance !== null ? `${student.porcentaje_avance}%` : '0%',
            'NOTA PARCIAL': student.notaParcial !== null && student.notaParcial !== undefined ? student.notaParcial : '0.0',
            'ESTADO RAP': student.estado || 'SIN EVALUAR',
            'EVALUADOR': (instructorAsignado || '')
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Calificaciones');

        XLSX.writeFile(workbook, `Calificaciones_Ficha_${idFicha || 'General'}.xlsx`);
    };

    const headers = ['Aprendiz', 'Identificacion', 'Ficha', 'Competencia', 'RAP', 'Porcentaje', 'Nota Parcial', 'Estado RAP', 'Evaluador', 'Acciones'];

    return (
        <div className="min-w-0 max-w-full space-y-4 animate-fade-in">
            <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white text-center uppercase tracking-tight">Calificaciones generales</h2>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-md">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o identificación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm shadow-sm transition-all"
                        />
                        <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors uppercase shadow-sm"
                    >
                        <KeenIcon icon="file-down" className="text-sm" />
                        Exportar Excel
                    </button>
                </div>
            </div>

            <div className="w-full min-w-0 max-w-full overflow-x-auto md:overflow-x-visible">
                <table className="w-full min-w-0 table-fixed border-collapse">
                    <colgroup>
                        <col style={{ width: '11%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '6%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '10%' }} />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                            {headers.map((h) => (
                                <th key={h} className={`py-2.5 px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-bold text-gray-600 dark:text-gray-400 tracking-wider uppercase ${['Porcentaje', 'Nota Parcial', 'Estado RAP', 'Evaluador', 'Acciones'].includes(h) ? 'text-center' : 'text-left'}`}>
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-coal-400/50 transition-colors">
                                <td className="py-3 px-1.5 sm:px-2 align-middle min-w-0 max-w-0">
                                    <div className="flex min-w-0 w-full max-w-full flex-col items-center gap-1.5">
                                        <div className="relative">
                                            <img
                                                src={getStudentPhoto(student)}
                                                alt={getFullName(student)}
                                                className="w-11 h-11 rounded-full object-cover border-2 border-gray-100 dark:border-gray-700 shadow-sm"
                                                onError={(e) => { e.currentTarget.src = '/media/avatars/blank.png'; }}
                                            />
                                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-coal-200 rounded-full"></div>
                                        </div>
                                        <span className="w-full min-w-0 text-[9px] sm:text-[10px] font-bold text-gray-900 dark:text-white uppercase leading-tight text-center line-clamp-2 break-words">
                                            {getFullName(student)}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-1.5 sm:px-2 text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 align-middle min-w-0 max-w-0">
                                    <span className="block truncate" title={student.matricula?.person?.identificacion || 'N/A'}>
                                        {student.matricula?.person?.identificacion || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-3 px-1.5 sm:px-2 text-[9px] sm:text-[10px] font-bold text-gray-800 dark:text-gray-200 uppercase align-middle min-w-0 max-w-0">
                                    <span className="block truncate" title={student.ficha?.codigo || 'N/A'}>
                                        {student.ficha?.codigo || 'N/A'}
                                    </span>
                                </td>
                                <td className="py-3 px-1.5 sm:px-2 align-middle min-w-0 max-w-0">
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <span className={`min-w-0 break-words text-[9px] sm:text-[10px] font-bold text-gray-800 dark:text-gray-200 uppercase leading-relaxed ${expandedCompetencies[student.id] ? '' : 'line-clamp-2'}`}>
                                            {student.materia?.nombreMateria || 'N/A'}
                                        </span>
                                        {(student.materia?.nombreMateria?.length || 0) > 40 && (
                                            <button
                                                onClick={() => toggleCompetency(student.id)}
                                                className="self-start text-[9px] sm:text-[10px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-tighter decoration-dotted underline underline-offset-2"
                                            >
                                                {expandedCompetencies[student.id] ? 'Ver menos' : 'Ver más'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-1.5 sm:px-2 align-middle min-w-0 max-w-0">
                                    <div className="flex min-w-0 flex-col gap-1">
                                        <span className={`min-w-0 break-words text-[9px] sm:text-[10px] text-gray-600 dark:text-gray-400 uppercase font-medium leading-relaxed ${expandedRAPs[student.id] ? '' : 'line-clamp-2'}`}>
                                            {student.materia?.descripcion || 'SIN DESCRIPCIÓN'}
                                        </span>
                                        {(student.materia?.descripcion?.length || 0) > 40 && (
                                            <button
                                                onClick={() => toggleRAP(student.id)}
                                                className="self-start text-[8px] sm:text-[9px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 uppercase tracking-tight"
                                            >
                                                {expandedRAPs[student.id] ? 'Ver menos' : 'Ver más'}
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="py-3 px-1 sm:px-1.5 text-center align-middle min-w-0">
                                    <div className="mx-auto inline-flex max-w-full items-center justify-center min-h-[1.9rem] min-w-0 px-1 sm:px-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 shadow-sm">
                                        <span className="text-[10px] sm:text-xs font-bold tabular-nums text-blue-700 dark:text-blue-300">
                                            {student.porcentaje_avance !== undefined && student.porcentaje_avance !== null ? `${student.porcentaje_avance}%` : '0%'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-1 sm:px-1.5 text-center align-middle min-w-0">
                                    <div className={`mx-auto inline-flex min-w-0 max-w-full items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg border shadow-sm ${
                                        student.notaParcial === null || student.notaParcial === undefined ? 'bg-gray-50 dark:bg-coal-300 border-gray-100 dark:border-coal-100' :
                                        student.notaParcial <= 3.5 ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' :
                                        student.notaParcial < 4.0 ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800' :
                                        'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                                    }`}>
                                        <span className={`text-[10px] sm:text-xs font-bold tabular-nums ${
                                            student.notaParcial === null || student.notaParcial === undefined ? 'text-gray-900 dark:text-white' :
                                            student.notaParcial <= 3.5 ? 'text-red-700 dark:text-red-400' :
                                            student.notaParcial < 4.0 ? 'text-yellow-700 dark:text-yellow-400' :
                                            'text-green-700 dark:text-green-400'
                                        }`}>
                                            {student.notaParcial !== null && student.notaParcial !== undefined ? student.notaParcial : '0.0'}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-1 sm:px-1.5 text-center align-middle min-w-0">
                                    <span className={`inline-flex max-w-full truncate px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wide border ${student.estado === 'APROBADO'
                                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
                                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
                                        }`} title={student.estado || 'SIN EVALUAR'}>
                                        {student.estado || 'SIN EVALUAR'}
                                    </span>
                                </td>
                                <td className="py-3 px-1 sm:px-1.5 text-center align-middle min-w-0 max-w-0">
                                    <div className="flex min-w-0 max-w-full flex-col items-center gap-0.5">
                                        <span className="w-full min-w-0 truncate text-[8px] sm:text-[9px] font-bold text-gray-700 dark:text-gray-300 uppercase leading-tight" title={student.estado === 'APROBADO' ? (instructorAsignado || '') : ''}>
                                            {student.estado === 'APROBADO' ? (instructorAsignado || '') : ''}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-3 px-1 sm:px-1.5 text-center align-middle min-w-0">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenActivities(student)}
                                        className="inline-flex w-full min-w-0 max-w-full items-center justify-center gap-0.5 sm:gap-1 rounded-lg border border-gray-200 bg-gray-100 px-1.5 py-1 text-[8px] sm:text-[9px] font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-200 dark:border-coal-100 dark:bg-coal-300 dark:text-white dark:hover:bg-coal-400 uppercase"
                                    >
                                        <KeenIcon icon="book" className="shrink-0 text-xs sm:text-sm" />
                                        <span className="min-w-0 text-[7px] leading-tight sm:text-[8px]">ACTIVIDADES</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredStudents.length > 0 && totalPages > 1 && (
                <div className="flex flex-col xl:flex-row items-center justify-center mt-4 px-4 py-3 bg-white dark:bg-coal-300 border border-gray-200 dark:border-coal-100 rounded-xl shadow-sm gap-4">
                    <div className="flex flex-wrap justify-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 1 ? 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-coal-300 dark:text-gray-500' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-coal-400 dark:border-coal-100 dark:text-white dark:hover:bg-coal-500 shadow-sm'}`}
                        >
                            Anterior
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-coal-400 dark:border-coal-100 dark:text-white dark:hover:bg-coal-500 shadow-sm'}`}
                                        >
                                            {page}
                                        </button>
                                    );
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return <span key={page} className="px-1 text-gray-500">...</span>;
                                }
                                return null;
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === totalPages ? 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-coal-300 dark:text-gray-500' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-coal-400 dark:border-coal-100 dark:text-white dark:hover:bg-coal-500 shadow-sm'}`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}

            {filteredStudents.length === 0 && (
                <div className="text-center py-24 bg-gray-50 dark:bg-coal-100/20 rounded-2xl border-2 border-dashed border-gray-200 dark:border-coal-100">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-coal-300 mb-4 animate-bounce">
                        <KeenIcon icon="search" className="text-3xl text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-bold text-lg">No se encontraron aprendices</p>
                    <p className="text-gray-400 text-sm mt-1">Intenta con otros términos de búsqueda</p>
                </div>
            )}

            {/* Modal Mis Actividades */}
            {selectedStudent && (
                <ModalMisActividades
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    studentId={selectedStudent.matricula.person.id}
                    studentName={getFullName(selectedStudent)}
                    idMateria={selectedStudent.materia?.id || idMateria}
                    idFicha={idFicha}
                />
            )}
        </div>
    );
};

export default CalificacionesFichaView;
