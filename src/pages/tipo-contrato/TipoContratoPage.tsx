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
import { TipoContratoContent } from './TipoContratoContent';
import { ModalTipoContrato } from './ModalTipoContrato';


const TipoContratoPage = () => {
  const { currentLayout } = useLayout();
  const [tipoContratoModalOpen, setTipoContratoModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleTipoDocumentoModalOpen = () => {
    setTipoContratoModalOpen(true);
  };
  const handleModalClose = () => {
    setTipoContratoModalOpen(false);
  };
  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setTipoContratoModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los tipos de contrato</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={handleTipoDocumentoModalOpen} className="btn btn-sm btn-light">
                Nuevo tipo de contrato
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalTipoContrato
          open={tipoContratoModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />

        <TipoContratoContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { TipoContratoPage };
