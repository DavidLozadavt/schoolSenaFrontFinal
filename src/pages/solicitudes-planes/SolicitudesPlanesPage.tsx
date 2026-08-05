import { Fragment, useState } from 'react';
import clsx from 'clsx';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Container } from '@/components/container';
import { useAuthContext } from '@/auth';
import { SolicitudesPlanesContent } from './SolicitudesPlanesContent';
import { PlanesMensajesContent } from './PlanesMensajesContent';
import { DashboardPlanesContent } from './DashboardPlanesContent';
import { HistorialFacturacionContent } from './HistorialFacturacionContent';
import { ConfiguracionPagosWompiContent } from './ConfiguracionPagosContent';

type Tab = 'solicitudes' | 'planes' | 'dashboard' | 'historial' | 'configuracion';

/**
 * Módulo ÚNICO del Administrador VT para planes y pagos.
 *
 * Historial de Facturación y Configuración de Pagos viven aquí como pestañas,
 * no como módulos paralelos.
 */
const SolicitudesPlanesPage = () => {
  const { currentLayout } = useLayout();
  const { permissions } = useAuthContext();
  const permisos = permissions ?? [];
  const puedeVerDashboard = permisos.includes('GESTION_DASHBOARD_PLANES');
  const puedeVerHistorial = permisos.includes('GESTION_HISTORIAL_FACTURACION');
  const puedeVerConfiguracion = permisos.includes('GESTION_CONFIGURACION_PAGOS');
  const [tab, setTab] = useState<Tab>('solicitudes');

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Revisión de compras de planes de mensajes de WhatsApp por usuario
              </ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="tabs mb-4" data-tabs="true">
          <button
            type="button"
            className={clsx('tab', tab === 'solicitudes' && 'active')}
            onClick={() => setTab('solicitudes')}
          >
            Solicitudes de Planes
          </button>
          <button
            type="button"
            className={clsx('tab', tab === 'planes' && 'active')}
            onClick={() => setTab('planes')}
          >
            Administración de Planes
          </button>
          {puedeVerDashboard && (
            <button
              type="button"
              className={clsx('tab', tab === 'dashboard' && 'active')}
              onClick={() => setTab('dashboard')}
            >
              Dashboard
            </button>
          )}
          {puedeVerHistorial && (
            <button
              type="button"
              className={clsx('tab', tab === 'historial' && 'active')}
              onClick={() => setTab('historial')}
            >
              Historial de Facturación
            </button>
          )}
          {puedeVerConfiguracion && (
            <button
              type="button"
              className={clsx('tab', tab === 'configuracion' && 'active')}
              onClick={() => setTab('configuracion')}
            >
              Configuración de Pagos
            </button>
          )}
        </div>

        {tab === 'solicitudes' ? (
          <SolicitudesPlanesContent />
        ) : tab === 'planes' ? (
          <PlanesMensajesContent />
        ) : tab === 'dashboard' ? (
          <DashboardPlanesContent />
        ) : tab === 'historial' ? (
          <HistorialFacturacionContent />
        ) : (
          <ConfiguracionPagosWompiContent />
        )}
      </Container>
    </Fragment>
  );
};

export { SolicitudesPlanesPage };
