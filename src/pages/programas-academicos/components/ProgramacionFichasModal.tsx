import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AsignarTiposDocumentoModal } from './documentos';
import { VerDocumentosFichaModal } from './documentos/VerDocumentosFichaModal';
import MallaCurricular from './malla-curricular/MallaCurricular';
import { AsignarInstructorLiderModal } from './AsignarInstructorLiderModal';
import { useAuthContext } from '@/auth';

interface Ficha {
  id: number;
  codigo: string;
  porcentajeEjecucion: number;
  idInstructorLider?: number | null;
  documento: string;

  jornada?: {
    id: number;
    nombreJornada: string;
  };

  sede?: {
    id: number;
    nombre: string;
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
    programa?: {
      id: number;
      nombrePrograma: string;
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
  const { programId } = useParams<{ programId: string }>();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(false);
  const [asignarFicha, setAsignarFicha] = useState<Ficha | null>(null);
  const [verFicha, setVerFicha] = useState<Ficha | null>(null);
  const [fichaExpandida, setFichaExpandida] = useState<number | null>(null);
  const [isMallaOpen, setIsMallaOpen] = useState(false);
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);
  const [fichaAsignarLider, setFichaAsignarLider] = useState<Ficha | null>(null);

  // Estados para edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fichaIdToEdit, setFichaIdToEdit] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [messageToast, setMessageToast] = useState('');
  const [evento, setEvento] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  //Creacion de ficha:
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadProgram = async () => {
    if (!programId) return;
    try {
      const res = await axios.get('/programas');
      if (res.data?.status === 'success' && Array.isArray(res.data?.data)) {
        const p = res.data.data.find((prog: any) => prog.id === Number(programId));
        if (p) {
          setProgram({
            id: p.id,
            name: p.nombrePrograma,
            codigo: p.codigoPrograma,
            nivel: p.nivel?.nombreNivel || 'N/A',
            formacion: p.tipo_formacion?.nombreTipoFormacion || 'N/A',
            status: p.estado?.nombre || 'ACTIVO'
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar programa:', error);
    }
  };

  const loadFichas = async () => {
    if (!programId) return;
    setLoading(true);
    try {
      const res = await axios.get(`fichas/programa/${programId}/${user?.idCentroFormacion}`);
      if (res.status === 200) {
        setFichas(res.data.data);
        console.log('Fichas cargadas:', res.data.data);
      } else {
        setFichas([]);
      }
    } catch {
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
  }, [programId, evento]); // Agregado 'evento' para recargar al editar

  // Auto-cierre del toast
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Cálculos de paginación
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

  // Función para editar ficha
  const handleEditarFicha = (fichaId: number) => {
    console.log('✏️ Editando ficha:', fichaId);
    setFichaIdToEdit(fichaId);
    setIsEditModalOpen(true);
  };

  // Función para eliminar ficha
  const handleEliminarFicha = async (fichaId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta ficha?')) {
      try {
        await axios.delete(`fichas/${fichaId}`);
        setMessageToast('Ficha eliminada correctamente');
        setShowToast(true);
        setEvento((prev) => !prev);
      } catch (error: any) {
        setMessageToast(error.response?.data?.message || 'Error al eliminar la ficha');
        setShowToast(true);
      }
    }
  };

  return (
    <>
      <div className="flex flex-col w-full h-screen bg-gray-50 dark:bg-coal-500">
        {/* Breadcrumbs */}
        <div className="px-6 py-4 bg-white dark:bg-coal-600 border-b border-gray-200 dark:border-coal-100">
          <nav className="text-sm text-gray-600 dark:text-gray-400">
            <span
              className="hover:text-primary cursor-pointer"
              onClick={() => navigate('/gestion-academica/configuracion/programas')}
            >
              Planeación
            </span>
            <span className="mx-2">/</span>
            <span
              className="hover:text-primary cursor-pointer"
              onClick={() => navigate('/gestion-academica/configuracion/programas')}
            >
              Gestión de planeación
            </span>
            <span className="mx-2">/</span>
            <span className="text-gray-800 dark:text-white font-medium">
              {program?.name ?? 'Programa'}
            </span>
          </nav>
        </div>

        {/* Header del Programa */}
        <div className="px-6 py-4 bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {program?.codigo} {program?.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span>{program?.formacion}</span>
                <span>•</span>
                <span>{program?.nivel}</span>
                <span>•</span>
                <span>Presencial</span>
              </div>
            </div>
            <button
              onClick={() => navigate('/gestion-academica/configuracion/programas')}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Volver
            </button>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                Programación de Fichas
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gestiona las fichas del programa y asigna líderes
              </p>
            </div>
            {/* Botón Crear Ficha */}
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
              onClick={() => setIsModalOpen(true)}
            >
              <i className="ki-outline ki-plus text-lg"></i>
              Crear Ficha
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : fichas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-coal-600 rounded-lg border border-gray-200 dark:border-coal-100">
              <i className="mb-4 text-5xl text-gray-400 ki-outline ki-file-deleted"></i>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay fichas registradas para este programa
              </p>
            </div>
          ) : (
            <>
              {/* Lista de Fichas */}
              <div className="space-y-3 mb-6">
                {paginatedFichas.map((ficha) => {
                  const expandida = fichaExpandida === ficha.id;
                  return (
                    <div
                      key={ficha.id}
                      className="bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-100 rounded-lg shadow-sm overflow-hidden transition-all hover:shadow-md"
                    >
                      {/* Fila Principal */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Foto del instructor */}
                            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden">
                              {ficha.instructorLider?.persona?.rutaFotoUrl ? (
                                <img
                                  src={ficha.instructorLider.persona.rutaFotoUrl}
                                  alt={`${ficha.instructorLider.persona.nombre1} ${ficha.instructorLider.persona.apellido1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              {ficha.idInstructorLider && (
                                <div
                                  className={`absolute inset-0 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-sm ${ficha.instructorLider?.persona?.rutaFotoUrl ? 'hidden' : 'flex'}`}
                                >
                                  {ficha.instructorLider?.persona
                                    ? `${ficha.instructorLider.persona.nombre1?.charAt(0) || ''}${ficha.instructorLider.persona.apellido1?.charAt(0) || ''}`.toUpperCase()
                                    : '?'}
                                </div>
                              )}
                            </div>

                            {/* Información Principal */}
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-base font-bold text-gray-800 dark:text-white">
                                  Ficha {ficha.codigo}
                                  {ficha.idInstructorLider && ficha.instructorLider?.persona && (
                                    <span className="font-normal text-gray-600 dark:text-gray-400 ml-2">
                                      - {ficha.instructorLider.persona.nombre1 || ''}{' '}
                                      {ficha.instructorLider.persona.apellido1 || ''}
                                    </span>
                                  )}
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

                              {/* Información en fila */}
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
                                  <span>Jornada: {ficha.jornada?.nombreJornada || '—'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Líder y Botón Asignar */}
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {ficha.idInstructorLider ? 'Líder asignado' : 'Sin líder asignado'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setFichaAsignarLider(ficha)}
                                className="px-3 py-1.5 text-xs font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                Asignar
                              </button>
                            </div>

                            {/* Botón Expandir/Colapsar */}
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

                      {/* Contenido Expandido */}
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
                                {ficha.jornada?.nombreJornada || '—'}
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
                                    <i className="ki-outline ki-file text-red-600 dark:text-red-400 text-2xl"></i>
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
                                      onClick={() => window.open(ficha.documento!, '_blank')}
                                      className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                      <i className="ki-outline ki-eye"></i>
                                      Ver Documento
                                    </button>

                                    <a
                                      href={ficha.documento!}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-4 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                                    >
                                      <i className="ki-outline ki-download"></i>
                                      Descargar
                                    </a>
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

                          {/* BOTONES DE ACCIÓN - EDITAR Y ELIMINAR */}
                          <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-coal-100">
                            <button
                              type="button"
                              onClick={() => handleEditarFicha(ficha.id)}
                              className="flex-1 px-4 py-2 text-sm font-bold uppercase bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <i className="ki-outline ki-notepad-edit"></i>
                              Editar Ficha
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarFicha(ficha.id)}
                              className="flex-1 px-4 py-2 text-sm font-bold uppercase bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <i className="ki-outline ki-trash"></i>
                              Eliminar Ficha
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Paginación */}
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

      {/* Modales */}
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

      {/* Toast de notificación */}
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
