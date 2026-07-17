import { useLayout } from '@/providers';
import { Fragment, useState } from 'react';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Container } from '@/components/container';
import { SeguimientoAspirantesContent } from './SeguimientoAspirantesContent';

const SeguimientoAspirantesPage = () => {
  const { currentLayout } = useLayout();
  const [reload, setReload] = useState(false);

  const handleReload = () => {
    setReload((prev) => !prev);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Mapeo, importación y administración de los aspirantes del SENA
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}
      <Container>
        <SeguimientoAspirantesContent 
          reloadTrigger={reload} 
          onReload={handleReload} 
        />
      </Container>
    </Fragment>
  );
};

export { SeguimientoAspirantesPage };
