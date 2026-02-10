import React, { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import ListaHistorialRAPs from './ListaHistorialRAPs';
import Toast from '../programas-academicos/components/Toast';

const HistorialRAPsPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const [evento, setEvento] = useState<boolean>(true);

  //Toast para el success
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona el historial de Raps</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <ListaHistorialRAPs searchTerm="" evento={evento} setEvento={setEvento} />
      </Container>
      <Toast isOpen={toastOpen} message={toastMessage} onClose={() => setToastOpen(false)} />
    </Fragment>
  );
};

export default HistorialRAPsPage;
