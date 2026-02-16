import { User, Pencil, Trash2, Calendar, FolderPlus, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface CardRapProps {
  materia: any;
  onVerRaps?: (competenciaId: number, competenciaNombre: string, idTrimestre: number) => void;
  verDescripcion?: boolean;
  idTrimestre?: number;
  setModalHorarios: any;
  idFicha?: number; // Necesario para filtrar instructores
}

export const CardRap = ({ 
  materia, 
  onVerRaps, 
  verDescripcion, 
  idTrimestre, 
  setModalHorarios,
  idFicha 
}: CardRapProps) => {
  const [horarios, setHorarios] = useState<any[]>([]);
  const [mostrarSelector, setMostrarSelector] = useState(false);
  const [instructores, setInstructores] = useState<any[]>([]);
  const [cargandoInstructores, setCargandoInstructores] = useState(false);

  useEffect(() => {
    if (Array.isArray(materia?.horarios)) {
      setHorarios(materia.horarios.filter((h: any) => h.estado === 'ASIGNADO'));
    } else {
      setHorarios([]);
    }
  }, [materia]);

  // Cargar instructores disponibles cuando se abre el selector
  const cargarInstructores = async () => {
    setCargandoInstructores(true);
    try {
      const response = await axios.get('materias/instructores', {
        params: {
          idMateria: materia.id || materia.idMateria
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
    try {
      await axios.post('horarios/asignar-instructor', {
        idGradoMateria: materia.id,
        idInstructor: instructor.id,
        idFicha: idFicha
      });
      
      setMostrarSelector(false);
    } catch (error) {
      console.error('Error al asignar instructor:', error);
    }
  };

  return (
    <div className="rounded-xl border border-gray-300 dark:border-gray-600 p-2 my-2 flex gap-4 bg-white dark:bg-coal-400 hover:border-primary/50 transition-all duration-300">
      {/* Contenido principal */}
      <div className="flex-1 space-y-4">
        {/* Título del RAP */}
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900 dark:text-white px-2">
            {materia.nombre || materia.nombreMateria}
            <p className='text-gray-500 font-normal text-xs'>
              {verDescripcion && materia.descripcion ? materia.descripcion : ''}
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
          <div className="flex items-center justify-center gap-3 text-left relative">
            {/* Avatars */}
            <div className="flex space-x-3">
              {horarios && horarios.length > 0 ? (
                horarios.map((h, idx) => (
                  <div
                    key={idx}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden flex items-center justify-center"
                  >
                    {h.instructor ? (
                      h.instructor?.rutaFoto ? (
                        <img
                          src={h.instructor.rutaFoto}
                          alt={`${h.instructor.nombre1 ?? ''} ${h.instructor.apellido1 ?? ''}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="text-gray-500" size={18} />
                      )
                    ) : (
                      <User className="text-gray-400" size={18} />
                    )}
                  </div>
                ))
              ) : (
                <div 
                  onClick={() => {
                    setMostrarSelector(!mostrarSelector);
                    cargarInstructores();
                  }}
                  className="h-10 w-10 rounded-full bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-all"
                  title="Asignar instructor"
                >
                  <User className="text-primary" size={18} />
                </div>
              )}
            </div>

            {/* Información del instructor o selector */}
            <div className="flex-1">
              {horarios?.length === 1 && horarios[0].instructor ? (
                // Hay instructor asignado
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Instructor</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white leading-tight">
                    {`${horarios[0].instructor.nombre1 || ''} ${horarios[0].instructor.nombre2 || ''} ${horarios[0].instructor.apellido1 || ''} ${horarios[0].instructor.apellido2 || ''}`}
                  </p>
                </div>
              ) : !horarios || horarios.length === 0 ? (
                // NO hay instructor - Mostrar selector
                <div className="flex items-center justify-center">
                  <button
                    onClick={() => {
                      setMostrarSelector(!mostrarSelector);
                      cargarInstructores();
                    }}
                    className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline"
                  >
                    + Asignar instructor
                    <ChevronDown size={16} className={`transition-transform ${mostrarSelector ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown de instructores */}
                  {mostrarSelector && (
                    <div className="absolute top-full mt-2 w-64 bg-white dark:bg-coal-300 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 max-h-60 overflow-y-auto">
                      {cargandoInstructores ? (
                        <div className="p-4 text-center">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : instructores.length > 0 ? (
                        instructores.map((inst) => (
                          <button
                            key={inst.id}
                            onClick={() => handleAsignarInstructor(inst.id)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-coal-400 border-b border-gray-100 dark:border-gray-600 last:border-0 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {inst.persona.rutaFotoUrl ? (
                                <img src={inst.persona.rutaFotoUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <User size={16} className="m-2 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                                {inst.persona.nombre1} {inst.persona.nombre2??''} {inst.persona.apellido1} {inst.persona.apellido2??''}
                              </p>
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="p-4 text-sm text-gray-500 text-center">
                          No hay instructores disponibles
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
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

      {/* Acciones - igual que antes */}
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

        <button
          onClick={() => {
            setModalHorarios(true);
            console.log('abriendo horarios');
          }}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 hover:text-green-600 transition"
          title="Horarios"
        >
          <Calendar size={18} />
        </button>

        <button
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 hover:text-red-600 transition"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};