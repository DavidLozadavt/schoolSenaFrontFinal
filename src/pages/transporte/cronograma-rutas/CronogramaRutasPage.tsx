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
import CronogramaRutasContent from './CronogramaRutasContent';
import ModalNuevoViaje from './ModalNuevoViaje';


const CronogramaRutasPage = () => {
    const { currentLayout } = useLayout();
    const [ViajeModalOpen, setModalViajeOpen] = useState(false);
    const [reloadContent, setReloadContent] = useState(false);
    const handleTipoPagoModalOpen = () => {
        setModalViajeOpen(true);
      };
      const handleModalClose = () => {
        setModalViajeOpen(false);
      };
    
      const handleAfterSave = () => {
        setReloadContent((prev) => !prev);
        setModalViajeOpen(false);
      };
      return (
        <Fragment>
          {currentLayout?.name === 'demo1-layout' && (
            <Container>
              <Toolbar>
                <ToolbarHeading>
                  <ToolbarPageTitle />
                  <ToolbarDescription>Gestiona el cronograma de las rutas</ToolbarDescription>
                </ToolbarHeading>
                <ToolbarActions>
                  <button onClick={handleTipoPagoModalOpen} className="btn btn-sm btn-light">
                    Nuevo viaje
                  </button>
                </ToolbarActions>
              </Toolbar>
            </Container>
          )}
          <Container>
            <ModalNuevoViaje
             open={ViajeModalOpen} 
             onClose={handleModalClose}
             onSave={handleAfterSave}/>
            <CronogramaRutasContent
              reload={reloadContent}
            />
          </Container>
        </Fragment>
      );
    };
    


export default CronogramaRutasPage