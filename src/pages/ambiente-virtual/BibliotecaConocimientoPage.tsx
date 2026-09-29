import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarHeading } from '@/partials/toolbar';
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-snug">
                Biblioteca de conocimiento
              </h1>
              <p className="text-sm font-medium leading-relaxed text-gray-700 dark:text-white mt-1.5 max-w-3xl">
                Recursos de tu programa de formación: documentos, enlaces y videos (solo consulta).
              </p>
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
