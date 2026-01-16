import { Fragment, useState } from 'react';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { Tabs, TabsList, Tab, TabPanel } from '@/components/tabs';
import FacturacionElectronicaContent from './FacturacionElectronicaContent';
import NotasCreditoContent from './NotasCreditoContent';

const FacturacionElectronicaPage = () => {
  const { currentLayout } = useLayout();
  const [reloadContent, setReloadContent] = useState(false);
  const [activeTab, setActiveTab] = useState<string | number>('facturas');

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Gestión de Facturación Electrónica y Notas de Crédito
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <Tabs 
          value={activeTab} 
          onChange={(_, value) => value !== null && setActiveTab(value)}
        >
          <div className="mb-5">
            <TabsList className="nav nav-tabs nav-tabs-line gap-5">
              <Tab 
                value="facturas" 
                className="nav-item"
              >
                <span className="nav-link">
                  Facturas Electrónicas
                </span>
              </Tab>
              <Tab 
                value="notas-credito" 
                className="nav-item"
              >
                <span className="nav-link">
                  Notas de Crédito
                </span>
              </Tab>
            </TabsList>
          </div>

          <TabPanel value="facturas">
            <FacturacionElectronicaContent reload={reloadContent} />
          </TabPanel>

          <TabPanel value="notas-credito">
            <NotasCreditoContent reload={reloadContent} />
          </TabPanel>
        </Tabs>
      </Container>
    </Fragment>
  );
};

export { FacturacionElectronicaPage };
