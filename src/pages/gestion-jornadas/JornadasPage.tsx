import { useState, useEffect } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { Container, KeenIcon } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import CrearJornadaMaterias from './modales/CrearJornadaMaterias';
import VerJornadaModal from './modales/VerJornadaModal';
import EditarJornadaMaterias from './modales/EditarJornadaMaterias';
import Swal from 'sweetalert2';

interface Jornada {
  grupoJornada: number;
  nombreJornada: string;
  descripcion: string;
  horaInicial: string;
  horaFinal: string;
  numeroHoras: number;
  tipoHorario: 'Mañana' | 'Tarde' | 'Nocturna';
  dias: string[];
  estado: string;
}

const ITEMS_PER_PAGE = 6;

const JornadasPage: React.FC = () => {
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalVerOpen, setModalVerOpen] = useState(false);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState<Jornada | null>(null);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);

  // Estados para filtros y búsqueda
  const [searchText, setSearchText] = useState('');
  const [filterTipo, setFilterTipo] = useState<'Todos' | 'Mañana' | 'Tarde' | 'Nocturna'>('Todos');
  const [filterEstado, setFilterEstado] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos');

  const fetchJornadas = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('jornadas/agrupadas');
      setJornadas(res.data.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || 'Error al obtener las jornadas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJornadas();
  }, []);

  // Filtrar jornadas según búsqueda y filtros
  const filteredJornadas = jornadas.filter((j) => {
    const matchesSearch = j.nombreJornada.toLowerCase().includes(searchText.toLowerCase());
    const matchesTipo = filterTipo === 'Todos' || j.tipoHorario === filterTipo;
    const matchesEstado = filterEstado === 'Todos' || j.estado === filterEstado;
    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Paginación sobre jornadas filtradas
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentJornadas = filteredJornadas.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredJornadas.length / ITEMS_PER_PAGE);

  const getImagen = (tipo: Jornada['tipoHorario']) => {
    switch (tipo) {
      case 'Mañana':
        return '/public/media/images/jornadas/dia.jpg';
      case 'Tarde':
        return '/public/media/images/jornadas/tarde.jpg';
      case 'Nocturna':
        return '/public/media/images/jornadas/noche.jpg';
      default:
        return '/public/media/images/jornadas/dia.jpg';
    }
  };

  const handleVerJornada = (j: Jornada) => {
    setJornadaSeleccionada(j);
    setModalVerOpen(true);
  };
  const handleUpdate = (j: Jornada) => {
    setJornadaSeleccionada(j);
    setModalEditarOpen(true);
  };

  const handleDelete = async (j: Jornada) => {
    if (!j.grupoJornada) return;

    const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
    const isDarkMode = theme === 'dark';
    const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
    const color = isDarkMode ? 'white' : '#4B5675';
    const iconColor = isDarkMode ? 'white' : '#4B5675';

    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar todas las jornadas del grupo ${j.grupoJornada}? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-sm btn-danger',
        cancelButton: 'btn btn-sm btn-light'
      },
      background,
      color,
      iconColor
    }).then(async (result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        try {
          await axios.delete('jornadas/eliminar', { data: { grupoJornada: j.grupoJornada } });
          await fetchJornadas();

          const indexOfFirst = (currentPage - 1) * ITEMS_PER_PAGE;
          if (filteredJornadas.length - 1 <= indexOfFirst && currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }

          Swal.fire({
            title: 'Eliminado',
            text: `Se eliminaron las jornadas del grupo ${j.grupoJornada} exitosamente`,
            icon: 'success',
            background,
            color,
            iconColor
          });
        } catch (err: any) {
          console.error(err);
          Swal.fire({
            title: 'Error',
            text: err?.response?.data?.message || 'Ocurrió un error al eliminar la jornada',
            icon: 'error',
            background,
            color,
            iconColor
          });
        }
      }
    });
  };

  const handleToggleEstado = async (j: Jornada) => {
    if (!j.grupoJornada) return;

    const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
    const isDarkMode = theme === 'dark';
    const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
    const color = isDarkMode ? 'white' : '#4B5675';
    const iconColor = isDarkMode ? 'white' : '#4B5675';

    const result = await Swal.fire({
      title: 'Cambiar estado',
      text: `¿Deseas cambiar el estado de todas las jornadas del grupo ${j.grupoJornada}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-sm btn-primary',
        cancelButton: 'btn btn-sm btn-light'
      },
      background,
      color,
      iconColor
    });

    if (result.isConfirmed) {
      try {
        const res = await axios.put('jornadas/cambiar-estado', { grupoJornada: j.grupoJornada });
        setJornadas((prev) =>
          prev.map((item) =>
            item.grupoJornada === j.grupoJornada ? { ...item, estado: res.data.estado } : item
          )
        );
        Swal.fire({
          title: '¡Listo!',
          text: `Estado cambiado a ${res.data.estado}`,
          icon: 'success',
          background,
          color,
          iconColor
        });
      } catch (err: any) {
        console.error(err);
        Swal.fire({
          title: 'Error',
          text: err?.response?.data?.message || 'Ocurrió un error al cambiar el estado',
          icon: 'error',
          background,
          color,
          iconColor
        });
      }
    }
  };

  return (
    <Container>
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle />
          <ToolbarDescription>Gestión de jornadas académicas</ToolbarDescription>
        </ToolbarHeading>

        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setModalCrearOpen(true)}
        >
          <KeenIcon icon="plus" />
          Crear jornada
        </button>
      </Toolbar>

      {/* Buscador y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4 mb-2 items-center">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 w-full input"
        />
        <select
          value={filterTipo}
          onChange={(e) => {
            setFilterTipo(e.target.value as any);
            setCurrentPage(1);
          }}
          className="select"
        >
          <option value="Todos">Todos los tipos</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
          <option value="Nocturna">Nocturna</option>
        </select>
        <select
          value={filterEstado}
          onChange={(e) => {
            setFilterEstado(e.target.value as any);
            setCurrentPage(1);
          }}
          className="select"
        >
          <option value="Todos">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
      </div>

      {/* Grilla de jornadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
        {loading && (
          <p className="col-span-full text-center text-gray-500 dark:text-gray-300">
            Cargando jornadas...
          </p>
        )}
        {error && <p className="col-span-full text-center text-red-500">{error}</p>}
        {!loading && !error && currentJornadas.length === 0 && (
          <p className="col-span-full text-center text-gray-500 dark:text-gray-300">
            No hay jornadas
          </p>
        )}

        {currentJornadas.map((j) => (
          <div
            key={j.grupoJornada}
            className={clsx(
              'relative h-60 rounded-xl overflow-hidden shadow-2xl transition-all transform flex',
              j.estado === 'Activo'
                ? 'hover:shadow-[0_25px_50px_rgba(0,0,0,0.3)] hover:-translate-y-2'
                : 'opacity-50 grayscale'
            )}
          >
            {/* Imagen de fondo */}
            <div className="w-1/2 h-full relative flex-shrink-0 overflow-hidden rounded-l-xl">
              <img
                src={getImagen(j.tipoHorario)}
                alt={j.nombreJornada}
                className="object-cover w-full h-full brightness-75 transform transition-transform duration-500 hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 dark:from-white/30 to-transparent"></div>
              <span
                className={clsx(
                  'absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold text-white shadow-md',
                  j.tipoHorario === 'Mañana' && 'bg-yellow-500',
                  j.tipoHorario === 'Tarde' && 'bg-orange-500',
                  j.tipoHorario === 'Nocturna' && 'bg-indigo-500'
                )}
              >
                {j.tipoHorario}
              </span>
            </div>

            {/* Info */}
            <div className="relative flex-1 p-6 rounded-r-xl shadow-md bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-lg tracking-wide truncate text-gray-900 dark:text-neutral-100 mb-2">
                  {j.nombreJornada.toUpperCase()}
                </h4>
                <p className="text-sm text-gray-800 dark:text-neutral-400 line-clamp-3">
                  {j.descripcion}
                </p>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-800 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">H. inicial:</span>
                    <span>
                      {new Date(`1970-01-01T${j.horaInicial}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">H. final:</span>
                    <span>
                      {new Date(`1970-01-01T${j.horaFinal}`).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>

                  <div className="w-full text-xs text-gray-600 dark:text-neutral-500 mt-1 line-clamp-1">
                    Días: {j.dias.join(', ')}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 justify-end mt-3 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleToggleEstado(j)}
                    className={clsx(
                      'px-4 py-0.5 rounded-full text-[10px] font-semibold transition relative group flex items-center justify-center',
                      j.estado === 'Activo' ? 'bg-green-500 text-white' : 'bg-red-500 text-white',
                      'hover:opacity-80'
                    )}
                  >
                    {j.estado}
                    <span className="absolute -top-5 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-[10px] bg-black text-white px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Cambiar de estado
                    </span>
                  </button>

                  <button
                    onClick={() => handleUpdate(j)}
                    className="px-2 py-2 rounded-full transition relative group flex items-center justify-center shadow-sm hover:shadow-md"
                  >
                    <KeenIcon
                      icon="pencil"
                      className="text-gray-800 dark:text-neutral-400 w-3 h-3"
                    />
                    <span className="absolute -top-5 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-[10px] bg-black text-white px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Actualizar
                    </span>
                  </button>

                  <button
                    onClick={() => handleDelete(j)}
                    className="px-2 py-2 rounded-full transition relative group flex items-center justify-center shadow-sm hover:shadow-md"
                  >
                    <KeenIcon
                      icon="trash"
                      className="text-gray-800 dark:text-neutral-400 w-3 h-3"
                    />
                    <span className="absolute -top-5 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-[10px] bg-black text-white px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Eliminar
                    </span>
                  </button>

                  <button
                    onClick={() => handleVerJornada(j)}
                    className="px-2 py-2 rounded-full transition relative group flex items-center justify-center shadow-sm hover:shadow-md"
                  >
                    <KeenIcon icon="eye" className="text-gray-800 dark:text-neutral-400 w-3 h-3" />
                    <span className="absolute -top-5 right-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition text-[10px] bg-black text-white px-1.5 py-0.5 rounded-md whitespace-nowrap">
                      Ver más información
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            disabled={currentPage === 1}
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={clsx(
                'w-3 h-3 rounded-full transition-colors',
                currentPage === page ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              )}
            />
          ))}

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            disabled={currentPage === totalPages}
          >
            <svg
              className="w-4 h-4 text-gray-600 dark:text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      <CrearJornadaMaterias
        open={modalCrearOpen}
        onClose={() => setModalCrearOpen(false)}
        onSuccess={() => fetchJornadas()}
      />
      <VerJornadaModal
        jornada={jornadaSeleccionada}
        open={modalVerOpen}
        onClose={() => setModalVerOpen(false)}
      />
      <EditarJornadaMaterias
        open={modalEditarOpen}
        jornada={jornadaSeleccionada}
        onClose={() => setModalEditarOpen(false)}
        onSuccess={() => fetchJornadas()}
      />
    </Container>
  );
};

export default JornadasPage;
