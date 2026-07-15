import React, { useState, useEffect } from 'react';
import { MallaCurricularProps } from '../../types';
import { Calendar, Search, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';

// Componentes separados
import { CardTrimestre } from './CardTrimestre';
import { FormNuevoTrimestre } from './FormNuevoTrimestre';
import { AsignarMateria } from './AsignarMateria';
import { ListaRaps } from './ListaRaps';
import { FormCompetencia } from './FormCompetencia';

// Hook personalizado
import { useTrimestres } from './UseTrimestres';
import {
  compararTrimestresPorNumeroGrado,
  maxNumeroGradoTrimestres,
} from './utils/trimestreNumeroGrado';
import Toast from '../Toast';
import { HorariosMateria } from './HorariosMateria';
import { enqueueSnackbar } from 'notistack';

export const MallaCurricular = ({ isOpen, onClose, program, ficha }: MallaCurricularProps) => {
  // Estados de modales
  const [isMateriaModalOpen, setIsMateriaModalOpen] = useState(false);
  const [selectedNivelId, setSelectedNivelId] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
    toast,
    setToast,
    loadingTrimestres
  } = useTrimestres(ficha?.id, program?.id);

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

  const handleOpenMateriaFromNuevoTrimestre = () => {
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

  if (!isOpen || !program) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 overflow-x-hidden bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 dark:border-gray-700">

        {/* Header con Banner */}
        <div className="relative flex-shrink-0 w-full overflow-hidden">
          <img
            src={program.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'}
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

          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
              {/* Controles de Trimestres */}
              {ficha && (
                <div className="flex w-full items-center gap-3 px-4 justify-between">
                  <div className='flex items-center'>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Trimestres:</span>
                    <span className="text-sm font-bold text-primary min-w-[2rem] text-center">
                      {trimestres.length}
                    </span>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-400 transition-colors text-gray-600 dark:text-gray-400 flex items-center gap-2 group"
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
                  <button
                    onClick={handleAgregarTrimestre}
                    disabled={
                      nuevoTrimestre !== null ||
                      (trimestres.length > 0 && (
                        (program.nivel?.toUpperCase() === 'TECNICO' && maxNumeroGradoTrimestres(trimestres) >= 3) ||
                        (program.nivel?.toUpperCase() === 'TECNOLOGO' && maxNumeroGradoTrimestres(trimestres) >= 7)
                      )) ||
                      trimestres.length >= 9
                    }
                    className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]">
                      <i className="text-lg ki-filled ki-plus"></i>
                    </div>
                    <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">
                      {
                        trimestres.length > 0 && (
                          (program.nivel?.toUpperCase() === 'TECNICO' && maxNumeroGradoTrimestres(trimestres) >= 3) ||
                          (program.nivel?.toUpperCase() === 'TECNOLOGO' && maxNumeroGradoTrimestres(trimestres) >= 7)
                        )
                          ? 'Límite alcanzado'
                          : 'Añadir Trimestre'
                      }
                    </span>
                  </button>
                </div>
              )}
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
                            ? [...trimestres].sort(compararTrimestresPorNumeroGrado)
                            : [...trimestres].sort((a, b) =>
                                compararTrimestresPorNumeroGrado(b, a)
                              )
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
                      )}
                </div>
              }
            </>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 px-6 bg-white dark:bg-coal-400 border-t-2 border-gray-200 dark:border-gray-600 shadow-inner">
          <div className="items-center hidden sm:flex gap-2">
            <i className="text-base ki-outline ki-information-2 text-primary"></i>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              {ficha
                ? `Ficha #${ficha?.codigo} seleccionada`
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
          nivel={program.nivel}
          onActualizarFechaFin={actualizarFechaFin}
          onActualizarFechaInicio={actualizarFechaInicio}
          onActualizarNumeroGrado={actualizarNumeroGrado}
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
          programId={program?.id}
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
        programId={program?.id ?? 0}
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

      <Toast message='Operación realizada correctamente' isOpen={toast} onClose={() => setToast(false)} />
    </div>
  );
};

export default MallaCurricular;