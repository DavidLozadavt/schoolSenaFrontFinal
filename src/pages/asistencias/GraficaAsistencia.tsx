import React, { useState } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';

interface GraficaAsistenciaProps {
    idMatricula: number;
}

interface AsistenciaData {
    countAsistencia?: number;
    countFaltas?: number;
    countAsistenciasJustificadas?: number;
    countTotalAsistencias?: number;
    aprendiz?: any;
    materiaStats?: any[];
    [key: string]: any;
}

const GraficaAsistencia: React.FC<GraficaAsistenciaProps> = ({ idMatricula }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [data, setData] = useState<AsistenciaData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const openModalAndFetchData = async () => {
        setIsModalOpen(true);
        if (!data) { // Solo si no ha cargado los datos previamente
            try {
                setLoading(true);
                const response = await axios.get(`estadisticas-estudiante?idMatricula=${idMatricula}`);
                setData(response.data);
                setError(false);
            } catch (err) {
                setError(true);
                console.error("Error al obtener estadísticas de asistencia para matrícula " + idMatricula, err);
            } finally {
                setLoading(false);
            }
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    // Cálculos para la gráfica si hay datos
    let asistencias = 0;
    let faltas = 0;
    let justificadas = 0;
    let total = 0;
    let porcentaje = 0;

    if (data) {
        asistencias = Number(data.countAsistencia || 0);
        faltas = Number(data.countFaltas || 0);
        justificadas = Number(data.countAsistenciasJustificadas || 0);

        // Asignar el total, protegiendo si el backend devuelve 0 en ese campo
        total = Number(data.countTotalAsistencias || 0);
        if (total < (asistencias + faltas + justificadas)) {
            total = asistencias + faltas + justificadas;
        }

        porcentaje = total > 0 ? Math.round((asistencias / total) * 100) : 0;
    }

    return (
        <>
            {/* Botón con el Ícono que abre el modal */}
            <button
                onClick={openModalAndFetchData}
                className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                title="Ver Asistencia"
            >
                <KeenIcon icon="chart-pie-simple" className="text-base" />
            </button>

            {/* Modal */}
            {isModalOpen && (
                <Modal open={true} onClose={closeModal}>
                    <ModalContent className="max-w-[900px] top-[5%] p-4">
                        <ModalHeader>
                            <ModalTitle className="flex items-center gap-2">
                                <KeenIcon icon="chart-line-up" className="text-blue-600" />
                                Estadísticas de Asistencia
                            </ModalTitle>
                            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={closeModal}>
                                <KeenIcon icon="cross" />
                            </button>
                        </ModalHeader>

                        <ModalBody className="grid gap-5 py-5 text-sm text-gray-700 font-medium">
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : error || !data ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <KeenIcon icon="information-2" className="text-4xl mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No se pudieron cargar los datos de asistencia.</p>
                                </div>
                            ) : (
                                <>
                                    {/* Resumen en Bloques (Estilo visual similar al de la imagen) */}
                                    <div className="text-center mb-6">
                                        <h4 className="text-gray-600 dark:text-gray-300 font-medium mb-4">
                                            Asistencias del rap
                                        </h4>
                                        <div className="flex justify-around items-center flex-wrap gap-4">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-700 dark:text-gray-300 mb-2">Asistencias</span>
                                                <div className="bg-green-700 text-white rounded-md px-6 py-1 font-bold text-lg shadow-sm border border-green-800">
                                                    {asistencias}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-700 dark:text-gray-300 mb-2">Faltas</span>
                                                <div className="bg-red-800 text-white rounded-md px-6 py-1 font-bold text-lg shadow-sm border border-red-900">
                                                    {faltas}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-700 dark:text-gray-300 mb-2 text-center w-24">Faltas<br />justificadas</span>
                                                <div className="bg-yellow-600 text-white rounded-md px-6 py-1 font-bold text-lg shadow-sm border border-yellow-700">
                                                    {justificadas}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center">
                                                <span className="text-xs text-gray-700 dark:text-gray-300 mb-2 text-center w-24">Total de<br />asistencias</span>
                                                <div className="bg-gray-800 text-white rounded-md px-6 py-1 font-bold text-lg shadow-sm border border-gray-900">
                                                    {total}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sección de la "Gráfica de Líneas" en HTML/SVG Pura */}
                                    <div className="mt-8">
                                        <h4 className="text-center text-gray-800 dark:text-white font-bold mb-4 text-base">
                                            Estadísticas de Asistencia por Materia
                                        </h4>
                                        <div className="text-xs text-gray-500 mb-4 ml-4">Información de faltas y retrasos</div>

                                        {/* Leyenda */}
                                        <div className="flex gap-4 ml-4 mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-3 border border-red-500 bg-red-100"></div>
                                                <span className="text-xs text-gray-600">Faltas</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-3 border border-yellow-500 bg-yellow-100"></div>
                                                <span className="text-xs text-gray-600">Retrasos</span>
                                            </div>
                                        </div>

                                        {/* Canvas Falso SVG Dinámico */}
                                        <div className="relative w-full h-[300px] bg-transparent pb-12">
                                            {(() => {
                                                const stats = data.materiaStats || [];
                                                if (stats.length === 0) {
                                                    return (
                                                        <div className="w-full h-full flex justify-center items-center text-gray-400 text-sm">
                                                            No hay estadísticas por materia disponibles
                                                        </div>
                                                    );
                                                }

                                                // Cálculos de escalas
                                                const maxY = Math.max(
                                                    10, // Mínimo 10 en Y para que no se vea vacío
                                                    ...stats.map(s => s.faltas || 0),
                                                    ...stats.map(s => s.retrasos || 0)
                                                );

                                                // Calculamos intervalos y para las 8 líneas horizontales
                                                const stepY = Math.ceil(maxY / 8);
                                                const adjustedMaxY = stepY * 8; // Nuevo máximo ajustado para cuadrar líneas perfectamente

                                                // Posiciones X distribuidas
                                                const getX = (index: number) => {
                                                    const padding = 10; // 10% de inicio
                                                    const usable = 80;   // 80% usables hasta el final
                                                    if (stats.length === 1) return 50; // Centrado si es uno
                                                    return padding + (usable / (stats.length - 1)) * index;
                                                };

                                                const getY = (value: number) => {
                                                    // Invertir (porque Y=0 es arriba en SVG)
                                                    return 100 - (value / adjustedMaxY) * 100;
                                                };

                                                // Generamos los string de puntos (points)
                                                const pointsFaltas = stats.map((s, i) => `${getX(i)}%,${getY(s.faltas || 0)}%`).join(' ');
                                                const pointsRetrasos = stats.map((s, i) => `${getX(i)}%,${getY(s.retrasos || 0)}%`).join(' ');

                                                return (
                                                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                                        {/* Líneas Horizontales y Etiquetas Eje Y */}
                                                        {[...Array(9)].map((_, i) => {
                                                            const value = adjustedMaxY - (i * stepY);
                                                            const yPos = (i * 12.5);
                                                            return (
                                                                <g key={`grid-h-${i}`}>
                                                                    <line x1="10%" y1={`${yPos}%`} x2="100%" y2={`${yPos}%`} stroke="#e5e7eb" strokeWidth="1" />
                                                                    <text x="8%" y={`${yPos}%`} fill="#6b7280" fontSize="10" textAnchor="end" alignmentBaseline="middle">
                                                                        {value}
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}

                                                        {/* Líneas Verticales Malla */}
                                                        {stats.map((_, i) => (
                                                            <line key={`grid-v-${i}`} x1={`${getX(i)}%`} y1="0%" x2={`${getX(i)}%`} y2="100%" stroke="#e5e7eb" strokeWidth="1" />
                                                        ))}

                                                        {/* DATA: Linea de Faltas (Roja) */}
                                                        {stats.length > 1 && (
                                                            <polyline
                                                                fill="none"
                                                                stroke="#ff4d4d"
                                                                strokeWidth="2"
                                                                points={pointsFaltas}
                                                            />
                                                        )}
                                                        {/* DATA: Linea de Retrasos (Amarilla) */}
                                                        {stats.length > 1 && (
                                                            <polyline
                                                                fill="none"
                                                                stroke="#fbbf24"
                                                                strokeWidth="2"
                                                                points={pointsRetrasos}
                                                            />
                                                        )}

                                                        {/* Puntos de Círculos e Eje X Dinámico */}
                                                        {stats.map((s, i) => {
                                                            const xPos = getX(i);
                                                            const yFaltas = getY(s.faltas || 0);
                                                            const yRetrasos = getY(s.retrasos || 0);

                                                            let nombreCorto = s.nombreMateria || `Materia ${i + 1}`;
                                                            if (nombreCorto.length > 15) {
                                                                nombreCorto = nombreCorto.substring(0, 15) + '...';
                                                            }

                                                            return (
                                                                <g key={`points-${i}`}>
                                                                    <circle cx={`${xPos}%`} cy={`${yFaltas}%`} r="5" fill="white" stroke="#ff4d4d" strokeWidth="2" />
                                                                    <circle cx={`${xPos}%`} cy={`${yRetrasos}%`} r="5" fill="white" stroke="#fbbf24" strokeWidth="2" />

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

                        <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                        </div>
                    </ModalContent>
                </Modal>
            )}
        </>
    );
};

export default GraficaAsistencia;
