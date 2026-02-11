import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MallaCurricularProps } from '../../types';
import { AlertCircle, BookOpen, Calendar, List, Search } from 'lucide-react';
import Select from "react-select";

// Componentes separados
import { CardTrimestre } from './CardTrimestre';
import { FormNuevoTrimestre } from './FormNuevoTrimestre';
import { Calendario } from './Calendario';
import { AsignarMateria } from './AsignarMateria';
import { ListaRaps } from './ListaRaps';

// Hook personalizado
import { useTrimestres } from './UseTrimestres';
import Toast from '../Toast';
import { useAuthContext } from '@/auth';

const formatearFecha = (fecha: Date): string => {
  return new Date(fecha).toISOString().split('T')[0];
};

export const MallaCurricular = ({ isOpen, onClose, program,  }: MallaCurricularProps) => {
  // Estados de fichas
  const [fichas, setFichas] = useState<any[]>([]);
  const [loadingFichas, setLoadingFichas] = useState(false);
  const [selectedFicha, setSelectedFicha] = useState<any | null>(null);
  const [selectedFichaOption, setSelectedFichaOption] = useState<any>(null);
  const { user } = useAuthContext();
  
  // Estados de vista
  const [vistaCalendario, setVistaCalendario] = useState(false);
  const [errorApi, setErrorApi] = useState<string | null>(null);
  
  // Estados de modales
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [selectedNivelId, setSelectedNivelId] = useState<number|null>(null);

  // Estados para modal de RAPs - NUEVO
  const [isRapsModalOpen, setIsRapsModalOpen] = useState(false);
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | null>(null);
  const [selectedCompetenciaNombre, setSelectedCompetenciaNombre] = useState<string>('');

  // Hook de trimestres
  const {
    trimestres,
    nuevoTrimestre,
    guardandoTrimestre,
    cargarTrimestres,
    agregarNuevoTrimestre,
    cancelarNuevoTrimestre,
    actualizarFechaFin,
    actualizarMaterias,
    crearTrimestre,
    asignarCompetenciasTrimestre,
    toast,
    setToast,
    loadingTrimestres
  } = useTrimestres(selectedFicha?.id, program?.id);

  // Cargar fichas cuando se abre el modal
  useEffect(() => {
    const cargarFichas = async () => {
      if (!isOpen || !program?.id) return;
      
      setSelectedFicha(null);
      setSelectedFichaOption(null);
      setLoadingFichas(true);
      try {
        const res = await axios.get(`fichas/programa/${program.id}/${user?.idCentroFormacion}`);
        if (Array.isArray(res.data?.data)) {
          setFichas(res.data.data);
        } else {
          setFichas([]);
        }
      } catch (error) {
        setFichas([]);
      } finally {
        setLoadingFichas(false);
      }
    };
    
    if (isOpen && program?.id) {
      cargarFichas();
      setErrorApi(null);
    }
  }, [isOpen, program?.id]);

  // Handlers
  const handleSeleccionarFicha = (opcion: any) => {
    if (opcion) {
      setSelectedFichaOption(opcion);
      const ficha = fichas.find(f => f.id === opcion.value);
      setSelectedFicha(ficha || null);
      cargarTrimestres(opcion.value);
    } else {
      setSelectedFichaOption(null);
      setSelectedFicha(null);
    }
  };

  const handleAgregarTrimestre = () => {
    agregarNuevoTrimestre(selectedFicha);
  };

  const handleOpenMateriaFromTrimestre = (nivelId: any) => {
    setSelectedNivelId(nivelId);
    setIsMateriaModalOpen(true);
  };

  const handleOpenMateriaFromNuevoTrimestre = () => {
    setIsMateriaModalOpen(true);
  };

  const handleMateriasSeleccionadas = async (data: { 
    idGradoPrograma: number; 
    materias: any[] 
  }) => {
    if (nuevoTrimestre) {
      actualizarMaterias(data.materias);
    } else if (selectedFicha?.id) {
      const success = await asignarCompetenciasTrimestre(data.idGradoPrograma, data.materias, selectedFicha.id);
      if (success) {
        await cargarTrimestres(selectedFicha.id);
        setIsMateriaModalOpen(false);
      }
    }
  };


const handleGuardarTrimestre = async () => {
  if (!selectedFicha) {
    alert('Debes seleccionar una ficha');
    return;
  }
  
  const success = await crearTrimestre(selectedFicha);
  if (success) {
    await cargarTrimestres(selectedFicha.id);
  }
};

  // para abrir modal de RAPs
  const handleOpenRaps = (competenciaId: number, competenciaNombre: string) => {
    setSelectedCompetenciaId(competenciaId);
    setSelectedCompetenciaNombre(competenciaNombre);
    setIsRapsModalOpen(true);
  };

  if (!isOpen || !program) return null;

  const fichaOptions = fichas.map((ficha) => ({
    value: ficha.id,
    label: `Ficha #${ficha.codigo} • ${formatearFecha(ficha.asignacion.fechaInicialClases)} - ${formatearFecha(ficha.asignacion.fechaFinalClases)} • Avance: ${ficha.porcentajeEjecucion}%`
  }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-x-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Header con Banner */}
        <div className="relative flex-shrink-0 w-full h-36 overflow-hidden">
          <img 
            src={program.imageUrl || '/default-banner.jpg'} 
            className="absolute inset-0 object-cover w-full h-full brightness-[0.4]" 
            alt="Banner del programa" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <button 
            onClick={onClose} 
            className="absolute z-10 flex items-center justify-center w-9 h-9 text-white transition-all border rounded-full top-4 right-4 bg-white/10 hover:bg-danger backdrop-blur-md border-white/40 hover:scale-110"
            aria-label="Cerrar modal"
          >
            <i className="text-lg ki-outline ki-cross"></i>
          </button>

          <div className="absolute text-white bottom-5 left-6">
            <span className="px-3 py-1 text-xs font-extrabold tracking-wider uppercase bg-primary rounded-md mb-2 inline-block shadow-lg">
              {program.estado?.nombre || "SIN ESTADO"}
            </span>
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-white drop-shadow-lg">
              {program.name || "Programa sin nombre"}
            </h2>
            <p className="mt-1.5 font-semibold tracking-wide text-gray-300 dark:text-white/70 text-xs flex items-center gap-2">
              <BookOpen size={14} />
              Código: {program.codigo} • Malla Curricular
            </p>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-grow min-h-96 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-coal-600 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {errorApi && (
            <div className="p-4 mb-6 border-l-4 border-danger bg-danger/10 rounded-lg text-danger flex items-center gap-3 animate-pulse">
              <AlertCircle size={20} />
              <span className="font-semibold text-sm">{errorApi}</span>
            </div>
          )}

          {!errorApi && (
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                <h4 className="text-lg font-black uppercase text-gray-800 dark:text-white border-l-4 border-primary pl-4">
                  Fichas del Programa
                </h4>

                {/* Controles de Trimestres */}
                {selectedFicha && (
                  <div className="flex items-center gap-3 bg-white dark:bg-coal-400 px-4 py-2 rounded-lg shadow-sm">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-600">Trimestres:</span>
                    <span className="text-sm font-bold text-primary min-w-[2rem] text-center">
                      {trimestres.length}
                    </span>
                    <button
                      onClick={handleAgregarTrimestre}
                      disabled={trimestres.length === 9 || nuevoTrimestre !== null}
                      className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95"
                    >
                      <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]">
                        <i className="text-lg ki-filled ki-plus"></i>
                      </div>
                      <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">
                        Añadir Trimestre
                      </span>
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
                  <div className="mb-6 bg-white dark:bg-coal-400 rounded-xl p-4 shadow-sm border border-gray-100">
                    <Select
                      options={fichaOptions}
                      value={selectedFichaOption}
                      placeholder="Selecciona una ficha para ver sus trimestres..."
                      onChange={handleSeleccionarFicha}
                      classNames={{
                        control: () =>
                          "bg-white dark:bg-coal-400 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-white",
                        menu: () =>
                          "bg-white dark:bg-coal-400 border border-gray-200 dark:border-gray-600",
                        option: ({ isFocused, isSelected }) =>
                          `cursor-pointer ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : isFocused
                              ? "bg-gray-100 dark:bg-coal-300"
                              : "text-gray-700 dark:text-white"
                          }`,
                        singleValue: () =>
                          "text-gray-700 dark:text-white",
                        placeholder: () =>
                          "text-gray-400 dark:text-gray-300",
                        input: () =>
                          "text-gray-700 dark:text-white",
                        clearIndicator: () =>
                          "text-gray-400 dark:text-gray-300 hover:text-red-500",
                        dropdownIndicator: () =>
                          "text-gray-400 dark:text-gray-300 hover:text-gray-600",
                      }}
                      isClearable
                    />
                  </div>

                  {!selectedFicha && (
                    <div className="py-8 rounded-lg text-center bg-white dark:bg-coal-400">
                      <Search size={48} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                        Busca y selecciona una ficha para continuar
                      </p>
                    </div>
                  )}

                  {/* Toggle Vista */}
                  {selectedFicha && trimestres.length > 0 && (
                    <div className="flex rounded-xl p-1.5 mb-6 bg-gray-100 dark:bg-coal-500 shadow-inner">
                      <button
                        onClick={() => setVistaCalendario(false)}
                        className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                          !vistaCalendario
                            ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        <List size={18} />
                        Trimestres
                      </button>
                      <button
                        onClick={() => setVistaCalendario(true)}
                        className={`flex-1 py-3 px-4 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${
                          vistaCalendario
                            ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                        }`}
                      >
                        <Calendar size={18} />
                        Calendario
                      </button>
                    </div>
                  )}

                  {/* Contenido: Trimestres o Calendario */}
                  {selectedFicha && 
                    <div className="space-y-5">
                      {
                        !loadingTrimestres?

                        <div className="flex justify-center py-8">
                          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      :
                      !vistaCalendario ? (
                        trimestres.length > 0 ? (
                          [...trimestres]
                            .sort((a, b) => a.grado?.numeroGrado - b.grado?.numeroGrado)
                            .map((trimestre, index) => (
                              <div
                                key={trimestre.id || index}
                                className={`p-6 bg-white dark:bg-coal-300 border-2 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ${
                                  trimestre.esNuevo 
                                    ? 'border-primary animate-pulse-slow' 
                                    : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                }`}
                              >
                                <CardTrimestre
                                  trimestre={trimestre}
                                  index={index}
                                  onAbrirMaterias={handleOpenMateriaFromTrimestre}
                                  setSelectedNivelId={setSelectedNivelId}
                                  onVerRaps={handleOpenRaps} // ← PASAR LA FUNCIÓN AL COMPONENTE HIJO
                                />
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
                  }
                </>
              )}
            </div>
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

      {/* Modal FormNuevoTrimestre */}
      {nuevoTrimestre && (
        <FormNuevoTrimestre
          trimestres={trimestres}
          trimestre={nuevoTrimestre}
          guardando={guardandoTrimestre}
          onActualizarFechaFin={actualizarFechaFin}
          onAbrirMaterias={handleOpenMateriaFromNuevoTrimestre}
          onGuardar={handleGuardarTrimestre}
          onCancelar={cancelarNuevoTrimestre}
        />
      )}

      {/* Modal AsignarMateria */}
      <AsignarMateria
        idPrograma={program?.id}
        isOpen={isMateriaModalOpen}
        onClose={() => setIsMateriaModalOpen(false)}
        nivelId={selectedNivelId}
        onMateriasSeleccionadas={handleMateriasSeleccionadas}
      />

      {/* Modal ListaRaps */}
      {selectedCompetenciaId && (
        <ListaRaps
          isOpen={isRapsModalOpen}
          onClose={() => setIsRapsModalOpen(false)}
          idMateriaPadre={selectedCompetenciaId}
          nombreCompetencia={selectedCompetenciaNombre}
        />
      )}

      <Toast message='Trimestre agregado correctamente' isOpen={toast}  onClose={()=> setToast(false)}/>
    </div>
  );
};

export default MallaCurricular;