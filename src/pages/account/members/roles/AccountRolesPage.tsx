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
import { CreateUpdateRole } from './CreateUpdateRole';
import { RoleModel } from './models/_Role';
import { RolesContent } from './blocks';

const AccountRolesPage = () => {
  const [role, setRole] = useState<RoleModel | null>(null);
  const [reloadContent, setReloadContent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpen = () => {
    setRole(null);
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
              <ToolbarDescription>Gestiona los roles del sistema.</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button type="button" className="btn btn-sm btn-light" onClick={handleOpen}>
                Nuevo rol
              </button>

              <CreateUpdateRole open={modalOpen} onClose={handleClose} onSave={handleAfterSave} />
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <RolesContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { AccountRolesPage };
