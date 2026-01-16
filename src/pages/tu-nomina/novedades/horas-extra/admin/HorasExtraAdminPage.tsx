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

import { HorasExtraAdminContent } from './HorasExtraAdminContent';
import { ModalHorasExtraAdmin } from './ModalHorasExtraAdmin';

const HorasExtraAdminPage = () => {
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
              <ToolbarDescription>Gestiona las horas extra.</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button type="button" className="btn btn-sm btn-light" onClick={handleOpen}>
                Nueva Solicitud
              </button>

              <ModalHorasExtraAdmin
                open={modalOpen}
                onClose={handleClose}
                onSave={handleAfterSave}
              />
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <HorasExtraAdminContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { HorasExtraAdminPage };
