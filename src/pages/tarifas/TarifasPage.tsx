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
import { TarifasContent } from './TarifasContent';
import { ModalTarifas } from './ModalTarifas';

const TarifasPage = () => {
  const { currentLayout } = useLayout();

  const [tarifasModalOpen, setTarifasModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleTarifasModalOpen = () => {
    setTarifasModalOpen(true);
  };
  const handleModalClose = () => {
    setTarifasModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setTarifasModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona las tarifas</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleTarifasModalOpen}>
                Nueva tarifa
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ModalTarifas
          open={tarifasModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
        <TarifasContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { TarifasPage };