import { Fragment, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FacturasAcademicasContent } from './FacturasAcademicasContent';
import { ModalDetalleFacturaAcademica } from './ModalDetalleFacturaAcademica';

const FacturasAcademicasPage = () => {
  const { currentLayout } = useLayout();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reloadContent, setReloadContent] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  useEffect(() => {
    setReloadContent((prev) => !prev);
  }, [location.pathname]);

  useEffect(() => {
    const id = searchParams.get('factura');
    if (id) {
      const num = Number(id);
      if (num > 0) {
        setDetalleId(num);
        setModalDetalleOpen(true);
      }
    }
  }, [searchParams]);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle text="Facturas" />
              <ToolbarDescription>
                Consulta facturas generadas desde los valores económicos configurados.
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <ModalDetalleFacturaAcademica
          open={modalDetalleOpen}
          facturaId={detalleId}
          onClose={() => {
            setModalDetalleOpen(false);
            setDetalleId(null);
            if (searchParams.get('factura')) {
              searchParams.delete('factura');
              setSearchParams(searchParams, { replace: true });
            }
          }}
        />
        <FacturasAcademicasContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { FacturasAcademicasPage };
