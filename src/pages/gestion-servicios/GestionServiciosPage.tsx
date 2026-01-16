import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Fragment, useState } from 'react';
import { ServiciosContent } from './GestionServiciosContent';
import { ModalServicio } from './modal/ModalServicio';

const ServiciosPage = () => {
  const { currentLayout } = useLayout();
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleModalOpen = () => setModalOpen(true);
  const handleModalClose = () => setModalOpen(false);

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
              <ToolbarDescription>Administración de Servicios</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Nuevo Servicio
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalServicio
          open={modalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
        <ServiciosContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export default ServiciosPage;