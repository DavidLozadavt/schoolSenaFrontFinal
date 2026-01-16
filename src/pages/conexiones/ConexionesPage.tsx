import { Container } from '@/components';
import React, { Fragment, useState } from 'react'
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import ConexionesContent from './ConexionesContent';
import ModalConexiones from './ModalConexiones';


const ConexionesPage = () => {
  const {currentLayout} = useLayout();
  const  [procesoModalOpen, setProcesoModalOpen] = useState(false);
  const [reloadContent, setReloadContent ] = useState(false);

  const handleProcesoModalOpen = () => {
    setProcesoModalOpen(true);
  };
  const handleModalClose = () => {
    setProcesoModalOpen(false);
  };
  const handleAfterSave = () => {
    setReloadContent((prev) =>!prev);
    setProcesoModalOpen(false);
  };
  
    return (
      <Fragment>
        {currentLayout?.name === 'demo1-layout' && (
          <Container>
            
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle />
                <ToolbarDescription>Gestion conexiones</ToolbarDescription>
              </ToolbarHeading>
              <ToolbarActions>
                <button className="btn btn-sm btn-light" onClick={handleProcesoModalOpen}>
                  Nuevo Proceso
                </button>
              </ToolbarActions>
            </Toolbar>
          </Container>
        )}
  
        <Container>
          <ModalConexiones
            open={procesoModalOpen}
            onClose={handleModalClose}
            onSave={handleAfterSave}
          />
          <ConexionesContent reload={reloadContent}/>
        </Container>
      </Fragment>
    );
  };

export default ConexionesPage