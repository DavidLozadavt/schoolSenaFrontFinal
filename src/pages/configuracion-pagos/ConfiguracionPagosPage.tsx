import { useLayout } from "@/providers";
import { Fragment, useCallback, useState } from 'react';
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
import { ModalLlavesWompi } from "./ModalLlavesWompi";

const ConfiguracionPagosPage = () => {
 const { currentLayout } = useLayout();
  const [modalOpen, setModalOpen]=useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  const [llavesWompiOpen, setLlavesWompiOpen] = useState(false);
  const cerrarLlavesWompi = useCallback(() => setLlavesWompiOpen(false), []);
  
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
            <button onClick={() => setLlavesWompiOpen(true)} className="btn btn-sm btn-light">
              <i className="ki-filled ki-key"></i>
              Llaves de Wompi
            </button>
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
      <ModalLlavesWompi open={llavesWompiOpen} onClose={cerrarLlavesWompi} />
      <ConfiguracionPagosContent reload={reloadContent} />
    </Container>
  </Fragment>
)
};


export { ConfiguracionPagosPage };