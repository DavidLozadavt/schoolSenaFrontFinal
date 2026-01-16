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
import { CuentasPucContent } from './CuentasPucContent';
import { ModalCuentasPuc } from './ModalCuentasPuc';

const CuentasPucPage = () => {
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
              <ToolbarDescription>Gestiona las cuentas PUC</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={() => setModalOpen(true)} className="btn btn-sm btn-light">
                Nueva cuenta
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalCuentasPuc
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={handleAfterSave}
        />

        <CuentasPucContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { CuentasPucPage };
