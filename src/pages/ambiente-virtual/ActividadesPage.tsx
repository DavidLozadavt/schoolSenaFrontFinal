import React, { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import ActividadesAprendiz from './actividades/ActividadesAprendiz';
import MaterialApoyoAprendiz from './actividades/MaterialApoyoAprendiz';

const ActividadesPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const [tab, setTab] = useState<'actividades' | 'material'>('actividades');

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Visualiza y gestiona tus actividades asignadas</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTab('actividades')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                tab === 'actividades'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-coal-400 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              Mis Actividades
            </button>
            <button
              type="button"
              onClick={() => setTab('material')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                tab === 'material'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 dark:bg-coal-400 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              Material de apoyo
            </button>
          </div>

          {tab === 'actividades' ? <ActividadesAprendiz /> : <MaterialApoyoAprendiz />}
        </div>
      </Container>
    </Fragment>
  );
};

export default ActividadesPage;
