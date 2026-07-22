import { useLayout } from '@/providers';
import { Fragment, useState } from 'react';
import clsx from 'clsx';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Container } from '@/components/container';
import { SeguimientoAspirantesContent } from './SeguimientoAspirantesContent';
import { SolicitudesInscripcionContent } from '@/pages/solicitudes-inscripcion/SolicitudesInscripcionContent';

type Tab = 'whatsapp' | 'solicitudes';

const SeguimientoAspirantesPage = () => {
  const { currentLayout } = useLayout();
  const [reload, setReload] = useState(false);
  const [tab, setTab] = useState<Tab>('whatsapp');

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
        <div className="tabs mb-4" data-tabs="true">
          <button
            type="button"
            className={clsx('tab', tab === 'whatsapp' && 'active')}
            onClick={() => setTab('whatsapp')}
          >
            WhatsApp Aspirantes
          </button>
          <button
            type="button"
            className={clsx('tab', tab === 'solicitudes' && 'active')}
            onClick={() => setTab('solicitudes')}
          >
            Solicitudes de Inscripción
          </button>
        </div>

        {tab === 'whatsapp' ? (
          <SeguimientoAspirantesContent
            reloadTrigger={reload}
            onReload={handleReload}
          />
        ) : (
          <SolicitudesInscripcionContent />
        )}
      </Container>
    </Fragment>
  );
};

export { SeguimientoAspirantesPage };
