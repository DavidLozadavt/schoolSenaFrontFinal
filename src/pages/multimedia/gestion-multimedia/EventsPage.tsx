import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import React, { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookImage, Film, FileCode } from 'lucide-react';
import EventsContent from './EventsContent';
import { FormIntegrationWizard } from './FormIntegrationWizard';

const EventsPage = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const [reloadContent, setReloadContent] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Administra los eventos de la institución
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                className="btn btn-sm btn-light flex items-center gap-2"
                onClick={() => navigate('/multimedia/gestion-multimedia')}
              >
                <BookImage className="w-4 h-4" />
                Gestionar Historias
              </button>
              <button
                className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2 ml-2"
                onClick={() => setShowWizard(true)}
              >
                <FileCode className="w-4 h-4" />
                Integrar Formulario
              </button>
              <button
                className="btn btn-sm bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 ml-2"
                onClick={() => navigate('/multimedia/eventos/nuevo')}
              >
                <Calendar className="w-4 h-4" />
                Nuevo Evento
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}
      <Container>
        {/* Tab switcher - simplified for Events view */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => navigate('/multimedia/gestion-multimedia')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <BookImage className="w-4 h-4" />
            Multimedia
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-white dark:bg-neutral-900 shadow text-orange-600 dark:text-orange-400"
          >
            <Calendar className="w-4 h-4" />
            Eventos
          </button>
        </div>

        <EventsContent reload={reloadContent} />
      </Container>

      <FormIntegrationWizard 
        open={showWizard} 
        onClose={() => setShowWizard(false)} 
        onSave={() => {
          setShowWizard(false);
          setReloadContent(prev => !prev);
        }}
      />
    </Fragment>
  );
};

export default EventsPage;
