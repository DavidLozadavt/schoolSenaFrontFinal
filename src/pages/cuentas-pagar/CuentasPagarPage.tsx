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
import { CuentasPagarContent } from './CuentasPagarContent';

const CuentasPagarPage = () => {
  const { currentLayout } = useLayout();

 
  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona las cuentas por pagar</ToolbarDescription>
            </ToolbarHeading>
       
          </Toolbar>
        </Container>
      )}

      <Container>

        <CuentasPagarContent  />
      </Container>
    </Fragment>
  );
};

export { CuentasPagarPage };
