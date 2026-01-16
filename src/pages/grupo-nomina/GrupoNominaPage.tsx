import { useLayout } from '@/providers';
import { Fragment, useState } from 'react';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Container } from '@/components/container';
import { GrupoNominaContent } from './GrupoNominaContent';
import { ModalGrupoNomina } from './ModalGrupoNomina';
const GrupoNominaPage = () => {
   const { currentLayout } = useLayout();
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

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
              <ToolbarDescription>Gestiona los grupos de nomina</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={() => setModalOpen(true)} className="btn btn-sm btn-light">
                Nuevo grupo
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalGrupoNomina
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAfterSave}
        />

        <GrupoNominaContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};


export { GrupoNominaPage };