import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
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
  const [idCentroFormacion, setIdCentroFormacion] = useState<number>(0);
  const [centroFormacion, setCentroFormacion] = useState<Centro[]>([]);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);

  const [search, setSearch] = useState('');
  const [periodo, setPeriodo] = useState(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  });
  const [estado, setEstado] = useState<number>(1);

  useEffect(() => {
    if (authContext?.roles?.includes('ADMINISTRADOR VT')) {
      axios.get('regional').then((r) => setRegionales(r.data));
      return;
    }
    if (authContext?.roles?.includes('ADMIN REGIONAL')) {
      setIdRegional(authContext?.empresa.id);
      return;
    }
    if (authContext?.roles?.includes('ADMIN CENTRO')) {
      setIdRegional(authContext?.empresa.id);
      setIdCentroFormacion(authContext?.user?.idCentroFormacion);
      return;
    }
  }, [authContext]);

  useEffect(() => {
    if (idRegional !== 0) {
      axios.get(`centrosFormacion/regional/${idRegional}`).then((r) => {
        setCentroFormacion(r.data.data);
        if (!authContext?.roles?.includes('ADMIN CENTRO')) setIdCentroFormacion(0);
      });
    }
  }, [idRegional]);

  useEffect(() => {
    if (idCentroFormacion === 0) {
      setInstructors([]);
      return;
    }
    setLoadingInstructors(true);
    axios
      .get('instructores', {
        params: {
          idCentroFormacion,
          periodo: periodo || undefined
        }
      })
      .then((r) => setInstructors(r.data))
      .finally(() => setLoadingInstructors(false));
  }, [idCentroFormacion, periodo]);

  const filtered = instructors.filter((i) => {
    const fullName =
      `${i.persona.nombre1} ${i.persona.nombre2} ${i.persona.apellido1} ${i.persona.apellido2}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const optionsRegional = regionales.map((v) => ({ value: v.id, label: v.razonSocial }));
  const optionsCentro = centroFormacion.map((v) => ({ value: v.id, label: v.nombre }));

  const periodoLabel = periodo
    ? new Date(periodo + '-02').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Reporte Mensual del Instructor
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gestión y seguimiento de reportes mensuales</p>
      </div>

      {/* Filtros Regional / Centro */}
      {(authContext?.roles?.includes('ADMINISTRADOR VT') ||
        authContext?.roles?.includes('ADMIN REGIONAL')) && (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-4 mb-4 flex flex-wrap gap-4">
          {authContext?.roles?.includes('ADMINISTRADOR VT') && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Regional
              </label>
              <Select
                unstyled
                options={optionsRegional}
                placeholder="Selecciona la regional"
                onChange={(e) => {
                  setIdRegional(Number(e?.value) || 0);
                  setIdCentroFormacion(0);
                  setCentroFormacion([]);
                }}
                classNames={selectStyles}
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
              placeholder="Selecciona el centro de formación"
              isDisabled={idRegional === 0}
              value={optionsCentro.find((c) => c.value === idCentroFormacion) || null}
              onChange={(e) => {
                const value = Number(e?.value);
                setIdCentroFormacion(value);
                setCentroF(value);
              }}
              classNames={selectStyles}
            />
          </div>
        </div>
      )}

      {/* Barra de filtros */}
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
              onChange={(e) => setEstado(Number(e?.value) || 1)}
              options={[
                { value: 1, label: 'Todos' },
                { value: 2, label: 'Pendientes' },
                { value: 3, label: 'Aceptados' },
                { value: 4, label: 'Rechazados' }
              ]}
            />
          </div>
        </div>
      </div>

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
                  periodo={periodo || undefined} // ← agrega esto
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
