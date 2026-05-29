import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Type, 
  FileText, 
  Link as LinkIcon, 
  Send, 
  ArrowLeft,
  Image as ImageIcon,
  Sparkles,
  Music,
  Search,
  Trash2
} from 'lucide-react';
import { ModalForm } from '../actividades/ModalForm';

export const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [areas, setAreas] = useState<any[]>([]);
  const [formulariosInternos, setFormulariosInternos] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicial: '',
    fechaFinal: '',
    hora: '',
    hora_final: '',
    linkRegistro: '',
    tipoEvento: 'PRESENCIAL',
    idArea: '',
    crearHistoria: true,
    idGrupoMultimedia: null as number | null,
    formUrl: '',
    formProvider: 'interno',
    idFormularioInterno: '' as string | number
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');

  // States for Music Selection
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [songsList, setSongsList] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMusicSearch, setShowMusicSearch] = useState(false);

  const handleMusicSearch = async (term: string) => {
    setSearchQuery(term);
    if (!term.trim()) {
      setSongsList([]);
      return;
    }
    setSearchLoading(true);
    try {
      const resp = await axios.get(`/deezer/search?q=${encodeURIComponent(term)}`);
      setSongsList(resp.data?.data ?? resp.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  const combineDateAndTime = (date?: string, time?: string) => {
    if (!date) return '';
    const datePart = date.split(' ')[0].split('T')[0];
    if (!time) return `${datePart}T00:00`;
    const timePart = time.slice(0, 5);
    return `${datePart}T${timePart}`;
  };

  const handleStartDatetimeChange = (value: string) => {
    setStartDatetime(value);
    const [d, t] = value.split('T');
    setFormData(prev => ({
      ...prev,
      fechaInicial: d || '',
      hora: t || '00:00'
    }));
  };

  const handleEndDatetimeChange = (value: string) => {
    setEndDatetime(value);
    if (value) {
      const [d, t] = value.split('T');
      setFormData(prev => ({
        ...prev,
        fechaFinal: d || '',
        hora_final: t || ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        fechaFinal: '',
        hora_final: ''
      }));
    }
  };

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get('all_areas');
        setAreas(response.data);
      } catch (err) {
        console.error('Error al cargar áreas:', err);
      }
    };
    fetchAreas();
  }, []);

  useEffect(() => {
    const fetchFormularios = async () => {
      try {
        const response = await axios.get('/formularios');
        setFormulariosInternos(response.data);
      } catch (err) {
        console.error('Error al cargar formularios:', err);
      }
    };
    fetchFormularios();
  }, []);

  useEffect(() => {
    // Check for prefilled data from FormIntegrationWizard
    if (location.state?.prefilledForm && !id) {
      setFormData(prev => {
        const next = {
          ...prev,
          ...location.state.prefilledForm
        };
        setStartDatetime(combineDateAndTime(next.fechaInicial, next.hora));
        setEndDatetime(combineDateAndTime(next.fechaFinal, next.hora_final));
        return next;
      });
      enqueueSnackbar('Formulario integrado correctamente. Completa los detalles del evento.', { variant: 'info' });
    }
  }, [location.state, id]);

  const fetchActividades = async () => {
    if (!id) return;
    try {
      const response = await axios.get('/items', { params: { idEvento: id } });
      setActividades(response.data || []);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      try {
        await axios.delete(`/items/${activityId}`);
        enqueueSnackbar('Actividad eliminada correctamente', { variant: 'success' });
        fetchActividades();
      } catch (err) {
        console.error(err);
        enqueueSnackbar('Error al eliminar la actividad', { variant: 'error' });
      }
    }
  };

  useEffect(() => {
    const fetchEvento = async () => {
      if (!id) return;
      try {
        const response = await axios.get(`eventos-multimedia/${id}`);
        const evento = response.data;
        setFormData({
          nombre: evento.nombre || '',
          descripcion: evento.descripcion || '',
          fechaInicial: evento.fechaInicial || '',
          fechaFinal: evento.fechaFinal || '',
          hora: evento.hora || '',
          hora_final: evento.hora_final || '',
          linkRegistro: evento.linkRegistro || '',
          tipoEvento: evento.tipoEvento || 'GENERAL',
          idArea: evento.idArea || '',
          crearHistoria: false,
          idGrupoMultimedia: evento.grupo_multimedia ? (evento.idGrupoMultimedia || true) : null,
          formUrl: evento.formUrl || '',
          formProvider: evento.formProvider || 'interno',
          idFormularioInterno: evento.idFormularioInterno || ''
        });
        const getImageUrl = (url?: string) => {
          if (!url) return null;
          if (url.startsWith('http')) return url;
          const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
          const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
          return `${backendUrl}${normalizedUrl}`;
        };
        setPreview(getImageUrl(evento.url));
        setStartDatetime(combineDateAndTime(evento.fechaInicial, evento.hora));
        setEndDatetime(combineDateAndTime(evento.fechaFinal, evento.hora_final));
        
        await fetchActividades();
      } catch (err) {
        console.error('Error al cargar evento:', err);
        enqueueSnackbar('No se pudo cargar el evento', { variant: 'error' });
        navigate('/gestion-eventos');
      } finally {
        setFetching(false);
      }
    };
    fetchEvento();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    
    // Construct dynamic formUrl and linkRegistro for internal forms if applicable
    let finalFormUrl = formData.formUrl;
    let finalLinkRegistro = formData.linkRegistro;
    
    if (formData.formProvider === 'interno' && formData.idFormularioInterno) {
      finalFormUrl = `/formulario-publico/${formData.idFormularioInterno}`;
      finalLinkRegistro = `/formulario-publico/${formData.idFormularioInterno}`;
    } else if (formData.formProvider !== 'interno') {
      // Clear idFormularioInterno if another provider is chosen
      formData.idFormularioInterno = '';
    }

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'idArea' && value === '') {
        // No añadir o añadir null
      } else if (key === 'formUrl') {
        data.append(key, finalFormUrl);
      } else if (key === 'linkRegistro') {
        data.append(key, finalLinkRegistro);
      } else if (key === 'idFormularioInterno') {
        if (formData.formProvider === 'interno' && value) {
          data.append(key, value.toString());
        } else {
          data.append(key, '');
        }
      } else if (value !== null && value !== undefined) {
        data.append(key, value.toString());
      }
    });
    
    if (archivo) {
      data.append('archivo', archivo);
    }

    if (formData.crearHistoria && selectedSong) {
      data.append('cancion', JSON.stringify(selectedSong));
    }

    try {
      if (id) {
        await axios.post(`eventos-multimedia/${id}`, data);
        enqueueSnackbar('Evento actualizado correctamente', { variant: 'success' });
      } else {
        await axios.post('eventos-multimedia', data);
        enqueueSnackbar('Evento creado correctamente', { variant: 'success' });
      }
      navigate('/gestion-eventos');
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Error al procesar el evento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mr-3" />
        <span className="text-neutral-500 font-medium">Cargando datos del evento...</span>
      </div>
    );
  }

  return (
    <Container>
      <div className="max-w-4xl mx-auto py-8">
        {/* Breadcrumb / Back button */}
        <Link 
          to="/gestion-eventos" 
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-orange-500 transition-colors mb-6 group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Eventos
        </Link>

        <div className="relative overflow-hidden bg-white dark:bg-neutral-900 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-neutral-100 dark:border-white/5">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
          
          <div className="p-10 md:p-12 border-b border-neutral-50 dark:border-white/5 relative z-10">
            <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter italic flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 rotate-3 group-hover:rotate-0 transition-transform">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              {id ? 'Editar Evento' : 'Crear Evento'}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-lg font-medium max-w-2xl">
              Configura los detalles de tu evento institucional con herramientas premium de gestión y visibilidad.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 md:p-12 space-y-12 relative z-10">
            {/* General Info Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Nombre */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                  <Type className="w-3 h-3 text-orange-500" /> Nombre del Evento
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-neutral-50 dark:bg-white/5 border border-transparent focus:border-orange-500/30 focus:bg-white dark:focus:bg-black rounded-2xl h-16 px-6 text-lg font-bold text-neutral-800 dark:text-white transition-all outline-none"
                  placeholder="Ej: Taller de Robótica"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                  <KeenIcon icon="category" className="text-orange-500 text-xs" /> Categoría
                </label>
                <select
                  className="w-full bg-neutral-50 dark:bg-white/5 border border-transparent focus:border-orange-500/30 focus:bg-white dark:focus:bg-black rounded-2xl h-16 px-6 text-lg font-bold text-neutral-800 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                  value={formData.tipoEvento}
                  onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>
              
              {/* Área */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] ml-4 flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-orange-500" /> Área Responsable
                </label>
                <select
                  className="w-full bg-neutral-50 dark:bg-white/5 border border-transparent focus:border-orange-500/30 focus:bg-white dark:focus:bg-black rounded-2xl h-16 px-6 text-lg font-bold text-neutral-800 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                  value={formData.idArea}
                  onChange={(e) => setFormData({ ...formData, idArea: e.target.value })}
                >
                  <option value="">Selecciona un área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scheduling Section */}
            <div className="p-8 rounded-[2.5rem] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-neutral-800 dark:text-white italic">Programación del Evento</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Define cuándo sucederá la magia</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inicio del Evento */}
                <div className="space-y-4">
                  <div className="p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 shadow-xl group relative">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 block ml-4 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" /> Inicio del Evento (Fecha y Hora)
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-6 text-orange-500 z-10">
                        <Clock className="w-6 h-6" />
                      </div>
                      <input
                        type="datetime-local"
                        required
                        className="w-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-neutral-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 rounded-3xl h-20 pl-14 pr-2 text-sm md:text-base font-bold text-neutral-800 dark:text-white transition-all duration-300 outline-none hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                        style={{ colorScheme: 'light dark' }}
                        value={startDatetime}
                        onChange={(e) => handleStartDatetimeChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Finalización del Evento */}
                <div className="space-y-4">
                  <div className="p-8 rounded-[2.5rem] bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 shadow-xl group relative">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-3 block ml-4 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 group-focus-within:text-orange-500" /> Finalización (Opcional - Fecha y Hora)
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-6 text-neutral-400 group-focus-within:text-orange-500 z-10 transition-colors">
                        <Clock className="w-6 h-6" />
                      </div>
                      <input
                        type="datetime-local"
                        className="w-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-neutral-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 rounded-3xl h-20 pl-14 pr-2 text-sm md:text-base font-bold text-neutral-800 dark:text-white transition-all duration-300 outline-none hover:shadow-xl hover:-translate-y-0.5 cursor-pointer"
                        style={{ colorScheme: 'light dark' }}
                        value={endDatetime}
                        onChange={(e) => handleEndDatetimeChange(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-center gap-3 py-3 px-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                 <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                 <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Fecha y hora integradas en un solo selector</span>
              </div>
            </div>


            {/* Registration & Integration Section */}
            <div className="p-8 rounded-[2.5rem] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tighter text-neutral-800 dark:text-white italic">Inscripción e Integración</h3>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Configura cómo se inscribirán los usuarios</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proveedor */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                    <KeenIcon icon="setting-2" className="text-orange-500 text-xs" /> Plataforma de Formulario
                  </label>
                  <select
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-orange-500/30 rounded-2xl h-12 px-4 font-semibold text-sm text-neutral-800 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                    value={formData.formProvider}
                    onChange={(e) => setFormData({ ...formData, formProvider: e.target.value })}
                  >
                    <option value="interno">Formulario Interno (VirtualT)</option>
                    <option value="other">Otro / Enlace Externo</option>
                    <option value="google">Google Forms</option>
                    <option value="microsoft">Microsoft Forms</option>
                    <option value="typeform">Typeform</option>
                    <option value="tally">Tally</option>
                    <option value="jotform">Jotform</option>
                  </select>
                </div>

                {/* Conditional Form Selection / Link Directo */}
                {formData.formProvider === 'interno' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-3 h-3 text-orange-500" /> Formulario Interno a Vincular
                    </label>
                    <select
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-orange-500/30 rounded-2xl h-12 px-4 font-semibold text-sm text-neutral-800 dark:text-white transition-all outline-none appearance-none cursor-pointer"
                      value={formData.idFormularioInterno}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setFormData({ 
                          ...formData, 
                          idFormularioInterno: selectedId,
                          formUrl: selectedId ? `/formulario-publico/${selectedId}` : '',
                          linkRegistro: selectedId ? `/formulario-publico/${selectedId}` : ''
                        });
                      }}
                    >
                      <option value="">Selecciona un formulario interno</option>
                      {formulariosInternos.map((form) => (
                        <option key={form.id} value={form.id}>
                          {form.titulo} ({form.preguntas_count || 0} preg. - {form.estado})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                      <LinkIcon className="w-3 h-3" /> Enlace Externo (Opcional)
                    </label>
                    <input
                      type="url"
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-orange-500/30 rounded-2xl h-12 px-4 font-semibold text-sm text-neutral-800 dark:text-white transition-all outline-none"
                      placeholder="https://pagina-externa.com"
                      value={formData.linkRegistro}
                      style={{ textTransform: 'none' }}
                      onChange={(e) => setFormData({ ...formData, linkRegistro: e.target.value })}
                    />
                  </div>
                )}

                {/* Conditional Preview / Custom Integration Box */}
                {formData.formProvider === 'interno' ? (
                  <div className="md:col-span-2 p-6 rounded-3xl bg-orange-500/5 dark:bg-orange-500/10 border-2 border-orange-500/20 shadow-lg shadow-orange-500/5 space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <FileText className="w-20 h-20 text-orange-500 -rotate-12" />
                    </div>
                    
                    <label className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-pulse" /> Integración Inteligente de Formulario
                    </label>
                    <p className="text-sm font-bold text-neutral-800 dark:text-white">
                      ¡Excelente elección! Los usuarios se inscribirán directamente dentro de la plataforma.
                    </p>
                    <div className="flex items-start gap-3 mt-2">
                      <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                         <KeenIcon icon="information-2" className="text-[10px] text-orange-500" />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                        Esta integración habilitará la <strong>inscripción automática e instantánea</strong>. Cuando los usuarios completen este formulario interno, su asistencia al evento quedará confirmada de inmediato en su perfil.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-neutral-900 border-2 border-orange-500/20 shadow-lg shadow-orange-500/5 space-y-3 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                       <LinkIcon className="w-20 h-20 text-orange-500 -rotate-12" />
                    </div>
                    
                    <label className="text-xs font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 animate-pulse" /> URL del Formulario Integrado
                    </label>
                    <input
                      type="url"
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 focus:border-orange-500/30 rounded-2xl h-14 px-4 font-medium text-sm text-neutral-800 dark:text-white transition-all outline-none"
                      placeholder="Pega aquí el enlace de compartir (ej. Google Forms)"
                      value={formData.formUrl}
                      style={{ textTransform: 'none' }}
                      onChange={(e) => setFormData({ ...formData, formUrl: e.target.value })}
                    />
                    <div className="flex items-start gap-3 mt-2">
                      <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center shrink-0 mt-0.5">
                         <KeenIcon icon="information-2" className="text-[10px] text-orange-500" />
                      </div>
                      <p className="text-[10px] text-neutral-400 font-medium leading-relaxed">
                        RECOMENDADO: Usa esta option para que el formulario se abra **dentro del modal** del evento. Mejora la conversión y mantiene a los usuarios en tu plataforma.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content & Description Section */}
            <div className="p-10 rounded-[2.5rem] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10">
               {/* Description */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tighter text-neutral-800 dark:text-white italic">Descripción</h3>
                    </div>
                  </div>
                  <textarea
                    className="w-full bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-white/5 rounded-3xl p-6 h-[260px] text-neutral-700 dark:text-neutral-300 font-medium text-lg focus:ring-4 focus:ring-orange-500/5 transition-all outline-none resize-none shadow-sm"
                    placeholder="Describe los objetivos y actividades del evento..."
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
               </div>

               {/* Image Upload */}
               <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tighter text-neutral-800 dark:text-white italic">Imagen Promocional</h3>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col items-center justify-center w-full h-[260px] border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-[2rem] cursor-pointer hover:bg-white dark:hover:bg-neutral-800 transition-all group relative overflow-hidden bg-white/50 dark:bg-transparent">
                      {preview ? (
                         <>
                           <img src={preview} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white backdrop-blur-sm">
                              <KeenIcon icon="file-up" className="text-4xl mb-2 translate-y-4 group-hover:translate-y-0 transition-transform" />
                              <span className="font-bold uppercase tracking-widest text-xs">Cambiar Imagen</span>
                           </div>
                         </>
                      ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20">
                            <KeenIcon icon="file-up" className="text-4xl text-neutral-400 group-hover:text-orange-500" />
                          </div>
                          <p className="text-sm font-black text-neutral-700 dark:text-neutral-300 uppercase tracking-widest">Sube un póster</p>
                          <p className="text-[10px] text-neutral-500 mt-2 font-bold opacity-60">PNG, JPG O WEBP • RECOMENDADO 1200x800</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
               </div>
            </div>

            {/* Automation toggle */}
            {!formData.idGrupoMultimedia && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-6 bg-orange-50 dark:bg-orange-950/20 rounded-3xl border border-orange-100 dark:border-orange-900/30">
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-orange-800 dark:text-orange-400">
                      {id ? 'Generar Historia Multimedia ahora' : 'Publicar como Historia automáticamente'}
                    </h4>
                    <p className="text-sm text-orange-600 dark:text-orange-400/60">
                      {id ? 'Crea una entrada en Historias usando el póster actual de este evento.' : 'Al guardar el evento, se generará una entrada en la sección de Historias Multimedia usando este póster.'}
                    </p>
                  </div>
                  <div className="form-switch">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-orange"
                      checked={formData.crearHistoria}
                      onChange={(e) => setFormData({ ...formData, crearHistoria: e.target.checked })}
                    />
                  </div>
                </div>

                {formData.crearHistoria && (
                  <div className="p-6 bg-neutral-50 dark:bg-neutral-900/40 rounded-3xl border border-neutral-200 dark:border-neutral-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Music className="w-5 h-5 text-orange-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Música de fondo para la historia</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMusicSearch(!showMusicSearch)}
                        className="px-4 py-2 bg-white dark:bg-neutral-800 hover:bg-neutral-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-500 shadow-sm border border-neutral-200 dark:border-white/5 transition-colors"
                      >
                        {selectedSong ? 'Cambiar' : 'Añadir música'}
                      </button>
                    </div>

                    {selectedSong && !showMusicSearch && (
                      <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-white/5 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <img src={selectedSong.image} className="w-12 h-12 rounded-xl object-cover shadow-md" alt="" />
                          <div className="min-w-0">
                            <p className="text-sm font-black text-neutral-800 dark:text-white truncate uppercase tracking-tight">{selectedSong.title}</p>
                            <p className="text-xs text-neutral-400 font-bold italic truncate">{selectedSong.artist}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedSong(null)}
                          className="p-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-400 hover:text-red-600 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {showMusicSearch && (
                      <div className="space-y-4 pt-2">
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
                            <Search className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            placeholder="Buscar artista o canción en Deezer..."
                            value={searchQuery}
                            onChange={(e) => handleMusicSearch(e.target.value)}
                            className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-2xl h-12 pl-12 pr-4 font-semibold text-sm text-neutral-800 dark:text-white transition-all outline-none"
                          />
                        </div>

                        {searchLoading && (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent" />
                          </div>
                        )}

                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                          {songsList.map((song) => (
                            <div
                              key={song.id}
                              className="flex items-center gap-4 p-3 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-2xl cursor-pointer transition-all border border-transparent"
                              onClick={() => {
                                setSelectedSong(song);
                                setShowMusicSearch(false);
                                setSongsList([]);
                                setSearchQuery(song.title);
                              }}
                            >
                              <img src={song.image} className="w-10 h-10 rounded-lg object-cover shadow-sm" alt="" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-neutral-800 dark:text-white truncate uppercase tracking-tight">{song.title}</p>
                                <p className="text-[11px] text-neutral-400 font-bold italic truncate">{song.artist}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actividades del Evento - Premium UI */}
            {id ? (
              <div className="p-8 rounded-[2.5rem] bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tighter text-neutral-800 dark:text-white italic">Cronograma de Actividades</h3>
                      <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Gestiona las actividades asociadas a este evento</p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setActivityToEdit(null);
                      setActivityModalOpen(true);
                    }}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    + Agregar Actividad
                  </button>
                </div>

                {actividades.length === 0 ? (
                  <div className="py-8 text-center bg-white dark:bg-neutral-900 rounded-[2rem] border border-dashed border-neutral-200 dark:border-neutral-800">
                    <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Sin actividades registradas</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Añade actividades para que los usuarios vean el cronograma del evento.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {actividades.map((act, index) => {
                      const dur = act.hora_inicio && act.hora_fin
                        ? Math.max(0, Math.round((new Date(act.hora_fin).getTime() - new Date(act.hora_inicio).getTime()) / 60000))
                        : 0;
                      return (
                        <div key={act.id} className="p-5 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:shadow-lg transition-all duration-350">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="px-2 py-0.5 rounded-lg bg-orange-500/10 text-orange-600 text-[8px] font-black uppercase tracking-wider">
                                Actividad #{index + 1}
                              </span>
                              {act.hora_inicio && (
                                <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                                  {new Date(act.hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                  {act.hora_fin && ` - ${new Date(act.hora_fin).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`}
                                  {dur > 0 && ` (${dur} min)`}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-black text-neutral-800 dark:text-white uppercase tracking-tight truncate">
                              {act.nombreItem}
                            </h4>
                            {act.descripcion && (
                              <p className="text-xs text-neutral-400 mt-1 italic line-clamp-2 leading-relaxed">
                                {act.descripcion}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setActivityToEdit(act);
                                setActivityModalOpen(true);
                              }}
                              className="w-10 h-10 bg-neutral-100 dark:bg-neutral-850 hover:bg-orange-500 hover:text-white text-neutral-500 rounded-xl flex items-center justify-center transition-all shadow-sm"
                              title="Editar actividad"
                            >
                              <KeenIcon icon="pencil" className="text-base" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(act.id)}
                              className="w-10 h-10 bg-rose-55 dark:bg-rose-950/20 hover:bg-rose-500 hover:text-white text-rose-500 rounded-xl flex items-center justify-center transition-all shadow-sm"
                              title="Eliminar actividad"
                            >
                              <KeenIcon icon="trash" className="text-base" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 rounded-[2.5rem] bg-orange-500/5 border border-orange-500/10 flex items-center gap-4">
                <Sparkles className="w-8 h-8 text-orange-500 shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-sm font-black uppercase text-orange-700 dark:text-orange-400 tracking-wider">Cronograma del Evento</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    Una vez creado el evento, podrás añadir, editar y eliminar actividades detalladas en esta misma sección para estructurar su cronograma.
                  </p>
                </div>
              </div>
            )}

            {/* Modal Formulario Actividad */}
            <ModalForm
              open={activityModalOpen}
              onClose={() => setActivityModalOpen(false)}
              onSuccess={fetchActividades}
              itemEditar={activityToEdit}
              defaultIdEvento={id ? Number(id) : null}
            />

            {/* Footer actions */}
            <div className="flex items-center justify-between pt-10 border-t border-neutral-50 dark:border-white/5">
              <button 
                type="button" 
                onClick={() => navigate('/gestion-eventos')} 
                className="px-8 py-4 rounded-2xl text-neutral-500 font-bold hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors uppercase text-xs tracking-widest"
              >
                Cancelar y Salir
              </button>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="group relative px-10 py-5 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm overflow-hidden shadow-2xl hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>{id ? 'Guardar Cambios' : 'Publicar Ahora'}</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
};

export default EventForm;
