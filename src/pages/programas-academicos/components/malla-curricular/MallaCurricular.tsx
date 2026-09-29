import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MallaCurricularProps } from '../../types';
<<<<<<< HEAD
import { BookOpen, Search, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@/components/modal';
=======
import { Calendar, Search, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4

// Componentes separados
import { AsignarMateria } from './AsignarMateria';
import { ListaRaps } from './ListaRaps';
import { FormCompetencia } from './FormCompetencia';
<<<<<<< HEAD
import { CardRap } from './CardRap';
=======
import { ModalSeguimientoPractica } from './ModalSeguimientoPractica';

// Hook personalizado
import { useTrimestres } from './UseTrimestres';
import {
  compararTrimestresPorNumeroGrado,
  esTrimestreActual,
  maxNumeroGradoTrimestres
} from './utils/trimestreNumeroGrado';
import Toast from '../Toast';
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
import { HorariosMateria } from './HorariosMateria';

export const MallaCurricular = ({ isOpen, onClose, ficha }: MallaCurricularProps) => {
  // Estados de modales
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [selectedNivelId, setSelectedNivelId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Estados para modal de RAPs
  const [isRapsModalOpen, setIsRapsModalOpen] = useState(false);
  const [selectedCompetenciaId, setSelectedCompetenciaId] = useState<number | null>(null);
  const [selectedCompetenciaNombre, setSelectedCompetenciaNombre] = useState<string>('');

  // Estados para modal de FormCompetencia (Independiente)
  const [isFormCompetenciaOpen, setIsFormCompetenciaOpen] = useState(false);
  const [editingCompetenciaId, setEditingCompetenciaId] = useState<number | undefined>(undefined);
  const [postEditCallback, setPostEditCallback] = useState<(() => void) | null>(null);

<<<<<<< HEAD
  // Estado de materias (antes en useTrimestres)
  const [materias, setMaterias] = useState<any[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState<boolean>(false);

  const cargarMaterias = async (fichaIdParam?: number) => {
    const idFicha = fichaIdParam || ficha?.id;
    try {
      const response = await axios.get(`materias/ficha`, { params: { idFicha } });
      setMaterias(response.data || []);
      setLoadingMaterias(true);
    } catch {
      setMaterias([]);
    }
  };

  useEffect(() => {
    if (ficha?.id) {
      cargarMaterias(ficha.id);
    }
  }, [ficha?.id]);

=======
  // Modal Seguimiento Etapa Practica
  const [isSeguimientoModalOpen, setIsSeguimientoModalOpen] = useState(false);

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
    toast,
    setToast,
    loadingTrimestres
  } = useTrimestres(ficha?.id, program?.id);

  useEffect(() => {
    if (ficha?.id) {
      cargarTrimestres(ficha?.id);
    }
  }, [ficha?.id]);

>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
  // Estados para modal de Horarios
  const [modalHorarios, setModalHorarios] = useState<{
    open: boolean;
    idMateria?: number;
    idFicha?: number;
    totalHoras?: number;
    horasActuales?: number;
    horasFaltantes?: number;
    fechaInicioPrefill?: string;
    horaInicioPrefill?: string;
    horaFinPrefill?: string;
    fechaFinalRap?: string;
  }>({
    open: false,
    idMateria: undefined,
    idFicha: undefined,
    totalHoras: 0,
    horasActuales: 0,
    horasFaltantes: 0
  });

  const handleOpenConfiguracionMaterias = () => {
    setSelectedNivelId(null);
    setIsMateriaModalOpen(true);
  };

  const handleMateriasSeleccionadas = async (data: {
    idGradoPrograma: number;
    materias: any[];
  }) => {
<<<<<<< HEAD
    // Si necesitas reasignar desde la malla, se implementa aquí
    setIsMateriaModalOpen(false);
    if (ficha?.id) {
      cargarMaterias(ficha?.id);
    }
  };

  // para abrir modal de RAPs
  const handleOpenRaps = (competenciaId: number, competenciaNombre: string) => {
=======
    if (nuevoTrimestre) {
      actualizarMaterias(data.materias);
    } else if (ficha?.id) {
      const success = await asignarCompetenciasTrimestre(
        data.idGradoPrograma,
        data.materias,
        ficha.id
      );
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

  const handleOpenRaps = (
    competenciaId: number,
    competenciaNombre: string,
    idTrimestre: number
  ) => {
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
    setSelectedCompetenciaId(competenciaId);
    setSelectedCompetenciaNombre(competenciaNombre);
    setIsRapsModalOpen(true);
  };

  const handleEditCompetencia = (competenciaId: number, callback?: () => void) => {
    setEditingCompetenciaId(competenciaId);
    setPostEditCallback(() => callback || null);
    setIsFormCompetenciaOpen(true);
  };

  const handleFormCompetenciaSuccess = () => {
    if (ficha?.id) {
      cargarMaterias(ficha?.id);
    }
    if (postEditCallback) {
      postEditCallback();
      setPostEditCallback(null);
    }
  };

<<<<<<< HEAD
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

=======
  const tieneEtapaPractica = trimestres.some((t) =>
    (t.materias || []).some(
      (m: any) =>
        (m.nombre || m.nombreMateria || '').toLowerCase().includes('etapa practica') ||
        (m.nombre || m.nombreMateria || '').toLowerCase().includes('etapa productiva')
    )
  );

  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-x-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Modal container */}
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header con Banner */}
        <div className="relative flex-shrink-0 w-full overflow-hidden">
          <img
            src={
              program.imageUrl ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'
            }
            className="absolute inset-0 object-cover w-full h-full brightness-[0.4]"
            alt="Banner del programa"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          <button
            onClick={onClose}
            className="absolute z-10 flex items-center justify-center w-9 h-9 text-white transition-all border rounded-full top-4 right-4 bg-white/10 hover:bg-danger backdrop-blur-md border-white/40 hover:scale-110"
            aria-label="Cerrar modal"
          >
            <i className="text-lg ki-outline ki-cross"></i>
          </button>

          <div className="relative z-[1] flex flex-col px-6 pb-5 pt-12 pr-16 text-white">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 mb-0.5">
                  Programa
                </p>
                <h2 className="text-base sm:text-lg md:text-xl font-bold uppercase tracking-tight leading-snug text-white/95 drop-shadow line-clamp-2">
                  {program?.name || program?.nombrePrograma || 'Programa sin nombre'}
                </h2>
                <p className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight leading-none drop-shadow-lg">
                  FICHA {ficha?.codigo ?? '—'}
                </p>
              </div>

              <div className="shrink-0 sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/65 mb-1">
                  Jornada
                </p>
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-md bg-white/15 border border-white/35 backdrop-blur-sm text-sm sm:text-base font-black uppercase tracking-widest text-white shadow-lg">
                  {ficha?.jornada?.nombreJornada || 'Sin jornada'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-grow min-h-96 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden bg-gray-50 dark:bg-coal-600 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
          <div className="mb-8">
            {/* Controles de Trimestres */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              {ficha && (
                <div className="flex w-full items-center gap-3 px-4 justify-between">
<<<<<<< HEAD
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
                  <button
                    onClick={handleOpenConfiguracionMaterias}
                    className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]">
                      <i className="text-lg ki-filled ki-plus"></i>
                    </div>
                    <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">
                      Agregar materias
                    </span>
                  </button>
=======
                  <div className="flex items-center">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      Trimestres:
                    </span>
                    <span className="text-sm font-bold text-primary min-w-[2rem] text-center">
                      {trimestres.length}
                    </span>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-400 transition-colors text-gray-600 dark:text-gray-400 flex items-center gap-2 group"
                      title={sortOrder === 'asc' ? 'Orden Ascendente' : 'Orden Descendente'}
                    >
                      {sortOrder === 'asc' ? (
                        <ArrowDownAZ
                          size={20}
                          className="text-primary group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <ArrowUpAZ
                          size={20}
                          className="text-primary group-hover:scale-110 transition-transform"
                        />
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">
                        {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                      </span>
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {tieneEtapaPractica && (
                      <button
                        onClick={() => setIsSeguimientoModalOpen(true)}
                        className="group relative flex items-center justify-start h-[46px] px-4 bg-green-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95 hover:bg-green-700"
                        title="Seguimiento Etapa Práctica"
                      >
                        <i className="text-lg ki-filled ki-people mr-2"></i>
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">
                          Seguimiento
                        </span>
                      </button>
                    )}
                    <button
                      onClick={handleAgregarTrimestre}
                      disabled={
                        nuevoTrimestre !== null ||
                        (trimestres.length > 0 &&
                          ((program.nivel?.toUpperCase() === 'TECNICO' &&
                            maxNumeroGradoTrimestres(trimestres) >= 3) ||
                            (program.nivel?.toUpperCase() === 'TECNOLOGO' &&
                              maxNumeroGradoTrimestres(trimestres) >= 7))) ||
                        trimestres.length >= 9
                      }
                      className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]">
                        <i className="text-lg ki-filled ki-plus"></i>
                      </div>
                      <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">
                        {trimestres.length > 0 &&
                        ((program.nivel?.toUpperCase() === 'TECNICO' &&
                          maxNumeroGradoTrimestres(trimestres) >= 3) ||
                          (program.nivel?.toUpperCase() === 'TECNOLOGO' &&
                            maxNumeroGradoTrimestres(trimestres) >= 7))
                          ? 'Límite alcanzado'
                          : 'Añadir Trimestre'}
                      </span>
                    </button>
                  </div>
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
                </div>
              )}
            </div>
          </div>

            {/* Sin ficha seleccionada */}
            {!ficha && (
              <div className="py-8 rounded-lg text-center bg-white dark:bg-coal-400">
                <Search size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                  selecciona una ficha para continuar
                </p>
              </div>
            )}

<<<<<<< HEAD
              {/* Contenido: Calendario o Materias */}
              {ficha &&
                <div className="space-y-5">
                  {
                    !loadingMaterias ?

                      <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      :
                      (
                        materias.length > 0 ? (
                          (sortOrder === 'asc' 
                            ? [...materias].sort((a, b) => a.nombreMateria.localeCompare(b.nombreMateria))
                            : [...materias].sort((a, b) => b.nombreMateria.localeCompare(a.nombreMateria))
                          ).map((materia, index) => (
                            <div key={materia.id || index} className="mb-4">
                              <CardRap
                                materia={materia}
                                onVerRaps={handleOpenRaps}
                                onEditCompetencia={handleEditCompetencia}
                                setModalHorarios={setModalHorarios}
                                idFicha={ficha?.id}
                                onAsignacionSuccess={() => ficha && cargarMaterias(ficha.id)}
                                materiasLength={materias.length}
                              />
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-16 bg-white dark:bg-coal-400 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                            <BookOpen size={56} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300 mb-2">
                              No hay materias asignadas
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Utiliza los controles superiores para agregar materias
                            </p>
                          </div>
                        )
                      )}
                </div>
              }
            </>

          </ModalBody>
=======
            {/* Contenido: Trimestres o Spinner */}
            {ficha && (
              <div className="space-y-5">
                {loadingTrimestres ? (
                  trimestres.length > 0 ? (
                    (sortOrder === 'asc'
                      ? [...trimestres].sort(compararTrimestresPorNumeroGrado)
                      : [...trimestres].sort((a, b) => compararTrimestresPorNumeroGrado(b, a))
                    ).map((trimestre, index) => (
                      <div
                        key={
                          trimestre.grado?.idGradoPrograma ??
                          trimestre.idGradoPrograma ??
                          trimestre.id ??
                          `grado-${trimestre.grado?.numeroGrado ?? trimestre.numeroGrado ?? index}`
                        }
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
                          onVerRaps={handleOpenRaps}
                          onEditCompetencia={handleEditCompetencia}
                          setModalHorarios={setModalHorarios}
                          idFicha={ficha?.id}
                          onAsignacionSuccess={() => ficha && cargarTrimestres(ficha.id)}
                          esEditable={esTrimestreActual(trimestre, trimestres)}
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
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4

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

      {/* Modal AsignarMateria */}
      <AsignarMateria
        isOpen={isMateriaModalOpen}
        onClose={() => setIsMateriaModalOpen(false)}
        nivelId={selectedNivelId}
        onMateriasSeleccionadas={handleMateriasSeleccionadas}
        idFicha={ficha?.id}
<<<<<<< HEAD
        materiasActuales={materias}
      />

=======
        materiasActuales={
          nuevoTrimestre
            ? nuevoTrimestre.materias
            : trimestres.find(
                (t) => (t.idGradoPrograma || t.grado?.idGradoPrograma) === selectedNivelId
              )?.materias || []
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
          programId={program?.id}
          program={program}
          ficha={ficha}
          nivelId={selectedNivelId ?? 0}
          porcentajeEjecucion={ficha?.porcentajeEjecucion ?? 0}
          onEditCompetencia={handleEditCompetencia}
          onUpdate={() => ficha && cargarTrimestres(ficha?.id)}
          esEditable={esTrimestreActual(
            trimestres.find(
              (t) => (t.idGradoPrograma || t.grado?.idGradoPrograma) === selectedNivelId
            ),
            trimestres
          )}
        />
      )}

>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
      {/* Modal Independiente de Competencia */}
      <FormCompetencia
        isOpen={isFormCompetenciaOpen}
        onClose={() => setIsFormCompetenciaOpen(false)}
        competenciaId={editingCompetenciaId}
        onSuccess={handleFormCompetenciaSuccess}
      />

      {/* Modal RAPs */}
      {isRapsModalOpen && selectedCompetenciaId && (
        <ListaRaps
          isOpen={isRapsModalOpen}
          onClose={() => {
            setIsRapsModalOpen(false);
            setSelectedCompetenciaId(null);
          }}
          idMateriaPadre={selectedCompetenciaId}
          nombreCompetencia={selectedCompetenciaNombre}
          idFicha={ficha?.id ?? 0}
          onEditCompetencia={handleEditCompetencia}
          onUpdate={() => ficha?.id && cargarMaterias(ficha.id)}
        />
      )}

      {/* Modal Horarios */}
      {modalHorarios.open && (
        <HorariosMateria
          open={modalHorarios.open}
<<<<<<< HEAD
          onClose={() => setModalHorarios({
            open: false,
            idMateria: undefined
          })}
          idMateria={modalHorarios.idMateria || 0}
=======
          onClose={() => setModalHorarios({ open: false, idGradoMateria: undefined })}
          idGradoMateria={modalHorarios.idGradoMateria ?? 0}
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
          idFicha={modalHorarios.idFicha || ficha?.id || 0}
          porcentajeEjecucion={ficha?.porcentajeEjecucion ?? 0}
          jornada={ficha?.jornada?.nombreJornada}
          fechaInicioPrefill={modalHorarios.fechaInicioPrefill}
          horaInicioPrefill={
            modalHorarios.horaInicioPrefill ||
            (ficha?.jornada?.horaInicial
              ? String(ficha.jornada.horaInicial).slice(0, 5)
              : undefined)
          }
          horaFinPrefill={
            modalHorarios.horaFinPrefill ||
            (ficha?.jornada?.horaFinal ? String(ficha.jornada.horaFinal).slice(0, 5) : undefined)
          }
          fechaFinalRap={modalHorarios.fechaFinalRap}
          onGuardado={() => {
            if (ficha?.id) cargarMaterias(ficha?.id);
          }}
        />
<<<<<<< HEAD
      }
    </>
=======
      )}

      <ModalSeguimientoPractica
        isOpen={isSeguimientoModalOpen}
        onClose={() => setIsSeguimientoModalOpen(false)}
        idFicha={ficha?.id ?? 0}
      />

      <Toast
        message="Operación realizada correctamente"
        isOpen={toast}
        onClose={() => setToast(false)}
      />
    </div>
>>>>>>> 7808e9cd69aa15046051a6a5e2f08da615c07ae4
  );
};

export default MallaCurricular;
