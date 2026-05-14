import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
  Image as ImageIcon
} from 'lucide-react';

export const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);
  const [areas, setAreas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicial: '',
    fechaFinal: '',
    hora: '',
    linkRegistro: '',
    tipoEvento: 'PRESENCIAL',
    idArea: '',
    crearHistoria: true 
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
          linkRegistro: evento.linkRegistro || '',
          tipoEvento: evento.tipoEvento || 'GENERAL',
          idArea: evento.idArea || '',
          crearHistoria: false 
        });
        setPreview(evento.url || null);
      } catch (err) {
        console.error('Error al cargar evento:', err);
        enqueueSnackbar('No se pudo cargar el evento', { variant: 'error' });
        navigate('/multimedia/eventos');
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
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'idArea' && value === '') {
        // No añadir o añadir null
      } else {
        data.append(key, value.toString());
      }
    });
    
    if (archivo) {
      data.append('archivo', archivo);
    }

    try {
      if (id) {
        await axios.post(`eventos-multimedia/${id}`, data);
        enqueueSnackbar('Evento actualizado correctamente', { variant: 'success' });
      } else {
        await axios.post('eventos-multimedia', data);
        enqueueSnackbar('Evento creado correctamente', { variant: 'success' });
      }
      navigate('/multimedia/eventos');
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
          to="/multimedia/eventos" 
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-orange-500 transition-colors mb-6 group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Eventos
        </Link>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          <div className="p-8 border-b border-neutral-100 dark:border-neutral-800">
            <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-500/10 rounded-xl">
                <Calendar className="w-8 h-8 text-orange-500" />
              </div>
              {id ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h1>
            <p className="text-neutral-500 mt-2">
              Completa la información para {id ? 'actualizar el' : 'publicar un nuevo'} evento institucional.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Type className="w-4 h-4 text-orange-500" /> Nombre del Evento
                </label>
                <input
                  type="text"
                  required
                  className="input focus:ring-orange-500/20"
                  placeholder="Ej: Taller de Robótica"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                />
              </div>

              {/* Tipo */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <KeenIcon icon="category" className="text-orange-500" /> Categoría
                </label>
                <select
                  className="select"
                  value={formData.tipoEvento}
                  onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="VIRTUAL">Virtual</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>

              {/* Fecha */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> Fecha del Evento
                </label>
                <input
                  type="date"
                  required
                  className="input"
                  value={formData.fechaInicial}
                  onChange={(e) => setFormData({ ...formData, fechaInicial: e.target.value })}
                />
              </div>

              {/* Hora */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Hora de Inicio
                </label>
                <input
                  type="time"
                  required
                  className="input"
                  value={formData.hora}
                  onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                />
              </div>

              {/* Área */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-orange-500" /> Lugar / Área Responsable
                </label>
                <select
                  className="select"
                  value={formData.idArea}
                  onChange={(e) => setFormData({ ...formData, idArea: e.target.value })}
                >
                  <option value="">Selecciona un área</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Link de Registro */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-orange-500" /> Link de Inscripción (Opcional)
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={formData.linkRegistro}
                  style={{ textTransform: 'none' }}
                  onChange={(e) => setFormData({ ...formData, linkRegistro: e.target.value })}
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" /> Descripción y Detalles
              </label>
              <textarea
                className="textarea h-32"
                placeholder="Describe los objetivos y actividades del evento..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Imagen / Póster Promocional</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl cursor-pointer hover:bg-orange-50/50 dark:hover:bg-neutral-800 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-2xl mb-3 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20 transition-colors">
                        <KeenIcon icon="file-up" className="text-2xl text-neutral-500 group-hover:text-orange-500" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Haz clic para subir imagen</p>
                      <p className="text-xs text-neutral-500 mt-1">PNG, JPG o WEBP (Recomendado 1200x800)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
                {preview && (
                  <div className="relative group rounded-3xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm h-48">
                    <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ImageIcon className="text-white w-8 h-8" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Automation toggle */}
            {!id && (
              <div className="flex items-center gap-4 p-6 bg-orange-50 dark:bg-orange-950/20 rounded-3xl border border-orange-100 dark:border-orange-900/30">
                <div className="flex-1">
                  <h4 className="text-base font-bold text-orange-800 dark:text-orange-400">Publicar como Historia automáticamente</h4>
                  <p className="text-sm text-orange-600 dark:text-orange-400/60">Al guardar el evento, se generará una entrada en la sección de Historias Multimedia usando este póster.</p>
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
            )}

            {/* Footer actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <button 
                type="button" 
                onClick={() => navigate('/multimedia/eventos')} 
                className="btn btn-light rounded-xl px-6"
              >
                Descartar
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="btn btn-primary rounded-xl px-8 min-w-[160px] flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {id ? 'Actualizar Evento' : 'Publicar Evento'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Container>
  );
};
