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
import { ModalArea } from './ModalArea';
import { AreaContent } from './AreaContent';

const AreaPage = () => {
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
              <ToolbarDescription>Gestiona las areas del sistema</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={() => setModalOpen(true)} className="btn btn-sm btn-light">
                Nueva área
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalArea
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAfterSave}
        />

        <AreaContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { AreaPage };
