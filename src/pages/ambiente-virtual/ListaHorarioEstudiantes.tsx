import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import GraficaAsistencia from '../asistencias/GraficaAsistencia';
import TakeAttendanceModal from '../asistencias/TakeAttendanceModal';
import AnotacionesDiciplinariasModal from '@/pages/anotaciones-disciplinarias/ModalAnotacionesDisciplinarias';
import { Modal, ModalContent, ModalHeader, ModalTitle, ModalBody } from '@/components/modal';
import { KeenIcon } from '@/components';
import { Tooltip } from '@mui/material';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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


interface PermisoAsistencia {
  tienePermiso?: boolean;
  estado?: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | string;
  fechaInicial?: string | null;
  fechaFinal?: string | null;
  tipoExcusa?: string | null;
  observacion?: string | null;
  archivoSoporte?: string | null;
  archivoSoporteUrl?: string | null;
  urlDocumento?: string | null;
  autorizadoPor?: string | null;
  fechaRespuesta?: string | null;
  observacionInstructor?: string | null;
  excusa?: {
    tipoExcusa?: string | null;
    observacion?: string | null;
    fechaInicialJustificacion?: string | null;
    fechaFinalJustificacion?: string | null;
    urlDocumento?: string | null;
  };
}
interface StudentData {
  id: number;
  idFicha: number;
  idGradoMateria: number;
  idMatricula: number;
  estado: string;
  asistio?: boolean | null;
  idAsistencia?: number;
  created_at?: string | null;
  updated_at?: string | null;
  idEvaluador?: number | null;
  observacion?: string | null;
  idMateria: number;
  notaParcial?: number | null;
  matricula: Matricula;
  ficha: Ficha;
  materia: Materia;
  evaluador?: Persona | null;
  permisoAsistencia?: PermisoAsistencia | null;
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
    idHorarioMateria?: number;
    ficha_codigo?: string;
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

  // Estado para menú de exportación
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  // Estado para Acudiente
  const [showAcudienteModal, setShowAcudienteModal] = useState<boolean>(false);
  const [selectedAcudiente, setSelectedAcudiente] = useState<Persona | null>(null);
  const [selectedPermiso, setSelectedPermiso] = useState<PermisoAsistencia | null>(null);

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
      setStudents(prev =>
        prev.map(s =>
          s.idMatricula === student.idMatricula ? { ...s, asistio: newStatus } : s
        )
      );

      const payload: Record<string, any> = {
        idMatriculaAcademica: student.id,
        idMatricula: student.idMatricula,
        idMateria:
          typeof materiaData.idMateria === 'string'
            ? parseInt(materiaData.idMateria)
            : materiaData.idMateria,
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
      console.error('Error al actualizar asistencia', error);
      // Revertir el optimistic update si falla
      fetchStudents();
    }
  };

  // Función para obtener estudiantes
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestData: Record<string, any> = {
        idMateria:
          typeof materiaData.idMateria === 'string'
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
      console.log(
        '🎯 [StudentList] URL completa:',
        `get_student_by_id_materia?data_encoded=${encodeURIComponent(JSON.stringify(requestData))}`
      );

      const dataEncoded = encodeData(requestData);

      const response = await axios.get('get_student_by_id_materia', {
        params: { data_encoded: dataEncoded, ts: new Date().getTime() }
      });

      console.log('[StudentList] Respuesta del backend:', response.data);
      console.log(
        '[StudentList] Tipo de respuesta:',
        Array.isArray(response.data) ? 'array' : typeof response.data
      );
      console.log('[StudentList] Cantidad de estudiantes:', response.data?.length || 0);

      if (Array.isArray(response.data)) {
        console.log('[StudentList] Primer estudiante:', response.data[0]);

        // Obtener la fecha de hoy en formato YYYY-MM-DD local
        const hoy = new Date();
        const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

        const mappedStudents = response.data.map((s: any) => {
          let asistioVal = false;

          if (s.asistencias && s.asistencias.length > 0) {
            // Buscar TODAS las asistencias de la sesión EXACTA de HOY:
            const asistenciasHoy = s.asistencias.filter((ast: any) => {
              const sm = ast.sesion_materia ?? ast.sesionMateria ?? null;
              const fechaSesion = sm?.fechaSesion ?? sm?.fecha_sesion ?? ast.fecha_sesion ?? null;

              if (!fechaSesion) return false;

              // Ensure we just safely grab the first 10 chars "YYYY-MM-DD"
              const fechaMatch = String(fechaSesion).substring(0, 10) === hoyStr;
              if (!fechaMatch) return false;

              // Si tenemos el horario exacto, verificar que la sesión pertenezca a él
              const idHorarioMateriaBackend = sm?.idHorarioMateria ?? sm?.id_horario_materia;

              if (
                materiaData.idHorarioMateria &&
                idHorarioMateriaBackend !== undefined &&
                idHorarioMateriaBackend !== null
              ) {
                return Number(idHorarioMateriaBackend) === Number(materiaData.idHorarioMateria);
              }

              return true; // sin idHorarioMateria, cualquier sesión de hoy sirve
            });

            if (asistenciasHoy && asistenciasHoy.length > 0) {
              // Si hay registros de esta sesión, priorizar si ALGUNO dice que asistió
              asistioVal = asistenciasHoy.some(
                (ast: any) =>
                  ast.asistio === 1 ||
                  ast.asistio === '1' ||
                  ast.asistio === true ||
                  String(ast.asistio).toLowerCase() === 'true'
              );
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

  // Cerrar menú de exportación al hacer clic afuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

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

    // Laravel storage a menudo sirve los archivos en la raíz del backend
    // quitamos /api/ si existe en la variable.
    const baseUrl = API_URL.endsWith('/api/')
      ? API_URL.slice(0, -5)
      : API_URL.endsWith('/')
        ? API_URL.slice(0, -1)
        : API_URL;

    // Prioridad: rutaFoto
    if (student.matricula?.person?.rutaFoto) {
      const rutaRelativa = student.matricula.person.rutaFoto;

      return rutaRelativa.startsWith('http')
        ? rutaRelativa
        : `${baseUrl}${rutaRelativa.startsWith('/') ? '' : '/'}${rutaRelativa}`;
    }

    // Segunda: rutaFotoUrl de la persona
    if (student.matricula?.person?.rutaFotoUrl) {
      const rutaRelativa = student.matricula.person.rutaFotoUrl;

      return rutaRelativa.startsWith('http')
        ? rutaRelativa
        : `${baseUrl}${rutaRelativa.startsWith('/') ? '' : '/'}${rutaRelativa}`;
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
      ACTIVO: 'bg-green-100 text-green-800',
      INACTIVO: 'bg-red-100 text-red-800',
      'POR EVALUAR': 'bg-yellow-100 text-yellow-800',
      APROBADO: 'bg-green-100 text-green-800',
      REPROBADO: 'bg-red-100 text-red-800',
      CURSANDO: 'bg-blue-100 text-blue-800',
      PENDIENTE: 'bg-gray-100 text-gray-800',
      'EN LÍNEA': 'bg-green-100 text-green-800',
      ONLINE: 'bg-green-100 text-green-800',
      DESCONECTADO: 'bg-gray-100 text-gray-800'
    };

    const colorClass = statusColors[estado] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {estado}
      </span>
    );
  };

  const getPermisoEstado = (permiso?: PermisoAsistencia | null): string => {
    return String(permiso?.estado || '').toUpperCase();
  };

  const estudianteTienePermiso = (permiso?: PermisoAsistencia | null): boolean => {
    if (!permiso) return false;

    const estado = getPermisoEstado(permiso);
    return permiso.tienePermiso === true || ['PENDIENTE', 'APROBADO', 'RECHAZADO'].includes(estado);
  };

  const getPermisoBadgeClass = (estado?: string): string => {
    const estadoNormalizado = String(estado || '').toUpperCase();

    if (estadoNormalizado === 'APROBADO') {
      return 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/25 dark:text-green-300 dark:border-green-700/60';
    }

    if (estadoNormalizado === 'PENDIENTE') {
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/25 dark:text-yellow-300 dark:border-yellow-700/60';
    }

    return 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/25 dark:text-red-300 dark:border-red-700/60';
  };

  const getPermisoLabel = (permiso?: PermisoAsistencia | null): string => {
    const estado = getPermisoEstado(permiso);

    if (estado === 'APROBADO') return 'Permiso aprobado';
    if (estado === 'PENDIENTE') return 'Permiso pendiente';
    if (estado === 'RECHAZADO') return 'Permiso rechazado';

    return 'Tiene permiso';
  };

  const getPermisoTipoExcusa = (permiso?: PermisoAsistencia | null): string => {
    return permiso?.tipoExcusa || permiso?.excusa?.tipoExcusa || 'Sin tipo registrado';
  };

  const getPermisoObservacion = (permiso?: PermisoAsistencia | null): string => {
    return permiso?.observacion || permiso?.excusa?.observacion || 'Sin observación registrada';
  };

  const getPermisoFechaInicial = (permiso?: PermisoAsistencia | null): string => {
    return permiso?.fechaInicial || permiso?.excusa?.fechaInicialJustificacion || 'Sin fecha inicial';
  };

  const getPermisoFechaFinal = (permiso?: PermisoAsistencia | null): string => {
    return permiso?.fechaFinal || permiso?.excusa?.fechaFinalJustificacion || 'Sin fecha final';
  };

  const getPermisoArchivoUrl = (permiso?: PermisoAsistencia | null): string | null => {
    return permiso?.archivoSoporteUrl || permiso?.urlDocumento || permiso?.excusa?.urlDocumento || null;
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

  const normalizeText = (value: string): string =>
    value
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const normalizeIdentity = (value: string): string => value.replace(/\D/g, '');

  const filteredStudents = students.filter((student) => {
    const search = normalizeText(searchTerm);
    const searchIdentity = normalizeIdentity(searchTerm);

    const fullName = normalizeText(getFullName(student));
    const identificacionTexto = normalizeText(getStudentIdentificacion(student));
    const identificacionNumerica = normalizeIdentity(getStudentIdentificacion(student));

    return (
      fullName.includes(search) ||
      identificacionTexto.includes(search) ||
      (searchIdentity.length > 0 && identificacionNumerica.includes(searchIdentity))
    );
  });

  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Estudiantes');

      // Intentamos cargar el logo
      try {
        const response = await fetch('/media/images/sena/logo-sena-excel-rmi.png');

        if (response.ok) {
          const blob = await response.blob();
          const arrayBuffer = await blob.arrayBuffer();

          const logoId = workbook.addImage({
            buffer: arrayBuffer,
            extension: 'png'
          });

          worksheet.addImage(logoId, {
            tl: { col: 0, row: 0 },
            ext: { width: 80, height: 80 }
          });
        }
      } catch (e) {
        console.warn('No se pudo cargar el logo para Excel', e);
      }

      // Estilo de encabezado del documento
      worksheet.mergeCells('B2:E3');

      const titleCell = worksheet.getCell('B2');
      titleCell.value = 'LISTA DE APRENDICES';
      titleCell.font = {
        name: 'Arial',
        size: 16,
        bold: true,
        color: { argb: 'FF00401A' }
      };
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.getCell('A5').value = 'Programa:';
      worksheet.getCell('A5').font = { bold: true };
      worksheet.getCell('B5').value = materiaData.programa_nombre || 'N/A';

      worksheet.getCell('A6').value = 'Ficha:';
      worksheet.getCell('A6').font = { bold: true };
      worksheet.getCell('B6').value = materiaData.ficha_codigo || materiaData.idFicha || 'N/A';

      // Tabla de estudiantes - Fila de encabezado
      const headerRow = worksheet.getRow(8);
      headerRow.values = ['#', 'Nombre Completo', 'Identificación', 'Correo Electrónico', 'Teléfono', 'Estado', 'Permiso'];

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0072C6' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });

      // Filas de datos
      filteredStudents.forEach((student, index) => {
        const row = worksheet.addRow([
          index + 1,
          getFullName(student),
          getStudentIdentificacion(student),
          getStudentEmail(student),
          getStudentCelular(student),
          'En formación',
          estudianteTienePermiso(student.permisoAsistencia)
            ? getPermisoLabel(student.permisoAsistencia)
            : 'Sin permiso'
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
            right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
          };

          if (colNumber === 1 || colNumber === 6 || colNumber === 7) {
            cell.alignment = { horizontal: 'center' };
          }
        });
      });

      // Ancho automático por columna (según el contenido más largo)
      const minWidths = [5, 30, 18, 28, 16, 16, 22];

      minWidths.forEach((minWidth, index) => {
        const column = worksheet.getColumn(index + 1);
        let maxLength = minWidth;

        column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
          if (rowNumber < 8) return; // ignoramos el encabezado del documento
          const length = String(cell.value ?? '').length;
          if (length > maxLength) maxLength = length;
        });

        column.width = Math.min(maxLength + 4, 55);
      });

      const buffer = await workbook.xlsx.writeBuffer();

      const finalBlob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      saveAs(finalBlob, `Lista_Aprendices_${materiaData.ficha_codigo || 'Ficha'}.xlsx`);
    } catch (error) {
      console.error('Error al generar Excel', error);
      alert('Hubo un error al generar el archivo Excel.');
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Por favor, permite las ventanas emergentes para exportar a PDF.');
      return;
    }

    const logoUrl = `${window.location.origin}/media/images/sena/logo-sena.png`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lista de Aprendices - ${materiaData.ficha_codigo || 'Ficha'}</title>
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
            .header-container { display: flex; align-items: center; justify-content: center; margin-bottom: 20px; border-bottom: 3px solid #0072C6; padding-bottom: 15px; position: relative; }
            .logo { width: 80px; height: auto; position: absolute; left: 0; top: -10px; }
            h1 { text-align: center; font-size: 24px; margin: 0; color: #0072C6; text-transform: uppercase; letter-spacing: 1px; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 25px; background-color: #f8f9fa; padding: 15px 20px; border-radius: 6px; border: 1px solid #eaeaea; }
            .info-item p { margin: 0; font-size: 14px; }
            .info-item strong { color: #444; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; table-layout: fixed; }
            th, td { border: 1px solid #ddd; padding: 7px 8px; text-align: left; word-wrap: break-word; overflow-wrap: anywhere; }
            .col-email { font-size: 10px; }
            th { background-color: #0072C6; color: white; font-weight: 600; text-transform: uppercase; font-size: 12px; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .text-center { text-align: center; }
            @media print {
              body { padding: 0; }
              .header-container { border-bottom: 3px solid #000; }
              h1 { color: #000; }
              th { background-color: #f0f0f0 !important; color: #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .info-grid { background-color: transparent; border: none; padding: 0; margin-bottom: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <img src="${logoUrl}" class="logo" alt="Logo SENA" onerror="this.style.display='none'" />
            <h1>Lista de Aprendices</h1>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <p><strong>Programa:</strong> ${materiaData.programa_nombre || 'N/A'}</p>
            </div>
            <div class="info-item">
              <p><strong>Ficha:</strong> ${materiaData.ficha_codigo || materiaData.idFicha || 'N/A'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 4%">#</th>
                <th style="width: 24%">Nombre Completo</th>
                <th style="width: 12%">Identificación</th>
                <th style="width: 24%">Correo Electrónico</th>
                <th style="width: 12%">Teléfono</th>
                <th class="text-center" style="width: 11%">Estado</th>
                <th class="text-center" style="width: 13%">Permiso</th>
              </tr>
            </thead>

            <tbody>
              ${filteredStudents
                .map(
                  (s, index) => `
                    <tr>
                      <td class="text-center">${index + 1}</td>
                      <td>${getFullName(s)}</td>
                      <td>${getStudentIdentificacion(s)}</td>
                      <td class="col-email">${getStudentEmail(s)}</td>
                      <td>${getStudentCelular(s)}</td>
                      <td class="text-center">En formación</td>
                      <td class="text-center">${estudianteTienePermiso(s.permisoAsistencia) ? getPermisoLabel(s.permisoAsistencia) : 'Sin permiso'}</td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

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
            data-no-uppercase
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder:text-gray-400 dark:bg-coal-500/20 dark:text-gray-100 dark:placeholder:text-gray-400 text-sm shadow-sm"
          />

          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <div ref={exportMenuRef} className="relative w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <KeenIcon icon="file-down" className="text-base" />
              Exportar

              <svg
                className={`w-4 h-4 transition-transform duration-200 ${
                  showExportMenu ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showExportMenu && (
              <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-coal-400">
                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    exportToPDF();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-gray-200 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                    <KeenIcon icon="document" className="text-base" />
                  </span>

                  <span>Exportar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowExportMenu(false);
                    exportToExcel();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-green-50 hover:text-green-700 dark:text-gray-200 dark:hover:bg-green-900/20 dark:hover:text-green-300"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300">
                    <KeenIcon icon="file-down" className="text-base" />
                  </span>

                  <span>Exportar Excel</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAttendanceModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            Justificaciones
          </button>
        </div>
      </div>

      {/* Header Compacto */}
      <div className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600/60 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Estudiantes de la Clase
            </h3>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ficha: {materiaData.ficha_codigo || materiaData.idFicha} |{' '}
              {materiaData.programa_nombre || materiaData.idPrograma}
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total:{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {filteredStudents.length}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            Cargando estudiantes...
          </span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {error}
              </p>
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
                className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600/60 p-4 hover:shadow-md transition-shadow"
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

                  <Tooltip title={fullName} placement="top" arrow>
                    <h4 className="text-[11px] font-semibold text-gray-900 dark:text-white mb-1 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {fullName}
                    </h4>
                  </Tooltip>

                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
                      {email}
                    </p>

                    {estudianteTienePermiso(student.permisoAsistencia) && (
                      <div className="mb-2">
                        <Tooltip title="Clic para ver permiso" placement="top" arrow>
                          <button
                            type="button"
                            onClick={() => setSelectedPermiso(student.permisoAsistencia || null)}
                            className={`inline-flex items-center justify-center px-2 py-1 text-[10px] font-bold rounded-full cursor-pointer transition-opacity hover:opacity-80 ${getPermisoBadgeClass(student.permisoAsistencia?.estado)}`}
                          >
                            {getPermisoLabel(student.permisoAsistencia)}
                          </button>
                        </Tooltip>
                      </div>
                    )}

                  <div className="mb-3">{getStatusBadge(student.estado)}</div>

                  {(materiaData.estadoClase === 'EN_CURSO' ||
                    materiaData.estadoClase === 'EN CURSO') && (
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <button
                        onClick={() => handleAttendanceToggle(student)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          student.asistio
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
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-200 dark:hover:bg-coal-500/40 transition-colors"
                      title="Ver detalles"
                    >
                      <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => showAcudienteDetails(student)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-200 dark:hover:bg-coal-500/40 transition-colors"
                      title="Familiares/Acudiente"
                    >
                      <KeenIcon icon="users" className="text-green-600 dark:text-green-400 text-base" />
                    </button>

                    <button
                      onClick={() => openAnotacionesMenu(student.idMatricula)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-200 dark:hover:bg-coal-500/40 transition-colors"
                      title="Anotaciones Disciplinarias"
                    >
                      <svg
                        className="w-4 h-4 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
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
        <div className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600/60 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>

          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No se encontraron estudiantes
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No hay estudiantes registrados para esta materia.
          </p>
        </div>
      )}

      {/* No Search Results */}
      {!loading && !error && students.length > 0 && filteredStudents.length === 0 && (
        <div className="bg-white dark:bg-coal-400 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600/60 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No hay coincidencias
          </h3>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No se encontraron estudiantes con ese nombre o identificación.
          </p>
        </div>
      )}

      {/* Modal for Student Details */}
      {showModal && selectedStudent && (
        <Modal open={true} onClose={closeModal}>
          <ModalContent className="max-w-[600px] top-[10%] p-4">
            <ModalHeader>
              <ModalTitle>Detalles del Estudiante</ModalTitle>

              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-200 dark:hover:bg-coal-500/40 transition-colors shrink-0"
                onClick={closeModal}
              >
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>

            <ModalBody className="grid gap-5 py-5 text-sm text-gray-700 dark:text-gray-300 font-medium">
              <div className="flex items-center gap-4 mb-2">
                <img
                  className="h-16 w-16 rounded-full border border-gray-200 dark:border-gray-600"
                  src={getStudentPhoto(selectedStudent)}
                  alt={getFullName(selectedStudent)}
                  onError={(e) => {
                    e.currentTarget.src = '/media/avatars/blank.png';
                  }}
                />

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                    {getFullName(selectedStudent)}
                  </h4>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getStudentEmail(selectedStudent)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Identificación
                  </label>

                  <p className="mt-1 text-gray-900 dark:text-white">
                    {getStudentIdentificacion(selectedStudent)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Teléfono
                  </label>

                  <p className="mt-1 text-gray-900 dark:text-white">
                    {getStudentCelular(selectedStudent)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Estado
                  </label>

                  <div className="mt-1">{getStatusBadge(selectedStudent.estado)}</div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                    Nota Parcial
                  </label>

                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedStudent.notaParcial !== null
                      ? selectedStudent.notaParcial
                      : 'No calificado'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Observaciones
                </label>

                <div className="mt-1 p-3 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-gray-600 rounded min-h-[60px] text-gray-900 dark:text-white">
                  {selectedStudent.observacion || 'Sin observaciones'}
                </div>
              </div>

              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={closeModal} className="btn btn-sm btn-secondary">
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
                <KeenIcon icon="users" className="text-green-600 dark:text-green-400" />
                Datos del Familiar / Acudiente
              </ModalTitle>

              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-200 dark:hover:bg-coal-500/40 transition-colors shrink-0"
                onClick={closeAcudienteModal}
              >
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>

            <ModalBody className="grid gap-5 py-5 text-sm text-gray-700 dark:text-gray-300 font-medium">
              {selectedAcudiente ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex items-center justify-center w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 text-2xl font-semibold">
                      {selectedAcudiente.nombre1?.charAt(0) || 'A'}
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
                        {[
                          selectedAcudiente.nombre1,
                          selectedAcudiente.nombre2,
                          selectedAcudiente.apellido1,
                          selectedAcudiente.apellido2
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      </h4>

                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedAcudiente.email || 'Sin correo electrónico'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Identificación
                      </label>

                      <p className="mt-1 text-gray-900 dark:text-white">
                        {selectedAcudiente.identificacion || 'No registrada'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Teléfono Celular
                      </label>

                      <p className="mt-1 text-gray-900 dark:text-white">
                        {selectedAcudiente.celular || 'No registrado'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Teléfono Fijo
                      </label>

                      <p className="mt-1 text-gray-900 dark:text-white">
                        {selectedAcudiente.telefonoFijo || 'No registrado'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                        Género
                      </label>

                      <p className="mt-1 text-gray-900 dark:text-white">
                        {selectedAcudiente.sexo === '1'
                          ? 'Masculino'
                          : selectedAcudiente.sexo === '2'
                            ? 'Femenino'
                            : selectedAcudiente.sexo || 'No registrado'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <KeenIcon
                    icon="information-2"
                    className="text-4xl mb-3 opacity-50 text-gray-400 dark:text-gray-500"
                  />
                  <p>Este estudiante no tiene un acudiente o familiar registrado.</p>
                </div>
              )}

              <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
                <button onClick={closeAcudienteModal} className="btn btn-sm btn-secondary">
                  Cerrar
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {selectedPermiso && (
        <Modal open={true} onClose={() => setSelectedPermiso(null)}>
          <ModalContent className="max-w-[520px] top-[15%] p-4">
            <ModalHeader>
              <ModalTitle className="flex items-center gap-2">
                <KeenIcon icon="notepad-edit" className="text-blue-600 dark:text-blue-400" />
                Información del permiso
              </ModalTitle>

              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-coal-500/20 dark:text-gray-200 dark:hover:bg-coal-500/40 transition-colors shrink-0"
                onClick={() => setSelectedPermiso(null)}
              >
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>

            <ModalBody className="py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</label>
                  <p className="mt-1">
                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${getPermisoBadgeClass(selectedPermiso.estado)}`}>
                      {getPermisoEstado(selectedPermiso) || 'SIN ESTADO'}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Desde</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{getPermisoFechaInicial(selectedPermiso)}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Hasta</label>
                    <p className="mt-1 text-gray-900 dark:text-white">{getPermisoFechaFinal(selectedPermiso)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipo / Razón</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{getPermisoTipoExcusa(selectedPermiso)}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Observación del aprendiz</label>
                  <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                    {getPermisoObservacion(selectedPermiso)}
                  </p>
                </div>

                {selectedPermiso.autorizadoPor && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Atendido por</label>
                    <p className="mt-1 text-gray-900 dark:text-white">
                      {selectedPermiso.autorizadoPor}
                      {selectedPermiso.fechaRespuesta ? ` (${selectedPermiso.fechaRespuesta})` : ''}
                    </p>
                  </div>
                )}

                {selectedPermiso.observacionInstructor && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Respuesta del instructor líder</label>
                    <p className="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                      {selectedPermiso.observacionInstructor}
                    </p>
                  </div>
                )}

                {getPermisoArchivoUrl(selectedPermiso) && (
                  <div className="pt-2">
                    <a
                      href={getPermisoArchivoUrl(selectedPermiso) || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      <KeenIcon icon="file-down" className="text-base" />
                      Ver archivo soporte adjunto
                    </a>
                  </div>
                )}
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
        estudiantes={students.map((s) => ({
          idMatriculaAcademica: s.id,
          idMatricula: s.idMatricula,
          nombre: getFullName(s),
          identificacion: getStudentIdentificacion(s),
          asistio: null,
          fotoUrl: getStudentPhoto(s)
        }))}
        idMateria={
          typeof materiaData.idMateria === 'string'
            ? parseInt(materiaData.idMateria)
            : materiaData.idMateria
        }
        idAsignacionPeriodoProgramaJornada={materiaData.idFicha}
        idHorarioMateria={materiaData.idHorarioMateria}
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
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