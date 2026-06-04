import React, { useState, useEffect } from 'react';
import { MallaCurricularProps } from '../../types';
import { BookOpen, Calendar, Search, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';

// Componentes separados
import { CardTrimestre } from './CardTrimestre';
import { FormNuevoTrimestre } from './FormNuevoTrimestre';
import { AsignarMateria } from './AsignarMateria';
import { ListaRaps } from './ListaRaps';
import { FormCompetencia } from './FormCompetencia';

// Hook personalizado
import { useTrimestres } from './UseTrimestres';
import { HorariosMateria } from './HorariosMateria';
import { enqueueSnackbar } from 'notistack';

export const MallaCurricular = ({ isOpen, onClose, ficha }: MallaCurricularProps) => {
  // Estados de modales
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [selectedNivelId, setSelectedNivelId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Estados para modal de RAPs - NUEVO
  const [isRapsModalOpen, setIsRapsModalOpen] = useState(false);
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | null>(null);
  const [selectedCompetenciaNombre, setSelectedCompetenciaNombre] = useState<string>('');

  // Estados para modal de FormCompetencia (Independiente)
  const [isFormCompetenciaOpen, setIsFormCompetenciaOpen] = useState(false);
  const [editingCompetenciaId, setEditingCompetenciaId] = useState<number | undefined>(undefined);
  const [postEditCallback, setPostEditCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (ficha?.id) {
      cargarTrimestres(ficha?.id);
    }
  }, [ficha?.id]);

  // Hook de trimestres
  const {
    trimestres,
    nuevoTrimestre,
    guardandoTrimestre,
    cargarTrimestres,
    agregarNuevoTrimestre,
    cancelarNuevoTrimestre,
    actualizarFechaFin,
    actualizarFechaInicio,
    actualizarNumeroGrado,
    actualizarMaterias,
    crearTrimestre,
    asignarCompetenciasTrimestre,
    loadingTrimestres
  } = useTrimestres(ficha?.id);

  // Estados para modal de Horarios
  const [modalHorarios, setModalHorarios] = useState<{
    open: boolean;
    idGradoMateria?: number;
    idFicha?: number;
    totalHoras?: number;
    horasActuales?: number;
    horasFaltantes?: number;
  }>({
    open: false,
    idGradoMateria: undefined,
    idFicha: undefined,
    totalHoras: 0,
    horasActuales: 0,
    horasFaltantes: 0
  });

  const handleAgregarTrimestre = () => {
    agregarNuevoTrimestre(ficha);
  };

  const handleOpenMateriaFromTrimestre = (nivelId: any) => {
    setSelectedNivelId(nivelId);
    setIsMateriaModalOpen(true);
  };

  const handleOpenConfiguracionMaterias = () => {
    setSelectedNivelId(null);
    setIsMateriaModalOpen(true);
  };

  const handleMateriasSeleccionadas = async (data: {
    idGradoPrograma: number;
    materias: any[]
  }) => {
    if (nuevoTrimestre) {
      actualizarMaterias(data.materias);
    } else if (ficha?.id) {
      const success = await asignarCompetenciasTrimestre(data.idGradoPrograma, data.materias, ficha.id);
      if (success) {
        await cargarTrimestres(ficha?.id);
        setIsMateriaModalOpen(false);
      }
    }
  };


  const handleGuardarTrimestre = async () => {
    if (!ficha) {
      enqueueSnackbar('Debes seleccionar una ficha', { variant: 'error' });
      return;
    }

    await crearTrimestre(ficha);
  };

  // para abrir modal de RAPs
  const handleOpenRaps = (competenciaId: number, competenciaNombre: string, idTrimestre: number) => {
    setSelectedCompetenciaId(competenciaId);
    setSelectedCompetenciaNombre(competenciaNombre);
    setSelectedNivelId(idTrimestre);
    setIsRapsModalOpen(true);
  };

  const handleEditCompetencia = (competenciaId: number, callback?: () => void) => {
    setEditingCompetenciaId(competenciaId);
    setPostEditCallback(() => callback || null);
    setIsFormCompetenciaOpen(true);
  };

  const handleFormCompetenciaSuccess = () => {
    if (ficha?.id) {
      cargarTrimestres(ficha?.id);
    }
    if (postEditCallback) {
      postEditCallback();
      setPostEditCallback(null);
    }
  };

  return (
    <>
      <Modal open={isOpen} onClose={onClose} zIndex={100} className="p-4 animate-fade-in">
        <ModalContent className="w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
          <ModalHeader className="flex px-4 w-full justify-between items-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-coal-600">
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight leading-none text-gray-600 dark:text-gray-300 drop-shadow-sm">
                Malla Curricular
              </h2>
              <span className="text-xs font-bold uppercase mt-1">{ficha?.codigo}</span>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 text-gray-500 hover:text-danger transition-all border rounded-full top-4 right-4 bg-gray-50 hover:bg-red-50 dark:bg-coal-400 dark:hover:bg-danger/20 border-gray-200 dark:border-coal-300 hover:scale-110"
              aria-label="Cerrar modal"
            >
              <i className="text-lg ki-outline ki-cross"></i>
            </button>
          </ModalHeader>

          {/* Contenido Principal */}
          <ModalBody className="flex-grow min-h-96 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">

          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              {/* Controles de Trimestres */}
              {ficha && (
                <div className="flex w-full items-center gap-3 px-4 justify-between">

                <div className="flex gap-4">
                  <button
                    onClick={handleOpenConfiguracionMaterias}
                    className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]">
                      <i className="text-lg ki-filled ki-setting"></i>
                    </div>
                    <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">
                      Configuración de materias
                    </span>
                  </button>
                  <div className='flex items-center'>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-600">Periodos:</span>
                    <span className="text-sm font-bold text-primary min-w-[2rem] text-center">
                      {trimestres.length}
                    </span>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="ml-4 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-400 transition-colors text-gray-600 dark:text-gray-400 flex items-center gap-2 group"
                      title={sortOrder === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
                    >
                      {sortOrder === 'asc' ? (
                        <ArrowDownAZ size={20} className="text-primary group-hover:scale-110 transition-transform" />
                      ) : (
                        <ArrowUpAZ size={20} className="text-primary group-hover:scale-110 transition-transform" />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                        {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                      </span>
                    </button>
                  </div>
                  </div>


                  <button
                    onClick={handleAgregarTrimestre}
                    disabled={
                      nuevoTrimestre !== null ||
                      trimestres.length >= 9
                    }
                    className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]">
                      <i className="text-lg ki-filled ki-plus"></i>
                    </div>
                    <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">
                      {trimestres.length >= 9
                        ? 'Límite alcanzado'
                        : 'Añadir Periodo académico'
                      }
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

            <>
              {!ficha && (
                <div className="py-8 rounded-lg text-center bg-white dark:bg-coal-400">
                  <Search size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                    selecciona una ficha para continuar
                  </p>
                </div>
              )}

              {/* Contenido: Trimestres o Calendario */}
              {ficha &&
                <div className="space-y-5">
                  {
                    !loadingTrimestres ?

                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      :
                      (
                        trimestres.length > 0 ? (
                        (sortOrder === 'asc' 
                            ? [...trimestres].sort((a, b) => (a.grado?.numeroGrado || a.numeroGrado) - (b.grado?.numeroGrado || b.numeroGrado))
                            : [...trimestres].sort((a, b) => (b.grado?.numeroGrado || b.numeroGrado) - (a.grado?.numeroGrado || a.numeroGrado))
                          )
                            .map((trimestre, index) => (
                              <div
                                key={trimestre.id || index}
                                className={`p-6 bg-white dark:bg-coal-300 border-2 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ${trimestre.esNuevo
                                  ? 'border-primary animate-pulse-slow'
                                  : 'border-gray-200 dark:border-gray-600 hover:border-primary/50'
                                  }`}
                              >
                                <CardTrimestre
                                  trimestre={trimestre}
                                  index={index}
                                  onAbrirMaterias={handleOpenMateriaFromTrimestre}
                                  setSelectedNivelId={setSelectedNivelId}
                                  onVerRaps={handleOpenRaps}
                                  onEditCompetencia={handleEditCompetencia}
                                  setModalHorarios={setModalHorarios}
                                  idFicha={ficha?.id}
                                  onAsignacionSuccess={() => ficha && cargarTrimestres(ficha.id)}
                                />
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <Calendar size={56} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
                              No hay periodos académicos configurados
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Utiliza los controles superiores para agregar periodos académicos
                            </p>
                          </div>
                        )
                      )}
                </div>
              }
            </>

          </ModalBody>

          {/* Footer */}
          <ModalFooter className="flex items-center justify-between p-5 px-6 bg-white dark:bg-coal-400 border-t-2 border-gray-200 dark:border-gray-600 shadow-inner">
          <div className="items-center hidden sm:flex gap-2">
            <i className="text-base ki-outline ki-information-2 text-primary"></i>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {ficha
                ? `Grupo ${ficha?.codigo} seleccionado`
                : 'Selecciona una grupo para comenzar'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-primary text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary-active active:scale-95 transition-all shadow-lg hover:shadow-xl"
          >
            Cerrar
          </button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal FormNuevoTrimestre */}
      {nuevoTrimestre && (
        <FormNuevoTrimestre
          trimestres={trimestres}
          trimestre={nuevoTrimestre}
          guardando={guardandoTrimestre}
          onActualizarFechaFin={actualizarFechaFin}
          onActualizarFechaInicio={actualizarFechaInicio}
          onActualizarNumeroGrado={actualizarNumeroGrado}
          onGuardar={handleGuardarTrimestre}
          onCancelar={cancelarNuevoTrimestre}
        />
      )}

      {/* Modal AsignarMateria */}
      <AsignarMateria
        isOpen={isMateriaModalOpen}
        onClose={() => setIsMateriaModalOpen(false)}
        nivelId={selectedNivelId}
        onMateriasSeleccionadas={handleMateriasSeleccionadas}
        idFicha={ficha?.id}
        materiasActuales={
          nuevoTrimestre
            ? nuevoTrimestre.materias
            : trimestres.find(t => (t.idGradoPrograma || t.grado?.idGradoPrograma) === selectedNivelId)?.materias || []
        }
      />

      {/* Modal ListaRaps */}
      {selectedCompetenciaId && (
        <ListaRaps
          isOpen={isRapsModalOpen}
          onClose={() => setIsRapsModalOpen(false)}
          idMateriaPadre={selectedCompetenciaId}
          nombreCompetencia={selectedCompetenciaNombre}
          idFicha={ficha?.id}
          nivelId={selectedNivelId ?? 0}
          porcentajeEjecucion={ficha?.porcentajeEjecucion ?? 0}
          onEditCompetencia={handleEditCompetencia}
          onUpdate={() => ficha && cargarTrimestres(ficha?.id)}
        />
      )}

      {/* Modal Independiente de Competencia */}
      <FormCompetencia
        isOpen={isFormCompetenciaOpen}
        onClose={() => setIsFormCompetenciaOpen(false)}
        competenciaId={editingCompetenciaId}
        onSuccess={handleFormCompetenciaSuccess}
      />

      {/* Modal Horarios */}
      {modalHorarios.open &&
        <HorariosMateria
          open={modalHorarios.open}
          onClose={() => setModalHorarios({
            open: false,
            idGradoMateria: undefined
          })}
          idGradoMateria={modalHorarios.idGradoMateria ?? 0}
          idFicha={modalHorarios.idFicha || ficha?.id || 0}
          totalHoras={modalHorarios.totalHoras}
          horasActuales={modalHorarios.horasActuales}
          horasFaltantes={modalHorarios.horasFaltantes}
          porcentajeEjecucion={ficha?.porcentajeEjecucion ?? 0}
          onGuardado={() => {
            if (ficha?.id) cargarTrimestres(ficha?.id);
          }}
        />
      }
    </>
  );
};

export default MallaCurricular;