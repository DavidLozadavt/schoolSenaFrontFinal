import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Select from 'react-select';
import selectStyles from './selectStyles';
import InstructorCard from './InstructorCard';
import { Instructor } from './interfaceInstructor';

interface Regional {
  id: number;
  razonSocial: string;
}

interface Centro {
  id: number;
  nombre: string;
}

const RmiGeneral: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const { centroF, setCentroF } = authContext;

  const [idRegional, setIdRegional] = useState<number>(0);
  const [regionales, setRegionales] = useState<Regional[]>([]);
  const [loadingRegionales, setLoadingRegionales] = useState(false);
  const [idCentroFormacion, setIdCentroFormacion] = useState<number>(0);
  const [centroFormacion, setCentroFormacion] = useState<Centro[]>([]);
  const [loadingCentros, setLoadingCentros] = useState(false);

  const [rawInstructors, setRawInstructors] = useState<Instructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  });
  const [estado, setEstado] = useState<string | null>(null);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  // Refs para cancelar peticiones
  const regionalAbortController = useRef<AbortController | null>(null);
  const centrosAbortController = useRef<AbortController | null>(null);
  const instructoresAbortController = useRef<AbortController | null>(null);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Cargar regionales solo si es ADMINISTRADOR VT
  useEffect(() => {
    if (authContext?.roles?.includes('ADMINISTRADOR VT')) {
      setLoadingRegionales(true);
      if (regionalAbortController.current) {
        regionalAbortController.current.abort();
      }
      regionalAbortController.current = new AbortController();

      axios
        .get('regional', { signal: regionalAbortController.current.signal })
        .then((r) => {
          setRegionales(r.data);
          setLoadingRegionales(false);
        })
        .catch((error) => {
          if (error.name !== 'CanceledError') {
            console.error('Error al cargar regionales:', error);
            setLoadingRegionales(false);
          }
        });

      return () => {
        if (regionalAbortController.current) {
          regionalAbortController.current.abort();
        }
      };
    } else if (authContext?.roles?.includes('ADMIN REGIONAL')) {
      setIdRegional(authContext?.empresa?.id || 0);
    } else {
      // Cualquier otro rol (incluye ADMIN CENTRO y todos los demás)
      setIdRegional(authContext?.empresa?.id || 0);
      setIdCentroFormacion(authContext?.user?.idCentroFormacion || 0);
    }
  }, [authContext?.roles, authContext?.empresa?.id, authContext?.user?.idCentroFormacion]);

  // Cargar centros de formación cuando cambia la regional
  useEffect(() => {
    if (idRegional === 0) {
      setCentroFormacion([]);
      setIdCentroFormacion(0);
      return;
    }

    setLoadingCentros(true);
    // Cancelar petición anterior si existe
    if (centrosAbortController.current) {
      centrosAbortController.current.abort();
    }

    centrosAbortController.current = new AbortController();

    axios
      .get(`centrosFormacion/regional/${idRegional}`, {
        signal: centrosAbortController.current.signal
      })
      .then((r) => {
        setCentroFormacion(r.data.data || []);
        if (authContext?.roles?.includes('ADMINISTRADOR VT')) {
          setIdCentroFormacion(0);
        }
        setLoadingCentros(false);
      })
      .catch((error) => {
        if (error.name !== 'CanceledError') {
          console.error('Error al cargar centros de formación:', error);
          setLoadingCentros(false);
        }
      });

    return () => {
      if (centrosAbortController.current) {
        centrosAbortController.current.abort();
      }
    };
  }, [idRegional, authContext?.roles]);

  // Cargar instructores cuando cambia el centro de formación o periodo
  useEffect(() => {
    if (idCentroFormacion === 0) {
      setRawInstructors([]);
      return;
    }

    setLoadingInstructors(true);
    // Cancelar petición anterior si existe
    if (instructoresAbortController.current) {
      instructoresAbortController.current.abort();
    }

    instructoresAbortController.current = new AbortController();

    axios
      .get(mostrarHistorial ? 'instructores/historial' : 'instructores', {
        params: {
          idCentroFormacion,
          periodo: periodo || undefined,
          // historial puede filtrar por estado, pendientes no necesitan
          ...(mostrarHistorial && estado ? { estado } : {})
        },
        signal: instructoresAbortController.current.signal
      })
      .then((r) => {
        setRawInstructors(r.data || []);
        setLoadingInstructors(false);
      })
      .catch((error) => {
        if (error.name !== 'CanceledError') {
          console.error('Error al cargar instructores:', error);
          setLoadingInstructors(false);
        }
      });

    return () => {
      if (instructoresAbortController.current) {
        instructoresAbortController.current.abort();
      }
    };
  }, [idCentroFormacion, periodo, mostrarHistorial, estado]);

  // Instructores según modo (pendientes vs historial) y filtro de estado
  const instructors = useMemo(() => {
    let base = rawInstructors;

    if (!mostrarHistorial) {
      // Solo pendientes en modo normal
      base = base.filter((i) => i.estado === 'PENDIENTE' || i.estado === 'RECHAZADO');
    }
    // En historial muestra todos sin filtrar por estado base
    // el filtro adicional del Select ya lo maneja abajo
    if (mostrarHistorial && estado) {
      base = base.filter((i) => i.estado === estado);
    }

    return base;
  }, [rawInstructors, mostrarHistorial, estado]);

  // Memoizar el filtro de instructores por nombre
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return instructors;
    }

    const searchLower = debouncedSearch.toLowerCase();
    return instructors.filter((i) => {
      const fullName =
        `${i.persona.nombre1} ${i.persona.nombre2} ${i.persona.apellido1} ${i.persona.apellido2}`.toLowerCase();
      return fullName.includes(searchLower);
    });
  }, [instructors, debouncedSearch]);

  // Memoizar opciones de select para evitar recálculos innecesarios
  const optionsRegional = useMemo(
    () => regionales.map((v) => ({ value: v.id, label: v.razonSocial })),
    [regionales]
  );

  const optionsCentro = useMemo(
    () => centroFormacion.map((v) => ({ value: v.id, label: v.nombre })),
    [centroFormacion]
  );

  const periodoLabel = useMemo(() => {
    if (!periodo) return '';
    return new Date(periodo + '-02').toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric'
    });
  }, [periodo]);

  // Callbacks para los handlers
  const handleRegionalChange = useCallback(
    (e: any) => {
      const newRegionalId = Number(e?.value) || 0;
      setIdRegional(newRegionalId);
      setIdCentroFormacion(0);
      setCentroFormacion([]);
      setRawInstructors([]);
    },
    [setRawInstructors]
  );

  const handleCentroChange = useCallback(
    (e: any) => {
      const value = Number(e?.value) || 0;
      setIdCentroFormacion(value);
      setCentroF(value);
    },
    [setCentroF]
  );

  const selectedCentroValue = useMemo(
    () => optionsCentro.find((c) => c.value === idCentroFormacion) || null,
    [optionsCentro, idCentroFormacion]
  );

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Reporte Mensual del Instructor
          </h1>
          <p className="text-sm text-gray-500 mt-1">Gestión y seguimiento de reportes mensuales</p>
        </div>
        {/* Botón Historial RMI */}
        <div className="ml-auto">
          <button
            type="button"
            onClick={() => {
              setMostrarHistorial((prev) => !prev);
              setEstado(null);
              setSearch('');
            }}
            disabled={idCentroFormacion === 0}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              idCentroFormacion === 0
                ? 'bg-blue-300 text-white/70 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
            }`}
          >
            {mostrarHistorial ? 'Ocultar historial RMI' : 'Ver historial RMI'}
          </button>
        </div>
      </div>

      {/* Filtros Regional / Centro */}
      {(authContext?.roles?.includes('ADMINISTRADOR VT') ||
        authContext?.roles?.includes('ADMIN REGIONAL')) && (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-4 mb-4 flex flex-wrap gap-4 items-end">
          {authContext?.roles?.includes('ADMINISTRADOR VT') && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Regional
              </label>
              <Select
                unstyled
                options={optionsRegional}
                placeholder={loadingRegionales ? 'Cargando...' : 'Selecciona la regional'}
                isLoading={loadingRegionales}
                isDisabled={loadingRegionales}
                onChange={handleRegionalChange}
                classNames={selectStyles}
                noOptionsMessage={() => 'No hay regionales disponibles'}
              />
            </div>
          )}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Centro de formación
            </label>
            <Select
              unstyled
              options={optionsCentro}
              placeholder={
                loadingCentros
                  ? 'Cargando...'
                  : idRegional === 0
                    ? 'Selecciona primero una regional'
                    : 'Selecciona el centro de formación'
              }
              isLoading={loadingCentros}
              isDisabled={idRegional === 0 || loadingCentros}
              value={selectedCentroValue}
              onChange={handleCentroChange}
              classNames={selectStyles}
              noOptionsMessage={() => 'No hay centros disponibles'}
            />
          </div>
        </div>
      )}

      {/* Barra de filtros - solo cuando se ve el historial */}
      {mostrarHistorial && (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Buscar por nombre
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Buscar instructor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-coal-200
                             rounded-md bg-white dark:bg-coal-400 text-gray-800 dark:text-white
                             placeholder-gray-400 focus:outline-none focus:ring-2
                             focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="min-w-[160px]">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Periodo
              </label>
              <input
                type="month"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-coal-200
                           rounded-md bg-white dark:bg-coal-400 text-gray-800 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="min-w-[140px]">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Estado
              </label>
              <Select
                unstyled
                classNames={selectStyles}
                placeholder="Todos"
                onChange={(e) => setEstado(e?.value || null)}
                options={[
                  { value: null, label: 'Todos' },
                  { value: 'PENDIENTE', label: 'Pendientes' },
                  { value: 'ACEPTADO', label: 'Aceptados' },
                  { value: 'RECHAZADO', label: 'Rechazados' }
                ]}
              />
            </div>
          </div>
        </div>
      )}

      {/* Sección de resultados */}
      {idCentroFormacion !== 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-700 dark:text-white">
              Reportes{periodo ? ` de ${periodoLabel}` : ''}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filtered.length} de {instructors.length} instructores
            </span>
          </div>

          {loadingInstructors ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
              No se encontraron instructores
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((instructor) => (
                <InstructorCard
                  key={instructor.idActivation}
                  instructor={instructor}
                  periodo={periodo || undefined}
                  onEstadoChange={(idActivation, nuevoEstado, motivoRechazo) => {
                    setRawInstructors((prev) =>
                      prev.map((inst) =>
                        inst.idActivation === idActivation
                          ? { ...inst, estado: nuevoEstado, motivoRechazo }
                          : inst
                      )
                    );
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RmiGeneral;
