import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Tooltip } from '@mui/material';

interface Estudiante {
  idMatriculaAcademica: number;
  idMatricula: number;
  nombre: string;
  identificacion?: string;
  fotoUrl?: string | null;
  asistio: boolean | null;
  estadoLocal?: 'presente' | 'ausente' | 'justificada';
}

interface TakeAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  estudiantes: Estudiante[];
  idMateria: number;
  idAsignacionPeriodoProgramaJornada: number;
  idHorarioMateria?: number;
  onAttendanceUpdated: () => void;
}

interface JustificationData {
  tipoExcusa: string;
  observacionExcusa: string;
  archivoSoporte: File | null;
}

const initialJustificationData: JustificationData = {
  tipoExcusa: 'FUERZA MAYOR',
  observacionExcusa: '',
  archivoSoporte: null
};

const validFileTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const maxFileSize = 5 * 1024 * 1024; // 5 MB

const TakeAttendanceModal: React.FC<TakeAttendanceModalProps> = ({
  isOpen,
  onClose,
  estudiantes,
  idMateria,
  idAsignacionPeriodoProgramaJornada,
  idHorarioMateria,
  onAttendanceUpdated
}) => {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [localEstudiantes, setLocalEstudiantes] = useState<Estudiante[]>([]);
  const [justifyingStudentId, setJustifyingStudentId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [justificationData, setJustificationData] = useState<JustificationData>(
    initialJustificationData
  );

  useEffect(() => {
    if (isOpen) {
      setLocalEstudiantes(estudiantes);
    }
  }, [isOpen, estudiantes]);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setJustifyingStudentId(null);
      setJustificationData(initialJustificationData);
    }
  }, [isOpen]);

  const normalizeText = (value: string = ''): string => {
    return value
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const normalizeIdentity = (value: string = ''): string => {
    return value.replace(/\D/g, '');
  };

  const getInitials = (nombre: string): string => {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const filteredEstudiantes = useMemo(() => {
    const search = normalizeText(searchTerm);
    const searchIdentity = normalizeIdentity(searchTerm);

    if (!search && !searchIdentity) {
      return localEstudiantes;
    }

    return localEstudiantes.filter((estudiante) => {
      const nombre = normalizeText(estudiante.nombre);
      const identificacionTexto = normalizeText(estudiante.identificacion || '');
      const identificacionNumerica = normalizeIdentity(estudiante.identificacion || '');

      return (
        nombre.includes(search) ||
        identificacionTexto.includes(search) ||
        (searchIdentity.length > 0 && identificacionNumerica.includes(searchIdentity))
      );
    });
  }, [localEstudiantes, searchTerm]);

  const resetJustificationForm = () => {
    setJustifyingStudentId(null);
    setJustificationData(initialJustificationData);
  };

  const handleOpenJustification = (id: number) => {
    setJustifyingStudentId(id);
    setJustificationData(initialJustificationData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (!file) {
      setJustificationData((prev) => ({
        ...prev,
        archivoSoporte: null
      }));
      return;
    }

    if (!validFileTypes.includes(file.type)) {
      alert('Tipo de archivo no permitido. Solo se permite PDF, JPG, JPEG o PNG.');
      e.target.value = '';
      return;
    }

    if (file.size > maxFileSize) {
      alert('El archivo no debe superar los 5 MB.');
      e.target.value = '';
      return;
    }

    setJustificationData((prev) => ({
      ...prev,
      archivoSoporte: file
    }));
  };

  const setAttendance = async (
    estudiante: Estudiante,
    estado: 'presente' | 'ausente' | 'justificada',
    justificationOptions?: JustificationData
  ) => {
    setLoadingId(estudiante.idMatriculaAcademica);

    try {
      if (estado === 'justificada') {
        const formData = new FormData();

        formData.append('idMatriculaAcademica', String(estudiante.idMatriculaAcademica));
        formData.append('idMatricula', String(estudiante.idMatricula));
        formData.append('idMateria', String(idMateria));
        formData.append(
          'idAsignacionPeriodoProgramaJornada',
          String(idAsignacionPeriodoProgramaJornada)
        );
        formData.append('asistio', 'false');
        formData.append('justificada', 'true');
        formData.append('tipoExcusa', justificationOptions?.tipoExcusa || '');
        formData.append('observacionExcusa', justificationOptions?.observacionExcusa || '');

        if (idHorarioMateria) {
          formData.append('idHorarioMateria', String(idHorarioMateria));
        }

        if (justificationOptions?.archivoSoporte) {
          formData.append('archivoSoporte', justificationOptions.archivoSoporte);
        }

        formData.append('_method', 'PUT');

        await axios.post('update_assistance', formData, {
          headers: {
            Accept: 'application/json'
          }
        });
      } else {
        const payloadData: any = {
          idMatriculaAcademica: estudiante.idMatriculaAcademica,
          idMatricula: estudiante.idMatricula,
          idMateria,
          idAsignacionPeriodoProgramaJornada,
          asistio: estado === 'presente',
          justificada: false
        };

        if (idHorarioMateria) {
          payloadData.idHorarioMateria = idHorarioMateria;
        }

        await axios.put('update_assistance', payloadData);
      }

      setLocalEstudiantes((prev) =>
        prev.map((e) =>
          e.idMatriculaAcademica === estudiante.idMatriculaAcademica
            ? {
                ...e,
                asistio: estado === 'presente',
                estadoLocal: estado
              }
            : e
        )
      );

      if (onAttendanceUpdated) {
        onAttendanceUpdated();
      }

      if (estado === 'justificada') {
        resetJustificationForm();
      }
    } catch (error) {
      console.error('Error al actualizar asistencia', error);
      alert('Error al actualizar la asistencia.');
    } finally {
      setLoadingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Justificaciones</h2>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Buscador */}
        <div className="px-4 pt-4 pb-3 border-b bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Buscar estudiante..."
              autoFocus
              data-no-uppercase
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
            />

            <svg
              className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z"
              />
            </svg>
          </div>

          <p className="mt-2 text-xs text-gray-500">
            Mostrando {filteredEstudiantes.length} de {localEstudiantes.length} estudiantes
          </p>
        </div>

        {/* Lista de Estudiantes */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {filteredEstudiantes.map((estudiante) => (
            <React.Fragment key={estudiante.idMatriculaAcademica}>
              <div
                className={`flex justify-between items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors z-10 relative ${
                  justifyingStudentId === estudiante.idMatriculaAcademica
                    ? 'rounded-b-none border-b-transparent bg-gray-50'
                    : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {estudiante.fotoUrl ? (
                    <img
                      src={estudiante.fotoUrl}
                      alt={estudiante.nombre}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = '/media/avatars/blank.png';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {getInitials(estudiante.nombre)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <Tooltip title={estudiante.nombre} placement="top" arrow>
                      <p className="text-gray-700 font-medium truncate cursor-pointer hover:text-blue-600 transition-colors">
                        {estudiante.nombre}
                      </p>
                    </Tooltip>

                    {estudiante.identificacion && (
                      <p className="text-xs text-gray-500 truncate">
                        ID: {estudiante.identificacion}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenJustification(estudiante.idMatriculaAcademica)}
                    disabled={loadingId === estudiante.idMatriculaAcademica}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      loadingId === estudiante.idMatriculaAcademica
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    } ${
                      estudiante.estadoLocal === 'justificada'
                        ? 'bg-yellow-500 text-white shadow-sm ring-1 ring-yellow-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                    }`}
                  >
                    {loadingId === estudiante.idMatriculaAcademica
                      ? 'Guardando...'
                      : 'Justificar'}
                  </button>
                </div>
              </div>

              {/* Formulario Inline de Justificación */}
              {justifyingStudentId === estudiante.idMatriculaAcademica && (
                <div className="p-3 border-x border-b rounded-b-lg bg-yellow-50/50 mt-[-0.5rem] mb-2 text-sm border-yellow-200">
                  <div className="mb-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Tipo de Excusa
                    </label>

                    <select
                      value={justificationData.tipoExcusa}
                      onChange={(e) =>
                        setJustificationData((prev) => ({
                          ...prev,
                          tipoExcusa: e.target.value
                        }))
                      }
                      className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 py-1"
                    >
                      <option value="FUERZA MAYOR">Fuerza Mayor</option>
                      <option value="PERMISO ESTUDIANTIL">Permiso Estudiantil</option>
                      <option value="PERMISO LABORAL">Permiso Laboral</option>
                      <option value="PERMISO MEDICO">Permiso Médico</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Observación
                    </label>

                    <textarea
                      value={justificationData.observacionExcusa}
                      onChange={(e) =>
                        setJustificationData((prev) => ({
                          ...prev,
                          observacionExcusa: e.target.value
                        }))
                      }
                      placeholder="Detalles sobre la inasistencia..."
                      className="w-full text-sm rounded-md border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 resize-none h-16"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Documento de soporte
                    </label>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200 transition-colors"
                    />

                    <p className="mt-1 text-[11px] text-gray-500">
                      Formatos permitidos: PDF, JPG, JPEG o PNG. Máximo 5 MB.
                    </p>

                    {justificationData.archivoSoporte && (
                      <p className="mt-1 text-xs text-green-600 font-medium truncate">
                        ✓ {justificationData.archivoSoporte.name}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetJustificationForm}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-xs font-semibold transition-colors"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendance(estudiante, 'justificada', justificationData)}
                      disabled={loadingId === estudiante.idMatriculaAcademica}
                      className={`px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-semibold transition-colors ${
                        loadingId === estudiante.idMatriculaAcademica
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      Guardar Justificación
                    </button>
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}

          {filteredEstudiantes.length === 0 && (
            <div className="text-center p-6 text-gray-500">
              {searchTerm
                ? 'No se encontraron estudiantes con ese nombre o identificación.'
                : 'No hay estudiantes para mostrar.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeAttendanceModal;