import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import AperturaCard from './components/AperturaCard';
import AperturaCreateModal from './components/AperturaCreateModal';

interface Program {
  id: number;
  name: string;
  codigo: string;
}

const ITEMS_PER_PAGE = 9;

const AperturarProgramaPage: React.FC = () => {
  const { idPrograma } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [aperturas, setAperturas] = useState<any[]>([]);
  const [loadingAperturas, setLoadingAperturas] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [aperturaToEdit, setAperturaToEdit] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!idPrograma) return;
    const loadProgram = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`aperturarprograma/disponibles`, { params: { idPrograma } });
        const data = res.data;
        const p = data && (Array.isArray(data) ? data[0] : data);
        if (p && p.id) {
          setProgram({
            id: Number(p.id),
            name: p.nombrePrograma || p.name || '',
            codigo: p.codigoPrograma || p.codigo || ''
          });
        } else {
          setError('Programa no encontrado.');
        }
      } catch (err) {
        console.error('Error cargando programa:', err);
        setError('No se pudo cargar el programa.');
      } finally {
        setLoading(false);
      }
    };
    loadProgram();
  }, [idPrograma]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (program) loadAperturas();
  }, [program]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      setError(null);
      const [periodosRes, sedesRes] = await Promise.all([
        axios.get('/periodos'),
        axios.get('/sedes')
      ]);
      setPeriodos(periodosRes.data.data || periodosRes.data || []);
      setSedes(sedesRes.data.data || sedesRes.data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar los datos necesarios');
    } finally {
      setLoadingData(false);
    }
  };

  const loadAperturas = async () => {
    if (!program) return;
    try {
      setLoadingAperturas(true);
      const res = await axios.get(`aperturarprograma/disponibles`,
          {params: { idPrograma: idPrograma || program.id }}
        );
      const data = res.data.data || res.data;
      setAperturas(data);
    } catch (err) {
      console.error('Error cargando aperturas:', err);
    } finally {
      setLoadingAperturas(false);
    }
  };

  const handleEdit = (apertura: any) => {
    setAperturaToEdit(apertura);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreate = () => {
    setAperturaToEdit(null);
    setIsCreateModalOpen(true);
  };

  const filterByTerm = (list: any[], term: string) => {
    const normalizedTerm = term.trim().toLowerCase();
    if (!normalizedTerm) return list;

    return list.filter((a) => {
      const searchableValues = [
        a.id?.toString(),
        a.estado,
        a.tipoCalificacion,
        a.periodo?.nombrePeriodo,
        a.sede?.nombre
      ];

      return searchableValues.some((value) => (value || '').toLowerCase().includes(normalizedTerm));
    });
  };

  const filteredAperturas = useMemo(
    () => filterByTerm(aperturas, searchTerm),
    [aperturas, searchTerm]
  );

  const totalPages = Math.max(1, Math.ceil(filteredAperturas.length / ITEMS_PER_PAGE));

  const paginatedAperturas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAperturas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAperturas, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="mt-6 flex justify-center items-center gap-2">
        <button
          type="button"
          onClick={() => setCurrentPage(currentPage - 1)}
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
          onClick={() => setCurrentPage(currentPage + 1)}
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-coal-400 dark:hover:bg-coal-300 transition-colors"
            >
              <i className="ki-outline ki-arrow-left text-lg text-gray-600 dark:text-gray-300" />
            </button>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">Aperturar Programa</h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
            Gestión de aperturas para el programa seleccionado
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <i className="ki-outline ki-plus" />
          Crear Apertura
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <>
          {program && (
            <div className="mb-6 p-4 bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                <i className="ki-outline ki-book-open text-blue-600 dark:text-blue-400 text-2xl" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">{program.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Código: {program.codigo}
                </p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="relative w-full md:max-w-md">
              <i className="ki-outline ki-magnifier text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por periodo, sede, estado..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-coal-500 border border-gray-200 dark:border-coal-300 rounded-xl text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {loadingAperturas ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredAperturas.length === 0 ? (
            <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              {aperturas.length === 0
                ? 'No hay aperturas registradas para este programa.'
                : 'No se encontraron aperturas con esa búsqueda.'}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedAperturas.map((apertura) => (
                  <AperturaCard key={apertura.id} apertura={apertura} onEdit={handleEdit} />
                ))}
              </div>
              {renderPagination()}
            </>
          )}
        </>
      )}

      {program && (
        <AperturaCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setAperturaToEdit(null);
          }}
          programId={program.id}
          periodos={periodos}
          sedes={sedes}
          onSuccess={loadAperturas}
          aperturaToEdit={aperturaToEdit}
        />
      )}
    </div>
  );
};

export default AperturarProgramaPage;
