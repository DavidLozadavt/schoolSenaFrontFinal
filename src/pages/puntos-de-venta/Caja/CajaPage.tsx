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
import CajaContent from './CajaContent';
import { KeenIcon } from '@/components';
import ModalCerrarCaja from './ModalCerrarCaja';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import RelojComponent from '../../../components/Reloj/RelojComponent';
import ModalReporteVentanillas from './ModalReportePlanillas';
import ModalCopiaTickets from './ModalCopiaTickets';
import ModalNuevoViaje from '@/pages/transporte/cronograma-rutas/ModalNuevoViaje';
import ModalDevoluciones from './ModalDevoluciones';
import ModalConfiguracionAsientos from './ModalConfiguracionAsientos';

const CajaPage = () => {
  const { idPunto } = useParams();
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOpenReporte, setModalOpenReporte] = useState(false);
  const [modalOpenCopia, setModalOpenCopia] = useState(false);
  const [modalOpenDevoluciones, setModalOpenDevoluciones] = useState(false);
  const [modalOpenConfigAsientos, setModalOpenConfigAsientos] = useState(false);

  const [reloadContent, setReloadContent] = useState(false);
  const [modalOpenNuevoViaje, setModalOpenNuevoViaje] = useState(false);

  const handleModalOpenNuevoViaje = () => {
    setModalOpenNuevoViaje(true);
  };
  const handleModalCloseNuevoViaje = () => {
    setModalOpenNuevoViaje(false);
  };
  const handleModalOpenReporte = () => {
    setModalOpenReporte(true);
  };
  const handleModalCloseReporte = () => {
    setModalOpenReporte(false);
  };


  const handleModalOpen = () => {
    setModalOpen(true);
  };
  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleModalOpenCopia = () => {
    setModalOpenCopia(true);
  };
  const handleModalCloseCopia = () => {
    setModalOpenCopia(false);
  };

  const handleModalOpenDevoluciones = () => {
    setModalOpenDevoluciones(true);
  };
  const handleModalCloseDevoluciones = () => {
    setModalOpenDevoluciones(false);
  };

  const handleModalOpenConfigAsientos = () => {
    setModalOpenConfigAsientos(true);
  };
  const handleModalCloseConfigAsientos = () => {
    setModalOpenConfigAsientos(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setModalOpen(false);
    navigate('/punto-de-ventas/puntos-de-ventas');
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                <RelojComponent />
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              {/* <button className="btn btn-sm btn-primary" onClick={handleModalOpenConfigAsientos}>
                <KeenIcon icon="cube-3" />
                Configurar Asientos
              </button> */}
              <button className="btn btn-sm btn-light" onClick={handleModalOpenDevoluciones}>
                Devoluciones
                <KeenIcon icon="arrow-left" />
              </button>
              <button className="btn btn-sm btn-light" onClick={handleModalOpenCopia}>
                Copia tiquetes
                <KeenIcon icon="cheque" />
              </button>
              <button className="btn btn-sm btn-light" onClick={handleModalOpenNuevoViaje}>
                Nuevo viaje
                <KeenIcon icon="plus" />
              </button>
              <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Cerrar caja
                <KeenIcon icon="lock-2" />
              </button>
              
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ModalCerrarCaja
          open={modalOpen}
          onClose={handleModalClose}
          idPunto={idPunto}
          onSave={handleAfterSave}
        />
        <ModalReporteVentanillas
          open={modalOpenReporte}
          onClose={handleModalCloseReporte}
          idPunto={idPunto}
          onSave={handleAfterSave}
        />

        <CajaContent
          idPunto={idPunto}
          reload={reloadContent}
          />

          <ModalCopiaTickets
          open={modalOpenCopia}
          onClose={handleModalCloseCopia}
          
        />

       <ModalNuevoViaje
        open={modalOpenNuevoViaje}
        onClose={handleModalCloseNuevoViaje}
        onSave={() => {
          setReloadContent(prev => !prev); 
        
        }}
      />

      <ModalDevoluciones
        open={modalOpenDevoluciones}
        onClose={handleModalCloseDevoluciones}
        idPunto={idPunto}
         onSave={() => {
          setReloadContent(prev => !prev); 
        
        }}
      />

      <ModalConfiguracionAsientos
        open={modalOpenConfigAsientos}
        onClose={handleModalCloseConfigAsientos}
        onSave={() => {
          setReloadContent(prev => !prev); 
        }}
      />

      </Container>
    </Fragment>
  );
};

export default CajaPage;
