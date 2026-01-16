import { Fragment, useState } from 'react';
import { Container } from '@/components';
import { CobrosPolizasContent } from './CobrosPolizasContent';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';

const CobrosPolizasPage = () => {
  const { currentLayout } = useLayout();
  const [reloadContent, setReloadContent] = useState(false);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Gestiona los cobros de pólizas</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <CobrosPolizasContent reload={reloadContent} />
      </Container>
    </Fragment>
  );
};

export { CobrosPolizasPage };
