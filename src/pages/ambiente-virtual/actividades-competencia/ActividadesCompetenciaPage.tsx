import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useLayout } from '@/providers';
import Select from 'react-select';
import {
  compactReactSelectNoOptions,
  compactReactSelectWrapClassNames,
} from '@/components/forms/compactReactSelect';
import MaterialCompetenciaView from './MaterialCompetenciaView';
import MaterialCompetenciaAprendizView from './MaterialCompetenciaAprendizView';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { CompetenciaAccesible } from './materialCompetencia.types';

const selectClassNames = {
  ...compactReactSelectWrapClassNames,
  control: (state: { isFocused: boolean }) =>
    `${compactReactSelectWrapClassNames.control()} dark:text-white ${
      state.isFocused ? '!border-primary ring-2 ring-primary/30' : 'hover:border-primary/40'
    }`,
  singleValue: () => `${compactReactSelectWrapClassNames.singleValue()} dark:!text-white`,
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm whitespace-normal',
  menu: () => `${compactReactSelectWrapClassNames.menu()} dark:text-white`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectWrapClassNames.option(state)} dark:!text-white ${state.isSelected ? '!text-white' : ''}`,
};

const formatCompetenciaOption = (option: { label: string }) => (
  <span className="block whitespace-normal break-words leading-snug">{option.label}</span>
);

const ActividadesCompetenciaPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const [competencias, setCompetencias] = useState<CompetenciaAccesible[]>([]);
  const [puedeAdministrar, setPuedeAdministrar] = useState(false);
  const [idCompetencia, setIdCompetencia] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await materialCompetenciaService.listarCompetencias();
        if (!mounted) return;
        setCompetencias(res.data);
        setPuedeAdministrar(res.puedeAdministrar);
        setIdCompetencia(res.data.length === 1 ? res.data[0].id : null);
      } catch (err) {
        if (!mounted) return;
        setCompetencias([]);
        setError(
          materialCompetenciaService.errorMessage(err, 'No se pudieron cargar las competencias asignadas.')
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const opciones = useMemo(
    () =>
      competencias.map((competencia) => ({
        value: competencia.id,
        label: competencia.codigo
          ? `${competencia.codigo} · ${competencia.nombreMateria}`
          : competencia.nombreMateria,
      })),
    [competencias]
  );

  const competenciaSeleccionada = competencias.find((c) => c.id === idCompetencia) ?? null;

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
                    ? 'Material de apoyo de las competencias autorizadas.'
                    : puedeAdministrar
                      ? 'Selecciona una competencia para consultar y administrar su material de apoyo.'
                      : 'Aquí encontrarás documentos, videos, audios y enlaces de apoyo asociados a cada competencia.'}
                </span>
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-gray-600 dark:text-gray-200 mt-3">Cargando competencias...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-white dark:bg-coal-400 p-5 text-sm text-red-600 dark:text-red-300">
              {error}
            </div>
          ) : competencias.length === 0 ? (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-5 text-sm text-gray-600 dark:text-gray-200">
              No tienes competencias asignadas. El acceso al material depende de tus horarios o matrículas vigentes.
            </div>
          ) : !puedeAdministrar ? (
            <MaterialCompetenciaAprendizView />
          ) : (
            <>
              {competencias.length > 1 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-4 sm:p-5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                    Competencia
                  </label>
                  <Select
                    placeholder="Seleccione una competencia"
                    options={opciones}
                    value={opciones.find((o) => o.value === idCompetencia) ?? null}
                    onChange={(opt) => setIdCompetencia(opt?.value ?? null)}
                    classNames={selectClassNames}
                    formatOptionLabel={formatCompetenciaOption}
                    noOptionsMessage={compactReactSelectNoOptions}
                  />
                </div>
              ) : null}

              {competenciaSeleccionada ? (
                <MaterialCompetenciaView
                  key={competenciaSeleccionada.id}
                  competencia={competenciaSeleccionada}
                  puedeAdministrar={puedeAdministrar}
                />
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-coal-400 p-5 text-sm text-gray-600 dark:text-gray-200">
                  Selecciona una competencia para consultar su material de apoyo.
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
