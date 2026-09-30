import { useLayout } from '@/providers';
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Container } from '@/components/container';
import { ModalConfiguracionPagos } from '@/pages/configuracion-pagos/ModalConfiguracionPagos';
import { ConfiguracionPagosContent } from '@/pages/configuracion-pagos/ConfiguracionPagosContent';
import { ModalGenerarFacturaValoresEconomicos } from '@/pages/facturas-academicas/ModalGenerarFacturaValoresEconomicos';

const ConfiguracionValoresEconomicosPage = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFacturaOpen, setModalFacturaOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);

  const handleModalOpen = () => setModalOpen(true);
  const handleModalClose = () => setModalOpen(false);
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
              <ToolbarPageTitle text="Configuración de valores económicos" />
              <ToolbarDescription>
                Gestiona los valores de matrícula, uniforme y otros costos académicos del colegio.
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => navigate('/pagos/facturas-academicas')}
              >
                Ver facturas
              </button>
              <button
                type="button"
                onClick={() => setModalFacturaOpen(true)}
                className="btn btn-sm btn-primary"
              >
                Generar factura
              </button>
              <button type="button" onClick={handleModalOpen} className="btn btn-sm btn-light">
                Nuevo valor económico
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalConfiguracionPagos
          open={modalOpen}
          onClose={handleModalClose}
          onSave={handleAfterSave}
          variant="economicos"
        />
        <ModalGenerarFacturaValoresEconomicos
          open={modalFacturaOpen}
          onClose={() => setModalFacturaOpen(false)}
          onGenerated={(facturaId) => {
            if (facturaId) {
              navigate(`/pagos/facturas-academicas?factura=${facturaId}`);
            } else {
              navigate('/pagos/facturas-academicas');
            }
          }}
        />
        <ConfiguracionPagosContent reload={reloadContent} variant="economicos" />
      </Container>
    </Fragment>
  );
};

export { ConfiguracionValoresEconomicosPage };
