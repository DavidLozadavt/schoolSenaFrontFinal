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
import { OtrasDeducciones } from './OtrasDeduccionesContent';
import { ModalOtrasDeducciones } from './ModalOtrasDeducciones';

const OtrasDeduccionesPage = () => {
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
              <ToolbarDescription>Gestiona las deducciones.</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button type="button" className="btn btn-sm btn-light" onClick={handleOpen}>
                Nueva Deducción
              </button>

              <ModalOtrasDeducciones
                open={modalOpen}
                onClose={handleClose}
                onSave={handleAfterSave}
              />
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <OtrasDeducciones reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { OtrasDeduccionesPage };
