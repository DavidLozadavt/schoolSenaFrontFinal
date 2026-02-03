import React, { useState, useRef, useMemo, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import FormularioPrograma from './components/FormularioPrograma';
import ConfirmarEliminar from './components/ConfirmarEliminar';
import Toast from './components/Toast';
import { Program } from './types';
import InformacionPrograma from './components/InformacionPrograma';
import MallaCurricular from './components/malla-curricular/MallaCurricular';
import { TiposDocumentoModal } from '@/pages/tipos-documento/TiposDocumentoModal';
import { AuthContext } from '@/auth/providers/JWTProvider';

const IMAGENES_POR_NIVEL: Record<string, string> = {
  'PREESCOLAR': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600',
  'PRIMARIA': 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600',
  'TECNICO': 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=600',
  'BACHILLER': 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=600',
  'TECNOLOGO': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600',
  'PREGRADO': 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=600',
  'POSTGRADO': 'https://images.unsplash.com/photo-1525921429624-479b6a26d84d?q=80&w=600',
  'DEFAULT': 'https://images.unsplash.com/photo-1523050335392-9ae38774b79f?q=80&w=600'
};

export const GestionProgramas = ({
  onActionComplete = () => { }
}: {
  onActionComplete?: () => void;
}) => {
  const navigate = useNavigate();

  const [isMallaOpen, setIsMallaOpen] = useState(false);
  const [selectedMallaProgram, setSelectedMallaProgram] = useState<Program | null>(null);

  const openMallaModal = (program: Program) => {
    setSelectedMallaProgram(program);
    setIsMallaOpen(true);
  };
  const authContext = useContext(AuthContext);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedInfoProgram, setSelectedInfoProgram] = useState<Program | null>(null);
  const [isTiposDocumentoOpen, setIsTiposDocumentoOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [programToEdit, setProgramToEdit] = useState<Program | null>(null);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);

  useEffect(() => {
    fetchProgramas();
  }, [authContext?.empresa.id]);

  const backUrl = import.meta.env.VITE_APP_BACKEND_URL || '';

  const mapBackendToUi = (p: any): Program => {
    const nivelKey = p.nivel?.nombreNivel?.trim().toUpperCase() || 'DEFAULT';
    return {
      id: p.id,
      name: p.nombrePrograma,
      codigo: p.codigoPrograma,
      status: p.estado?.nombre || 'ACTIVO',
      estado: p.estado,
      nivel: p.nivel?.nombreNivel || 'N/A',
      formacion: p.tipo_formacion?.nombreTipoFormacion || 'N/A',
      imageUrl: IMAGENES_POR_NIVEL[nivelKey] || IMAGENES_POR_NIVEL['DEFAULT'],
      description: p.descripcionPrograma,
      documento: p.documento ? `${backUrl}${p.documento}` : null,
      idNivelEducativo: p.idNivelEducativo,
      idTipoFormacion: p.idTipoFormacion,
      idEstadoPrograma: p.idEstadoPrograma
    };
  };

  const fetchProgramas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`programasporRegional/${authContext?.empresa?.id}`);
      if (response.data.status === 'success') {
        setPrograms(response.data.data.map(mapBackendToUi));
      }
    } catch (error) {
      console.error('Error al cargar programas:', error);
      setError("No se pudieron cargar los programas. Por favor, intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgram = (newProgramFromDB: any) => {
    setPrograms((prev) => [...prev, mapBackendToUi(newProgramFromDB)]);
    setToastMessage("Programa creado con éxito");
    setShowToast(true);
    onActionComplete();
  };

  const handleUpdateProgram = (updatedFromDB: any) => {
    const mapped = mapBackendToUi(updatedFromDB);
    setPrograms(prev => prev.map(p => p.id === mapped.id ? mapped : p));
    setToastMessage("Programa actualizado con éxito");
    setShowToast(true);
    onActionComplete();
  };

  const openDeleteConfirm = (program: Program) => {
    setProgramToDelete(program);
    setIsConfirmOpen(true);
  };

  const handleExecuteDelete = async () => {
    if (!programToDelete) return;
    try {
      const response = await axios.delete(`/programas_eliminar/${programToDelete.id}`);
      if (response.data.status === 'success') {
        setPrograms(prev => prev.filter(p => p.id !== programToDelete.id));
        setToastMessage(`Programa "${programToDelete.name}" eliminado`);
        setShowToast(true);
        onActionComplete();
      }
    } catch (error) {
      alert("No es posible eliminar este programa porque ya tiene períodos académicos asignados..");
    } finally {
      setProgramToDelete(null);
    }
  };

  const openTiposDocumentoModal = () => setIsTiposDocumentoOpen(true);

  const openEditModal = (program: Program) => {
    setProgramToEdit(program);
    setIsModalOpen(true);
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, programs]);

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredPrograms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex);

  // Resetear página cuando cambia el filtro
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleOpenInfo = (program: Program) => {
    setSelectedInfoProgram(program);
    setIsInfoOpen(true);
  };

  const handleOpenProgramacionFichas = (program: Program) => {
    // Navegar a la página de programación de fichas
    navigate(`/gestion-academica/configuracion/programas/${program.id}/fichas`);
  };

  return (
    <div className="relative flex flex-col w-full h-screen min-h-screen p-4 md:p-8 bg-[#f3f4f7] dark:bg-coal-500 font-sans overflow-hidden">

      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#a1a1aa 0.5px, transparent 0.5px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -mr-64 -mt-64"></div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="relative z-10 flex flex-col w-full h-full">
        <div className="w-full max-w-6xl mx-auto mb-6 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-800 uppercase dark:text-white">Gestión de Programas</h1>
          <p className="mt-1 text-xs font-medium tracking-widest text-gray-500 uppercase">Configuración Académica</p>
        </div>

        <div className="flex items-center justify-between w-full max-w-5xl gap-4 px-2 mx-auto mb-8">
          <div className="group flex items-center bg-white/80 backdrop-blur-md dark:bg-coal-300/80 border border-gray-400 dark:border-gray-800 rounded-full p-1.5 transition-all duration-500 ease-in-out w-[46px] hover:w-[280px] md:hover:w-[350px] focus-within:w-[280px] md:focus-within:w-[350px] shadow-sm overflow-hidden">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-500 transition-colors group-hover:text-blue-600"><i className="text-xl ki-outline ki-magnifier"></i></div>
            <input type="text" placeholder="Buscar programa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full px-3 text-sm font-medium transition-opacity bg-transparent border-none outline-none opacity-0 group-hover:opacity-100 focus:opacity-100 dark:text-white" />
          </div>

          <button onClick={() => { setProgramToEdit(null); setIsModalOpen(true); }} className="group relative flex items-center justify-start h-[46px] w-[46px] hover:w-[180px] bg-blue-600 text-white rounded-full transition-all duration-500 shadow-lg active:scale-95">
            <div className="flex items-center justify-center flex-shrink-0 w-[46px] h-[46px]"><i className="text-lg ki-filled ki-plus"></i></div>
            <span className="absolute left-[46px] text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity pr-6">Añadir Programa</span>
          </button>
        </div>

        {/* Grid de Tarjetas Verticales */}
        <div className="relative w-full max-w-7xl mx-auto flex-grow flex flex-col px-4 md:px-6 overflow-hidden">
          {/* Condicional de Carga */}
          {loading ? (
            <div className="flex flex-col items-center justify-center w-full gap-4 py-12">
              <div className="w-12 h-12 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <p className="text-sm font-medium tracking-widest text-gray-500 uppercase">Cargando programas...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center w-full text-center py-12">
              <i className="mb-4 text-4xl text-red-500 ki-outline ki-information-2"></i>
              <p className="font-medium text-gray-600 dark:text-gray-300">{error}</p>
              <button onClick={fetchProgramas} className="mt-4 text-xs font-bold text-blue-600 uppercase hover:underline">Reintentar</button>
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full text-center opacity-60 py-12">
              <i className="mb-4 text-5xl text-gray-400 ki-outline ki-search-list"></i>
              <p className="text-xs font-medium tracking-widest text-gray-500 uppercase dark:text-gray-400">No se encontraron programas para "{searchTerm}"</p>
            </div>
          ) : (
            <>
              {/* Grid de Tarjetas */}
              <div className="flex-1 overflow-y-auto pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedPrograms.map((program) => (
                    <div key={program.id} className="w-full h-auto shadow-xl rounded-xl border border-gray-300 dark:border-coal-100 bg-white dark:bg-coal-400 overflow-hidden hover:shadow-2xl transition-shadow">
                      {/* Imagen del programa */}
                      <div className="relative h-48 overflow-hidden">
                        <img src={program.imageUrl} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute top-3 right-3">
                          <span className="px-3 py-1 font-extrabold uppercase rounded-md text-[10px] bg-blue-600 text-white tracking-wider shadow-sm">{program.nivel}</span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <h3 className="text-sm font-bold text-white leading-tight uppercase line-clamp-2">{program.name}</h3>
                        </div>
                      </div>

                      {/* Contenido de la tarjeta */}
                      <div className="p-4 flex flex-col">
                        {/* Información básica */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-hashtag text-xs"></i>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{program.codigo}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-book text-xs"></i>
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{program.formacion}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <i className="text-gray-400 ki-outline ki-information text-xs"></i>
                            <span className={`text-xs font-bold uppercase ${program.status === 'ACTIVO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>{program.status}</span>
                          </div>
                        </div>

                        {/* Botones de acción rápida */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <button title="Periodos abiertos" className="flex items-center justify-center w-full h-8 text-gray-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all">
                            <i className="text-sm ki-outline ki-entrance-right"></i>
                          </button>
                          <button title="Malla curricular" onClick={() => openMallaModal(program)} className="flex items-center justify-center w-full h-8 text-gray-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all">
                            <i className="text-sm ki-outline ki-book-open"></i>
                          </button>
                          <button title="Configurar pagos" className="flex items-center justify-center w-full h-8 text-gray-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all">
                            <i className="text-sm ki-outline ki-setting-2"></i>
                          </button>
                          <button title="Configurar documentos" type="button" onClick={openTiposDocumentoModal} className="flex items-center justify-center w-full h-8 text-gray-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all">
                            <i className="text-sm ki-outline ki-files"></i>
                          </button>
                        </div>

                        {/* Botón principal */}
                        <button
                          onClick={() => handleOpenProgramacionFichas(program)}
                          className="w-full py-2 px-4 text-xs font-bold uppercase bg-primary text-white rounded-lg hover:bg-primary-active transition-colors mb-3"
                        >
                          Ver Programación de Fichas →
                        </button>

                        {/* Botones de acción secundaria */}
                        <div className="flex justify-between gap-2 pt-3 border-t border-gray-100 dark:border-coal-200">
                          {program.documento ? (
                            <button
                              type="button"
                              onClick={() => window.open(program.documento!, '_blank')}
                              title="Ver PDF"
                              className="flex items-center justify-center flex-1 py-1.5 text-blue-600 transition-all border border-transparent bg-blue-50/50 dark:bg-blue-500/10 rounded-lg hover:border-blue-500 hover:scale-105"
                            >
                              <i className="text-sm ki-outline ki-document"></i>
                            </button>
                          ) : (
                            <span title="Sin documento" className="flex items-center justify-center flex-1 py-1.5 text-gray-400 rounded-lg bg-gray-50/50 dark:bg-coal-200/50 cursor-not-allowed">
                              <i className="text-sm ki-outline ki-document"></i>
                            </span>
                          )}
                          <button onClick={() => openEditModal(program)} title="Actualizar" className="flex items-center justify-center flex-1 py-1.5 text-blue-500 transition-all border border-transparent bg-blue-50/50 dark:bg-blue-500/10 rounded-lg hover:border-blue-500 hover:scale-105">
                            <i className="text-sm ki-outline ki-arrows-loop"></i>
                          </button>
                          <button onClick={() => openDeleteConfirm(program)} title="Eliminar" className="flex items-center justify-center flex-1 py-1.5 text-red-500 transition-all border border-transparent bg-red-50/50 dark:bg-red-500/10 rounded-lg hover:border-red-500 hover:scale-105">
                            <i className="text-sm ki-outline ki-trash"></i>
                          </button>
                          <button title="Información" onClick={() => handleOpenInfo(program)} className="flex items-center justify-center flex-1 py-1.5 text-blue-600 transition-all border border-transparent bg-blue-50/50 dark:bg-blue-500/10 rounded-lg hover:border-blue-600 hover:scale-105">
                            <i className="text-sm ki-outline ki-eye"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200 dark:border-coal-100 bg-white dark:bg-coal-300 rounded-b-lg">
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
                      {startIndex + 1} - {Math.min(endIndex, filteredPrograms.length)} de {filteredPrograms.length}
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

      <MallaCurricular
        isOpen={isMallaOpen}
        onClose={() => setIsMallaOpen(false)}
        program={selectedMallaProgram}
      />

      <FormularioPrograma
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setProgramToEdit(null); }}
        onAddProgram={handleAddProgram}
        onUpdateProgram={handleUpdateProgram}
        programToEdit={programToEdit}
      />

      <ConfirmarEliminar
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setProgramToDelete(null); }}
        onConfirm={handleExecuteDelete}
        nombrePrograma={programToDelete?.name}
      />

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />

      <InformacionPrograma
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        program={selectedInfoProgram}
      />

      <TiposDocumentoModal
        isOpen={isTiposDocumentoOpen}
        onClose={() => setIsTiposDocumentoOpen(false)}
      />
    </div>

  );
};

export default GestionProgramas;