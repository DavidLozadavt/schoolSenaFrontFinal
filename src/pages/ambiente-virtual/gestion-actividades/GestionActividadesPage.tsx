import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
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
              <ToolbarPageTitle text="Gestión de actividades" />
              <ToolbarDescription>
                <span className="dark:text-white">
                  Administra tus actividades académicas, organízalas por competencia y RAP, y asígnalas a las
                  fichas correspondientes.
                </span>
              </ToolbarDescription>
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
