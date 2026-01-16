import { useLayout } from "@/providers";
import { Fragment, useState } from 'react';
import {
    Toolbar,
    ToolbarActions,
    ToolbarDescription,
    ToolbarHeading,
    ToolbarPageTitle
  } from '@/partials/toolbar';
  import { Container } from '@/components/container';
import { ModalConfiguracionPagos } from "./ModalConfiguracionPagos";
import { ConfiguracionPagosContent } from "./ConfiguracionPagosContent";

const ConfiguracionPagosPage = () => {
 const { currentLayout } = useLayout();
  const [modalOpen, setModalOpen]=useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  
  const handleModalOpen = () => {
    setModalOpen(true);
    
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };
  const handleAfterSave = () => {
    setReloadContent((prev) =>!prev);
    setModalOpen(false);
  };


  return (
    <Fragment>
    {currentLayout?.name === 'demo1-layout' && (
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle />
            <ToolbarDescription>Gestiona la configuración de pagos</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <button onClick={handleModalOpen} className="btn btn-sm btn-light">
              Nueva configuración de pago
            </button>
          </ToolbarActions>
        </Toolbar>
      </Container>
    )}
    <Container>
        <ModalConfiguracionPagos
        open={modalOpen} 
        onClose={handleModalClose}
        onSave={handleAfterSave}/>
      <ConfiguracionPagosContent reload={reloadContent} />
    </Container>
  </Fragment>
)
};


export { ConfiguracionPagosPage };