import { useState, Fragment } from 'react';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import clsx from 'clsx';
import { useNavigate } from 'react-router-dom';
import EventsContent from './eventos/EventsContent';
import ActividadesTab from './actividades/ActividadesTab';
import HermanosTab from './invitados/Hermanostab';
import ScannerTab from './scanner/ScannerTab';
import { FormIntegrationWizard } from './eventos/FormIntegrationWizard';

// ─── Tipos de tabs disponibles ────────────────────────────────────────────────
type TabKey = 'eventos' | 'actividades' | 'invitados' | 'scanner';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  description: string;
}

const TABS: Tab[] = [
  {
    key: 'eventos',
    label: 'Eventos',
    icon: 'calendar',
    description: 'Administración de eventos de la institución'
  },
  {
    key: 'actividades',
    label: 'Actividades',
    icon: 'calendar-tick',
    description: 'Línea de tiempo de actividades del evento'
  },
  {
    key: 'invitados',
    label: 'Invitados',
    icon: 'star',
    description: 'Empresas y personas que apoyan el evento'
  },
  {
    key: 'scanner',
    label: 'Scanner',
    icon: 'notepad',
    description: 'Escanea el código QR del invitado'
  }
];

const GestionEventos: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<TabKey>('eventos');
  const [reloadEventos, setReloadEventos] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const navigate = useNavigate();

  const tabInfo = TABS.find((t) => t.key === tabActiva)!;

  return (
    <Fragment>
      {/* ── Toolbar ── */}
      <Toolbar>
        <ToolbarHeading>
          <ToolbarPageTitle />
          <ToolbarDescription>{tabInfo.description}</ToolbarDescription>
        </ToolbarHeading>

        {/* Acciones dinámicas según la pestaña activa */}
        {tabActiva === 'eventos' && (
          <ToolbarActions>
            <button
              className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
              onClick={() => setShowWizard(true)}
            >
              <KeenIcon icon="file-code" className="text-base" />
              Integrar Formulario
            </button>
            <button
              className="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 ml-2"
              onClick={() => navigate('/gestion-eventos/nuevo')}
            >
              <KeenIcon icon="plus" className="text-base" />
              Nuevo Evento
            </button>
          </ToolbarActions>
        )}
      </Toolbar>

      <Container>
        {/* ── Tabs premium de navegación ── */}
        <div className="card mb-6 border border-gray-200 dark:border-zinc-700">
          <div className="card-body py-0 px-6">
            <div className="flex gap-0 border-b border-gray-200 dark:border-zinc-700 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTabActiva(tab.key)}
                  className={clsx(
                    'flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px',
                    tabActiva === tab.key
                      ? 'border-orange-500 text-orange-500 dark:text-orange-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <KeenIcon
                    icon={tab.icon}
                    className={clsx(
                      'text-lg transition-transform duration-300',
                      tabActiva === tab.key 
                        ? 'text-orange-500 dark:text-orange-400 scale-110' 
                        : 'text-gray-400 group-hover:scale-105'
                    )}
                  />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Contenido dinámico ── */}
        <div className="tab-content">
          {tabActiva === 'eventos' && <EventsContent reload={reloadEventos} />}
          {tabActiva === 'actividades' && <ActividadesTab />}
          {tabActiva === 'invitados' && <HermanosTab />}
          {tabActiva === 'scanner' && <ScannerTab />}
        </div>
      </Container>

      {/* Asistente para Integración de Formularios */}
      <FormIntegrationWizard
        open={showWizard}
        onClose={() => setShowWizard(false)}
        onSave={() => {
          setShowWizard(false);
          setReloadEventos((prev) => !prev);
        }}
      />
    </Fragment>
  );
};

export default GestionEventos;
