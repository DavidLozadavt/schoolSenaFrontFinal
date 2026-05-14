import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import MaterialApoyoAprendiz from './actividades/MaterialApoyoAprendiz';

/**
 * Biblioteca de conocimiento: material de consulta por programa (misma lógica que
 * `GET ambiente-virtual/material-apoyo` sin filtrar por ficha/RAP).
 */
const BibliotecaConocimientoPage: React.FC = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Biblioteca de conocimiento" />
              <ToolbarDescription>
                Recursos de tu programa de formación: documentos, enlaces y videos (solo consulta).
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <MaterialApoyoAprendiz
          modoBibliotecaGlobal
          hideGroupHeaders
          emptyMessage="No hay recursos en la biblioteca de conocimiento para tu programa."
        />
      </Container>
    </Fragment>
  );
};

export default BibliotecaConocimientoPage;
