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
import { ModalEntidadesSeguridadSocial } from './ModalEntidadesSeguridadSocial';
import { EntidadesSeguridadSocialContent } from './EntidadesSeguridadSocialContent';

const EntidadesSeguridadSocialPage = () => {
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
              <ToolbarDescription>Gestiona las entidades de seguridad social</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={() => setModalOpen(true)} className="btn btn-sm btn-light">
                Nueva entidad
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalEntidadesSeguridadSocial
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAfterSave}
        />

        <EntidadesSeguridadSocialContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { EntidadesSeguridadSocialPage };
