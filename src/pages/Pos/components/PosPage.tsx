import { Fragment, useRef, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

import { useLayout } from '@/providers';
import { PosContent } from './PosContent';
import ModalCerrarCaja from '@/pages/puntos-de-venta/Caja/ModalCerrarCaja';
import { KeenIcon } from '@/components';
import { Cliente } from '../models/ClienteModel';
import ModalCerrarCajaTienda from './ModalCerrarCajaTienda';

const PosPage = () => {
    const { idPunto } = useParams();
    const { currentLayout } = useLayout();
    const navigate = useNavigate(); 
    const [modalOpen, setModalOpen] = useState(false);
    const [reloadContent, setReloadContent] = useState(false);
    const [cliente, setCliente] = useState<Cliente | null>(null);

  const handleModalOpen = () => {
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setModalOpen(false); 
    navigate('/punto-de-ventas/pos-tienda'); 
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
            </ToolbarHeading>
            <ToolbarActions>
               <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Cerrar caja
                <KeenIcon
                  icon="lock-2"
                />
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
      <ModalCerrarCajaTienda
          open={modalOpen}
          onClose={handleModalClose}
          idPunto={idPunto}
          onSave={handleAfterSave}
        />
        <PosContent
          idPunto={idPunto}
        />
      </Container>
    </Fragment>
  );
};

export { PosPage };
