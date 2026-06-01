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
      <Container>
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
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 shadow-md shadow-blue-500/10"
                onClick={() => setShowWizard(true)}
              >
                <KeenIcon icon="file-code" className="text-base animate-pulse" />
                Integrar Formulario
              </button>
              <button
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:scale-95 shadow-md shadow-orange-500/10"
                onClick={() => navigate('/gestion-eventos/nuevo')}
              >
                <KeenIcon icon="plus" className="text-base" />
                Nuevo Evento
              </button>
            </ToolbarActions>
          )}
        </Toolbar>
        {/* ── Tabs premium de navegación ── */}
        <div className="mb-8 p-2 bg-neutral-100/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-[2.5rem] border border-neutral-200/40 dark:border-white/5 flex gap-2 overflow-x-auto no-scrollbar shadow-inner max-w-fit scroll-smooth">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              className={clsx(
                'flex items-center gap-3 px-6 py-3.5 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 rounded-[2rem]',
                tabActiva === tab.key
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-white/5'
              )}
            >
              <KeenIcon
                icon={tab.icon}
                className={clsx(
                  'text-lg transition-all duration-300',
                  tabActiva === tab.key 
                    ? 'text-white scale-110' 
                    : 'text-neutral-400 group-hover:scale-105'
                )}
              />
              {tab.label}
            </button>
          ))}
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
