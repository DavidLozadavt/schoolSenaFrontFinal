import { Fragment, useRef, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { ContratoContent } from './ContratosContent';


const ContratosPage = () => {
  const { currentLayout } = useLayout();

  const [medioPagoModalOpen, setMedioPagoModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleMedioPagoModalOpen = () => {
    setMedioPagoModalOpen(true);
  };
  const handleModalClose = () => {
    setMedioPagoModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setMedioPagoModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona todos los contratos</ToolbarDescription>
            </ToolbarHeading>
          
          </Toolbar>
        </Container>
      )}

      <Container>
        {/* <ModalMedioPago
          open={medioPagoModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        /> */}
        <ContratoContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { ContratosPage };
