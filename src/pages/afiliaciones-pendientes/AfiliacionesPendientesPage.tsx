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
import { AfiliacionesPendienteContent } from './AfiliacionesPendienteContent';


const AfiliacionesPendientesPage = () => {
  const { currentLayout } = useLayout();

  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleModalOpen = () => {
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona las vinculaciones pendientes</ToolbarDescription>
            </ToolbarHeading>
           
          </Toolbar>
        </Container>
      )}

      <Container>
        {/* <ModalCentroCostos
          open={modalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />*/}
        <AfiliacionesPendienteContent reload={reloadContent} /> 
      </Container>
    </Fragment>
  );
};

export { AfiliacionesPendientesPage };
