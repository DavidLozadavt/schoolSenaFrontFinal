
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
import { ConfigurarAsientosContent } from './ConfigurarAsientosContent';
import ModalConfigurarAsientos from './ModalConfigurarAsientos';


const ConfigurarAsientosPage = () => {
  const { currentLayout } = useLayout();
     const [reload, setReload] = useState(false);
   const [isModalOpen, setIsModalOpen] = useState(false);

  const handleReload = () => {
    setReload((prev) => !prev);
  };

  const handleAfterSave = () => {
    setIsModalOpen(false);
    handleReload();
  };


  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los mapas de asientos</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button onClick={() => setIsModalOpen(true)} className="btn btn-sm btn-light">
                Nuevo mapa de asientos
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
       
      <ConfigurarAsientosContent reload={reload} />

      <ModalConfigurarAsientos
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAfterSave}
      />
      </Container>
    </Fragment>
  );
};

export { ConfigurarAsientosPage };
