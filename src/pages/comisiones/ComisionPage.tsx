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
import { ComisionContent } from './ComisionContent';
import { ModalComision } from './ModalComision';

const ComisionPage = () => {
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
              <ToolbarDescription>Gestiona las Comisiones</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Nueva Comisión
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ModalComision open={modalOpen} onClose={handleModalClose} onSave={handleAfterSave} />
        <ComisionContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { ComisionPage };
