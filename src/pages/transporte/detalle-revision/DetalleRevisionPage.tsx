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
import ModalDetalleRevision from './ModalDetalleRevision';
import DetalleRevisionContent from './DetalleRevisionContent';


const DetalleRevisionPage = () => {
  const { currentLayout } = useLayout();
  const [detalleRevisionModalOpen, setdetalleRevisionModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handledetalleRevisionModalOpen = () => {
    setdetalleRevisionModalOpen(true);
  };
  const handleModalClose = () => {
    setdetalleRevisionModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setdetalleRevisionModalOpen(false);
  };


return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los detalles de revision</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handledetalleRevisionModalOpen}>
                Nuevo detalle
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ModalDetalleRevision
          open={detalleRevisionModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
        <DetalleRevisionContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export default DetalleRevisionPage