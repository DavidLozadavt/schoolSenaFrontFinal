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
import { TipoPagoPageContent } from './TipoPagoPageContent';
import { ModalTipoPago } from './ModalTipoPago';

const TipoPagoPage = () => {
  const { currentLayout } = useLayout();

  const [TipoPagoModalOpen, setTipoPagoModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);


  const handleTipoPagoModalOpen = () => {
    setTipoPagoModalOpen(true);
  };
  const handleModalClose = () => {
    setTipoPagoModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setTipoPagoModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los tipos de pagos</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={handleTipoPagoModalOpen} className="btn btn-sm btn-light">
                Nuevo tipo de pago
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalTipoPago
         open={TipoPagoModalOpen} 
         onClose={handleModalClose}
         onSave={handleAfterSave}/>
        <TipoPagoPageContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { TipoPagoPage };
