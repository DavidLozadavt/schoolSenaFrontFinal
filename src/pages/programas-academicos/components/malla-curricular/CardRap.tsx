import { User, Pencil, Trash2, Calendar, FolderPlus, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components';
import { useSnackbar } from 'notistack';

interface CardRapProps {
  materia: any;
  onVerRaps?: (competenciaId: number, competenciaNombre: string, idTrimestre: number) => void;
  idTrimestre?: number;
  setModalHorarios?: any;
  idFicha?: number; // Necesario para filtrar instructores
  onAsignacionSuccess?: () => void;
}

export const CardRap = ({
  materia,
  onVerRaps,
  idTrimestre,
  setModalHorarios,
  idFicha,
  onAsignacionSuccess
}: CardRapProps) => {
  const [horarios, setHorarios] = useState<any[]>([]);
  const [horariosSinAsignar, setHorariosSinAsignar] = useState<any[]>([]);
  const [instructoresAsignados, setInstructoresAsignados] = useState<any[]>([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [cargandoInstructores, setCargandoInstructores] = useState(false);
  const [showInstructorsModal, setShowInstructorsModal] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    let asignados: any[] = [];
    let sinAsignar: any[] = [];

    if (materia?.horarios && !Array.isArray(materia.horarios)) {
      // Nueva estructura: objeto { asignados, sinAsignar }
      asignados = materia.horarios.asignados || [];
      sinAsignar = materia.horarios.sinAsignar || [];
    } else if (Array.isArray(materia?.horarios)) {
      // Estructura antigua: array
      asignados = materia.horarios.filter((h: any) => h.estado === 'ASIGNADO');
      sinAsignar = materia.horarios.filter((h: any) => h.estado !== 'ASIGNADO');
    }

    setHorarios(asignados);
    setHorariosSinAsignar(sinAsignar);

    // Agrupar por instructores únicos
    const unicos: any[] = [];
    const idsVistos = new Set();

    asignados.forEach((h: any) => {
      const instructor = h.instructor || h.persona; // Compatibilidad con diferentes estructuras
      if (instructor && !idsVistos.has(instructor.id)) {
        idsVistos.add(instructor.id);
        unicos.push(instructor);
      }
    });

    setInstructoresAsignados(unicos);
  }, [materia]);

  // Cargar instructores disponibles cuando se abre el selector
  const cargarInstructores = async () => {
    setCargandoInstructores(true);
    try {
      const response = await axios.get('materias/instructores', {
        params: {
          idMateria: materia.idMateria || materia.id
        }
      });
      setInstructores(response.data.data || []);
    } catch (error) {
      setInstructores([]);
    } finally {
      setCargandoInstructores(false);
    }
  };

  const handleAsignarInstructor = async (instructor: any) => {
    setAsignando(true);
    try {
      await axios.put('asignar/instructor', {
        idContrato: instructor.id, // instructor es el contrato, los datos personales vienen en instructor.persona
        horarios: horariosSinAsignar
      });

      enqueueSnackbar('Instructor asignado correctamente', { variant: 'success' });
      setMostrarSelector(false);

      if (onAsignacionSuccess) {
        onAsignacionSuccess();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al asignar instructor', { variant: 'error' });
    } finally {
      setAsignando(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-2 flex gap-4 bg-white dark:bg-coal-400 hover:border-primary/50 transition-all duration-300">
      {/* Contenido principal */}
      <div className="flex-1 space-y-4">
        {/* Título del RAP */}
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-white px-2">
            {materia.nombre || materia.nombreMateria}
            <p className='text-gray-500 font-normal text-xs'>
              {materia.descripcion ? materia.descripcion : ''}
            </p>
          </h3>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Progreso</p>
            <p className="text-lg text-center text-blue-500 font-semibold">
              {materia.porcentajeAvance || 0}%
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 rounded-lg p-4 text-center bg-gray-50 dark:bg-coal-500">
          <div className="flex flex-col items-center justify-center gap-2 text-center relative col-span-1 md:col-span-1 min-h-[60px]">
            {(() => {
              const horariosData = materia?.horarios;
              const hasAsignados = Array.isArray(horariosData)
                ? horariosData.some((h: any) => h.estado === 'ASIGNADO')
                : (horariosData?.asignados?.length > 0);

              const hasSinAsignar = Array.isArray(horariosData)
                ? horariosData.some((h: any) => h.estado !== 'ASIGNADO')
                : (horariosData?.sinAsignar?.length > 0);

              if (!hasAsignados && !hasSinAsignar) {
                return (
                  <div className="flex-1 text-center py-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      SIN HORARIOS ASIGNADOS O CREADOS
                    </p>
                  </div>
                );
              }

              return (
                <>
                  <div className="flex items-center gap-3">
                    {/* Avatars de Instructores Asignados */}
                    {instructoresAsignados.length > 0 && (
                      <div
                        className="flex -space-x-2 cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => setShowInstructorsModal(true)}
                      >
                        {instructoresAsignados.slice(0, 3).map((inst, idx) => (
                          <div
                            key={idx}
                            className="h-8 w-8 rounded-full border-2 border-white bg-gray-100 overflow-hidden flex items-center justify-center shadow-sm"
                            title={`${inst.nombre1 || ''} ${inst.apellido1 || ''}`}
                          >
                            {inst.rutaFotoUrl ? (
                              <img
                                src={inst.rutaFotoUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="text-gray-500" size={14} />
                            )}
                          </div>
                        ))}
                        {instructoresAsignados.length > 3 && (
                          <div className="h-8 w-8 rounded-full border-2 border-white bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                            +{instructoresAsignados.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nombre del Instructor */}
                    <div className="text-left">
                      {instructoresAsignados.length > 0 ? (
                        <div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">Instructor</p>
                          <p className="text-xs font-semibold text-gray-800 dark:text-white leading-tight">
                            {instructoresAsignados.length === 1 ? (
                              `${instructoresAsignados[0].nombre1 || ''} ${instructoresAsignados[0].apellido1 || ''}`
                            ) : (
                              <span
                                className="text-primary cursor-pointer hover:underline"
                                onClick={() => setShowInstructorsModal(true)}
                              >
                                +{instructoresAsignados.length}
                              </span>
                            )}
                          </p>
                        </div>
                      ) : hasSinAsignar && (
                        <p className="text-[10px] text-orange-500 font-bold uppercase">Por asignar</p>
                      )}
                    </div>
                  </div>

                  {/* Botón para asignar nuevo (solo si hay horarios sin asignar) */}
                  {hasSinAsignar && (
                    <div className="w-full">
                      <button
                        onClick={() => {
                          setMostrarSelector(!mostrarSelector);
                          cargarInstructores();
                        }}
                        className="flex items-center justify-center gap-1 text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded hover:bg-primary/20 transition-all uppercase w-full max-w-[150px] mx-auto"
                      >
                        + Asignar instructor
                        <ChevronDown size={12} className={`transition-transform ${mostrarSelector ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown de cada RAP/Materia */}
                      {mostrarSelector && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-coal-300 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 z-[100] max-h-60 overflow-y-auto">
                          {cargandoInstructores || asignando ? (
                            <div className="p-4 text-center">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                              {asignando && <p className="text-[10px] mt-2 font-bold text-primary animate-pulse">ASIGNANDO...</p>}
                            </div>
                          ) : (
                            <div className="p-1">
                              {instructores.length > 0 ? (
                                instructores.map((inst) => (
                                  <button
                                    key={inst.id}
                                    onClick={() => handleAsignarInstructor(inst)}
                                    className="w-full p-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-coal-400 rounded-md transition-colors text-left"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                      {inst.persona?.rutaFotoUrl ? (
                                        <img src={inst.persona.rutaFotoUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <User size={14} className="m-1.5 text-gray-500" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                        {inst.persona ? `${inst.persona.nombre1} ${inst.persona.apellido1}` : 'Sin nombre'}
                                      </p>
                                      <p className="text-[9px] text-gray-500">Instructor</p>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <p className="p-4 text-xs text-gray-500 text-center">
                                  No hay instructores disponibles
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Horas - igual que antes */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total de horas</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {materia.horasTotales || 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Horas acumuladas</p>
            <p className="text-lg font-semibold text-green-600">
              {materia.horasActuales || 0}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Horas restantes</p>
            <p className="text-lg font-semibold text-orange-500">
              {materia.horasFaltantes || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col items-center justify-between py-2 gap-1">
        {onVerRaps && (
          <button
            onClick={() => onVerRaps(materia.id, materia.nombre || materia.nombreMateria, idTrimestre ?? 0)}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition"
            title="RAPs"
          >
            <FolderPlus size={18} />
          </button>
        )}

        <button
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 hover:text-blue-600 transition"
          title="Editar"
        >
          <Pencil size={18} />
        </button>

        {materia.idMateriaPadre != null &&
          <button
            onClick={() => {
              setModalHorarios({
                open: true,
                idGradoMateria: materia.idGradoMateria,
                idFicha: idFicha,
                totalHoras: materia.horasTotales ?? 0,
                horasActuales: materia.horasActuales ?? 0,
                horasFaltantes: materia.horasFaltantes ?? 0
              });
            }}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 hover:text-green-600 transition"
            title="Horarios"
          >
            <Calendar size={18} />
          </button>
        }

        <button
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 hover:text-red-600 transition"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Modal de Lista de Instructores */}
      {showInstructorsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <ModalContent className="w-full max-w-xl p-4 max-h-[95vh]">
            <ModalHeader>
              <ModalTitle>Instructores Asignados</ModalTitle>
              <button
                onClick={() => setShowInstructorsModal(false)}
                className="absolute z-10 flex items-center justify-center w-9 h-9 text-gray-400 transition-all border rounded-full top-4 right-4 hover:bg-danger backdrop-blur-md border-gray-400 hover:text-white hover:scale-110"
              >
                <i className="ki-outline ki-cross text-lg"></i>
              </button>
            </ModalHeader>

            <ModalBody className="p-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-1">
                {instructoresAsignados.map((inst, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-coal-400 transition-colors">
                    <div className="h-20 w-20 rounded-full border-2 border-primary/20 overflow-hidden flex-shrink-0 bg-gray-100">
                      {inst.rutaFotoUrl ? (
                        <img src={inst.rutaFotoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          <User size={28} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-white text-sm truncate uppercase">
                        {`${inst.nombre1 || ''} ${inst.nombre2 || ''} ${inst.apellido1 || ''} ${inst.apellido2 || ''}`}
                      </p>
                      <p className="text-xs text-primary font-medium flex items-center gap-1.5 mt-0.5 truncate">
                        <i className="ki-outline ki-sms size-3.5"></i>
                        {inst.email || 'Sin correo registrado'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ModalBody>

            <div className="p-4 border-t border-gray-100 dark:border-gray-600 flex justify-end">
              <button
                onClick={() => setShowInstructorsModal(false)}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-coal-400 dark:hover:bg-coal-300 text-gray-700 dark:text-white rounded-lg text-xs font-bold uppercase transition-all"
              >
                Cerrar
              </button>
            </div>
          </ModalContent>
        </div>
      )}
    </div>
  );
};