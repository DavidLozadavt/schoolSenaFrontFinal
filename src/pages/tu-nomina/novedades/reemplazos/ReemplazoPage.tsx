import { Fragment, useState } from 'react';

import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';

import { useLayout } from '@/providers';
import { ModalReemplazo } from './ModalReemplazo';
import { ReemplazosContent } from './ReemplazosContent';

const ReemplazoPage = () => {
  const [reloadContent, setReloadContent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpen = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setModalOpen(false);
  };

  const { currentLayout } = useLayout();

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los reemplazos.</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button type="button" className="btn btn-sm btn-light" onClick={handleOpen}>
                Nuevo Registro
              </button>

              <ModalReemplazo
                open={modalOpen}
                onClose={handleClose}
                onSave={handleAfterSave}
              />
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ReemplazosContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { ReemplazoPage };
