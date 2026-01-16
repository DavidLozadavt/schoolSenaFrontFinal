import { Fragment, useRef, useState } from 'react';
import { Container } from '@/components';
import { AhorroTerceroContent } from './AhorroTerceroContent';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
const AhorroTerceroPage = () => {
  const { currentLayout } = useLayout();
    const [reloadContent, setReloadContent] = useState(false);

    
  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los ahorros de tercero</ToolbarDescription>
            </ToolbarHeading>

          </Toolbar>
        </Container>
      )}
      <Container>
        <AhorroTerceroContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { AhorroTerceroPage };