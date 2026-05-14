import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import React, { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Film, BookImage, Calendar } from 'lucide-react';
import MultimediaContent from './MultimediaContent';
import { ModalMultimedia } from './ModalMultimedia';
import EventsContent from './EventsContent';

const MultimediaPage = () => {
  const { currentLayout } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadContent, setReloadContent] = useState(false);
  const [modalTipo, setModalTipo] = useState<'historia' | 'reel'>('historia');
  const [activeTab, setActiveTab] = useState<'historia' | 'reel' | 'evento'>('historia');

  useEffect(() => {
    if (location.pathname.includes('/multimedia/eventos')) {
      setActiveTab('evento');
    }
    // Don't reset to 'historia' when already on gestion-multimedia with a reel tab active
  }, [location.pathname]);

  const handleTabChange = (tab: 'historia' | 'reel' | 'evento') => {
    setActiveTab(tab);
    if (tab === 'evento') {
      navigate('/multimedia/eventos');
    } else {
      // Stay on gestion-multimedia but update active tab without navigating
      if (location.pathname !== '/multimedia/gestion-multimedia') {
        navigate('/multimedia/gestion-multimedia');
      }
    }
  };

  const handleModalOpen = (tipo: 'historia' | 'reel') => {
    setModalTipo(tipo);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  const handleAfterSave = () => {
    setReloadContent((prev) => !prev);
    setModalOpen(false);
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                {activeTab === 'evento' 
                  ? 'Administra los eventos de la institución' 
                  : 'Administra tus historias y reels'}
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                className="btn btn-sm btn-light flex items-center gap-2"
                onClick={() => handleModalOpen('historia')}
              >
                <BookImage className="w-4 h-4" />
                Nueva Historia
              </button>
              <button
                className="btn btn-sm btn-primary flex items-center gap-2 ml-2"
                onClick={() => handleModalOpen('reel')}
              >
                <Film className="w-4 h-4" />
                Nuevo Reel
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
        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => handleTabChange('historia')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'historia'
                ? 'bg-white dark:bg-neutral-900 shadow text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <BookImage className="w-4 h-4" />
            Historias
          </button>
          <button
            onClick={() => handleTabChange('reel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'reel'
                ? 'bg-white dark:bg-neutral-900 shadow text-purple-600 dark:text-purple-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Film className="w-4 h-4" />
            Reels
          </button>
          <button
            onClick={() => handleTabChange('evento')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'evento'
                ? 'bg-white dark:bg-neutral-900 shadow text-orange-600 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Eventos
          </button>
        </div>

        <ModalMultimedia
          open={modalOpen}
          tipo={modalTipo}
          onClose={handleModalClose}
          onSave={handleAfterSave}
        />

        {activeTab === 'evento' ? (
          <EventsContent
            reload={reloadContent}
          />
        ) : (
          <MultimediaContent
            key={activeTab}
            reload={reloadContent}
            tipo={activeTab as 'historia' | 'reel'}
            onEdit={(grupo, tipo) => {
              setModalTipo(tipo);
              setModalOpen(true);
            }}
          />
        )}
      </Container>
    </Fragment>
  );
};

export default MultimediaPage;