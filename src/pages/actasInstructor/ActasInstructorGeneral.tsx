import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Acta } from './types';
import ActaCard from './components/ActaCard';
import ActaDetailModal from './components/ActaDetailModal';
import ActaCreateModal from './components/ActaCreateModal';
import ActaAsistenciasModal from './components/ActaAsistenciasModal';
import ActaAprobarModal from './components/ActaAprobarModal';
import ActaAnexosModal from './components/ActaAnexosModal';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

const ITEMS_PER_PAGE = 9;

const ActasInstructorGeneral = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(false);
  const [actasAsistente, setActasAsistente] = useState<Acta[]>([]);
  const [loadingAsistente, setLoadingAsistente] = useState(false);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [activeTab, setActiveTab] = useState<'creadas' | 'asistente'>('creadas');
  const [searchCreada, setSearchCreada] = useState('');
  const [searchAsistente, setSearchAsistente] = useState('');
  const [currentPageCreada, setCurrentPageCreada] = useState(1);
  const [currentPageAsistente, setCurrentPageAsistente] = useState(1);

  // Estados para creación/edición
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actaToEdit, setActaToEdit] = useState<Acta | null>(null);

  // Estado para modal de asistencias
  const [isAsistenciasModalOpen, setIsAsistenciasModalOpen] = useState(false);
  const [actaForAsistencias, setActaForAsistencias] = useState<Acta | null>(null);

  // Estado para modal de aprobar asistencia
  const [isAprobarModalOpen, setIsAprobarModalOpen] = useState(false);
  const [actaForAprobar, setActaForAprobar] = useState<Acta | null>(null);

  // Estado para modal de anexos
  const [isAnexosModalOpen, setIsAnexosModalOpen] = useState(false);
  const [actaForAnexos, setActaForAnexos] = useState<Acta | null>(null);

  // Estados para modal de opciones de descarga (Descargar vs Guardar)
  const [downloadOptionsModalOpen, setDownloadOptionsModalOpen] = useState(false);
  const [actaForDownloadOptions, setActaForDownloadOptions] = useState<Acta | null>(null);
  const [isProcessingDownload, setIsProcessingDownload] = useState(false);

  const [availableFichas, setAvailableFichas] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);

  const idContrato = authContext.persona.contrato[0]?.id;

  const loadActas = async () => {
    if (!idContrato) return;
    setLoading(true);
    try {
      const res = await axios.get(`actas/contrato/${idContrato}`);
      setActas(res.data);
    } catch (error) {
      console.error('Error al cargar actas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActasAsistente = async () => {
    if (!idContrato) return;
    setLoadingAsistente(true);
    try {
      const res = await axios.get(`actas/asistente/${idContrato}`);
      setActasAsistente(res.data);
    } catch (error) {
      console.error('Error al cargar actas como asistente:', error);
    } finally {
      setLoadingAsistente(false);
    }
  };

  const loadFichas = async () => {
    if (!idContrato) return;
    try {
      const res = await axios.get(`instructores/fichas?idContrato=${idContrato}`);
      setAvailableFichas(res.data);
    } catch (error) {
      console.error('Error al cargar fichas:', error);
    }
  };

  const loadCiudades = async () => {
    try {
      const res = await axios.get('ciudades-departamento');
      setCiudades(res.data);
    } catch (error) {
      console.error('Error al cargar ciudades:', error);
    }
  };

  const handleDownloadPDF = async (idActa: number, shouldDownload = true): Promise<Blob | null> => {
    // ─── DEBUG ───────────────────────────────────────────────
    const DEBUG = false; // cambiar a false para producción

    if (DEBUG) {
      try {
        const debugResponse = await axios.get(`actas/generar-pdf/${idActa}?debug=true`);
        console.log('🔍 DEBUG acta payload:', debugResponse.data);
        console.log('📋 Instructores:', debugResponse.data.instructoresConColor);
        console.log('📅 Calendario:', debugResponse.data.calendario);
        console.log('✅ En formación:', debugResponse.data.enFormacion);
        console.log('⚠️ Con novedad:', debugResponse.data.conNovedad);
        console.log('📊 Meta:', debugResponse.data.meta);
      } catch (debugError) {
        console.error('❌ Error en debug:', debugError);
      }
    }
    // ─────────────────────────────────────────────────────────

    try {
      const response = await axios.get(`actas/generar-pdf/${idActa}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });

      if (shouldDownload) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `acta_instructor_${idActa}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      return blob;
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      alert('Error al descargar el PDF. Por favor, intente de nuevo.');
      return null;
    }
  };

  const handleOpenDownloadOptions = (acta: Acta) => {
    setActaForDownloadOptions(acta);
    setDownloadOptionsModalOpen(true);
  };

  const handleSaveAndDownloadActa = async () => {
    if (!actaForDownloadOptions) return;

    setIsProcessingDownload(true);
    try {
      // 1. Generar el PDF y obtener el blob
      const pdfBlob = await handleDownloadPDF(actaForDownloadOptions.id, false);

      if (pdfBlob) {
        // 2. Crear el archivo para subir
        const fileToUpload = new File(
          [pdfBlob],
          `acta_instructor_${actaForDownloadOptions.id}.pdf`,
          { type: 'application/pdf' }
        );

        // 3. Subir el documento
        await handleUploadDocumento(actaForDownloadOptions.id, fileToUpload);

        // 4. Descargar para el usuario
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `acta_instructor_${actaForDownloadOptions.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }

      setDownloadOptionsModalOpen(false);
      setActaForDownloadOptions(null);
    } catch (error) {
      console.error('Error en el proceso de guardar y descargar:', error);
    } finally {
      setIsProcessingDownload(false);
    }
  };

  const handleEdit = (acta: Acta) => {
    setActaToEdit(acta);
    setIsCreateModalOpen(true);
  };

  const handleOpenAsistencias = (acta: Acta) => {
    setActaForAsistencias(acta);
    setIsAsistenciasModalOpen(true);
  };

  const handleOpenAprobar = (acta: Acta) => {
    setActaForAprobar(acta);
    setIsAprobarModalOpen(true);
  };

  const handleOpenAnexos = (acta: Acta) => {
    setActaForAnexos(acta);
    setIsAnexosModalOpen(true);
  };

  const handleUploadDocumento = async (idActa: number, file: File) => {
    const formData = new FormData();
    formData.append('documento', file);

    try {
      await axios.post(`actas/${idActa}/documento`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Documento subido correctamente');
      loadActas();
      loadActasAsistente();
    } catch (error) {
      console.error('Error al subir el documento:', error);
      alert('Error al subir el documento. Por favor, intente de nuevo.');
    }
  };

  const handleOpenCreate = () => {
    setActaToEdit(null);
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    loadActas();
    loadActasAsistente();
    loadFichas();
    loadCiudades();
  }, [idContrato]);

  const filterActasByTerm = (list: Acta[], term: string) => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) return list;

    return list.filter((acta) => {
      const searchableValues = [
        acta.id?.toString(),
        acta.nombre,
        acta.tipoActa,
        acta.lugar,
        acta.ficha?.codigo,
        acta.ciudad?.descripcion
      ];

      return searchableValues.some((value) => (value || '').toLowerCase().includes(normalizedTerm));
    });
  };

  const filteredActasCreadas = useMemo(
    () => filterActasByTerm(actas, searchCreada),
    [actas, searchCreada]
  );

  const filteredActasAsistente = useMemo(
    () => filterActasByTerm(actasAsistente, searchAsistente),
    [actasAsistente, searchAsistente]
  );

  const totalPagesCreadas = Math.max(1, Math.ceil(filteredActasCreadas.length / ITEMS_PER_PAGE));
  const totalPagesAsistente = Math.max(
    1,
    Math.ceil(filteredActasAsistente.length / ITEMS_PER_PAGE)
  );

  const paginatedActasCreadas = useMemo(() => {
    const start = (currentPageCreada - 1) * ITEMS_PER_PAGE;
    return filteredActasCreadas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActasCreadas, currentPageCreada]);

  const paginatedActasAsistente = useMemo(() => {
    const start = (currentPageAsistente - 1) * ITEMS_PER_PAGE;
    return filteredActasAsistente.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredActasAsistente, currentPageAsistente]);

  useEffect(() => {
    setCurrentPageCreada(1);
  }, [searchCreada]);

  useEffect(() => {
    if (currentPageCreada > totalPagesCreadas) {
      setCurrentPageCreada(totalPagesCreadas);
    }
  }, [currentPageCreada, totalPagesCreadas]);

  useEffect(() => {
    setCurrentPageAsistente(1);
  }, [searchAsistente]);

  useEffect(() => {
    if (currentPageAsistente > totalPagesAsistente) {
      setCurrentPageAsistente(totalPagesAsistente);
    }
  }, [currentPageAsistente, totalPagesAsistente]);

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    onPageChange: (page: number) => void
  ) => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-6 flex justify-center items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-coal-300 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-coal-400"
        >
          Anterior
        </button>
        <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
          Página {currentPage} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-coal-300 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-coal-400"
        >
          Siguiente
        </button>
      </div>
    );
  };

  return (
    <div className="p-5 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Actas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestión de actas y asistencias</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <i className="ki-outline ki-plus" />
          Crear Acta
        </button>
      </div>

      <div className="flex border-b border-gray-200 dark:border-coal-300 mb-6">
        <button
          onClick={() => setActiveTab('creadas')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'creadas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Mis Actas (Creadas)
        </button>
        <button
          onClick={() => setActiveTab('asistente')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'asistente'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Actas por Aprobar (Asistente)
        </button>
      </div>

      {activeTab === 'creadas' &&
        (loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="relative w-full md:max-w-md">
                <i className="ki-outline ki-magnifier text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm" />
                <input
                  type="text"
                  value={searchCreada}
                  onChange={(e) => setSearchCreada(e.target.value)}
                  placeholder="Buscar por nombre, tipo, ficha, ciudad, lugar o ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {filteredActasCreadas.length === 0 ? (
              <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                {actas.length === 0
                  ? 'No hay actas registradas para este contrato.'
                  : 'No se encontraron actas con esa búsqueda.'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedActasCreadas.map((acta) => (
                    <ActaCard
                      key={acta.id}
                      acta={acta}
                      onClick={setSelectedActa}
                      onDownloadPDF={() => handleOpenDownloadOptions(acta)}
                      onEdit={handleEdit}
                      onAsistencias={handleOpenAsistencias}
                      onAnexos={handleOpenAnexos}
                      onUploadDocumento={handleUploadDocumento}
                    />
                  ))}
                </div>
                {renderPagination(currentPageCreada, totalPagesCreadas, setCurrentPageCreada)}
              </>
            )}
          </>
        ))}

      {activeTab === 'asistente' &&
        (loadingAsistente ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="relative w-full md:max-w-md">
                <i className="ki-outline ki-magnifier text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm" />
                <input
                  type="text"
                  value={searchAsistente}
                  onChange={(e) => setSearchAsistente(e.target.value)}
                  placeholder="Buscar por nombre, tipo, ficha, ciudad, lugar o ID..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {filteredActasAsistente.length === 0 ? (
              <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
                {actasAsistente.length === 0
                  ? 'No eres asistente en ninguna acta actualmente.'
                  : 'No se encontraron actas con esa búsqueda.'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedActasAsistente.map((acta) => (
                    <ActaCard
                      key={acta.id}
                      acta={acta}
                      onClick={setSelectedActa}
                      onDownloadPDF={handleDownloadPDF}
                      onAprobar={handleOpenAprobar}
                      onAnexos={handleOpenAnexos}
                      onUploadDocumento={handleUploadDocumento}
                    />
                  ))}
                </div>
                {renderPagination(
                  currentPageAsistente,
                  totalPagesAsistente,
                  setCurrentPageAsistente
                )}
              </>
            )}
          </>
        ))}

      {/* Modal Detalles Acta */}
      <ActaDetailModal acta={selectedActa} onClose={() => setSelectedActa(null)} />

      <ActaCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setActaToEdit(null);
        }}
        idContrato={idContrato}
        availableFichas={availableFichas}
        ciudades={ciudades}
        onSuccess={loadActas}
        actaToEdit={actaToEdit}
      />

      {/* Modal Asistencias */}
      <ActaAsistenciasModal
        isOpen={isAsistenciasModalOpen}
        onClose={() => {
          setIsAsistenciasModalOpen(false);
          setActaForAsistencias(null);
        }}
        acta={actaForAsistencias}
        onSuccess={loadActas}
      />

      {/* Modal Aprobar */}
      <ActaAprobarModal
        isOpen={isAprobarModalOpen}
        onClose={() => {
          setIsAprobarModalOpen(false);
          setActaForAprobar(null);
        }}
        acta={actaForAprobar}
        idContrato={idContrato}
        onSuccess={loadActasAsistente}
      />

      <ActaAnexosModal
        isOpen={isAnexosModalOpen}
        onClose={() => {
          setIsAnexosModalOpen(false);
          setActaForAnexos(null);
        }}
        acta={actaForAnexos}
        onSuccess={loadActas}
      />

      {/* Modal de Opciones de Descarga */}
      {downloadOptionsModalOpen && actaForDownloadOptions && (
        <Modal
          open={true}
          onClose={() => !isProcessingDownload && setDownloadOptionsModalOpen(false)}
          className="mx-4 sm:mx-auto max-w-sm w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <ModalTitle>Generar Acta</ModalTitle>
              <button
                type="button"
                onClick={() => setDownloadOptionsModalOpen(false)}
                disabled={isProcessingDownload}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-4">
              <div className="flex flex-col gap-3">
                <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                      <i className="ki-outline ki-file-down text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-bold text-gray-800 dark:text-white">
                      ¿Qué desea hacer?
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Puede generar el PDF solo para descargar o guardarlo directamente en el sistema
                    como el documento oficial del acta.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      handleDownloadPDF(actaForDownloadOptions.id);
                      setDownloadOptionsModalOpen(false);
                    }}
                    disabled={isProcessingDownload}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-coal-300 dark:hover:bg-coal-200 text-gray-700 dark:text-white rounded-xl transition-all text-sm font-bold border border-transparent disabled:opacity-50"
                  >
                    <i className="ki-outline ki-file-down text-lg" />
                    Solo Descargar PDF
                  </button>

                  <button
                    onClick={handleSaveAndDownloadActa}
                    disabled={isProcessingDownload}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all text-sm font-bold shadow-lg shadow-green-500/20 disabled:opacity-50"
                  >
                    {isProcessingDownload ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <i className="ki-outline ki-document text-lg" />
                    )}
                    {isProcessingDownload ? 'Procesando...' : 'Guardar y Descargar'}
                  </button>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setDownloadOptionsModalOpen(false)}
                  disabled={isProcessingDownload}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
};

export default ActasInstructorGeneral;
