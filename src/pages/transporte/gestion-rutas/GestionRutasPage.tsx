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
import GestionRutaContent from './GestionRutaContent';
import ModalGestionRuta from './ModalGestionRuta';



const GestionRutasPage = () => {

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
                  <ToolbarDescription>Gestion de Rutas</ToolbarDescription>
                </ToolbarHeading>
                <ToolbarActions>
                  <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Nueva Ruta
                  </button>
                </ToolbarActions>
              </Toolbar>
            </Container>
          )}
    
          <Container>
            <ModalGestionRuta
              open={modalOpen}
              onClose={handleModalClose}
              onSave={handleAfterSave}
            />
            <GestionRutaContent reload={reloadContent} />
            {/* <Timeline /> */}

          </Container>
        </Fragment>
      );
    };
  


export default GestionRutasPage