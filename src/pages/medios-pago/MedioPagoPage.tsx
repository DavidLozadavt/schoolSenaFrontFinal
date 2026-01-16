import { Fragment, useRef, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { MedioPagoContent } from './MedioPagoContent';
import { ModalMedioPago } from './ModalMedioPago';

const MedioPagoPage = () => {
  const { currentLayout } = useLayout();

  const [medioPagoModalOpen, setMedioPagoModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleMedioPagoModalOpen = () => {
    setMedioPagoModalOpen(true);
  };
  const handleModalClose = () => {
    setMedioPagoModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setMedioPagoModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los medios de pagos</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleMedioPagoModalOpen}>
                Nuevo medio de pago
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ModalMedioPago
          open={medioPagoModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
        <MedioPagoContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { MedioPagoPage };
