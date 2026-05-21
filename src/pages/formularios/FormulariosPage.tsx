import React, { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { 
  FileCode, 
  Settings, 
  Link as LinkIcon, 
  Calendar, 
  AlertCircle, 
  ExternalLink, 
  PlusCircle, 
  CheckCircle2, 
  Info, 
  FileText, 
  Globe, 
  Plus,
  Trash2,
  Sparkles,
  Eye,
  Smile,
  ClipboardCheck,
  UserPlus,
  MessageSquare,
  Layers
} from 'lucide-react';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { FormIntegrationWizard } from '@/pages/multimedia/gestion-multimedia/FormIntegrationWizard';
import ExternalFormEmbed from '@/pages/multimedia/gestion-multimedia/ExternalFormEmbed';
import { compactReactSelectClassNames, compactReactSelectNoOptions } from '@/components/forms/compactReactSelect';

import { useNavigate } from 'react-router-dom';

interface FormularioInterno {
  id: number;
  titulo: string;
  descripcion?: string | null;
  estado: string;
  preguntas_count?: number;
  respuestas_count?: number;
  created_at: string;
  [key: string]: any;
}

const FormulariosPage: React.FC = () => {
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external');
  
  // External Forms Integration States
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [reloadSignal, setReloadSignal] = useState(false);
  
  // Toast / Notifications State
  const [toast, setToast] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  
  // Internal Forms State
  const [internalForms, setInternalForms] = useState<FormularioInterno[]>([]);
  const [loadingInternalForms, setLoadingInternalForms] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch events with forms
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await axios.get('eventos-multimedia?per_page=50');
        const allEvents = response.data.data || [];
        setEvents(allEvents);
        
        // Auto-select first event with integrated form if none selected
        if (allEvents.length > 0 && !selectedEvent) {
          const firstWithForm = allEvents.find((e: any) => e.formUrl);
          if (firstWithForm) {
            setSelectedEvent(firstWithForm);
          } else {
            setSelectedEvent(allEvents[0]);
          }
        } else if (selectedEvent) {
          // Keep selection updated
          const updated = allEvents.find((e: any) => e.idEvento === selectedEvent.idEvento);
          if (updated) setSelectedEvent(updated);
        }
      } catch (error) {
        console.error('Error cargando eventos:', error);
        showToast('No se pudieron obtener los eventos del servidor', 'error');
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [reloadSignal]);

  // Fetch internal forms
  useEffect(() => {
    const fetchInternalForms = async () => {
      setLoadingInternalForms(true);
      try {
        const response = await axios.get('/formularios');
        setInternalForms(response.data);
      } catch (error) {
        console.error('Error fetching internal forms:', error);
      } finally {
        setLoadingInternalForms(false);
      }
    };
    if (activeTab === 'internal') {
      fetchInternalForms();
    }
  }, [activeTab]);


  const handleDeleteExternalLink = async (eventId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar la vinculación de este formulario?')) return;
    
    try {
      await axios.post(`eventos-multimedia/${eventId}`, {
        formUrl: '',
        formProvider: 'other',
        _method: 'POST'
      });
      showToast('Formulario desvinculado con éxito', 'success');
      setReloadSignal((prev) => !prev);
    } catch (error) {
      console.error(error);
      showToast('Error al desvincular el formulario', 'error');
    }
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case 'google':
        return <span className="badge badge-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-bold uppercase tracking-wider">Google Forms</span>;
      case 'microsoft':
        return <span className="badge badge-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold uppercase tracking-wider">Microsoft Forms</span>;
      case 'typeform':
        return <span className="badge badge-sm bg-black text-white dark:bg-white/10 dark:text-white font-bold uppercase tracking-wider">Typeform</span>;
      case 'tally':
        return <span className="badge badge-sm bg-neutral-900 text-white dark:bg-neutral-800 dark:text-neutral-200 font-bold uppercase tracking-wider">Tally</span>;
      case 'jotform':
        return <span className="badge badge-sm bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold uppercase tracking-wider">Jotform</span>;
      default:
        return <span className="badge badge-sm bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400 font-bold uppercase tracking-wider">Externo / Otro</span>;
    }
  };

  return (
    <Fragment>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 transform scale-100 border ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : toast.type === 'error' 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' 
            : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
        } backdrop-blur-xl animate-bounce-short`}>
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">{toast.message}</span>
        </div>
      )}

      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>
                Portal unificado de integración y diseño de formularios institucionales
              </ToolbarDescription>
            </ToolbarHeading>
            <ToolbarActions>
              <button
                onClick={() => setWizardOpen(true)}
                className="btn btn-sm bg-gradient-to-r from-orange-500 to-rose-500 text-white flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/20 rounded-xl px-5 py-2.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Vincular Formulario Externo</span>
              </button>
            </ToolbarActions>
          </Toolbar>
        </Container>
      )}

      <Container>
        {/* Tab Selector */}
        <div className="flex gap-1 mb-8 bg-neutral-100 dark:bg-neutral-800/80 p-1.5 rounded-2xl w-fit border border-neutral-200/20 shadow-inner">
          <button
            onClick={() => setActiveTab('external')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'external'
                ? 'bg-white dark:bg-neutral-900 shadow-xl shadow-black/5 text-orange-600 dark:text-orange-400'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Integración de Formularios Externos</span>
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'internal'
                ? 'bg-white dark:bg-neutral-900 shadow-xl shadow-black/5 text-blue-600 dark:text-blue-400'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Estructura de Formularios Internos (Demo)</span>
          </button>
        </div>

        {activeTab === 'external' ? (
          /* TAB 1: EXTERNAL FORMS INTEGRATION */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* List / Left side */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-neutral-800 dark:text-white">Eventos Multimedia</h2>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">Listado de vinculación de formularios</p>
                  </div>
                  <button 
                    onClick={() => setWizardOpen(true)}
                    className="p-3 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {loadingEvents ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
                    <div className="w-8 h-8 rounded-full border-4 border-t-orange-500 border-neutral-200 dark:border-neutral-800 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Cargando eventos...</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                    {events.map((e) => (
                      <div
                        key={e.idEvento}
                        onClick={() => setSelectedEvent(e)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 group relative overflow-hidden ${
                          selectedEvent?.idEvento === e.idEvento
                            ? 'border-orange-500 bg-orange-500/[0.03] shadow-lg shadow-orange-500/5'
                            : 'border-neutral-100 dark:border-white/5 bg-neutral-50/50 dark:bg-neutral-800/20 hover:bg-white dark:hover:bg-neutral-800/40 hover:border-orange-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block mb-1">
                              ID: {e.idEvento}
                            </span>
                            <h4 className="text-xs font-black uppercase tracking-tight truncate text-neutral-800 dark:text-white">
                              {e.nombre}
                            </h4>
                          </div>
                          
                          {e.formUrl ? (
                            getProviderBadge(e.formProvider)
                          ) : (
                            <span className="badge badge-sm bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 font-bold uppercase tracking-wider">
                              Sin Vincular
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 mt-1 border-t border-neutral-100 dark:border-white/5 pt-3">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                            <span>{e.fechaInicial}</span>
                          </span>
                          
                          {e.formUrl && (
                            <button
                              onClick={(evt) => {
                                evt.stopPropagation();
                                handleDeleteExternalLink(e.idEvento);
                              }}
                              className="text-neutral-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                              title="Desvincular Formulario"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {events.length === 0 && (
                      <div className="text-center py-16 border-2 border-dashed border-neutral-100 dark:border-white/5 rounded-3xl opacity-50">
                        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-neutral-400" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No se encontraron eventos</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Embed Preview / Right side */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl min-h-[600px] flex flex-col justify-center">
                {selectedEvent ? (
                  selectedEvent.formUrl ? (
                    <div className="animate-fade-in flex flex-col gap-6">
                      <div className="flex items-center justify-between bg-orange-500/5 p-5 rounded-3xl border border-orange-500/10 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Sparkles className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-tight text-neutral-800 dark:text-white">Formulario Activo</h4>
                            <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Vinculado al evento: <span>{selectedEvent.nombre}</span></p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteExternalLink(selectedEvent.idEvento)}
                          className="btn btn-sm bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          <span>Eliminar Enlace</span>
                        </button>
                      </div>

                      <ExternalFormEmbed 
                        url={selectedEvent.formUrl} 
                        provider={selectedEvent.formProvider} 
                        title={selectedEvent.nombre} 
                      />
                    </div>
                  ) : (
                    <div className="text-center py-20 animate-fade-in flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800/40 rounded-[2rem] flex items-center justify-center mb-6 border border-neutral-100 dark:border-white/5">
                        <LinkIcon className="w-8 h-8 text-neutral-300" />
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2">Sin Formulario Vinculado</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed font-semibold mb-8">
                        <span>El evento </span>
                        <span className="text-orange-500 font-bold">"{selectedEvent.nombre}"</span>
                        <span> no tiene un formulario de registro asociado todavía.</span>
                      </p>
                      <button
                        onClick={() => {
                          setWizardOpen(true);
                        }}
                        className="btn btn-primary w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20 transform active:scale-95 transition-all"
                      >
                        <span>Vincular Formulario Ahora</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="text-center py-24 opacity-40">
                    <FileCode className="w-16 h-16 mx-auto mb-4 text-neutral-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Selecciona un evento de la lista para gestionar o previsualizar su formulario</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* TAB 2: INTERNAL FORMS STANDARDS & DEMO */
          <div className="grid grid-cols-1 gap-8 items-start">
            
            <div className="col-span-1">
              <div className="bg-white dark:bg-neutral-900 p-8 md:p-10 rounded-[2.5rem] border border-neutral-100 dark:border-white/5 shadow-2xl flex flex-col gap-8">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-white/5 pb-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-neutral-800 dark:text-white flex items-center gap-3">
                      <span className="w-2.5 h-8 bg-blue-600 rounded-full animate-pulse inline-block" />
                      <span>Mis Formularios Internos</span>
                    </h2>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mt-1">Crea y gestiona formularios directamente en la plataforma</p>
                  </div>
                  <button 
                    onClick={() => navigate('/formularios/builder')}
                    className="btn btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl shadow-lg shadow-blue-500/20 px-6 py-3.5 flex items-center justify-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 text-xs font-black uppercase tracking-wider"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Crear Desde Cero</span>
                  </button>
                </div>

                {/* Templates Section */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" /> <span>Plantillas predeterminadas para inicio rápido</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Satisfaccion */}
                    <div 
                      className="group relative rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.06] hover:border-emerald-500/30 transition-all duration-300 cursor-pointer p-6 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-emerald-500/5 hover:-translate-y-1"
                      onClick={() => navigate('/formularios/builder', { state: { template: 'satisfaccion' } })}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-300" />
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                          <Smile className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2">
                          Satisfacción
                        </h4>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium leading-relaxed">
                          Encuesta rápida para evaluar la satisfacción de un servicio o experiencia.
                        </p>
                      </div>
                      <div className="mt-6 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Usar plantilla</span> <Plus className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Evaluacion de Evento */}
                    <div 
                      className="group relative rounded-3xl border border-blue-500/10 bg-blue-500/[0.02] hover:bg-blue-500/[0.06] hover:border-blue-500/30 transition-all duration-300 cursor-pointer p-6 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-blue-500/5 hover:-translate-y-1"
                      onClick={() => navigate('/formularios/builder', { state: { template: 'evaluacion' } })}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all duration-300" />
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                          <ClipboardCheck className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2">
                          Evaluación de Evento
                        </h4>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium leading-relaxed">
                          Recopila feedback estructurado y opiniones directas de tus asistentes.
                        </p>
                      </div>
                      <div className="mt-6 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Usar plantilla</span> <Plus className="w-3 h-3" />
                      </div>
                    </div>

                    {/* Registro */}
                    <div 
                      className="group relative rounded-3xl border border-orange-500/10 bg-orange-500/[0.02] hover:bg-orange-500/[0.06] hover:border-orange-500/30 transition-all duration-300 cursor-pointer p-6 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-orange-500/5 hover:-translate-y-1"
                      onClick={() => navigate('/formularios/builder', { state: { template: 'registro' } })}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-all duration-300" />
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
                          <UserPlus className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-2">
                          Registro
                        </h4>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium leading-relaxed">
                          Formulario para capturar inscripciones, datos clave y datos personales.
                        </p>
                      </div>
                      <div className="mt-6 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span>Usar plantilla</span> <Plus className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Existing Forms Section */}
                <div className="mt-2 border-t border-neutral-100 dark:border-white/5 pt-8">
                  {loadingInternalForms ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-neutral-400">
                      <div className="w-8 h-8 rounded-full border-4 border-t-blue-500 border-neutral-200 dark:border-neutral-800 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Cargando formularios...</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {internalForms.map((f) => (
                        <div 
                          key={f.id} 
                          className="group relative bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-white/5 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 flex flex-col justify-between"
                          style={{ minHeight: '220px' }}
                        >
                          <div>
                            {/* Card Header: Title & Status */}
                            <div className="flex justify-between items-start gap-4 mb-3">
                              <h4 
                                className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white truncate flex-1" 
                                title={f.titulo}
                              >
                                {f.titulo}
                              </h4>
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                                f.estado === 'publicado' 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              }`}>
                                {f.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                              </span>
                            </div>
                            
                            {/* Description */}
                            <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium line-clamp-2 mb-4 leading-relaxed h-8">
                              {f.descripcion || 'Sin descripción o instrucciones adicionales.'}
                            </p>

                            {/* Info Row: Questions / Responses / Date */}
                            <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider mb-6">
                              <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/40 px-2 py-1 rounded-lg">
                                <Layers className="w-3.5 h-3.5 text-neutral-300" />
                                <span>{`${f.preguntas_count ?? 0} ${f.preguntas_count === 1 ? 'Pregunta' : 'Preguntas'}`}</span>
                              </span>
                              
                              <span className="flex items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/40 px-2 py-1 rounded-lg">
                                <MessageSquare className="w-3.5 h-3.5 text-neutral-300" />
                                <span>{`${f.respuestas_count ?? 0} ${f.respuestas_count === 1 ? 'Respuesta' : 'Respuestas'}`}</span>
                              </span>
                              
                              <span className="flex items-center gap-1.5 px-1 py-1">
                                <Calendar className="w-3.5 h-3.5 text-neutral-300" />
                                <span>{new Date(f.created_at).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="flex items-center justify-between border-t border-neutral-100 dark:border-white/5 pt-4 mt-auto">
                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300 group-hover:text-blue-500/70 transition-colors">
                              Formulario Interno
                            </span>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => navigate(`/formularios/builder/${f.id}`)}
                                className="p-2.5 bg-neutral-50 hover:bg-blue-500/10 text-neutral-500 hover:text-blue-600 dark:bg-neutral-800/40 dark:hover:bg-blue-500/20 dark:text-neutral-400 dark:hover:text-blue-400 rounded-xl transition-all active:scale-90"
                                title="Configurar y Editar Preguntas"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => window.open(`/formulario-publico/${f.id}`, '_blank')}
                                className="p-2.5 bg-neutral-50 hover:bg-emerald-500/10 text-neutral-500 hover:text-emerald-600 dark:bg-neutral-800/40 dark:hover:bg-emerald-500/20 dark:text-neutral-400 dark:hover:text-emerald-400 rounded-xl transition-all active:scale-90"
                                title="Ver Vista Pública"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {internalForms.length === 0 && (
                        <div className="col-span-full text-center py-20 border border-dashed border-neutral-200 dark:border-white/10 rounded-[2rem] bg-neutral-50/50 dark:bg-neutral-800/5 flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800/40 rounded-2xl flex items-center justify-center mb-4 text-neutral-300">
                            <FileText className="w-8 h-8" />
                          </div>
                          <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white mb-1">
                            No tienes formularios creados
                          </h3>
                          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed font-semibold mb-6">
                            Comienza diseñando un formulario interactivo desde cero o utilizando una de nuestras plantillas.
                          </p>
                          <button
                            onClick={() => navigate('/formularios/builder')}
                            className="btn btn-primary bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg px-5 py-3 text-xs font-black uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
                          >
                            <span>Crear Primer Formulario</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        )}
      </Container>

      {/* External Form Integration Wizard Modal */}
      <FormIntegrationWizard 
        open={wizardOpen} 
        onClose={() => setWizardOpen(false)} 
        onSave={() => {
          setWizardOpen(false);
          setReloadSignal((prev) => !prev);
          showToast('Formulario integrado con éxito', 'success');
        }}
      />
    </Fragment>
  );
};

export default FormulariosPage;
