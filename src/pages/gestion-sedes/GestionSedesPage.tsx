import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import React, { Fragment, useState } from 'react';
import { GestionSedesContent } from './GestionSedesContent';
import { ModalSedes } from './ModalSedes';

const GestionSedesPage = () => {
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
              <ToolbarDescription>Administración de Sedes </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Nueva Sede
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
      <ModalSedes
          open={modalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
        <GestionSedesContent reload={reloadContent}/>
      </Container>
    </Fragment>
  );
};

export default GestionSedesPage;
