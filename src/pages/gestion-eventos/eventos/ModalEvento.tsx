import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { Calendar, Clock, MapPin, Type, FileText, Link, Send, Music, Search, Trash2, Sparkles } from 'lucide-react';
import { ModalForm } from '../actividades/ModalForm';

interface ModalEventoProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  evento?: any;
}

export const ModalEvento = ({ open, onClose, onSave, evento }: ModalEventoProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);
  const [availableActividades, setAvailableActividades] = useState<any[]>([]);
  const [selectedActividadesIds, setSelectedActividadesIds] = useState<number[]>([]);
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fechaInicial: '',
    fechaFinal: '',
    hora: '',
    linkRegistro: '',
    tipoEvento: 'GENERAL',
    idArea: '',
    crearHistoria: true,
    idGrupoMultimedia: null as number | null
  });
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [songsList, setSongsList] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showMusicSearch, setShowMusicSearch] = useState(false);

  const handleMusicSearch = async (term: string) => {
    setSearchQuery(term);
    if (!term.trim()) { setSongsList([]); return; }
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

  const fetchActividades = async (eventoId?: number) => {
    try {
      if (eventoId) {
        const [resCon, resSin] = await Promise.all([
          axios.get('/items', { params: { idEvento: eventoId } }),
          axios.get('/items', { params: { sinEvento: true } }),
        ]);
        const conEvento = resCon.data || [];
        const sinEvento = resSin.data || [];
        const merged = [
          ...conEvento,
          ...sinEvento.filter((s: any) => !conEvento.some((c: any) => c.id === s.id)),
        ];
        setAvailableActividades(merged);
        setSelectedActividadesIds(conEvento.map((a: any) => a.id));
      } else {
        const res = await axios.get('/items');
        setAvailableActividades(res.data || []);
        setSelectedActividadesIds([]);
      }
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    }
  };

  useEffect(() => {
    if (!open) return;
    axios.get('areas').then((r) => setAreas(r.data)).catch(console.error);
    fetchActividades(evento?.idEvento);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (evento) {
      setFormData({
        nombre: evento.nombre || '',
        descripcion: evento.descripcion || '',
        fechaInicial: evento.fechaInicial || '',
        fechaFinal: evento.fechaFinal || '',
        hora: evento.hora || '',
        linkRegistro: evento.linkRegistro || '',
        tipoEvento: evento.tipoEvento || 'GENERAL',
        idArea: evento.idArea || '',
        crearHistoria: false,
        idGrupoMultimedia: evento.grupo_multimedia ? (evento.idGrupoMultimedia || true) : null
      });
      setPreview(evento.url || null);
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        fechaInicial: '',
        fechaFinal: '',
        hora: '',
        linkRegistro: '',
        tipoEvento: 'GENERAL',
        idArea: '',
        crearHistoria: true,
        idGrupoMultimedia: null
      });
      setArchivo(null);
      setPreview(null);
    }
    setSelectedSong(null);
    setSearchQuery('');
    setSongsList([]);
    setShowMusicSearch(false);
    setActivitySearchQuery('');
    setActivityToEdit(null);
  }, [evento, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setArchivo(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDeleteActivity = async (activityId: number) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    try {
      await axios.delete(`/items/${activityId}`);
      enqueueSnackbar('Actividad eliminada', { variant: 'success' });
      fetchActividades(evento?.idEvento);
    } catch {
      enqueueSnackbar('Error al eliminar la actividad', { variant: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        data.append(key, value.toString());
      }
    });
    if (archivo) data.append('archivo', archivo);
    if (formData.crearHistoria && selectedSong) data.append('cancion', JSON.stringify(selectedSong));
    data.append('actividades_ids', JSON.stringify(selectedActividadesIds));

    try {
      if (evento) {
        await axios.post(`eventos-multimedia/${evento.idEvento}`, data);
        enqueueSnackbar('Evento actualizado correctamente', { variant: 'success' });
      } else {
        await axios.post('eventos-multimedia', data);
        enqueueSnackbar('Evento creado correctamente', { variant: 'success' });
      }
      onSave();
    } catch (err) {
      console.error(err);
      enqueueSnackbar('Error al procesar el evento', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredActividades = availableActividades.filter((act) => {
    if (!activitySearchQuery.trim()) return true;
    const q = activitySearchQuery.toLowerCase();
    return act.nombreItem.toLowerCase().includes(q) || (act.descripcion && act.descripcion.toLowerCase().includes(q));
  });

  return (
    <>
      <Modal open={open}>
        <ModalContent className="w-full max-w-[720px] top-[3%] p-4 relative max-h-[94vh] flex flex-col">
          <ModalHeader>
            <ModalTitle>
              <Calendar className="w-5 h-5 mr-2 inline text-orange-500" />
              {evento ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>

          <ModalBody className="py-5 px-0 overflow-y-auto flex-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campos básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Type className="w-4 h-4 text-orange-500" /> Nombre del Evento
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-sm"
                    placeholder="Ej: Taller de Robótica"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <KeenIcon icon="category" className="text-orange-500" /> Tipo
                  </label>
                  <select
                    className="select select-sm"
                    value={formData.tipoEvento}
                    onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                  >
                    <option value="GENERAL">General</option>
                    <option value="TALLER">Taller</option>
                    <option value="CONFERENCIA">Conferencia</option>
                    <option value="DEPORTIVO">Deportivo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-orange-500" /> Fecha
                  </label>
                  <input
                    type="date"
                    required
                    className="input input-sm"
                    value={formData.fechaInicial}
                    onChange={(e) => setFormData({ ...formData, fechaInicial: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" /> Hora
                  </label>
                  <input
                    type="time"
                    required
                    className="input input-sm"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-orange-500" /> Lugar / Área
                  </label>
                  <select
                    className="select select-sm"
                    value={formData.idArea}
                    onChange={(e) => setFormData({ ...formData, idArea: e.target.value })}
                  >
                    <option value="">Selecciona un área</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Link className="w-4 h-4 text-orange-500" /> Link de Registro
                  </label>
                  <input
                    type="url"
                    className="input input-sm"
                    placeholder="https://..."
                    value={formData.linkRegistro}
                    style={{ textTransform: 'none' }}
                    onChange={(e) => setFormData({ ...formData, linkRegistro: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" /> Descripción
                </label>
                <textarea
                  className="textarea textarea-sm h-24"
                  placeholder="Detalles del evento..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Imagen/Póster del Evento</label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <KeenIcon icon="file-up" className="text-2xl text-gray-400 mb-2" />
                        <p className="text-xs text-gray-500">Haz clic para subir o arrastra</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  {preview && (
                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-neutral-200">
                      <img src={preview} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              {!formData.idGrupoMultimedia && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30">
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400">
                        {evento ? 'Generar Historia ahora' : 'Automatización Multimedia'}
                      </h4>
                      <p className="text-xs text-orange-600/80 dark:text-orange-400/60">
                        {evento ? 'Crea una historia multimedia usando el póster actual.' : 'Se creará una "Historia" automáticamente con esta imagen.'}
                      </p>
                    </div>
                    <div className="form-switch">
                      <input
                        type="checkbox"
                        checked={formData.crearHistoria}
                        onChange={(e) => setFormData({ ...formData, crearHistoria: e.target.checked })}
                      />
                    </div>
                  </div>

                  {formData.crearHistoria && (
                    <div className="p-4 bg-neutral-50 dark:bg-neutral-900/40 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Music className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Música de fondo</span>
                        </div>
                        <button type="button" onClick={() => setShowMusicSearch(!showMusicSearch)} className="btn btn-xs btn-light">
                          {selectedSong ? 'Cambiar' : 'Añadir música'}
                        </button>
                      </div>

                      {selectedSong && !showMusicSearch && (
                        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-white/5 rounded-xl">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={selectedSong.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-neutral-800 dark:text-white truncate uppercase">{selectedSong.title}</p>
                              <p className="text-[10px] text-neutral-400 font-bold italic truncate">{selectedSong.artist}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => setSelectedSong(null)} className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-400 hover:text-red-600 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {showMusicSearch && (
                        <div className="space-y-3 pt-2">
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                              <Search className="w-4 h-4" />
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar artista o canción..."
                              value={searchQuery}
                              onChange={(e) => handleMusicSearch(e.target.value)}
                              className="input input-sm pl-9"
                            />
                          </div>
                          {searchLoading && (
                            <div className="flex items-center justify-center py-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
                            </div>
                          )}
                          <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                            {songsList.map((song) => (
                              <div
                                key={song.id}
                                className="flex items-center gap-3 p-2 hover:bg-neutral-100 dark:hover:bg-white/5 rounded-lg cursor-pointer transition-all border border-transparent"
                                onClick={() => { setSelectedSong(song); setShowMusicSearch(false); setSongsList([]); setSearchQuery(song.title); }}
                              >
                                <img src={song.image} className="w-8 h-8 rounded-md object-cover" alt="" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[11px] font-black text-neutral-800 dark:text-white truncate uppercase tracking-tight">{song.title}</p>
                                  <p className="text-[10px] text-neutral-400 font-bold italic truncate">{song.artist}</p>
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

              {/* Actividades del Evento */}
              <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white">Actividades</h3>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Opcional — puedes añadirlas luego al editar</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActivityToEdit(null); setActivityModalOpen(true); }}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                  >
                    + Nueva
                  </button>
                </div>

                {availableActividades.length > 0 && (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar actividades..."
                      value={activitySearchQuery}
                      onChange={(e) => setActivitySearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-xl h-9 pl-9 pr-3 text-sm font-medium text-neutral-800 dark:text-white outline-none"
                    />
                  </div>
                )}

                {availableActividades.length === 0 ? (
                  <div className="py-6 text-center bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                    <Calendar className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Sin actividades disponibles</p>
                    <p className="text-[10px] text-neutral-400 mt-1">Crea una nueva actividad con el botón de arriba.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {filteredActividades.map((act) => {
                      const isSelected = selectedActividadesIds.includes(act.id);
                      const isLinked = evento && String(act.idEvento) === String(evento.idEvento);
                      return (
                        <div
                          key={act.id}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-orange-500/[0.04] border-orange-500/25'
                              : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-neutral-300 text-orange-500 focus:ring-orange-500 cursor-pointer shrink-0"
                              checked={isSelected}
                              onChange={() =>
                                setSelectedActividadesIds((prev) =>
                                  prev.includes(act.id) ? prev.filter((i) => i !== act.id) : [...prev, act.id]
                                )
                              }
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                {isSelected && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600">
                                    Seleccionada
                                  </span>
                                )}
                                {isLinked && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-green-500/10 text-green-600">
                                    Vinculada
                                  </span>
                                )}
                                {act.hora_inicio && (
                                  <span className="text-[9px] text-neutral-400 font-bold">
                                    {new Date(act.hora_inicio).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-black text-neutral-800 dark:text-white uppercase tracking-tight truncate">{act.nombreItem}</p>
                              {act.descripcion && (
                                <p className="text-[10px] text-neutral-400 italic truncate">{act.descripcion}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => { setActivityToEdit(act); setActivityModalOpen(true); }}
                              className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 hover:bg-orange-500 hover:text-white text-neutral-500 rounded-lg flex items-center justify-center transition-all"
                              title="Editar"
                            >
                              <KeenIcon icon="pencil" className="text-xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteActivity(act.id)}
                              className="w-8 h-8 hover:bg-rose-500 hover:text-white text-rose-500 rounded-lg flex items-center justify-center transition-all"
                              title="Eliminar"
                            >
                              <KeenIcon icon="trash" className="text-xs" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedActividadesIds.length > 0 && (
                  <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest text-center">
                    {selectedActividadesIds.length} actividad{selectedActividadesIds.length !== 1 ? 'es' : ''} seleccionada{selectedActividadesIds.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={onClose} className="btn btn-sm btn-light">Cancelar</button>
                <button type="submit" disabled={loading} className="btn btn-sm btn-primary min-w-[120px] flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {evento ? 'Actualizar' : 'Crear Evento'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      <ModalForm
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        onSuccess={(newItem) => {
          fetchActividades(evento?.idEvento).then(() => {
            if (newItem?.id) {
              setSelectedActividadesIds((prev) =>
                prev.includes(newItem.id) ? prev : [...prev, newItem.id]
              );
            }
          });
        }}
        itemEditar={activityToEdit}
        defaultIdEvento={evento?.idEvento ?? null}
      />
    </>
  );
};

export default ModalEvento;
