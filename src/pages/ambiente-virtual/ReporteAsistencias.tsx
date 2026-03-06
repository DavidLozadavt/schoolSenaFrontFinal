import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';

interface AreaData {
  idArea: number;
  nombreArea: string;
  asistencias: number;
  inasistencias: number;
  total: number;
  porcentaje: number;
}

interface RegistroDetallado {
  fecha: string;
  idArea: number;
  nombreArea: string;
  asistio: boolean;
  estado: string;
}

interface ResumenData {
  asistenciaGeneral: number;
  totalAsistencias: number;
  totalInasistencias: number;
  totalRegistros: number;
}

interface ReporteAsistenciasProps {
  onVolver: () => void;
}

const ReporteAsistencias: React.FC<ReporteAsistenciasProps> = ({ onVolver }) => {
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [registros, setRegistros] = useState<RegistroDetallado[]>([]);
  const [resumen, setResumen] = useState<ResumenData>({
    asistenciaGeneral: 0,
    totalAsistencias: 0,
    totalInasistencias: 0,
    totalRegistros: 0
  });
  const [areaSeleccionada, setAreaSeleccionada] = useState<number | null>(null);

  useEffect(() => {
    fetchAsistencias();
  }, []);

  const fetchAsistencias = async () => {
    try {
      setLoading(true);
      const response = await axios.get('asistencias-por-area');
      const data = response.data?.data || {};
      
      setAreas(data.areas || []);
      setRegistros(data.registros || []);
      setResumen(data.resumen || {
        asistenciaGeneral: 0,
        totalAsistencias: 0,
        totalInasistencias: 0,
        totalRegistros: 0
      });
    } catch (error) {
      console.error('Error al obtener asistencias:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fechaStr: string): string => {
    if (!fechaStr) return '';
    
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha.getTime())) {
        return fechaStr;
      }
      
      const meses = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
      ];
      
      const diasSemana = [
        'dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'
      ];
      
      return `${diasSemana[fecha.getDay()]}, ${fecha.getDate()} ${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
    } catch (error) {
      return fechaStr;
    }
  };

  const registrosFiltrados = areaSeleccionada 
    ? registros.filter(r => r.idArea === areaSeleccionada)
    : registros;

  const resumenFiltrado = useMemo<ResumenData>(() => {
    if (areaSeleccionada === null) {
      return resumen;
    }

    const totalAsistencias = registrosFiltrados.filter((registro) => registro.asistio).length;
    const totalInasistencias = registrosFiltrados.filter((registro) => !registro.asistio).length;
    const totalRegistros = registrosFiltrados.length;

    return {
      asistenciaGeneral:
        totalRegistros > 0 ? Math.round((totalAsistencias / totalRegistros) * 100) : 0,
      totalAsistencias,
      totalInasistencias,
      totalRegistros
    };
  }, [areaSeleccionada, registrosFiltrados, resumen]);

  const areasUnicas = [
    { id: null, nombre: 'Todas las áreas' },
    ...areas.map(a => ({ id: a.idArea, nombre: a.nombreArea }))
  ];

  return (
    <>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <button 
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-transparent hover:bg-gray-100 dark:hover:bg-coal-300 rounded-lg px-2 py-1.5 -ml-2 mb-3"
                onClick={onVolver}
                title="Volver a clases"
              >
                <KeenIcon icon="arrow-left" className="text-sm" />
                <span className="text-sm font-medium">Volver a clases</span>
              </button>
              <div className="flex items-center gap-2">
                <KeenIcon icon="chart-line-up" className="text-blue-600 dark:text-blue-400" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Control de Asistencia</h1>
              </div>
              <ToolbarDescription>Registro detallado de asistencias e inasistencias por área</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Tabs de filtro por área */}
              <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-200 dark:border-gray-700 pb-3">
                {areasUnicas.map((area) => {
                  const isSelected = areaSeleccionada === area.id || (areaSeleccionada === null && area.id === null);
                  return (
                    <button
                      key={area.id ?? 'todas'}
                      onClick={() => setAreaSeleccionada(area.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-2 border-blue-500 dark:border-blue-400'
                          : 'bg-gray-100 dark:bg-coal-300 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-coal-200 border-2 border-transparent'
                      }`}
                    >
                      {area.nombre}
                    </button>
                  );
                })}
              </div>

              {/* Tarjetas de resumen */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="chart-pie-simple" className="text-blue-600 dark:text-blue-400 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Asistencia General</p>
                      <p className="text-base font-bold text-blue-600 dark:text-blue-400">{resumenFiltrado.asistenciaGeneral}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="check" className="text-green-700 dark:text-green-500 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Asistencias</p>
                      <p className="text-base font-bold text-green-700 dark:text-green-500">{resumenFiltrado.totalAsistencias}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="cross" className="text-red-700 dark:text-red-500 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Inasistencias</p>
                      <p className="text-base font-bold text-red-700 dark:text-red-500">{resumenFiltrado.totalInasistencias}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <KeenIcon icon="calendar" className="text-gray-600 dark:text-gray-400 text-base" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Registros</p>
                      <p className="text-base font-bold text-gray-600 dark:text-gray-400">{resumenFiltrado.totalRegistros}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2.5">
                  Registro Detallado
                </h3>
                <div className="bg-white dark:bg-coal-400 rounded-lg shadow-md border border-gray-200 dark:border-gray-600 overflow-hidden">
                  <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-coal-300 sticky top-0 z-10">
                        <tr>
                          <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            FECHA
                          </th>
                          <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            ÁREA
                          </th>
                          <th className="px-2.5 py-2 text-left text-[10px] font-semibold text-gray-700 dark:text-gray-300 uppercase">
                            ESTADO
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {registrosFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-2.5 py-7 text-center text-xs text-gray-500 dark:text-gray-400">
                              No hay registros disponibles
                            </td>
                          </tr>
                        ) : (
                          registrosFiltrados.map((registro, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-coal-300">
                              <td className="px-2.5 py-2 text-[12px] text-gray-900 dark:text-white whitespace-nowrap">
                                {formatearFecha(registro.fecha)}
                              </td>
                              <td className="px-2.5 py-2 text-[12px] text-gray-700 dark:text-gray-300">
                                {registro.nombreArea}
                              </td>
                              <td className="px-2.5 py-2 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${
                                  registro.asistio
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {registro.asistio ? (
                                    <>
                                      <KeenIcon icon="check" className="text-[10px]" />
                                      Presente
                                    </>
                                  ) : (
                                    <>
                                      <KeenIcon icon="cross" className="text-[10px]" />
                                      Ausente
                                    </>
                                  )}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Container>
    </>
  );
};

export default ReporteAsistencias;
