import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import ActividadesAprendiz from './actividades/ActividadesAprendiz';

const ActividadesPage: React.FC = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                <span className="dark:text-white">Visualiza y gestiona tus actividades asignadas</span>
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ActividadesAprendiz />
      </Container>
    </Fragment>
  );
};

export default ActividadesPage;
