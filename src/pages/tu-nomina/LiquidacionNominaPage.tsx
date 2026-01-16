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

import axios from 'axios';
import { KeenIcon } from '@/components';
import { LiquidacionNominaContent } from './LiquidacionNominaContent';
import Spinner from '@/components/loaders/Spinner';

const LiquidacionNominaPage = () => {
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setModalOpen(false);
  };

  const handleLiquidar = async () => {
    setLoading(true);

    try {
      await axios.post('ejecutar_nomina_procedure');
      handleAfterSave();
    } catch (error) {
      console.error('Error al  ejecutar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLiquidaciones = async () => {
    setLoading(true);

    try {
      await axios.post('delete_all_liquidaciones');
      handleAfterSave();
    } catch (error) {
      console.error('Error al asignar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <h1 className="text-xl font-semibold leading-none text-gray-900">Liquidaciones</h1>
              <ToolbarDescription>Gestiona las liquidaciones existentes</ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button className="btn btn-sm btn-danger" onClick={handleDeleteLiquidaciones}>
                Eliminar liquidaciones
              </button>

              <button className="btn btn-sm btn-light" onClick={handleLiquidar}>
                Liquidar
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        {loading && <Spinner />}
        {/* <ModalTarifasRiesgo
          open={modalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        /> */}
        <LiquidacionNominaContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { LiquidacionNominaPage };
