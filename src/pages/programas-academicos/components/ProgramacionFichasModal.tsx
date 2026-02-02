import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Program } from '../types';
import { AsignarTiposDocumentoModal } from './documentos/AsignarTiposDocumentoModal';
import { VerDocumentosFichaModal } from './documentos/VerDocumentosFichaModal';
import MallaCurricular from './malla-curricular/MallaCurricular';
import { TiposDocumentoModal } from '@/pages/tipos-documento/TiposDocumentoModal';

interface Ficha {
  id: number;
  idPrograma: number;
  idGrado: number;
  cupos: number;
  grado: {
    id: number;
    nombreGrado: string;
    numeroGrado: number;
  } | null;
  programa: {
    id: number;
    nombrePrograma: string;
    codigoPrograma: string;
  } | null;
}

interface ProgramacionFichasModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
}

export const ProgramacionFichasModal = ({
  isOpen,
  onClose,
  program,
}: ProgramacionFichasModalProps) => {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [loading, setLoading] = useState(false);
  const [asignarFicha, setAsignarFicha] = useState<Ficha | null>(null);
  const [verFicha, setVerFicha] = useState<Ficha | null>(null);
  const [fichaExpandida, setFichaExpandida] = useState<number | null>(null);
  const [isMallaOpen, setIsMallaOpen] = useState(false);
  const [isTiposDocumentoOpen, setIsTiposDocumentoOpen] = useState(false);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  const loadFichas = async () => {
    if (!program?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(`programa/${program.id}/fichas`);
      if (res.data?.status === 'success' && Array.isArray(res.data?.data)) {
        setFichas(res.data.data);
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
    if (isOpen) {
      loadFichas();
    } else {
      setFichas([]);
      setFichaExpandida(null);
      setCurrentPage(1);
    }
  }, [isOpen, program?.id]);

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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-7xl max-h-[90vh] flex flex-col bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
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
                {/* Grid de Tarjetas Verticales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {paginatedFichas.map((ficha) => {
                    const expandida = fichaExpandida === ficha.id;
                    return (
                      <div
                        key={ficha.id}
                        className="bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-100 rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg"
                      >
                        {/* Header de la tarjeta */}
                        <div className="p-4 border-b border-gray-200 dark:border-coal-100">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-bold text-gray-800 dark:text-white">
                              {ficha.grado?.nombreGrado ?? `Ficha #${ficha.id}`}
                            </h3>
                            <span className="px-2 py-1 text-xs font-bold uppercase rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              En formación
                            </span>
                          </div>
                        </div>

                        {/* Contenido de la tarjeta */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-calendar text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Inicio</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">—</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-calendar-tick text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Fin</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">—</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-time text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Jornada</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">—</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-clock text-sm"></i>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Horario</p>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">—</p>
                            </div>
                          </div>
                        </div>

                        {/* Botón expandir/colapsar */}
                        <div className="px-4 pb-4">
                          <button
                            type="button"
                            onClick={() => toggleExpandirFicha(ficha.id)}
                            className="w-full py-2 text-xs font-bold uppercase text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          >
                            {expandida ? 'Ocultar detalles' : 'Ver detalles'}
                            <i className={`ml-2 ki-outline ${expandida ? 'ki-up' : 'ki-down'}`}></i>
                          </button>
                        </div>

                        {/* Contenido expandido */}
                        {expandida && (
                          <div className="px-4 pb-4 border-t border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200/30">
                            <div className="pt-4 space-y-3">
                              <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Sede</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">—</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Jornada</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">—</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Fecha de inicio</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">—</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Fecha de Finalización</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">—</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Horario de inicio</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">—</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Horario de Finalización</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">—</p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-coal-100">
                              <button
                                type="button"
                                onClick={() => setIsMallaOpen(true)}
                                className="flex-1 px-3 py-2 text-xs font-bold uppercase rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                              >
                                <i className="ki-outline ki-book-open text-sm"></i>
                                Malla
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsTiposDocumentoOpen(true)}
                                className="flex-1 px-3 py-2 text-xs font-bold uppercase rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white transition-colors flex items-center justify-center gap-1"
                              >
                                <i className="ki-outline ki-files text-sm"></i>
                                Documentos
                              </button>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setAsignarFicha(ficha)}
                                className="flex-1 px-3 py-2 text-xs font-bold uppercase rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                              >
                                Asignar tipos
                              </button>
                              <button
                                type="button"
                                onClick={() => setVerFicha(ficha)}
                                className="flex-1 px-3 py-2 text-xs font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-coal-300 transition-colors"
                              >
                                Ver documentos
                              </button>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                className="flex-1 px-3 py-2 text-xs font-bold uppercase rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                              >
                                Actualizar Ficha
                              </button>
                              <button
                                type="button"
                                className="flex-1 px-3 py-2 text-xs font-bold uppercase rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                              >
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
                  <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Mostrando</span>
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

      <TiposDocumentoModal
        isOpen={isTiposDocumentoOpen}
        onClose={() => setIsTiposDocumentoOpen(false)}
      />
    </>
  );
};
