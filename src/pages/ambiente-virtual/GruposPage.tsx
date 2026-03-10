import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import ListaGruposAprendiz from './actividades/ListaGruposAprendiz';

const GruposPage: React.FC = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Lista de grupos y únete a ellos</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ListaGruposAprendiz />
      </Container>
    </Fragment>
  );
};

export default GruposPage;
