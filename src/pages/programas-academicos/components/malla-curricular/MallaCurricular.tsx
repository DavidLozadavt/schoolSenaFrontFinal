import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MallaCurricularProps } from '../../types';
import AsignarMateria from './AsignarMateria';
import { AsignarTiposDocumentoModal } from '../documentos/AsignarTiposDocumentoModal';
import { VerDocumentosFichaModal } from '../documentos/VerDocumentosFichaModal';
import { Calendario } from './Calendario';
import { CardRap } from './CardRap';
import { Calendar, List, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';
import Select from "react-select";

export const MallaCurricular = ({ isOpen, onClose, program }: MallaCurricularProps) => {
  // Estados principales
  const [niveles, setNiveles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  
  // Estados de vista
  const [calendario, setCalendario] = useState<boolean>(false);
  const [selectedFicha, setSelectedFicha] = useState<any | null>(null);
  const [selectedFichaOption, setSelectedFichaOption] = useState<any>(null);
  
  // Estados de modales
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [selectedNivelId, setSelectedNivelId] = useState(); // grado(trimestre)
  const [asignarTiposFicha, setAsignarTiposFicha] = useState<any | null>(null);
  const [verDocsFicha, setVerDocsFicha] = useState<any | null>(null);
  
  // Estados de fichas
  const [fichas, setFichas] = useState<any[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);

  // Cargar configuración inicial
  useEffect(() => {
    if (isOpen && program?.id) {
      setLoading(false);
      setErrorApi(null);
    }
  }, [isOpen, program?.id]);

  // Cargar fichas del programa
  useEffect(() => {
    const fetchFichas = async () => {
      if (!isOpen || !program?.id) return;
      
      setLoadingFichas(true);
      try {
        const res = await axios.get(`fichas/programa/${program.id}`);
        if (Array.isArray(res.data?.data)) {
          setFichas(res.data.data);
        } else {
          setFichas([]);
        }
      } catch (error) {
        console.error('Error al cargar fichas');
        setFichas([]);
      } finally {
        setLoadingFichas(false);
      }
    };
    
    fetchFichas();
  }, [isOpen, program?.id]);

  // Funciones de utilidad
  const calcularProgreso = (fechaInicio: string, fechaFin: string): number => {
    const inicio = new Date(fechaInicio).getTime();
    const fin = new Date(fechaFin).getTime();
    const hoy = Date.now();

    if (hoy <= inicio) return 0;
    if (hoy >= fin) return 100;

    const total = fin - inicio;
    const transcurrido = hoy - inicio;

    return Math.round((transcurrido / total) * 100);
  };

  const formatearFecha = (fecha: Date): string => {
    return new Date(fecha).toISOString().split('T')[0];
  };

  // Funciones de manejo de datos
  const getDatosFicha = async (fichaId: number, option: any = null) => {
    if (!fichaId) {
      setNiveles([]);
      setSelectedFicha(null);
      setSelectedFichaOption(null);
      return;
    }

    try {
      setLoadingFichas(true);
      const response = await axios.get(`trimestres-ficha/${fichaId}`);
      setNiveles(response.data.data || []);
      
      const ficha = fichas.find(f => f.id === fichaId);
      setSelectedFicha(ficha || null);
      
      // Guardar la opción seleccionada para mantenerla visible
      if (option) {
        setSelectedFichaOption(option);
      }
    } catch (error) {
      console.error('Error al cargar trimestres:', error);
      setNiveles([]);
      setSelectedFicha(null);
      setSelectedFichaOption(null);
    } finally {
      setLoadingFichas(false);
    }
  };

  const agregarNivel = () => {
    const nuevoId = `${niveles.length + 1}`;
    setNiveles([
      ...niveles,
      {
        id: nuevoId,
        grado: {
          id: niveles.length + 1,
          numeroGrado: niveles.length + 1,
          estado: 'Nuevo'
        },
        materias: []
      }
    ]);
  };

  const quitarNivel = () => {
    if (niveles.length > 0) {
      setNiveles(niveles.slice(0, -1));
    }
  };

  const handleOpenMateria = (nivelId: any) => {
    setSelectedNivelId(nivelId);
    setIsMateriaModalOpen(true);
  };

  // Renderizado condicional
  if (!isOpen || !program) return null;

  // Opciones para el selector de fichas
  const fichaOptions = fichas.map((ficha) => ({
    value: ficha.id,
    label: `Ficha #${ficha.codigo} • ${formatearFecha(ficha.asignacion.fechaInicialClases)} - ${formatearFecha(ficha.asignacion.fechaFinalClases)} • Avance: ${ficha.porcentajeEjecucion}%`
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-coal-500/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-primary uppercase tracking-wider">Cargando...</span>
            </div>
          </div>
        )}

        {/* Header con Banner */}
        <div className="relative flex-shrink-0 w-full h-36 md:h-44 overflow-hidden">
          <img 
            src={program.imageUrl || '/default-banner.jpg'} 
            className="absolute inset-0 object-cover w-full h-full brightness-[0.4]" 
            alt="Banner del programa" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Botón cerrar */}
          <button 
            onClick={onClose} 
            className="absolute z-10 flex items-center justify-center w-9 h-9 text-white transition-all border rounded-full top-4 right-4 bg-white/10 hover:bg-danger backdrop-blur-md border-white/40 hover:scale-110"
            aria-label="Cerrar modal"
          >
            <i className="text-lg ki-outline ki-cross"></i>
          </button>

          {/* Información del programa */}
          <div className="absolute text-white bottom-5 left-6">
            <span className="px-3 py-1 text-xs font-extrabold tracking-wider uppercase bg-primary rounded-md mb-2 inline-block shadow-lg">
              {program.estado?.nombre || "SIN ESTADO"}
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-white drop-shadow-lg">
              {program.name || "Programa sin nombre"}
            </h2>
            <p className="mt-1.5 font-semibold tracking-wide text-gray-200 text-xs flex items-center gap-2">
              <BookOpen size={14} />
              Código: {program.codigo} • Malla Curricular
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-grow p-6 md:p-8 overflow-y-auto bg-gray-50 dark:bg-coal-600 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">

          {/* Mensaje de error */}
          {errorApi && (
            <div className="p-4 mb-6 border-l-4 border-danger bg-danger/10 rounded-lg text-danger flex items-center gap-3 animate-pulse">
              <AlertCircle size={20} />
              <span className="font-semibold text-sm">{errorApi}</span>
            </div>
          )}

          {!errorApi && (
            <>
              {/* Sección de Fichas */}
              <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <h4 className="text-lg font-black uppercase text-gray-800 dark:text-gray-100 border-l-4 border-primary pl-4">
                    Fichas del Programa
                  </h4>

                  {/* Controles de Trimestres */}
                  {selectedFicha && (
                    <div className="flex items-center gap-3 bg-white dark:bg-coal-400 px-4 py-2 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
                      <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Trimestres:</span>
                      <button
                        onClick={quitarNivel}
                        disabled={niveles.length === 0}
                        className="flex items-center justify-center w-9 h-9 transition-all border border-gray-300 rounded-lg bg-gray-50 dark:bg-coal-300 text-danger hover:bg-danger hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Quitar trimestre"
                      >
                        <i className="text-xl ki-outline ki-minus"></i>
                      </button>
                      <span className="text-sm font-bold text-primary min-w-[2rem] text-center">
                        {niveles.length}
                      </span>
                      <button
                        onClick={agregarNivel}
                        className="flex items-center justify-center w-9 h-9 text-white transition-all rounded-lg bg-primary hover:bg-primary-active shadow-md"
                        aria-label="Agregar trimestre"
                      >
                        <i className="text-xl ki-outline ki-plus"></i>
                      </button>
                    </div>
                  )}
                </div>

                {/* Selector de Fichas */}
                {loadingFichas ? (
                  <div className="flex justify-center py-8">
                    <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : fichas.length === 0 ? (
                  <div className="py-12 text-center bg-white dark:bg-coal-400 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <BookOpen size={48} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                      No hay fichas asignadas a este programa
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-6 bg-white dark:bg-coal-400 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-600">
                      <Select
                        options={fichaOptions}
                        value={selectedFichaOption}
                        placeholder="Selecciona una ficha para ver sus trimestres..."
                        onChange={(opcion) => {
                          if (opcion) {
                            setSelectedFichaOption(opcion)
                            getDatosFicha(opcion.value, opcion);
                          } else {
                            setNiveles([]);
                            setSelectedFicha(null);
                            setSelectedFichaOption(null);
                          }
                        }}
                        classNamePrefix="react-select"
                        isClearable
                      />
                    </div>

                    {/* Toggle Vista: Lista / Calendario */}
                    {selectedFicha && niveles.length > 0 && (
                      <div className="flex rounded-xl p-1.5 mb-6 bg-gray-100 dark:bg-coal-500 shadow-inner">
                        <button
                          onClick={() => setCalendario(false)}
                          className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                            !calendario
                              ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          <List size={18} />
                          Competencias (RAPs)
                        </button>
                        <button
                          onClick={() => setCalendario(true)}
                          className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                            calendario
                              ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md'
                              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                          }`}
                        >
                          <Calendar size={18} />
                          Calendario
                        </button>
                      </div>
                    )}

                    {/* Contenido Principal: Trimestres o Calendario */}
                    {selectedFicha && (
                      <div className="space-y-5">
                        {!calendario ? (
                          niveles.length > 0 ? (
                            [...niveles]
                              .sort((a, b) => a.grado.id - b.grado.id)
                              .map((nivel, index) => (
                                <div
                                  key={nivel.id}
                                  className="p-6 bg-white dark:bg-coal-300 border-2 border-gray-200 dark:border-gray-600 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:border-primary/50"
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                  {/* Header del Trimestre */}
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 pb-4 border-b-2 border-gray-100 dark:border-gray-600">
                                    <h3 className="text-2xl font-black text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                      <span className="text-primary">#{nivel.grado.numeroGrado || index + 1}</span>
                                      TRIMESTRE
                                    </h3>
                                    <span className={`mt-2 sm:mt-0 rounded-full 
                                      px-4 py-1.5 text-xs font-bold 
                                      ${nivel.grado.estado == 'FINALIZADO'? 'bg-green-100 dark:bg-green-900/30 text-greeg-600 dark:text-green-400'
                                        : nivel.grado.estado == 'EN CURSO'? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                        : nivel.grado.estado == 'CANCELADO' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        : ''
                                      }
                                      uppercase tracking-wide`}>
                                      {nivel.grado.estado || 'Sin estado'}
                                    </span>
                                  </div>

                                  {/* Estadísticas del Trimestre */}
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Inicio</p>
                                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                        {nivel.grado.fechaInicio? formatearFecha(nivel.grado.fechaInicio): '--:--:--'}
                                      </p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Fin</p>
                                      <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                        {nivel.grado.fechaFin? formatearFecha(nivel.grado.fechaFin) : '--:--:--'}
                                      </p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Competencias</p>
                                      <p className="font-bold text-primary text-sm">
                                        {nivel.materias?.length || 0}
                                      </p>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 dark:bg-coal-400 rounded-lg">
                                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Progreso</p>
                                      <p className="font-bold text-green-600 dark:text-green-400 text-sm flex items-center justify-center gap-1">
                                        <TrendingUp size={14} />
                                        {calcularProgreso(nivel.grado.fechaInicio, nivel.grado.fechaFin) || 0}%
                                      </p>
                                    </div>
                                  </div>

                                  {/* Competencias */}
                                  <div>
                                    <h4 className="text-sm font-black uppercase text-gray-700 dark:text-gray-200 border-l-4 border-primary pl-3 mb-4">
                                      Competencias Asignadas
                                    </h4>
                                    
                                    {nivel.materias && nivel.materias.length > 0 ? (
                                      <div className="space-y-3">
                                        {nivel.materias.map((materia: any) => (
                                          <CardRap key={materia.id} materia={materia} />
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 bg-gray-50 dark:bg-coal-400 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                          No hay competencias asignadas
                                        </p>
                                      </div>
                                    )}

                                    {/* Botón Agregar Competencia */}
                                    <button
                                      onClick={() => handleOpenMateria(nivel.id)}
                                      className="w-full py-3 mt-4 font-bold text-gray-600 dark:text-gray-300 uppercase transition-all border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg hover:border-primary hover:text-white hover:bg-primary text-sm hover:shadow-lg active:scale-95"
                                    >
                                      <i className="mr-2 ki-outline ki-plus"></i>
                                      Agregar Competencia
                                    </button>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                              <Calendar size={56} className="mx-auto text-gray-400 mb-4" />
                              <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
                                No hay trimestres configurados
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Utiliza los controles superiores para agregar trimestres
                              </p>
                            </div>
                          )
                        ) : (
                          <Calendario />
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 px-6 bg-white dark:bg-coal-400 border-t-2 border-gray-200 dark:border-gray-600 shadow-inner">
          <div className="items-center hidden sm:flex gap-2">
            <i className="text-base ki-outline ki-information-2 text-primary"></i>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {selectedFicha 
                ? `Ficha #${selectedFicha.codigo} seleccionada`
                : 'Selecciona una ficha para comenzar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary-active active:scale-95 transition-all shadow-lg hover:shadow-xl"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Modales */}
      <AsignarMateria
        isOpen={isMateriaModalOpen}
        onClose={() => setIsMateriaModalOpen(false)}
        nivelId={selectedNivelId}
      />

      <AsignarTiposDocumentoModal
        isOpen={!!asignarTiposFicha}
        onClose={() => setAsignarTiposFicha(null)}
        onSave={() => setAsignarTiposFicha(null)}
        ficha={asignarTiposFicha}
      />

      <VerDocumentosFichaModal
        isOpen={!!verDocsFicha}
        onClose={() => setVerDocsFicha(null)}
        ficha={verDocsFicha}
      />
    </div>
  );
};

export default MallaCurricular;