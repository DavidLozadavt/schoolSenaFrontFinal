import { Fragment } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import SolicitudesInscripcionContent from './SolicitudesInscripcionContent';

const SolicitudesInscripcionPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Solicitudes de inscripción" />
              <ToolbarDescription>
                Revisión de solicitudes y registro de pago en facturas académicas (matrícula la gestionan otras áreas)
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <SolicitudesInscripcionContent />
      </Container>
    </Fragment>
  );
};

export default SolicitudesInscripcionPage;
