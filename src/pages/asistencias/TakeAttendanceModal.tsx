import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Estudiante {
  idMatriculaAcademica: number;
  idMatricula: number;
  nombre: string;
  asistio: boolean | null; // true (Asistió), false (Faltó/Inasistencia)
  estadoLocal?: 'presente' | 'ausente' | 'justificada';
}

interface TakeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  estudiantes: Estudiante[];
  idMateria: number;
  idAsignacionPeriodoProgramaJornada: number;
  onAttendanceUpdated: () => void; // Callback para recargar la lista de estudiantes
}

const TakeAttendanceModal: React.FC<TakeAttendanceModalProps> = ({
  isOpen,
  onClose,
  estudiantes,
  idMateria,
  idAsignacionPeriodoProgramaJornada,
  onAttendanceUpdated
}) => {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [localEstudiantes, setLocalEstudiantes] = useState<Estudiante[]>([]);
  const [justifyingStudentId, setJustifyingStudentId] = useState<number | null>(null);
  const [justificationData, setJustificationData] = useState({
    tipoExcusa: 'FUERZA MAYOR',
    observacionExcusa: ''
  });

  useEffect(() => {
    if (isOpen) {
      setLocalEstudiantes(estudiantes);
    }
  }, [isOpen, estudiantes]);

  if (!isOpen) return null;

  const setAttendance = async (
    estudiante: Estudiante,
    estado: 'presente' | 'ausente' | 'justificada',
    justificationOptions?: { tipoExcusa: string; observacionExcusa: string }
  ) => {
    setLoadingId(estudiante.idMatriculaAcademica);

    try {
      const payload = {
        idMatriculaAcademica: estudiante.idMatriculaAcademica,
        idMatricula: estudiante.idMatricula,
        idMateria,
        idAsignacionPeriodoProgramaJornada,
        asistio: estado === 'presente',
        justificada: estado === 'justificada',
        ...(justificationOptions || {})
      };

      await axios.put('update_assistance', payload);

      setLocalEstudiantes(prev => prev.map(e =>
        e.idMatriculaAcademica === estudiante.idMatriculaAcademica
          ? { ...e, asistio: estado === 'presente', estadoLocal: estado }
          : e
      ));

      if (onAttendanceUpdated) onAttendanceUpdated();

      if (estado === 'justificada') {
        setJustifyingStudentId(null);
      }

    } catch (error) {
      console.error("Error al actualizar asistencia", error);
      alert("Error al actualizar la asistencia.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleOpenJustification = (id: number) => {
    setJustifyingStudentId(id);
    setJustificationData({ tipoExcusa: 'FUERZA MAYOR', observacionExcusa: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">

        {/* Header del Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Justificaciones</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Lista de Estudiantes */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {localEstudiantes.map((estudiante) => (
            <React.Fragment key={estudiante.idMatriculaAcademica}>
              <div
                className={`flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors z-10 relative
                ${justifyingStudentId === estudiante.idMatriculaAcademica ? 'rounded-b-none border-b-transparent bg-gray-50' : ''}
              `}
              >
                <span className="text-gray-700 font-medium truncate pr-4">
                  {estudiante.nombre}
                </span>

                <div className="flex gap-1 sm:gap-2">
                  <button
                    onClick={() => handleOpenJustification(estudiante.idMatriculaAcademica)}
                    disabled={loadingId === estudiante.idMatriculaAcademica}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                    ${loadingId === estudiante.idMatriculaAcademica ? 'opacity-50 cursor-not-allowed' : ''}
                    ${estudiante.estadoLocal === 'justificada'
                        ? 'bg-yellow-500 text-white shadow-sm ring-1 ring-yellow-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                      }`}
                  >
                    Justificar
                  </button>
                </div>
              </div>

              {/* Formulario Inline de Justificación */}
              {justifyingStudentId === estudiante.idMatriculaAcademica && (
                <div className="p-3 border-x border-b rounded-b-lg bg-yellow-50/50 mt-[-0.5rem] mb-2 text-sm border-yellow-200">
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de Excusa</label>
                    <select
                      value={justificationData.tipoExcusa}
                      onChange={(e) => setJustificationData({ ...justificationData, tipoExcusa: e.target.value })}
                      className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 py-1"
                    >
                      <option value="FUERZA MAYOR">Fuerza Mayor</option>
                      <option value="PERMISO ESTUDIANTIL">Permiso Estudiantil</option>
                      <option value="PERMISO LABORAL">Permiso Laboral</option>
                      <option value="PERMISO MEDICO">Permiso Médico</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Observación</label>
                    <textarea
                      value={justificationData.observacionExcusa}
                      onChange={(e) => setJustificationData({ ...justificationData, observacionExcusa: e.target.value })}
                      placeholder="Detalles sobre la inasistencia..."
                      className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 resize-none h-16"
                    ></textarea>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setJustifyingStudentId(null)}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => setAttendance(estudiante, 'justificada', justificationData)}
                      className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-semibold transition-colors"
                    >
                      Guardar Justificación
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}

          {localEstudiantes.length === 0 && (
            <div className="text-center p-4 text-gray-500">
              No hay estudiantes para mostrar.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}

export default TakeAttendanceModal;
