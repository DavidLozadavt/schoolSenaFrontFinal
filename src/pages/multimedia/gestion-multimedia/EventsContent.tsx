import React, { useEffect, useMemo, useState } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, ExternalLink, Trash2, Edit3, Image as ImageIcon } from 'lucide-react';

interface Evento {
  idEvento: number;
  nombre: string;
  descripcion?: string;
  fechaInicial: string;
  fechaFinal?: string;
  hora: string;
  url?: string;
  linkRegistro?: string;
  tipoEvento: string;
  estado: string;
  esPublico: boolean;
  idArea?: number;
  area?: {
    id: number;
    nombre: string;
  };
}

interface EventsContentProps {
  reload: boolean;
}

const EventsContent = ({ reload }: EventsContentProps) => {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { confirmAction } = useConfirm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('eventos-multimedia');
      setEventos(response.data);
    } catch (err) {
      console.error('Error al obtener eventos:', err);
      setError('Error al cargar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [reload]);

  const deleteEvento = async (id: number) => {
    confirmAction('¿Eliminar este evento permanentemente?', async () => {
      try {
        await axios.delete(`eventos-multimedia/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
        setError('Error al eliminar');
      }
    });
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return eventos;
    const q = searchTerm.toLowerCase();
    return eventos.filter((e) => 
      e.nombre.toLowerCase().includes(q) || 
      e.descripcion?.toLowerCase().includes(q)
    );
  }, [searchTerm, eventos]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mr-3" />
        <span className="text-neutral-500 font-medium">Cargando eventos...</span>
      </div>
    );
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h2 className="text-3xl font-extrabold flex items-center gap-2 text-neutral-900 dark:text-slate-50">
          <Calendar className="w-7 h-7 text-orange-500" />
          Eventos Próximos
          <span className="ml-2 text-sm font-normal text-gray-400 dark:text-gray-500">
            ({filteredData.length} eventos)
          </span>
        </h2>

        <div className="relative flex gap-4 items-center w-full sm:w-auto">
          <KeenIcon
            icon="magnifier"
            className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
          />
          <input
            type="text"
            placeholder="Buscar eventos..."
            className="pl-8 input input-sm w-full sm:w-auto focus:ring-orange-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map((evento) => (
            <div
              key={evento.idEvento}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              {/* Media Preview */}
              <div className="h-48 bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                {evento.url ? (
                  <img
                    src={evento.url}
                    alt={evento.nombre}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-lg">
                    {evento.tipoEvento}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-3 truncate group-hover:text-orange-500 transition-colors">
                  {evento.nombre}
                </h3>
                
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    {evento.fechaInicial} - {evento.hora}
                  </div>
                  {evento.area && (
                    <div className="flex items-center gap-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      <MapPin className="w-4 h-4 text-orange-500" />
                      {evento.area.nombre}
                    </div>
                  )}
                </div>

                <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 mb-6 min-h-[40px] leading-relaxed">
                  {evento.descripcion || 'Sin descripción disponible para este evento institucional.'}
                </p>

                <div className="flex gap-3 pt-5 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => navigate(`/multimedia/eventos/editar/${evento.idEvento}`)}
                    className="btn btn-sm btn-light flex-1 flex justify-center items-center gap-2 rounded-xl hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10 dark:hover:text-orange-400 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => deleteEvento(evento.idEvento)}
                    className="btn btn-sm bg-red-50 hover:bg-red-100 text-red-600 border-none flex-1 flex justify-center items-center gap-2 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                    Borrar
                  </button>
                  {evento.linkRegistro && (
                    <a
                      href={evento.linkRegistro}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-primary flex items-center justify-center w-10 h-10 p-0 rounded-xl shadow-lg shadow-blue-500/20"
                      title="Link de Registro"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 bg-neutral-50 dark:bg-neutral-800/50 rounded-[40px] border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-3xl shadow-sm mb-6">
            <Calendar className="w-12 h-12 text-orange-500 opacity-40" />
          </div>
          <h3 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">No hay eventos registrados</h3>
          <p className="text-neutral-500 dark:text-neutral-400 max-w-sm">
            Comienza publicando un nuevo evento institucional para mantener a la comunidad informada.
          </p>
          <button 
            onClick={() => navigate('/multimedia/eventos/nuevo')}
            className="btn btn-primary mt-8 rounded-2xl px-8"
          >
            Crear Primer Evento
          </button>
        </div>
      )}
    </div>
  );
};

export default EventsContent;
