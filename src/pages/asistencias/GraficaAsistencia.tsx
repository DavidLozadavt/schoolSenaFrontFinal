import React, { useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';

interface GraficaAsistenciaProps {
    idMatricula: number;
}

interface JustificacionDetalle {
    idJustificacion?: number;
    idAsistencia?: number;
    idMateria?: number;
    nombreMateria?: string;
    fecha?: string | null;
    numeroSesion?: number | null;
    estado?: string | null;
    observacion?: string | null;
    archivoSoporte?: string | null;
    archivoSoporteUrl?: string | null;
    excusa?: {
        id?: number | null;
        tipoExcusa?: string | null;
        observacion?: string | null;
        fechaInicialJustificacion?: string | null;
        fechaFinalJustificacion?: string | null;
    };
}

interface MateriaStat {
    idMateria?: number;
    nombreMateria?: string;
    faltas?: number;
    faltasTotales?: number;
    justificadas?: number;
    retrasos?: number;
}

interface AsistenciaData {
    countAsistencia?: number;
    countFaltas?: number;
    countAsistenciasJustificadas?: number;
    countTotalAsistencias?: number;
    aprendiz?: any;
    materiaStats?: MateriaStat[];
    justificaciones?: JustificacionDetalle[];
    [key: string]: any;
}

const GraficaAsistencia: React.FC<GraficaAsistenciaProps> = ({ idMatricula }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showJustificaciones, setShowJustificaciones] = useState(false);
    const [data, setData] = useState<AsistenciaData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [loadingArchivoId, setLoadingArchivoId] = useState<string | number | null>(null);

    const openModalAndFetchData = async () => {
        setIsModalOpen(true);

        try {
            setLoading(true);
            const response = await axios.get(`estadisticas-estudiante?idMatricula=${idMatricula}`);
            setData(response.data);
            setError(false);
        } catch (err) {
            setError(true);
            console.error('Error al obtener estadísticas de asistencia para matrícula ' + idMatricula, err);
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setShowJustificaciones(false);
        setLoadingArchivoId(null);
    };

    const formatDate = (date?: string | null) => {
        if (!date) return 'Sin fecha';

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return date;
        }

        return parsedDate.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const getJustificacionKey = (item: JustificacionDetalle, index: number) => {
        return item.idJustificacion ?? item.idAsistencia ?? index;
    };

    const abrirArchivoSoporte = async (item: JustificacionDetalle, index: number) => {
        const archivoUrl = item.archivoSoporteUrl;
        const key = getJustificacionKey(item, index);

        if (!archivoUrl) {
            alert('Esta justificación no tiene archivo soporte.');
            return;
        }

        const nuevaVentana = window.open('', '_blank');

        try {
            setLoadingArchivoId(key);

            const response = await axios.get(archivoUrl, {
                responseType: 'blob',
            });

            const contentType = response.headers['content-type'] || 'application/octet-stream';

            const blob = new Blob([response.data], {
                type: contentType,
            });

            const blobUrl = URL.createObjectURL(blob);

            if (nuevaVentana) {
                nuevaVentana.location.href = blobUrl;
            } else {
                window.open(blobUrl, '_blank', 'noopener,noreferrer');
            }

            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 60000);
        } catch (err) {
            console.error('Error al abrir el archivo soporte', err);

            if (nuevaVentana) {
                nuevaVentana.close();
            }

            alert('No se pudo abrir el archivo soporte. Verifica que el archivo exista y que el endpoint esté funcionando.');
        } finally {
            setLoadingArchivoId(null);
        }
    };

    let asistencias = 0;
    let faltas = 0;
    let justificadas = 0;
    let total = 0;
    let porcentaje = 0;

    if (data) {
        asistencias = Number(data.countAsistencia || 0);
        faltas = Number(data.countFaltas || 0);
        justificadas = Number(data.countAsistenciasJustificadas || 0);
        total = Number(data.countTotalAsistencias || 0);

        if (total < asistencias + faltas + justificadas) {
            total = asistencias + faltas + justificadas;
        }

        porcentaje = total > 0 ? Math.round((asistencias / total) * 100) : 0;
    }

    const justificacionesDetalle = data?.justificaciones || [];

    return (
        <>
            <button
                type="button"
                onClick={openModalAndFetchData}
                className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                title="Ver Asistencia"
            >
                <KeenIcon icon="chart-pie-simple" className="text-base" />
            </button>

            {isModalOpen && (
                <Modal open={true} onClose={closeModal}>
                    <ModalContent className="max-w-[1050px] top-[5%] p-4">
                        <ModalHeader>
                            <ModalTitle className="flex items-center gap-2">
                                <KeenIcon icon="chart-line-up" className="text-blue-600" />
                                Estadísticas de Asistencia
                            </ModalTitle>

                            <button
                                type="button"
                                className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
                                onClick={closeModal}
                            >
                                <KeenIcon icon="cross" />
                            </button>
                        </ModalHeader>

                        <ModalBody className="grid gap-5 py-5 text-sm text-gray-700 font-medium">
                            {loading ? (
                                <div className="flex justify-center items-center py-10">
                                    <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
                                </div>
                            ) : error || !data ? (
                                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    <KeenIcon icon="information-2" className="text-4xl mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No se pudieron cargar los datos de asistencia.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                        <h4 className="text-center text-gray-700 dark:text-gray-200 font-semibold mb-5">
                                            Asistencias del aprendiz
                                        </h4>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex flex-col items-center rounded-lg border border-green-200 bg-green-50 p-4">
                                                <span className="text-xs text-gray-600 mb-2">Asistencias</span>
                                                <div className="bg-green-700 text-white rounded-md px-6 py-1 font-bold text-lg shadow-sm border border-green-800">
                                                    {asistencias}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center rounded-lg border border-red-200 bg-red-50 p-4">
                                                <span className="text-xs text-gray-600 mb-2">Faltas</span>
                                                <div className="bg-red-800 text-white rounded-md px-6 py-1 font-bold text-lg shadow-sm border border-red-900">
                                                    {faltas}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                                                <span className="text-xs text-gray-600 mb-2 text-center">
                                                    Faltas justificadas
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (justificadas > 0) {
                                                            setShowJustificaciones((prev) => !prev);
                                                        }
                                                    }}
                                                    disabled={justificadas === 0}
                                                    title={
                                                        justificadas > 0
                                                            ? 'Ver detalle de faltas justificadas'
                                                            : 'No hay faltas justificadas'
                                                    }
                                                    className={`rounded-md px-6 py-1 text-lg font-bold text-white shadow-sm border transition-all ${
                                                        justificadas > 0
                                                            ? 'bg-yellow-600 border-yellow-700 hover:bg-yellow-700 hover:scale-105 cursor-pointer'
                                                            : 'bg-yellow-500 border-yellow-600 opacity-70 cursor-not-allowed'
                                                    }`}
                                                >
                                                    {justificadas}
                                                </button>

                                                {justificadas > 0 && (
                                                    <span className="mt-2 text-[11px] text-yellow-700">
                                                        Clic para ver detalle
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col items-center rounded-lg border border-gray-200 bg-gray-50 p-4">
                                                <span className="text-xs text-gray-600 mb-2 text-center">
                                                    Total asistencias
                                                </span>
                                                <div className="bg-gray-800 text-white rounded-md px-6 py-1 font-bold text-lg shadow-sm border border-gray-900">
                                                    {total}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                <span>Porcentaje de asistencia</span>
                                                <span>{porcentaje}%</span>
                                            </div>
                                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-green-600 transition-all"
                                                    style={{ width: `${porcentaje}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {showJustificaciones && (
                                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                                            <div className="flex items-center justify-between gap-3 mb-4">
                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <KeenIcon icon="notepad" className="text-yellow-700" />
                                                    Detalle de faltas justificadas
                                                </h4>

                                                <button
                                                    type="button"
                                                    onClick={() => setShowJustificaciones(false)}
                                                    className="rounded-md border border-yellow-300 bg-white px-3 py-1 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 transition-colors"
                                                >
                                                    Ocultar
                                                </button>
                                            </div>

                                            {justificacionesDetalle.length === 0 ? (
                                                <div className="rounded-lg border border-gray-200 bg-white py-8 text-center text-gray-500">
                                                    No hay detalle de justificaciones disponible.
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                                                    <table className="min-w-full text-xs">
                                                        <thead className="bg-gray-100 text-gray-700">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left font-bold">Fecha</th>
                                                                <th className="px-4 py-3 text-left font-bold">Sesión</th>
                                                                <th className="px-4 py-3 text-left font-bold">Materia</th>
                                                                <th className="px-4 py-3 text-left font-bold">Tipo excusa</th>
                                                                <th className="px-4 py-3 text-left font-bold">Observación</th>
                                                                <th className="px-4 py-3 text-center font-bold">Soporte</th>
                                                            </tr>
                                                        </thead>

                                                        <tbody className="divide-y divide-gray-100">
                                                            {justificacionesDetalle.map((item, index) => {
                                                                const soporteUrl = item.archivoSoporteUrl;
                                                                const key = getJustificacionKey(item, index);
                                                                const isOpening = loadingArchivoId === key;

                                                                return (
                                                                    <tr
                                                                        key={key}
                                                                        className="hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                                                            {formatDate(item.fecha)}
                                                                        </td>

                                                                        <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                                                                            {item.numeroSesion || 'N/A'}
                                                                        </td>

                                                                        <td className="px-4 py-3 text-gray-700">
                                                                            {item.nombreMateria || 'SIN MATERIA'}
                                                                        </td>

                                                                        <td className="px-4 py-3 text-gray-700">
                                                                            <span className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700 border border-blue-100">
                                                                                {item.excusa?.tipoExcusa || 'Sin tipo'}
                                                                            </span>
                                                                        </td>

                                                                        <td className="px-4 py-3 text-gray-600 max-w-[320px]">
                                                                            <div className="max-h-16 overflow-hidden leading-5">
                                                                                {item.observacion ||
                                                                                    item.excusa?.observacion ||
                                                                                    'Sin observación'}
                                                                            </div>
                                                                        </td>

                                                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                                            {soporteUrl ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => abrirArchivoSoporte(item, index)}
                                                                                    disabled={isOpening}
                                                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                                                                                        isOpening
                                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-wait'
                                                                                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800'
                                                                                    }`}
                                                                                >
                                                                                    {isOpening ? (
                                                                                        <>
                                                                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"></span>
                                                                                            Abriendo...
                                                                                        </>
                                                                                    ) : (
                                                                                        <>
                                                                                            <KeenIcon icon="document" className="text-sm" />
                                                                                            Ver archivo
                                                                                        </>
                                                                                    )}
                                                                                </button>
                                                                            ) : (
                                                                                <span className="inline-flex rounded-md bg-gray-100 px-3 py-1.5 text-xs text-gray-400 border border-gray-200">
                                                                                    Sin archivo
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                                        <h4 className="text-center text-gray-800 dark:text-white font-bold mb-4 text-base">
                                            Estadísticas de Asistencia por Materia
                                        </h4>

                                        <div className="text-xs text-gray-500 mb-4">
                                            Información de faltas y retrasos
                                        </div>

                                        <div className="flex gap-4 mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-3 border border-red-500 bg-red-100"></div>
                                                <span className="text-xs text-gray-600">Faltas</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-3 border border-yellow-500 bg-yellow-100"></div>
                                                <span className="text-xs text-gray-600">Retrasos</span>
                                            </div>
                                        </div>

                                        <div className="relative w-full h-[300px] bg-transparent pb-12">
                                            {(() => {
                                                const stats = data.materiaStats || [];

                                                if (stats.length === 0) {
                                                    return (
                                                        <div className="w-full h-full flex justify-center items-center text-gray-400 text-sm">
                                                            No hay estadísticas por materia disponibles.
                                                        </div>
                                                    );
                                                }

                                                const maxY = Math.max(
                                                    10,
                                                    ...stats.map((s) => Number(s.faltas || 0)),
                                                    ...stats.map((s) => Number(s.retrasos || 0))
                                                );

                                                const stepY = Math.ceil(maxY / 8);
                                                const adjustedMaxY = stepY * 8;

                                                const getX = (index: number) => {
                                                    const padding = 10;
                                                    const usable = 80;

                                                    if (stats.length === 1) return 50;

                                                    return padding + (usable / (stats.length - 1)) * index;
                                                };

                                                const getY = (value: number) => {
                                                    return 100 - (value / adjustedMaxY) * 100;
                                                };

                                                const pointsFaltas = stats
                                                    .map((s, i) => `${getX(i)}%,${getY(Number(s.faltas || 0))}%`)
                                                    .join(' ');

                                                const pointsRetrasos = stats
                                                    .map((s, i) => `${getX(i)}%,${getY(Number(s.retrasos || 0))}%`)
                                                    .join(' ');

                                                return (
                                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                                        {[...Array(9)].map((_, i) => {
                                                            const value = adjustedMaxY - i * stepY;
                                                            const yPos = i * 12.5;

                                                            return (
                                                                <g key={`grid-h-${i}`}>
                                                                    <line
                                                                        x1="10%"
                                                                        y1={`${yPos}%`}
                                                                        x2="100%"
                                                                        y2={`${yPos}%`}
                                                                        stroke="#e5e7eb"
                                                                        strokeWidth="1"
                                                                    />
                                                                    <text
                                                                        x="8%"
                                                                        y={`${yPos}%`}
                                                                        fill="#6b7280"
                                                                        fontSize="10"
                                                                        textAnchor="end"
                                                                        alignmentBaseline="middle"
                                                                    >
                                                                        {value}
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}

                                                        {stats.map((_, i) => (
                                                            <line
                                                                key={`grid-v-${i}`}
                                                                x1={`${getX(i)}%`}
                                                                y1="0%"
                                                                x2={`${getX(i)}%`}
                                                                y2="100%"
                                                                stroke="#e5e7eb"
                                                                strokeWidth="1"
                                                            />
                                                        ))}

                                                        {stats.length > 1 && (
                                                            <polyline
                                                                fill="none"
                                                                stroke="#ff4d4d"
                                                                strokeWidth="2"
                                                                points={pointsFaltas}
                                                            />
                                                        )}

                                                        {stats.length > 1 && (
                                                            <polyline
                                                                fill="none"
                                                                stroke="#fbbf24"
                                                                strokeWidth="2"
                                                                points={pointsRetrasos}
                                                            />
                                                        )}

                                                        {stats.map((s, i) => {
                                                            const xPos = getX(i);
                                                            const yFaltas = getY(Number(s.faltas || 0));
                                                            const yRetrasos = getY(Number(s.retrasos || 0));

                                                            let nombreCorto = s.nombreMateria || `Materia ${i + 1}`;

                                                            if (nombreCorto.length > 15) {
                                                                nombreCorto = nombreCorto.substring(0, 15) + '...';
                                                            }

                                                            return (
                                                                <g key={`points-${i}`}>
                                                                    <circle
                                                                        cx={`${xPos}%`}
                                                                        cy={`${yFaltas}%`}
                                                                        r="5"
                                                                        fill="white"
                                                                        stroke="#ff4d4d"
                                                                        strokeWidth="2"
                                                                    />

                                                                    <circle
                                                                        cx={`${xPos}%`}
                                                                        cy={`${yRetrasos}%`}
                                                                        r="5"
                                                                        fill="white"
                                                                        stroke="#fbbf24"
                                                                        strokeWidth="2"
                                                                    />

                                                                    <text
                                                                        x={`${xPos}%`}
                                                                        y="105%"
                                                                        fill="#6b7280"
                                                                        fontSize="10"
                                                                        transform={`rotate(-45, ${xPos}%, 105%)`}
                                                                        textAnchor="end"
                                                                    >
                                                                        {nombreCorto}
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}
                                                    </svg>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </>
                            )}
                        </ModalBody>

                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200"></div>
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};

export default GraficaAsistencia;