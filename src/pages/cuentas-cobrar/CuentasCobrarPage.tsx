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

import { CuentasCobrarContent } from './CuentasCobrarContent';

const CuentasCobrarPage = () => {
  const { currentLayout } = useLayout();

 
  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona las cuentas por cobrar</ToolbarDescription>
            </ToolbarHeading>
       
          </Toolbar>
        </Container>
      )}

      <Container>

        <CuentasCobrarContent  />
      </Container>
    </Fragment>
  );
};

export { CuentasCobrarPage };
