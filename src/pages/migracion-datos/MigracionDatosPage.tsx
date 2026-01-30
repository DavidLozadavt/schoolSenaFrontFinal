import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import React, { Fragment, useState } from 'react';
import MigracionDatosContent from './MigracionDatosContent';

const MigracionDatosPage = () => {
  const { currentLayout } = useLayout();
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && <Container></Container>}
      <Container>
        <MigracionDatosContent />
      </Container>
    </Fragment>
  );
};

export default MigracionDatosPage;

