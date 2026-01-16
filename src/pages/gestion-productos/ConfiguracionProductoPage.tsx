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
import { ConfiguracionProductoContent } from './ConfiguracionProductoContent';

const ConfiguracionProductoPage = () => {
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
              <ToolbarDescription>Gestiona los productos</ToolbarDescription>
            </ToolbarHeading>
            {/* <ToolbarActions>
              <button onClick={() => setModalOpen(true)} className="btn btn-sm btn-light">
                Crear Usuario
              </button>
            </ToolbarActions> */}
          </Toolbar>
        </Container>
      )}

      <Container>
        <ConfiguracionProductoContent reload={reloadContent}  />
      </Container>

      {/* <ModalUsuarios open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} /> */}
    </Fragment>
  );
};

export { ConfiguracionProductoPage };
