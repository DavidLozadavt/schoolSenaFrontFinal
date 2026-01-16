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
import { TipoDocumentoContent } from './TipoDocumentoContent';
import { ModalTipoDocumento } from './ModalTipoDocumento';

const TipoDocumentoPage = () => {
  const { currentLayout } = useLayout();
  const [TipoDocumentoModalOpen, setTipoDocumentoModalOpen]=useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  
  const handleTipoDocumentoModalOpen = () => {
    setTipoDocumentoModalOpen(true);
    
  };
  const handleModalClose = () => {
    setTipoDocumentoModalOpen(false);
  };
  const handleAfterSave = () => {
    setReloadContent((prev) =>!prev);
    setTipoDocumentoModalOpen(false);
  };


  return (
    <Fragment>
    {currentLayout?.name === 'demo1-layout' && (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>Gestiona los tipos de documento</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <button onClick={handleTipoDocumentoModalOpen} className="btn btn-sm btn-light">
              Nuevo tipo de documento
            </button>
          </ToolbarActions>
        </Toolbar>
      </Container>
    )}
    <Container>
      <ModalTipoDocumento
       open={TipoDocumentoModalOpen} 
       onClose={handleModalClose}
       onSave={handleAfterSave}/>
      <TipoDocumentoContent reload={reloadContent} />
    </Container>
  </Fragment>
)
};

export { TipoDocumentoPage };
