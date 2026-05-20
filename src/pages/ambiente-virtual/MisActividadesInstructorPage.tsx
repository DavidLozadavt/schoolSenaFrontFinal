import React, { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import MisActividadesInstructor from './actividades/MisActividadesInstructor';

/**
 * Vista instructor/admin: resumen de actividades creadas o asignadas (agrupadas por actividad + ficha).
 * Distinta de «Mis Actividades» del aprendiz en /ambiente-virtual/actividades.
 */
const MisActividadesInstructorPage: React.FC = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Mis actividades" />
              <ToolbarDescription>
                Resumen de actividades que has creado o asignado: entregas, pendientes y calificaciones por ficha y RAP.
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <MisActividadesInstructor />
      </Container>
    </Fragment>
  );
};

export default MisActividadesInstructorPage;
