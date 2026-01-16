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
import { UsuariosContent } from './UsuariosContent';
import { ModalUsuarios } from './ModalUsuarios';

const UsuariosPage = () => {
  const { currentLayout } = useLayout();
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleSave = () => {
     setReloadContent((prev) =>!prev);
    setModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los usuarios del sistema</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={() => setModalOpen(true)} className="btn btn-sm btn-light">
                Crear Usuario
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <UsuariosContent reload={reloadContent}  />
      </Container>

      <ModalUsuarios open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />
    </Fragment>
  );
};

export { UsuariosPage };
