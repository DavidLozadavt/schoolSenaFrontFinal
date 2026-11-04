import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useLayout } from '@/providers';
import Select from 'react-select';
import {
  compactReactSelectClassNames,
  compactReactSelectNoOptions,
} from '@/components/forms/compactReactSelect';
import MaterialCompetenciaView from './MaterialCompetenciaView';
import MaterialCompetenciaAprendizView from './MaterialCompetenciaAprendizView';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { CompetenciaAccesible, FichaMaterialCompetencia } from './materialCompetencia.types';
import { etiquetaCompetenciaMaterial } from './materialCompetenciaEtiqueta';

const selectClassNames = {
  ...compactReactSelectClassNames,
  control: (state: { isFocused: boolean; isDisabled?: boolean }) =>
    `${compactReactSelectClassNames.control()} !min-h-9 !h-9 overflow-hidden dark:text-white ${
      state.isDisabled
        ? 'opacity-80 !bg-gray-50 dark:!bg-coal-500/60 cursor-not-allowed'
        : state.isFocused
          ? '!border-primary ring-2 ring-primary/30'
          : 'hover:border-primary/40'
    }`,
  valueContainer: () => 'flex-nowrap overflow-hidden min-w-0 py-0',
  singleValue: () =>
    `${compactReactSelectClassNames.singleValue()} dark:!text-white !whitespace-nowrap overflow-hidden text-ellipsis max-w-full`,
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm truncate',
  input: () => `${compactReactSelectClassNames.input()} dark:!text-white`,
  menu: () => `${compactReactSelectClassNames.menu()} dark:text-white`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectClassNames.option(state)} dark:!text-white whitespace-normal break-words leading-snug py-2 ${
      state.isSelected ? '!text-white' : ''
    }`,
};

const selectStyles = {
  control: (base: Record<string, unknown>) => ({
    ...base,
    minHeight: 36,
    height: 36,
  }),
  valueContainer: (base: Record<string, unknown>) => ({
    ...base,
    flexWrap: 'nowrap' as const,
    overflow: 'hidden',
  }),
  singleValue: (base: Record<string, unknown>) => ({
    ...base,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    position: 'static' as const,
    transform: 'none',
  }),
};

const formatOptionLabel = (option: { label: string }, meta: { context: string }) =>
  meta.context === 'value' ? (
    <span className="block truncate" title={option.label}>
      {option.label}
    </span>
  ) : (
    <span className="block whitespace-normal break-words leading-snug" title={option.label}>
      {option.label}
    </span>
  );

const etiquetaFichaOpcion = (ficha: FichaMaterialCompetencia) => {
  const codigo = String(ficha.codigo || ficha.id);
  const programa = (ficha.programa || '').trim();
  const jornada = (ficha.jornada || '').trim();
  return [codigo, programa || null, jornada || null].filter(Boolean).join(' · ');
};

const ActividadesCompetenciaPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const [puedeAdministrar, setPuedeAdministrar] = useState(false);
  const [fichas, setFichas] = useState<FichaMaterialCompetencia[]>([]);
  const [idFicha, setIdFicha] = useState<number | null>(null);
  const [competencias, setCompetencias] = useState<CompetenciaAccesible[]>([]);
  const [idCompetencia, setIdCompetencia] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCompetencias, setLoadingCompetencias] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const meta = await materialCompetenciaService.listarCompetencias();
        if (!mounted) return;
        setPuedeAdministrar(meta.puedeAdministrar);
        if (!meta.puedeAdministrar) {
          setFichas([]);
          return;
        }
        const lista = await materialCompetenciaService.listarFichasInstructor();
        if (!mounted) return;
        setFichas(lista);
      } catch (err) {
        if (!mounted) return;
        setFichas([]);
        setError(
          materialCompetenciaService.errorMessage(err, 'No se pudieron cargar las fichas asignadas.')
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!puedeAdministrar || !idFicha) {
      setCompetencias([]);
      setIdCompetencia(null);
      return;
    }
    let cancelled = false;
    setLoadingCompetencias(true);
    setIdCompetencia(null);
    setCompetencias([]);
    (async () => {
      try {
        const lista = await materialCompetenciaService.listarCompetenciasDeFicha(idFicha);
        if (cancelled) return;
        setCompetencias(lista);
      } catch {
        if (cancelled) return;
        setCompetencias([]);
      } finally {
        if (!cancelled) setLoadingCompetencias(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [puedeAdministrar, idFicha]);

  const opcionesFicha = useMemo(
    () => fichas.map((ficha) => ({ value: ficha.id, label: etiquetaFichaOpcion(ficha) })),
    [fichas]
  );

  const opcionesCompetencia = useMemo(
    () =>
      competencias.map((competencia) => ({
        value: competencia.id,
        label: etiquetaCompetenciaMaterial(competencia.codigo, competencia.nombreMateria),
      })),
    [competencias]
  );

  const fichaSeleccionada = fichas.find((f) => f.id === idFicha) ?? null;
  const competenciaSeleccionada = competencias.find((c) => c.id === idCompetencia) ?? null;
  const competenciaDeshabilitada = !idFicha || loadingCompetencias;

  const handleChangeFicha = (id: number | null) => {
    setIdFicha(id);
    setIdCompetencia(null);
    setCompetencias([]);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Material de Apoyo" />
              <ToolbarDescription>
                <span className="dark:text-white">
                  {loading
                    ? 'Material de apoyo de las fichas y competencias autorizadas.'
                    : puedeAdministrar
                      ? 'Selecciona una ficha y posteriormente una competencia.'
                      : 'Aquí encontrarás documentos, videos, audios y enlaces de apoyo asociados a cada competencia.'}
                </span>
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-gray-600 dark:text-gray-200 mt-3">Cargando fichas...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-coal-400 p-5 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          ) : !puedeAdministrar ? (
            <MaterialCompetenciaAprendizView />
          ) : fichas.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-5 text-sm text-gray-600 dark:text-gray-200">
              No tienes fichas asignadas. El acceso al material depende de tus horarios vigentes.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-3 sm:p-4">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,35%)_minmax(0,65%)] gap-3">
                  <div className="min-w-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                      Ficha
                    </label>
                    <Select
                      placeholder="Seleccione una ficha"
                      options={opcionesFicha}
                      value={opcionesFicha.find((o) => o.value === idFicha) ?? null}
                      onChange={(opt) => handleChangeFicha(opt?.value ?? null)}
                      classNames={selectClassNames}
                      styles={selectStyles}
                      formatOptionLabel={formatOptionLabel}
                      noOptionsMessage={compactReactSelectNoOptions}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                      Competencia
                    </label>
                    <Select
                      placeholder={
                        !idFicha
                          ? 'Seleccione una ficha primero'
                          : loadingCompetencias
                            ? 'Cargando competencias...'
                            : 'Seleccione una competencia'
                      }
                      options={opcionesCompetencia}
                      value={opcionesCompetencia.find((o) => o.value === idCompetencia) ?? null}
                      onChange={(opt) => setIdCompetencia(opt?.value ?? null)}
                      classNames={selectClassNames}
                      styles={selectStyles}
                      formatOptionLabel={formatOptionLabel}
                      isDisabled={competenciaDeshabilitada}
                      noOptionsMessage={() =>
                        loadingCompetencias
                          ? 'Cargando...'
                          : competencias.length === 0
                            ? 'No hay competencias en esta ficha'
                            : compactReactSelectNoOptions()
                      }
                    />
                  </div>
                </div>
              </div>

              {fichaSeleccionada && competenciaSeleccionada ? (
                <MaterialCompetenciaView
                  key={`${fichaSeleccionada.id}-${competenciaSeleccionada.id}`}
                  competencia={competenciaSeleccionada}
                  ficha={fichaSeleccionada}
                  puedeAdministrar={puedeAdministrar}
                />
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-5 text-sm text-gray-600 dark:text-gray-200">
                  {!idFicha
                    ? 'Selecciona una ficha y una competencia para consultar su material de apoyo.'
                    : loadingCompetencias
                      ? 'Cargando competencias de la ficha...'
                      : competencias.length === 0
                        ? 'Esta ficha no tiene competencias compatibles en tu ámbito académico.'
                        : 'Selecciona una competencia para consultar su material de apoyo.'}
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </Fragment>
  );
};

export default ActividadesCompetenciaPage;
