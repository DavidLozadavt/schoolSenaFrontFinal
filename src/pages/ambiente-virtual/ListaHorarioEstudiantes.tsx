import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GraficaAsistencia from '../asistencias/GraficaAsistencia';
import TakeAttendanceModal from '../asistencias/TakeAttendanceModal';
import AnotacionesDiciplinariasModal from '@/pages/anotaciones-disciplinarias/ModalAnotacionesDisciplinarias';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';
import { KeenIcon } from '@/components';

// Interfaces TypeScript basadas en la respuesta del backend
interface Persona {
  id: number;
  identificacion: string;
  nombre1: string;
  nombre2?: string | null;
  apellido1: string;
  apellido2?: string | null;
  email: string;
  telefonoFijo?: string | null;
  celular?: string | null;
  rutaFoto?: string;
  rutaFotoUrl?: string;
  sexo: string;
}

interface Matricula {
  id: number;
  fecha: string;
  idAcudiente: number;
  idFicha: number;
  idPersona: number;
  idCompany: number;
  idGrado: number;
  estado: string;
  observacion?: string | null;
  condicionado?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  person: Persona;
  acudiente?: Persona;
}

interface Ficha {
  id: number;
  idJornada: number;
  idAsignacion: number;
  created_at?: string;
  updated_at?: string;
  codigo: string;
  idInstructorLider: number;
  documento: string;
  idAprendizVocero?: number | null;
  idAprendizSuplente?: number | null;
  idInfraestructura: number;
  idSede: number;
  idRegional?: number | null;
  porcentajeEjecucion: number;
  rutaDocumentoUrl?: string | null;
}

interface Materia {
  id: number;
  nombreMateria: string;
  descripcion: string;
  rutaDoc?: string | null;
  idMateriaPadre?: number;
  codigo: string;
  creditos: number;
  horas: string;
  created_at?: string;
  updated_at?: string;
  idCompany: number;
  porcentaje?: number | null;
  idAreaConocimiento: number;
  DocUrl?: string;
}

interface StudentData {
  id: number;
  idFicha: number;
  idGradoMateria: number;
  idMatricula: number;
  estado: string;
  asistio?: boolean | null; // <--- ADDED START
  idAsistencia?: number; // <--- ADDED END
  created_at?: string | null;
  updated_at?: string | null;
  idEvaluador?: number | null;
  observacion?: string | null;
  idMateria: number;
  notaParcial?: number | null;
  matricula: Matricula;
  ficha: Ficha;
  materia: Materia;
}

interface StudentListProps {
  materiaData: {
    idFicha: number;
    idJornada: string;
    idMateria: string | number;
    idPrograma?: string;
    programa_nombre?: string;
    horaInicial?: string;
    horaFinal?: string;
    idGrado?: string | number;
    estadoClase?: string;
    idHorarioMateria?: number; // Identifica el horario exacto para soportar dos clases el mismo día
  };
}

const StudentListByMateria: React.FC<StudentListProps> = ({ materiaData }) => {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAttendanceModal, setShowAttendanceModal] = useState<boolean>(false);

  // Estado para Acudiente
  const [showAcudienteModal, setShowAcudienteModal] = useState<boolean>(false);
  const [selectedAcudiente, setSelectedAcudiente] = useState<Persona | null>(null);

  // Estado para Anotaciones Disciplinarias
  const [showAnotacionesModal, setShowAnotacionesModal] = useState<boolean>(false);
  const [selectedMatriculaId, setSelectedMatriculaId] = useState<number | null>(null);

  const openAnotacionesMenu = (idMatricula: number) => {
    setSelectedMatriculaId(idMatricula);
    setShowAnotacionesModal(true);
  };
  const encodeData = (data: any): string => {
    return JSON.stringify(data);
  };

  // Función para hacer toggle de asistencia directamente desde la card
  const handleAttendanceToggle = async (student: StudentData) => {
    try {
      const isCurrentlyPresent = student.asistio === true;
      const newStatus = !isCurrentlyPresent;

      // Optimistic update en UI
      setStudents(prev => prev.map(s =>
        s.idMatricula === student.idMatricula ? { ...s, asistio: newStatus } : s
      ));

      const payload: Record<string, any> = {
        idMatriculaAcademica: student.id,
        idMatricula: student.idMatricula,
        idMateria: typeof materiaData.idMateria === 'string' ? parseInt(materiaData.idMateria) : materiaData.idMateria,
        asistio: newStatus
      };

      // Pasar el horario exacto si está disponible:
      // Permite que la misma materia dictada dos veces el mismo día
      // genere sesiones de asistencia independientes.
      if (materiaData.idHorarioMateria) {
        payload.idHorarioMateria = materiaData.idHorarioMateria;
      }

      await axios.put('update_assistance', payload);

    } catch (error) {
      console.error("Error al actualizar asistencia", error);
      // Revertir el optimistic update si falla
      fetchStudents();
    }
  };

  // Función para obtener estudiantes
  // En StudentListByMateria.tsx, dentro de fetchStudents:

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData: Record<string, any> = {
        idMateria: typeof materiaData.idMateria === 'string'
          ? parseInt(materiaData.idMateria)
          : materiaData.idMateria,
        idFicha: materiaData.idFicha
      };

      // Incluir el horario exacto para que el backend cree la sesión correcta
      if (materiaData.idHorarioMateria) {
        requestData.idHorarioMateria = materiaData.idHorarioMateria;
      }

      console.log('🎯 [StudentList] Enviando datos al backend:', requestData);
      console.log('🎯 [StudentList] Estado de la clase recibido:', materiaData.estadoClase);
      console.log('🎯 [StudentList] URL completa:', `get_student_by_id_materia?data_encoded=${encodeURIComponent(JSON.stringify(requestData))}`);

      const dataEncoded = encodeData(requestData);

      const response = await axios.get(
        `get_student_by_id_materia`,
        {
          params: { data_encoded: dataEncoded }
        }
      );

      console.log('[StudentList] Respuesta del backend:', response.data);
      console.log('[StudentList] Tipo de respuesta:', Array.isArray(response.data) ? 'array' : typeof response.data);
      console.log('[StudentList] Cantidad de estudiantes:', response.data?.length || 0);

      if (Array.isArray(response.data)) {
        console.log('[StudentList] Primer estudiante:', response.data[0]);
        // Obtener la fecha de hoy en formato YYYY-MM-DD para comparar con fechaSesion
        const hoyStr = new Date().toISOString().split('T')[0];

        const mappedStudents = response.data.map((s: any) => {
          let asistioVal = false;
          if (s.asistencias && s.asistencias.length > 0) {
            // Buscar la asistencia de la sesión EXACTA de HOY:
            // - Misma fecha (hoy)
            // - Mismo horario (idHorarioMateria) si está disponible
            //   → distingue dos clases de la misma materia el mismo día
            const asistenciaHoy = s.asistencias.find((ast: any) => {
              const sm = ast.sesion_materia ?? ast.sesionMateria ?? null;
              const fechaSesion = sm?.fechaSesion ?? sm?.fecha_sesion ?? ast.fecha_sesion ?? null;
              if (!fechaSesion) return false;

              const fechaMatch = fechaSesion.split('T')[0] === hoyStr;
              if (!fechaMatch) return false;

              // Si tenemos el horario exacto, verificar que la sesión pertenezca a él
              // (evita que la asistencia de la clase de las 8am aparezca en la de las 2pm)
              if (materiaData.idHorarioMateria && sm?.idHorarioMateria !== undefined) {
                return sm.idHorarioMateria === materiaData.idHorarioMateria;
              }

              return true; // sin idHorarioMateria, cualquier sesión de hoy sirve
            });

            if (asistenciaHoy) {
              // Hay registro de esta sesión de hoy → usar su valor
              asistioVal = asistenciaHoy.asistio === 1 || asistenciaHoy.asistio === true;
            } else {
              // Sin registro para esta sesión → estado inicial Falta
              asistioVal = false;
            }
          }
          return { ...s, asistio: asistioVal };
        });

        setStudents(mappedStudents);
      } else {
        console.warn('[StudentList] Formato de respuesta inesperado:', response.data);
        setStudents([]);
      }
    } catch (err: any) {
      console.error('[StudentList] Error fetching students:', err);
      console.error('[StudentList] Mensaje:', err.message);
      console.error('[StudentList] Respuesta:', err.response?.data);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al cargar los estudiantes'
      );
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // useEffect para cargar datos cuando cambia materiaData
  useEffect(() => {
    if (materiaData?.idMateria && materiaData?.idFicha) {
      fetchStudents();
    }
  }, [materiaData.idMateria, materiaData.idFicha, materiaData.idHorarioMateria]);

  // Función para obtener nombre completo
  const getFullName = (student: StudentData): string => {
    const persona = student.matricula?.person;
    if (!persona) return 'Sin nombre';

    const nombres = [persona.nombre1, persona.nombre2].filter(Boolean).join(' ');
    const apellidos = [persona.apellido1, persona.apellido2].filter(Boolean).join(' ');
    return `${nombres} ${apellidos}`.trim();
  };

  // Función para obtener foto del estudiante
  const getStudentPhoto = (student: StudentData): string => {
    const API_URL = import.meta.env.VITE_APP_API_URL || '';
    // Laravel storage a menudo sirve los archivos en la raíz del backend (quitamos /api/ si existe en la variable)
    const baseUrl = API_URL.endsWith('/api/') ? API_URL.slice(0, -5) : API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

    // Prioridad: rutaFoto (ya que confirmaste que tiene /storage/persona/...)
    if (student.matricula?.person?.rutaFoto) {
      const rutaRelativa = student.matricula.person.rutaFoto;
      return rutaRelativa.startsWith('http') ? rutaRelativa : `${baseUrl}${rutaRelativa.startsWith('/') ? '' : '/'}${rutaRelativa}`;
    }

    // Segunda: rutaFotoUrl de la persona
    if (student.matricula?.person?.rutaFotoUrl) {
      const rutaRelativa = student.matricula.person.rutaFotoUrl;
      return rutaRelativa.startsWith('http') ? rutaRelativa : `${baseUrl}${rutaRelativa.startsWith('/') ? '' : '/'}${rutaRelativa}`;
    }

    // Default: Avatar por defecto
    return '/media/avatars/blank.png';
  };

  // Función para obtener email
  const getStudentEmail = (student: StudentData): string => {
    return student.matricula?.person?.email || 'Sin email';
  };

  // Función para obtener identificación
  const getStudentIdentificacion = (student: StudentData): string => {
    return student.matricula?.person?.identificacion || 'N/A';
  };

  // Función para obtener celular
  const getStudentCelular = (student: StudentData): string => {
    return student.matricula?.person?.celular || 'No registrado';
  };

  // Función para obtener estado con estilo
  const getStatusBadge = (estado: string): JSX.Element => {
    const statusColors: Record<string, string> = {
      'ACTIVO': 'bg-green-100 text-green-800',
      'INACTIVO': 'bg-red-100 text-red-800',
      'POR EVALUAR': 'bg-yellow-100 text-yellow-800',
      'APROBADO': 'bg-green-100 text-green-800',
      'REPROBADO': 'bg-red-100 text-red-800',
      'CURSANDO': 'bg-blue-100 text-blue-800',
      'PENDIENTE': 'bg-gray-100 text-gray-800',
      'EN LÍNEA': 'bg-green-100 text-green-800',
      'ONLINE': 'bg-green-100 text-green-800',
      'DESCONECTADO': 'bg-gray-100 text-gray-800'
    };

    const colorClass = statusColors[estado] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {estado}
      </span>
    );
  };

  // Función para mostrar detalles del estudiante
  const showStudentDetails = (student: StudentData) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  // Función para cerrar modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
  };

  // Función para mostrar modal de Acudiente
  const showAcudienteDetails = (student: StudentData) => {
    if (student.matricula?.acudiente) {
      setSelectedAcudiente(student.matricula.acudiente);
    } else {
      setSelectedAcudiente(null);
    }
    setShowAcudienteModal(true);
  };

  const closeAcudienteModal = () => {
    setShowAcudienteModal(false);
    setSelectedAcudiente(null);
  };

  const filteredStudents = students.filter(student => {
    const fullName = getFullName(student).toLowerCase();
    const identificacion = getStudentIdentificacion(student).toLowerCase();
    const search = searchTerm.toLowerCase();
    return fullName.includes(search) || identificacion.includes(search);
  });

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Buscar por nombre o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm shadow-sm"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          onClick={() => setShowAttendanceModal(true)}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          Justificaciones
        </button>
      </div>

      {/* Header Compacto */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Estudiantes de la Clase
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ficha: {materiaData.idFicha} | {materiaData.programa_nombre || materiaData.idPrograma}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total: <span className="font-semibold text-gray-900 dark:text-white">{filteredStudents.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Cargando estudiantes...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Students Grid */}
      {!loading && !error && filteredStudents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.map((student) => {
            const fullName = getFullName(student);
            const photo = getStudentPhoto(student);
            const email = getStudentEmail(student);

            return (
              <div
                key={student.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="text-center">
                  <img
                    className="w-16 h-16 rounded-full mx-auto mb-3 object-cover border-2 border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity hover:ring-2 hover:ring-blue-400"
                    src={photo}
                    alt={fullName}
                    onClick={() => setSelectedPhotoUrl(photo)}
                    title="Click para ampliar imagen"
                    onError={(e) => {
                      e.currentTarget.src = '/media/avatars/blank.png';
                    }}
                  />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {fullName}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
                    {email}
                  </p>
                  <div className="mb-3">
                    {getStatusBadge(student.estado)}
                  </div>

                  {(materiaData.estadoClase === 'EN_CURSO' || materiaData.estadoClase === 'EN CURSO') && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <button
                        onClick={() => handleAttendanceToggle(student)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 
                          ${student.asistio
                            ? 'bg-green-500 hover:bg-green-600 text-white focus:ring-green-400'
                            : 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
                          }`}
                        title={student.asistio ? 'Marcar como ausente' : 'Marcar como presente'}
                      >
                        {student.asistio ? 'Presente' : 'Falta'}
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <GraficaAsistencia idMatricula={student.idMatricula} />
                    <button
                      onClick={() => showStudentDetails(student)}
                      className="btn btn-sm btn-icon btn-light btn-active-light-primary"
                      title="Ver detalles"
                    >
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => showAcudienteDetails(student)}
                      className="btn btn-sm btn-icon btn-light btn-active-light-success"
                      title="Familiares/Acudiente"
                    >
                      <KeenIcon icon="users" className="text-green-600 dark:text-green-400 text-base" />
                    </button>
                    <button
                      onClick={() => openAnotacionesMenu(student.idMatricula)}
                      className="btn btn-sm btn-icon btn-light btn-active-light-danger"
                      title="Anotaciones Disciplinarias"
                    >
                      <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && students.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No se encontraron estudiantes</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No hay estudiantes registrados para esta materia.</p>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && students.length > 0 && filteredStudents.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay coincidencias</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No se encontraron estudiantes con ese nombre o identificación.</p>
        </div>
      )}

      {/* Modal for Student Details */}
      {showModal && selectedStudent && (
        <Modal open={true} onClose={closeModal}>
          <ModalContent className="max-w-[600px] top-[10%] p-4">
            <ModalHeader>
              <ModalTitle>Detalles del Estudiante</ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={closeModal}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="grid gap-5 py-5 text-sm text-gray-700 font-medium">
              <div className="flex items-center gap-4 mb-2">
                <img
                  className="h-16 w-16 rounded-full border border-gray-200"
                  src={getStudentPhoto(selectedStudent)}
                  alt={getFullName(selectedStudent)}
                  onError={(e) => {
                    e.currentTarget.src = '/media/avatars/blank.png';
                  }}
                />
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 leading-tight">
                    {getFullName(selectedStudent)}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {getStudentEmail(selectedStudent)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Identificación</label>
                  <p className="mt-1">
                    {getStudentIdentificacion(selectedStudent)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Teléfono</label>
                  <p className="mt-1">
                    {getStudentCelular(selectedStudent)}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedStudent.estado)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase">Nota Parcial</label>
                  <p className="mt-1">
                    {selectedStudent.notaParcial !== null ? selectedStudent.notaParcial : 'No calificado'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase">Observaciones</label>
                <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded min-h-[60px]">
                  {selectedStudent.observacion || 'Sin observaciones'}
                </div>
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={closeModal}
                  className="btn btn-sm btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal for Acudiente / Familiar */}
      {showAcudienteModal && (
        <Modal open={true} onClose={closeAcudienteModal}>
          <ModalContent className="max-w-[500px] top-[15%] p-4">
            <ModalHeader>
              <ModalTitle className="flex items-center gap-2">
                <KeenIcon icon="users" className="text-green-600" />
                Datos del Familiar / Acudiente
              </ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={closeAcudienteModal}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="grid gap-5 py-5 text-sm text-gray-700 font-medium">
              {selectedAcudiente ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center justify-center w-14 h-14 bg-gray-100 rounded-full border border-gray-200 text-gray-500 text-2xl font-semibold">
                      {selectedAcudiente.nombre1?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 leading-tight">
                        {[selectedAcudiente.nombre1, selectedAcudiente.nombre2, selectedAcudiente.apellido1, selectedAcudiente.apellido2].filter(Boolean).join(' ')}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {selectedAcudiente.email || 'Sin correo electrónico'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Identificación</label>
                      <p className="mt-1">
                        {selectedAcudiente.identificacion || 'No registrada'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Teléfono Celular</label>
                      <p className="mt-1">
                        {selectedAcudiente.celular || 'No registrado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Teléfono Fijo</label>
                      <p className="mt-1">
                        {selectedAcudiente.telefonoFijo || 'No registrado'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase">Género</label>
                      <p className="mt-1">
                        {selectedAcudiente.sexo === '1' ? 'Masculino' : selectedAcudiente.sexo === '2' ? 'Femenino' : selectedAcudiente.sexo || 'No registrado'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <KeenIcon icon="information-2" className="text-4xl mb-3 opacity-50 text-gray-400" />
                  <p>Este estudiante no tiene un acudiente o familiar registrado.</p>
                </div>
              )}

              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={closeAcudienteModal}
                  className="btn btn-sm btn-secondary"
                >
                  Cerrar
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal for Anotaciones Disciplinarias */}
      <AnotacionesDiciplinariasModal
        open={showAnotacionesModal}
        onClose={() => setShowAnotacionesModal(false)}
        idMatricula={selectedMatriculaId || 0}
      />

      <TakeAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        estudiantes={students.map(s => ({
          idMatriculaAcademica: s.id,
          idMatricula: s.idMatricula,
          nombre: getFullName(s),
          asistio: null
        }))}
        idMateria={typeof materiaData.idMateria === 'string' ? parseInt(materiaData.idMateria) : materiaData.idMateria}
        idAsignacionPeriodoProgramaJornada={materiaData.idFicha}
        onAttendanceUpdated={fetchStudents}
      />

      {/* Photo Zoom Modal */}
      {selectedPhotoUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
          onClick={() => setSelectedPhotoUrl(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhotoUrl(null);
              }}
              className="absolute -top-12 right-0 md:-right-12 text-white hover:text-gray-300 focus:outline-none p-2 rounded-full hover:bg-white/10 transition-colors"
              title="Cerrar (Click fuera de la imagen también cierra)"
            >
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img
              src={selectedPhotoUrl}
              alt="Ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentListByMateria;