import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
import { useLayout } from '@/providers';
import GestionActividadesView from './GestionActividadesView';

const GestionActividadesPage: React.FC = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/35 dark:text-blue-300">
                  <KeenIcon icon="notepad" className="text-xl" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
                    Gestión de actividades
                  </h1>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-0.5">
                    Administra tus actividades académicas, organízalas por competencia y RAP, y asígnalas a las
                    fichas correspondientes.
                  </p>
                </div>
              </div>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <GestionActividadesView />
      </Container>
    </Fragment>
  );
};

export default GestionActividadesPage;
