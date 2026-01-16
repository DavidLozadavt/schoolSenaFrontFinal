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
import PuntosVentaContent from './PuntosVentaContent';
import ModalPuntosVenta from './ModalPuntosVenta';

const PuntosVentaPage = () => {
    const { currentLayout } = useLayout();

    const [modalOpen, setModalOpen] = useState(false);
    const [reloadContent, setReloadContent] = useState(false);
  
    const handleModalOpen = () => {
      setModalOpen(true);
    };
    const handleModalClose = () => {
      setModalOpen(false);
    };
  
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
                  <ToolbarDescription>Gestion puntos de venta</ToolbarDescription>
                </ToolbarHeading>
                <ToolbarActions>
                  <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                     Nuevo Punto de Venta
                  </button>
                </ToolbarActions>
              </Toolbar>
            </Container>
          )}
    
          <Container>
            <ModalPuntosVenta
              open={modalOpen}
              onClose={handleModalClose}
              onSave={handleAfterSave}
            />
            <PuntosVentaContent reload={reloadContent} /> 
          </Container>
        </Fragment>
      );
    };
    


export default PuntosVentaPage