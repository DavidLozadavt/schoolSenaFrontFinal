import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import React, { Fragment, useState } from 'react';
import SolicitudAlmacenContent from './SolicitudAlmacenContent';
import ModalRechazarSolicitud from './ModalRechazarSolicitud';
import ModalTrazabilidad from './ModalTrazabilidad';

const SolicitudAlmacenPage = () => {
  const { currentLayout } = useLayout();

  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<number | null>(null);

  // Nuevo estado para trazabilidad
  const [trazabilidadOpen, setTrazabilidadOpen] = useState(false);
  const [distribucionId, setDistribucionId] = useState<number | null>(null);

  /* 🔹 Cuando cierras modal */
  const handleModalClose = () => {
    setModalOpen(false);
    setSolicitudSeleccionada(null);
  };

  /* 🔹 Cuando guardas el rechazo */
  const handleAfterSave = () => {
    setReloadContent(!reloadContent); // recarga tabla
    setModalOpen(false);
    setSolicitudSeleccionada(null);
  };

  /* 🔹 Abrir modal de trazabilidad desde la tabla */
  const handleOpenTrazabilidad = (id: number) => {
    setDistribucionId(id);
    setTrazabilidadOpen(true);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Administra tus solicitudes de los productos</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        {/* 🔹 Modal de Rechazo centralizado */}
        <ModalRechazarSolicitud
          open={modalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
          solicitudId={solicitudSeleccionada}
        />

        {/* 🔹 Modal de trazabilidad */}
        <ModalTrazabilidad
          isOpen={trazabilidadOpen}
          onClose={() => {
            setTrazabilidadOpen(false);
            setDistribucionId(null);
          }}
          idDistribucion={distribucionId}
        />

        {/* 🔹 Contenido principal */}
        <SolicitudAlmacenContent
          reload={reloadContent}
          onOpenRechazo={(id: number) => {
            setSolicitudSeleccionada(id);
            setModalOpen(true);
          }}
          onOpenTrazabilidad={handleOpenTrazabilidad}
        />
      </Container>
    </Fragment>
  );
};

export default SolicitudAlmacenPage;
