import React, { useContext, useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AsignarTiposDocumentoModal } from './components/documentos/AsignarTiposDocumentoModal';
import { VerDocumentosFichaModal } from './components/documentos/VerDocumentosFichaModal';
import MallaCurricular from './components/malla-curricular/MallaCurricular';
import { AsignarInstructorLiderModal } from './components/AsignarInstructorLiderModal';
import { Calendario } from './components/malla-curricular/Calendario';
import { useAuthContext } from '@/auth';
import ModalJuiciosEvaluativos from './components/ModalJuiciosEvaluativos';
import CrearEditarFicha from './components/CrearEditarFicha';
import { AuthContext } from '@/auth/providers/JWTProvider';
import { enqueueSnackbar } from 'notistack';
import { User } from 'lucide-react';
import SolicitudInstructorForm from '../solicitud-instructor/SolicitudInstructorForm';
import CrearGrupos from './components/CrearGrupos';

interface Ficha {
  id: number;
  codigo: string;
  porcentajeEjecucion: number;
  idInstructorLider?: number | null;
  documento?: string | null;
  rutaDocumentoUrl: string | null;

  sede?: {
    id: number;
    nombre: string;
    idCentroFormacion: number;
  };

  regional?: {
    id: number;
    razonSocial: string;
  };

  asignacion?: {
    id: number;
    estado: string;
    fechaInicialClases: string;
    fechaFinalClases: string;
    jornada?: any,
    programa?: {
      id: number;
      nombrePrograma: string;
      grados: [
        {
          id: number;
          pivot: {
            idGrado: number;
          };
        }
      ];
    };
  };

  instructorLider?: {
    id: number;
    persona?: {
      id: number;
      nombre1: string;
      nombre2?: string;
      apellido1: string;
      apellido2?: string;
      rutaFotoUrl?: string;
    };
  };
}

interface Program {
  id: number;
  name: string;
  codigo: string;
  nivel: string;
  formacion: string;
  status: string;
}

export const ProgramacionFichasPage = () => {
  const { programId } = useParams<{ programId: string }>(); // id de la apertura del programa
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(false);
  const [asignarFicha, setAsignarFicha] = useState<Ficha | null>(null);
  const [verFicha, setVerFicha] = useState<Ficha | null>(null);
  const [fichaExpandida, setFichaExpandida] = useState<number | null>(null);
  const [isMallaOpen, setIsMallaOpen] = useState(false);
  const [fichaAsignarLider, setFichaAsignarLider] = useState<Ficha | null>(null);
  const [verHorariosFicha, setVerHorariosFicha] = useState<Ficha | null>(null);
  const [verMallaCurricular, setVerMallaCurricular] = useState<boolean>(false);
  const [fichaSelected, setFichaSelected] = useState<any | null>(null);
  const [solicitud, setSolicitud] = useState<boolean>(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fichaIdToEdit, setFichaIdToEdit] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [messageToast, setMessageToast] = useState('');
  const [evento, setEvento] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [juiciosEvaluativos, setJuiciosEvaluativos] = useState<boolean>(false);
  const [idFicha, setIdFicha] = useState<number>(0);
  const [idSede, setIdSede] = useState<number | undefined>(0);
  const [idGrado, setIdGrado] = useState<number | undefined>(0);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [idCentroFormacion, setIdCentroFormacion] = useState<number>(0);

  const [fichasCreadasEnSesion, setFichasCreadasEnSesion] = useState<number[]>([]);
  const [fichasAntesDeCrear, setFichasAntesDeCrear] = useState<number[]>([]);
  const [crearGrupoModal, setCrearGrupoModal] = useState<boolean>(false);

  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error('AuthContext debe usarse dentro de AuthProvider');
  }

  const { centroF, roles } = authContext;

  const esInstructorSena = roles?.includes('INSTRUCTOR SENA');

  const loadProgram = async () => {
    if (!programId) return;
    try {
      const res = await axios.get('/programas');
      const data = res.data?.data || res.data;
      const list = Array.isArray(data) ? data : [];
      const p = list.find((prog: any) => Number(prog.id) === Number(programId));
      if (p) {
        setProgram({
          id: Number(p.id),
          name: p.nombrePrograma,
          codigo: p.codigoPrograma,
          nivel: p.nivel?.nombreNivel || 'N/A',
          formacion: p.tipo_formacion?.nombreTipoFormacion || 'N/A',
          status: p.estado?.nombre || 'ACTIVO'
        });
      }
    } catch (error) {
      console.error('Error al cargar programa:', error);
    }
  };

  const loadFichas = async (idsAnteriores?: number[]) => {
    if (!programId) return;
    setLoading(true);

    try {
      const idContratoUsuario = user?.persona?.contrato?.find(
        (c: any) => Number(c.idEstado) === 1
      )?.id;

      const aplicarFiltro = (fichasConDocumento: any[]) => {
        return esInstructorSena
          ? fichasConDocumento.filter(
              (ficha: any) =>
                !ficha.idInstructorLider ||
                Number(ficha.idInstructorLider) === Number(idContratoUsuario)
            )
          : fichasConDocumento;
      };

      const centroId = Number(centroF) !== 0 ? Number(centroF) : Number(user?.idCentroFormacion);

      const res = await axios.get(`fichas/programa/${programId}`,);
      const backUrl = import.meta.env.VITE_APP_BACKEND_URL;

      if (res.status === 200 && Array.isArray(res.data.data)) {
        const fichasConDocumento = res.data.data.map((ficha: any) => ({
          ...ficha,
          id: Number(ficha.id),
          idInstructorLider:
            ficha.idInstructorLider != null ? Number(ficha.idInstructorLider) : null,
          documento: ficha.documento ? `${backUrl}${ficha.documento}` : null,
          sede: ficha.sede
            ? {
                ...ficha.sede,
                id: Number(ficha.sede.id),
                idCentroFormacion: Number(ficha.sede.idCentroFormacion)
              }
            : undefined,
          jornada: ficha.jornada ? { ...ficha.jornada, id: Number(ficha.jornada.id) } : undefined,
          regional: ficha.regional
            ? { ...ficha.regional, id: Number(ficha.regional.id) }
            : undefined,
          asignacion: ficha.asignacion
            ? {
                ...ficha.asignacion,
                id: Number(ficha.asignacion.id),
                programa: ficha.asignacion.programa
                  ? {
                      ...ficha.asignacion.programa,
                      id: Number(ficha.asignacion.programa.id),
                      grados: ficha.asignacion.programa.grados?.map((g: any) => ({
                        ...g,
                        id: Number(g.id),
                        pivot: { idGrado: Number(g.pivot?.idGrado) }
                      }))
                    }
                  : undefined
              }
            : undefined,
          instructorLider: ficha.instructorLider
            ? {
                ...ficha.instructorLider,
                id: Number(ficha.instructorLider.id),
                persona: ficha.instructorLider.persona
                  ? {
                      ...ficha.instructorLider.persona,
                      id: Number(ficha.instructorLider.persona.id)
                    }
                  : undefined
              }
            : undefined
        }));

        setIdCentroFormacion(Number(user?.idCentroFormacion));
        const filtradas = aplicarFiltro(fichasConDocumento);
        setFichas(filtradas);

        if (idsAnteriores && idsAnteriores.length > 0) {
          const nuevas = filtradas
            .filter((f: any) => !idsAnteriores.includes(f.id))
            .map((f: any) => f.id);
          if (nuevas.length > 0) {
            setFichasCreadasEnSesion((prev) => [...prev, ...nuevas]);
          }
        }
      } else {
        setFichas([]);
      }
    } catch (error) {
      console.error('Error cargando fichas', error);
      setFichas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (programId) {
      loadProgram();
      loadFichas();
    }
  }, [programId, evento]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const totalPages = Math.ceil(fichas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFichas = fichas.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const toggleExpandirFicha = (id: number) => {
    setFichaExpandida(fichaExpandida === id ? null : id);
  };

  const handleEditarFicha = (fichaId: number) => {
    setFichaIdToEdit(fichaId);
    setIsEditModalOpen(true);
  };

  const handleEliminarFicha = async (fichaId: number) => {
    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`fichas/${fichaId}`);
        enqueueSnackbar('Ficha eliminada correctamente', { variant: 'success' });
        setFichasCreadasEnSesion((prev) => prev.filter((id) => id !== fichaId));
        setEvento((prev) => !prev);
      } catch (error: any) {
        enqueueSnackbar(error.response?.data?.message || 'Error al eliminar la ficha', {
          variant: 'error'
        });
      }
    }
  };

  const puedeEditarEliminar = (ficha: Ficha): boolean => {
    if (!esInstructorSena) return true;
    return fichasCreadasEnSesion.includes(ficha.id);
  };

  return (
    <>
      <div className="flex flex-col w-full h-screen">
        <ModalJuiciosEvaluativos
          open={juiciosEvaluativos}
          onClose={() => {
            setJuiciosEvaluativos(false);
            setIdFicha(0);
          }}
          onSave={() => setEvento((pre) => !pre)}
          idFicha={idFicha}
          idPrograma={programId}
          idSede={idSede}
          idGrado={idGrado}
        />

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start md:justify-between px-6 py-2 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-coal-400 dark:hover:bg-coal-300 transition-colors"
            >
              <i className="ki-outline ki-arrow-left text-lg text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">{program?.name || 'Grupos del programa'}</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            {esInstructorSena
                ? 'Grupos asignados a ti y disponibles para autogestión.'
                : 'Administra los grupos del programa y asigna líderes responsables.'
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCrearGrupoModal(true)}
            className="h-11 px-4 gap-2 flex items-center rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition"
          >
            <i className="ki-outline ki-plus text-base"></i>
            Crear Grados
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <i className="ki-outline ki-plus text-base"></i>
            Crear Grado
          </button>
        </div>
      </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {isModalOpen && (
            <CrearEditarFicha
              idCentro={idCentroFormacion}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              onAction={() => {
                const idsActuales = fichas.map((f) => f.id);
                setFichasAntesDeCrear(idsActuales);
                loadFichas(idsActuales).then(() => {
                  if (!esInstructorSena) {
                    setTimeout(() => {
                      setFichas((fichasActuales) => {
                        const nuevaFicha = fichasActuales.find((f) => !idsActuales.includes(f.id));
                        if (nuevaFicha) {
                          setFichaAsignarLider(nuevaFicha);
                        }
                        return fichasActuales;
                      });
                    }, 300);
                  }
                });
                setEvento((prev) => !prev);
              }}
            />
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fichas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-coal-600 rounded-lg border border-gray-200 dark:border-coal-100">
              <i className="mb-4 text-5xl text-gray-400 ki-outline ki-file-deleted"></i>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {esInstructorSena
                  ? 'No tienes grados asignados en este nivel académico'
                  : 'No hay grados registrados para este nivel académico'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {paginatedFichas.map((ficha) => {
                  const expandida = fichaExpandida === ficha.id;
                  return (
                    <div
                      key={ficha.id}
                      className="bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-100 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div
                              className="relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-coal-200 border border-gray-200 dark:border-coal-100 flex items-center justify-center"
                              title={
                                ficha.idInstructorLider && ficha.instructorLider?.persona
                                  ? [
                                      ficha.instructorLider.persona.nombre1,
                                      ficha.instructorLider.persona.nombre2,
                                      ficha.instructorLider.persona.apellido1,
                                      ficha.instructorLider.persona.apellido2
                                    ]
                                      .filter(Boolean)
                                      .join(' ')
                                  : 'Sin líder asignado'
                              }
                            >
                              {ficha.idInstructorLider && ficha.instructorLider?.persona ? (
                                <>
                                  {ficha.instructorLider.persona.rutaFotoUrl ? (
                                    <img
                                      src={ficha.instructorLider.persona.rutaFotoUrl}
                                      alt=""
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        const t = e.target as HTMLImageElement;
                                        t.style.display = 'none';
                                        const fallback = t.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <span
                                    className={`absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-coal-200 text-blue-600 dark:text-blue-400 font-bold text-sm ${ficha.instructorLider.persona.rutaFotoUrl ? 'hidden' : ''}`}
                                    style={
                                      ficha.instructorLider.persona.rutaFotoUrl
                                        ? { display: 'none' }
                                        : undefined
                                    }
                                  >
                                    {[
                                      ficha.instructorLider.persona.nombre1?.charAt(0),
                                      ficha.instructorLider.persona.apellido1?.charAt(0)
                                    ]
                                      .filter(Boolean)
                                      .join('')
                                      .toUpperCase() || '?'}
                                  </span>
                                </>
                              ) : null}
                              {!ficha.idInstructorLider && (
                                <div className="w-full h-full rounded-full bg-primary/10 border border-dashed border-primary flex items-center justify-center">
                                  <User className="text-primary" size={14} />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-base font-bold text-gray-800 dark:text-white">
                                  {ficha.codigo}
                                </h3>
                                <span
                                  className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                                    ficha.asignacion?.estado === 'EN CURSO'
                                      ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                      : 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                                  }`}
                                >
                                  {ficha.asignacion?.estado || 'N/A'}
                                </span>
                              </div>

                              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-2">
                                  <i className="ki-outline ki-calendar text-xs"></i>
                                  <span>
                                    Inicio:{' '}
                                    {ficha.asignacion?.fechaInicialClases
                                      ? new Date(
                                          ficha.asignacion.fechaInicialClases
                                        ).toLocaleDateString()
                                      : '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <i className="ki-outline ki-calendar-tick text-xs"></i>
                                  <span>
                                    Fin:{' '}
                                    {ficha.asignacion?.fechaFinalClases
                                      ? new Date(
                                          ficha.asignacion.fechaFinalClases
                                        ).toLocaleDateString()
                                      : '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <i className="ki-outline ki-time text-xs"></i>
                                  <span>Jornada: {ficha.asignacion?.jornada?.nombreJornada || '—'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {ficha.idInstructorLider && ficha.instructorLider?.persona ? (
                                !esInstructorSena && (
                                  <button
                                    type="button"
                                    onClick={() => setFichaAsignarLider(ficha)}
                                    className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex-shrink-0"
                                  >
                                    Cambiar
                                  </button>
                                )
                              ) : (
                                <>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Sin líder asignado
                                  </span>
                                  {esInstructorSena ? (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const idContratoUsuario = user?.persona?.contrato?.find(
                                          (c: any) => Number(c.idEstado) === 1
                                        )?.id;
                                        if (!idContratoUsuario) {
                                          enqueueSnackbar('No se encontró tu contrato activo', {
                                            variant: 'error'
                                          });
                                          return;
                                        }
                                        try {
                                          await axios.post(
                                            `fichas/${ficha.id}/asignar-instructor-lider`,
                                            {
                                              idInstructorLider: Number(idContratoUsuario)
                                            }
                                          );
                                          enqueueSnackbar(
                                            'Te has asignado correctamente a esta ficha',
                                            { variant: 'success' }
                                          );
                                          loadFichas();
                                        } catch {
                                          enqueueSnackbar('Error al asignarte a la ficha', {
                                            variant: 'error'
                                          });
                                        }
                                      }}
                                      className="px-3 py-1.5 text-xs font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Asignarme
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setFichaAsignarLider(ficha)}
                                      className="px-3 py-1.5 text-xs font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                      Asignar
                                    </button>
                                  )}
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleExpandirFicha(ficha.id)}
                              className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <i
                                className={`ki-outline ${expandida ? 'ki-up' : 'ki-down'} text-lg`}
                              ></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      {expandida && (
                        <div className="px-4 pb-4 border-t border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200/30">
                          <div className="pt-4 grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                Sede
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {ficha.sede?.nombre || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                Jornada
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {ficha.asignacion?.jornada?.nombreJornada || '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                Fecha de inicio
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {ficha.asignacion?.fechaInicialClases
                                  ? new Date(
                                      ficha.asignacion.fechaInicialClases
                                    ).toLocaleDateString()
                                  : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                Fecha de Finalización
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {ficha.asignacion?.fechaFinalClases
                                  ? new Date(ficha.asignacion.fechaFinalClases).toLocaleDateString()
                                  : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                                Regional
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {ficha.regional?.razonSocial || '—'}
                              </p>
                            </div>
                          </div>

                          {ficha.documento ? (
                            <div className="pt-4 border-t border-gray-200 dark:border-coal-100 mb-4">
                              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <i className="ki-outline ki-document"></i>
                                Documento de la Ficha
                              </h4>
                              <div className="bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-100 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-lg flex items-center justify-center">
                                    <i className="ki-outline ki-document text-red-600 dark:text-red-400 text-2xl"></i>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                                      Documento Principal
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      Formato PDF
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => window.open(ficha.rutaDocumentoUrl!, '_blank')}
                                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                      <i className="ki-outline ki-eye"></i>
                                      Ver Documento
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-4 border-t border-gray-200 dark:border-coal-100 mb-4">
                              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <i className="ki-outline ki-document"></i>
                                Documento de la Ficha
                              </h4>
                              <div className="bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-100 rounded-lg p-4">
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2 flex items-center justify-center gap-2">
                                  <i className="ki-outline ki-information-2"></i>
                                  No hay documento adjunto para esta ficha
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-3 md:grid-cols-5 gap-6 pt-3 border-t border-gray-200 dark:border-coal-100">
                            <button
                              type="button"
                              onClick={() => {
                                setJuiciosEvaluativos(true);
                                setIdFicha(ficha.id);
                                setIdSede(ficha.sede?.id);
                                setIdGrado(
                                  Number(ficha.asignacion?.programa?.grados?.[0]?.pivot?.idGrado) ||
                                    1
                                );
                              }}
                              title="Juicios evaluativos"
                              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 rounded-lg transition-all"
                            >
                              <i className="ki-outline ki-element-11 text-base"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => setVerHorariosFicha(ficha)}
                              title="Horarios"
                              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg transition-all"
                            >
                              <i className="ki-outline ki-calendar text-base"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVerMallaCurricular(true);
                                setFichaSelected(ficha);
                              }}
                              title="Malla curricular"
                              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 rounded-lg transition-all"
                            >
                              <i className="ki-outline ki-book-square text-base"></i>
                            </button>

                            {esInstructorSena && <button
                              type='button'
                              onClick={() => {
                                setSolicitud(true);
                                setFichaSelected(ficha);
                              }}
                              title="Solicitud de instructor"
                              className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 rounded-lg transition-all"
                            >
                              <i className="ki-outline ki-user text-base"></i>
                            </button>}

                            {puedeEditarEliminar(ficha) && (
                              <button
                                type="button"
                                onClick={() => handleEditarFicha(ficha.id)}
                                title="Editar"
                                className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-lg transition-all"
                              >
                                <i className="ki-outline ki-notepad-edit text-base"></i>
                              </button>
                            )}

                            {puedeEditarEliminar(ficha) && (
                              <button
                                type="button"
                                onClick={() => handleEliminarFicha(ficha.id)}
                                title="Eliminar"
                                className="flex items-center justify-center gap-2 px-3 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                              >
                                <i className="ki-outline ki-trash text-base"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-coal-100 bg-white dark:bg-coal-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      Mostrando
                    </span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-coal-100 rounded bg-white dark:bg-coal-400 text-gray-700 dark:text-gray-200"
                    >
                      <option value={10}>10 por página</option>
                      <option value={20}>20 por página</option>
                      <option value={30}>30 por página</option>
                      <option value={50}>50 por página</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      {startIndex + 1} - {Math.min(endIndex, fichas.length)} de {fichas.length}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-coal-100 bg-white dark:bg-coal-400 text-gray-600 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-coal-300"
                    >
                      <i className="text-sm ki-outline ki-left"></i>
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-300 dark:border-coal-100 bg-white dark:bg-coal-400 text-gray-600 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-coal-300"
                    >
                      <i className="text-sm ki-outline ki-right"></i>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {solicitud && <SolicitudInstructorForm
        open={solicitud}
        onClose={() => setSolicitud(false)}
        onSave={() => setSolicitud(false)}
        ficha={fichaSelected}
        programa={program?.name}
      />}

      <AsignarTiposDocumentoModal
        isOpen={!!asignarFicha}
        onClose={() => setAsignarFicha(null)}
        onSave={() => {
          setAsignarFicha(null);
          loadFichas();
        }}
        ficha={asignarFicha}
      />
      <VerDocumentosFichaModal
        isOpen={!!verFicha}
        onClose={() => setVerFicha(null)}
        ficha={verFicha}
      />
      <MallaCurricular
        isOpen={isMallaOpen}
        onClose={() => setIsMallaOpen(false)}
        program={program}
        ficha={fichaSelected}
      />
      <AsignarInstructorLiderModal
        isOpen={!!fichaAsignarLider}
        onClose={() => setFichaAsignarLider(null)}
        fichaId={fichaAsignarLider?.id || 0}
        programaNombre={fichaAsignarLider?.asignacion?.programa?.nombrePrograma}
        onSuccess={() => {
          loadFichas();
          setFichaAsignarLider(null);
        }}
      />
      <CrearEditarFicha
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        fichaId={fichaIdToEdit}
        setShowToast={setShowToast}
        setMessageToast={setMessageToast}
        onAction={() => setEvento((prev) => !prev)}
      />

      <CrearGrupos
        isModalOpen={crearGrupoModal}
        setIsModalOpen={setCrearGrupoModal}
        fichaId={fichaIdToEdit}
        setShowToast={setShowToast}
        setMessageToast={setMessageToast}
        onAction={() => setEvento((prev) => !prev)}
      />

      {verMallaCurricular && (
        <MallaCurricular
          isOpen={verMallaCurricular}
          onClose={() => setVerMallaCurricular(false)}
          program={program}
          ficha={fichaSelected}
        />
      )}
      {verHorariosFicha && (
        <Calendario
          isOpen={!!verHorariosFicha}
          onClose={() => setVerHorariosFicha(null)}
          materia={{ nombre: `Ficha ${verHorariosFicha?.codigo}` }}
          idFicha={verHorariosFicha?.id || 0}
          onAddSchedule={() => {}}
        />
      )}
      {showToast && (
        <div className="fixed top-4 right-4 z-[200]">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
            <i className="text-xl ki-solid ki-check-circle"></i>
            <span className="font-medium">{messageToast}</span>
            <button
              onClick={() => setShowToast(false)}
              className="ml-2 hover:text-gray-200 transition-colors"
            >
              <i className="ki-solid ki-cross text-lg"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
