import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Program } from '../types';
import { AsignarTiposDocumentoModal } from './documentos/AsignarTiposDocumentoModal';
import { VerDocumentosFichaModal } from './documentos/VerDocumentosFichaModal';
import MallaCurricular from './malla-curricular/MallaCurricular';
import { DocumentosProgramaModal } from './documentos';
import EditarFicha from './EditarFicha';

// Interfaz corregida según los datos del backend
interface Ficha {
  id: number;
  idJornada: number;
  idAsignacion: number;
  codigo: string;
  idInstructorLider: number | null;
  documento: string | null;
  idAprendizVocero: number | null;
  idAprendizSuplente: number | null;
  idInfraestructura: number | null;
  idSede: number;
  idRegional: number;
  porcentajeEjecucion: number;
  created_at: string;
  updated_at: string;
  jornada: {
    id: number;
    nombreJornada: string;
  };
  sede: {
    id: number;
    nombre: string;
  };
  regional: {
    id: number;
    razonSocial: string;
    rutaLogoUrl: string;
  };
  asignacion: {
    id: number;
    estado: string;
    fechaInicialClases: string;
    fechaFinalClases: string;
    idPrograma: number;
    programa: {
      id: number;
      nombrePrograma: string;
    };
  };
  instructor_lider: any | null;
}

interface ProgramacionFichasModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
}

export const ProgramacionFichasModal = ({
  isOpen,
  onClose,
  program
}: ProgramacionFichasModalProps) => {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(false);
  const [asignarFicha, setAsignarFicha] = useState<Ficha | null>(null);
  const [verFicha, setVerFicha] = useState<Ficha | null>(null);
  const [fichaExpandida, setFichaExpandida] = useState<number | null>(null);
  const [isMallaOpen, setIsMallaOpen] = useState(false);
  const [isDocumentosOpen, setIsDocumentosOpen] = useState(false);

  // Estados para el modal de edición
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fichaIdToEdit, setFichaIdToEdit] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [messageToast, setMessageToast] = useState('');
  const [evento, setEvento] = useState(false);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  const loadFichas = async () => {
    if (!program?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(`programa/${program.id}/fichas`);

      if (Array.isArray(res.data?.data)) {
        setFichas(res.data.data);
      } else {
        setFichas([]);
      }
    } catch (error) {
      console.error('Error cargando fichas:', error);
      setFichas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFichas();
    } else {
      setFichas([]);
      setFichaExpandida(null);
      setCurrentPage(1);
    }
  }, [isOpen, program?.id, evento]);

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

  // Función para abrir el modal de edición
  const handleEditarFicha = (fichaId: number) => {
    console.log('🔵 Abriendo modal de edición para ficha:', fichaId);
    setFichaIdToEdit(fichaId);
    setIsEditModalOpen(true);
  };

  // Función para eliminar ficha
  const handleEliminarFicha = async (fichaId: number) => {
    if (window.confirm('¿Está seguro de eliminar esta ficha?')) {
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

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-800 dark:text-white">
                Programación de Fichas
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {program?.name ?? 'Programa'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white"
            >
              <i className="text-lg ki-filled ki-cross" />
            </button>
          </div>

          {/* Body con scroll */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : fichas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <i className="mb-4 text-5xl text-gray-400 ki-outline ki-file-deleted"></i>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay fichas registradas para este programa
                </p>
              </div>
            ) : (
              <>
                {/* Grid de Tarjetas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {paginatedFichas.map((ficha) => {
                    const expandida = fichaExpandida === ficha.id;
                    
                    return (
                      <div
                        key={ficha.id}
                        className="bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-100 rounded-xl shadow-md hover:shadow-lg transition-shadow"
                      >
                        {/* Header de la tarjeta */}
                        <div className="p-4 border-b border-gray-200 dark:border-coal-100">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">
                              Ficha {ficha.codigo}
                            </h3>
                            <span className="px-2 py-1 text-xs font-bold uppercase rounded bg-green-100 text-green-600 dark:bg-green-700 dark:text-green-400">
                              {ficha.asignacion?.estado || 'En formación'}
                            </span>
                          </div>
                        </div>

                        {/* Información básica */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-calendar text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Inicio</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatDate(ficha.asignacion?.fechaInicialClases)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-calendar-tick text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Fin</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formatDate(ficha.asignacion?.fechaFinalClases)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-time text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Jornada</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {ficha.jornada?.nombreJornada || '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-geolocation text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sede</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {ficha.sede?.nombre || '—'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Botón expandir */}
                        <div className="px-4 pb-4">
                          <button
                            type="button"
                            onClick={() => toggleExpandirFicha(ficha.id)}
                            className="w-full py-2 text-xs font-bold uppercase text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            {expandida ? 'Ocultar opciones' : 'Ver opciones'}
                            <i className={`ml-2 ki-outline ${expandida ? 'ki-up' : 'ki-down'}`}></i>
                          </button>
                        </div>

                        {/* Sección expandida con TODOS los botones */}
                        {expandida && (
                          <div className="border-t border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200/30">
                            <div className="p-4 space-y-3">
                              {/* Info adicional */}
                              <div className="mb-4">
                                <div className="mb-2">
                                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                    Regional
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {ficha.regional?.razonSocial || '—'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                    Programa
                                  </p>
                                  <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {ficha.asignacion?.programa?.nombrePrograma || '—'}
                                  </p>
                                </div>
                              </div>

                              {/* TODOS LOS BOTONES EN UNA GRID */}
                              <div className="grid grid-cols-2 gap-2">
                                {/* Botón 1: Malla */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('📚 Malla curricular');
                                    setIsMallaOpen(true);
                                  }}
                                  className="px-3 py-2 text-xs font-bold uppercase rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500 hover:text-white transition-colors"
                                >
                                  📚 Malla
                                </button>

                                {/* Botón 2: Documentos */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('📄 Documentos programa');
                                    setIsDocumentosOpen(true);
                                  }}
                                  className="px-3 py-2 text-xs font-bold uppercase rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-colors"
                                >
                                  📄 Docs
                                </button>

                                {/* Botón 3: Asignar tipos */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('📋 Asignar tipos');
                                    setAsignarFicha(ficha);
                                  }}
                                  className="px-3 py-2 text-xs font-bold uppercase rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white transition-colors"
                                >
                                  📋 Asignar
                                </button>

                                {/* Botón 4: Ver documentos */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('👁️ Ver documentos ficha');
                                    setVerFicha(ficha);
                                  }}
                                  className="px-3 py-2 text-xs font-bold uppercase rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                  👁️ Ver
                                </button>

                                {/* Botón 5: ACTUALIZAR - ESTE ES EL IMPORTANTE */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('✏️ EDITAR FICHA ID:', ficha.id);
                                    handleEditarFicha(ficha.id);
                                  }}
                                  className="px-3 py-2 text-xs font-bold uppercase rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                >
                                  ✏️ Editar
                                </button>

                                {/* Botón 6: ELIMINAR */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    console.log('🗑️ ELIMINAR FICHA ID:', ficha.id);
                                    handleEliminarFicha(ficha.id);
                                  }}
                                  className="px-3 py-2 text-xs font-bold uppercase rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                  🗑️ Borrar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200 rounded-lg">
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

          {/* Footer */}
          <div className="flex items-center justify-end px-5 py-4 border-t border-gray-200 dark:border-coal-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-coal-300"
            >
              Cerrar
            </button>
          </div>
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

      <DocumentosProgramaModal
        isOpen={isDocumentosOpen}
        onClose={() => setIsDocumentosOpen(false)}
        program={program}
      />

      {/* Modal de edición */}
      <EditarFicha
        isModalOpen={isEditModalOpen}
        setIsModalOpen={setIsEditModalOpen}
        fichaId={fichaIdToEdit}
        setEvento={setEvento}
        setShowToast={setShowToast}
        setMessageToast={setMessageToast}
      />

      {/* Toast */}
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