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
import { ModalConfiguracionHorasExtra } from './ModalConfiguracionHorasExtra';
import { ConfiguracionHorasExtraContent } from './ConfiguracionHorasExtraContent';

const ConfiguracionHorasExtraPage = () => {
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
              <ToolbarDescription>Configuración de Horas Extra</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-light" onClick={handleModalOpen}>
                Nueva Configuración Horas Extra
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ModalConfiguracionHorasExtra open={modalOpen} onClose={handleModalClose} onSave={handleAfterSave} />
        <ConfiguracionHorasExtraContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { ConfiguracionHorasExtraPage };
