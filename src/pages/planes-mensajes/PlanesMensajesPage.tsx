import { Fragment } from 'react';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Container } from '@/components/container';
import { PlanesMensajesAdminContent } from './PlanesMensajesAdminContent';

/**
 * Módulo "Planes de Mensajes" del Administrador VT (Mejora 4).
 */
const PlanesMensajesPage = () => {
  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Administración del catálogo de planes de mensajes de WhatsApp
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <PlanesMensajesAdminContent />
      </Container>
    </Fragment>
  );
};

export { PlanesMensajesPage };
