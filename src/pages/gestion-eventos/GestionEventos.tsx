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
  const [searchTerm, setSearchTerm] = useState('');
  const [isArchived, setIsArchived] = useState(false);
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

          <ToolbarActions>
            {tabActiva === 'eventos' && (
              <>
                <div className="relative flex items-center">
                  <KeenIcon
                    icon="magnifier"
                    className="absolute left-3 text-gray-400 text-sm pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Buscar eventos..."
                    className="pl-8 input input-sm w-48"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsArchived((v) => !v)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-lg ${
                    isArchived
                      ? 'bg-orange-500 text-white shadow-orange-500/20'
                      : 'bg-white dark:bg-neutral-900 text-neutral-500 border border-neutral-100 dark:border-white/5'
                  }`}
                >
                  <KeenIcon icon="archive" className="text-sm" />
                  {isArchived ? 'Ver Activos' : 'Archivo'}
                </button>
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
              </>
            )}
          </ToolbarActions>
        </Toolbar>

        {/* ── Tabs premium de navegación ── */}
        <div className="mb-6 p-1.5 bg-neutral-100/70 dark:bg-zinc-900/60 backdrop-blur-md rounded-2xl border border-neutral-200/40 dark:border-white/5 flex gap-1 overflow-x-auto no-scrollbar shadow-inner max-w-fit scroll-smooth">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTabActiva(tab.key)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 rounded-xl',
                tabActiva === tab.key
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-white/5'
              )}
            >
              <KeenIcon
                icon={tab.icon}
                className={clsx(
                  'text-sm transition-all duration-300',
                  tabActiva === tab.key ? 'text-white' : 'text-neutral-400'
                )}
              />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Contenido dinámico ── */}
        <div className="tab-content">
          {tabActiva === 'eventos' && (
            <EventsContent
              reload={reloadEventos}
              searchTerm={searchTerm}
              isArchived={isArchived}
            />
          )}
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
