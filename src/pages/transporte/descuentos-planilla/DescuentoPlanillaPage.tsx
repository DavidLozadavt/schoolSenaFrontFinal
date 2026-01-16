


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
import DescuentoPlanillaContent from './DescuentoPlanillaContent';
import ModalDescuentoPlanilla from './ModalDescuentoPlanilla';



const DescuentoPlanillaPage = () => {
  const { currentLayout } = useLayout();
  const [descuentoModalOpen, setdescuentoModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handledescuentoModalOpen = () => {
    setdescuentoModalOpen(true);
  };
  const handleModalClose = () => {
    setdescuentoModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setdescuentoModalOpen(false);
  };


return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los descuentos de planilla</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handledescuentoModalOpen}>
                Nuevo descuento
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ModalDescuentoPlanilla
          open={descuentoModalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />
        <DescuentoPlanillaContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export default DescuentoPlanillaPage;