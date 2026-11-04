import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle, ModalFooter } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { Film, BookImage, X, Image as ImageIcon } from 'lucide-react';

interface ModalProps {
  open: boolean;
  tipo?: 'historia' | 'reel';
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

interface Song {
  id: number;
  title: string;
  artist: string;
  image: string;
  preview_url: string;
}

type FileEntry = File | { id?: number; url: string; existing?: true };

const ModalMultimedia = ({ open, tipo = 'historia', data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [groupName, setGroupName] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [urlDirecta, setUrlDirecta] = useState(''); // Nueva opción para URL externa
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ groupName?: string }>({});
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [searches, setSearches] = useState<string[]>([]);
  const [songsList, setSongsList] = useState<Song[][]>([]);
  const [selectedSongs, setSelectedSongs] = useState<(Song | null)[]>([]);
  const [loading, setLoading] = useState<boolean[]>([]);
  const [showSearch, setShowSearch] = useState<boolean[]>([]);
  const [deletedExistingIds, setDeletedExistingIds] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      const grupo = Array.isArray(data) ? data[0] : data;
      setGroupName(grupo?.nombreGrupo || '');
      setDescripcion(grupo?.descripcion || '');

      if (grupo?.grupos_multimedia && Array.isArray(grupo.grupos_multimedia)) {
        const existing: FileEntry[] = grupo.grupos_multimedia.map((m: any) => {
          const rawUrl = m.urlMultimediaFull ?? m.urlMultimedia ?? m.url ?? '';
          let finalUrl = rawUrl;
          if (rawUrl && !rawUrl.startsWith('http')) {
            const backendUrl = (import.meta.env.VITE_APP_BACKEND_URL || import.meta.env.VITE_APP_API_URL?.replace('/api', '') || 'http://127.0.0.1:8000').replace(/\/$/, '');
            const normalizedUrl = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
            finalUrl = `${backendUrl}${normalizedUrl}`;
          }
          return {
            id: m.id,
            url: finalUrl,
            existing: true
          };
        });

        const parsedSongs: (Song | null)[] = grupo.grupos_multimedia.map((m: any) => {
          if (!m.cancion) return null;
          try {
            const firstParse = typeof m.cancion === 'string' ? JSON.parse(m.cancion) : m.cancion;
            return typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
          } catch {
            return null;
          }
        });

        const fetchSongs = async () => {
          const updatedSongs: (Song | null)[] = await Promise.all(
            parsedSongs.map(async (song) => {
              if (song?.id && (!song.title || !song.artist)) {
                try {
                  const resp = await axios.get(`/deezer/search/${song.id}`);
                  return resp.data;
                } catch {
                  return song;
                }
              }
              return song;
            })
          );
          setSelectedSongs(updatedSongs);
        };

        setFiles(existing);
        // Si es un reel, intentamos recuperar la URL del primer elemento
        const firstMedia = grupo.grupos_multimedia[0];
        const rawUrl = firstMedia?.urlMultimediaFull || firstMedia?.urlMultimedia || '';
        
        // Verificamos si es una URL externa
        const isExternal = rawUrl && (
          rawUrl.toLowerCase().startsWith('http') || 
          rawUrl.toLowerCase().includes('youtube.com') || 
          rawUrl.toLowerCase().includes('youtu.be') || 
          rawUrl.toLowerCase().includes('tiktok.com') || 
          rawUrl.toLowerCase().includes('instagram.com')
        );

        if (tipo === 'reel' && isExternal) {
          setUrlDirecta(rawUrl);
          // Si es URL directa, no la mostramos en la lista de archivos para evitar duplicados en la UI
          setFiles([]);
          setPreviewUrls([]);
        } else {
          setUrlDirecta('');
          setFiles(existing);
          setPreviewUrls(existing.map((m: any) => m.url ?? ''));
        }

        setSearches(existing.map(() => ''));
        setSongsList(existing.map(() => []));
        setLoading(existing.map(() => false));
        setShowSearch(existing.map(() => false));
        setDeletedExistingIds([]);
        fetchSongs();
      } else {
        setFiles([]);
        setPreviewUrls([]);
        setSearches([]);
        setSongsList([]);
        setSelectedSongs([]);
        setLoading([]);
        setShowSearch([]);
        setDeletedExistingIds([]);
        setUrlDirecta('');
      }

      setErrors({});
    }
  }, [open, data]);

  const isVideoEntry = (entry: FileEntry) => {
    const name = entry instanceof File ? entry.name : entry.url;
    return /\.(mp4|webm|ogg|mov)$/i.test(name);
  };

  const onFiles = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected);
    const newUrls = arr.map((f) => URL.createObjectURL(f));

    setFiles((prev) => [...prev, ...arr]);
    setPreviewUrls((prev) => [...prev, ...newUrls]);
    setSearches((prev) => [...prev, ...arr.map(() => '')]);
    setSongsList((prev) => [...prev, ...arr.map(() => [])]);
    setSelectedSongs((prev) => [...prev, ...arr.map(() => null)]);
    setLoading((prev) => [...prev, ...arr.map(() => false)]);
    setShowSearch((prev) => [...prev, ...arr.map(() => false)]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onFiles(e.dataTransfer.files);
  };

  const handleBrowse = () => inputRef.current?.click();

  const isVideo = (url: string) => /\.(mp4|webm|ogg|mov)$/i.test(url);

  const removeFile = (index: number) => {
    const entry = files[index];
    if (entry && typeof entry === 'object' && 'existing' in entry && (entry as any).id) {
      setDeletedExistingIds((prev) => [...prev, (entry as any).id]);
    }
    if (files[index] instanceof File) {
      URL.revokeObjectURL(previewUrls[index]);
    }

    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSearches((prev) => prev.filter((_, i) => i !== index));
    setSongsList((prev) => prev.filter((_, i) => i !== index));
    setSelectedSongs((prev) => prev.filter((_, i) => i !== index));
    setLoading((prev) => prev.filter((_, i) => i !== index));
    setShowSearch((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const err: any = {};
    if (!groupName.trim()) err.groupName = 'Nombre requerido';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const getUrlPreview = (url: string) => {
    if (!url) return null;

    // YouTube (incluyendo shorts)
    const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (ytMatch) {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytMatch[1]}`}
          className="w-full h-40 rounded-md border-0"
          allowFullScreen
        />
      );
    }

    // TikTok
    if (url.includes('tiktok.com')) {
      const videoId = url.split('/video/')[1]?.split('?')[0];
      if (videoId) {
        return (
          <iframe
            src={`https://www.tiktok.com/player/v1/${videoId}`}
            className="w-full h-40 rounded-md border-0"
          />
        );
      }
    }

    // Instagram
    if (url.includes('instagram.com/reels/') || url.includes('instagram.com/reel/')) {
      const reelId = url.includes('/reels/') ? url.split('/reels/')[1]?.split('/')[0] : url.split('/reel/')[1]?.split('/')[0];
      if (reelId) {
        return (
          <iframe
            src={`https://www.instagram.com/reels/${reelId}/embed`}
            className="w-full h-40 rounded-md border-0"
          />
        );
      }
    }

    // Video directo
    if (/\.(mp4|webm|ogg|mov)$/i.test(url)) {
      return <video src={url} controls className="w-full h-40 rounded-md object-cover" />;
    }

    return null;
  };

  const handleSearch = async (term: string, index: number) => {
    const newSearches = [...searches];
    newSearches[index] = term;
    setSearches(newSearches);

    if (!term.trim()) {
      const newSongsList = [...songsList];
      newSongsList[index] = [];
      setSongsList(newSongsList);
      return;
    }

    try {
      const newLoading = [...loading];
      newLoading[index] = true;
      setLoading(newLoading);

      const resp = await axios.get(`/deezer/search?q=${encodeURIComponent(term)}`);
      const results: Song[] = resp.data?.data ?? resp.data ?? [];

      const newSongsList = [...songsList];
      newSongsList[index] = results;
      setSongsList(newSongsList);
    } catch {
      enqueueSnackbar('Error al buscar canciones.', { variant: 'error' });
    } finally {
      const newLoading = [...loading];
      newLoading[index] = false;
      setLoading(newLoading);
    }
  };

  const handleSelectSong = (song: Song, index: number) => {
    const newSelected = [...selectedSongs];
    newSelected[index] = song;
    setSelectedSongs(newSelected);
    enqueueSnackbar(`Canción seleccionada: ${song.title}`, { variant: 'success' });

    const newSearches = [...searches];
    newSearches[index] = song.title;
    setSearches(newSearches);

    const newSongsList = [...songsList];
    newSongsList[index] = [];
    setSongsList(newSongsList);

    const newShowSearch = [...showSearch];
    newShowSearch[index] = false;
    setShowSearch(newShowSearch);
  };

  const handleToggleSearch = (index: number) => {
    const newShowSearch = [...showSearch];
    newShowSearch[index] = !newShowSearch[index];
    setShowSearch(newShowSearch);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append('nombreGrupo', groupName.trim());
      form.append('tipo', tipo);
      if (descripcion.trim()) form.append('descripcion', descripcion.trim());
      if (urlDirecta.trim()) form.append('url', urlDirecta.trim());

      files.forEach((entry, i) => {
        if (entry instanceof File) {
          form.append('archivos[]', entry);

          if (!isVideoEntry(entry) && selectedSongs[i]) {
            form.append(`archivos_cancion[${i}]`, JSON.stringify(selectedSongs[i]));
          }
        } else {
          if ((entry as any).id) {
            form.append('archivos_ids[]', String((entry as any).id));

            if (!isVideoEntry(entry) && selectedSongs[i]) {
              form.append(
                `archivos_cancion_existentes[${(entry as any).id}]`,
                JSON.stringify(selectedSongs[i])
              );
            }
          }
        }
      });

      if (deletedExistingIds.length > 0) {
        form.append('deleted_ids', JSON.stringify(deletedExistingIds));
      }

      const grupo = Array.isArray(data) ? data[0] : data;

      if (grupo?.id) {
        await axios.post(`update_grupo_multimedia/${grupo.id}`, form);
        enqueueSnackbar(`${tipo === 'reel' ? 'Reel' : 'Historia'} actualizado.`, { variant: 'success' });
      } else {
        await axios.post('store_grupo_multimedia', form);
        enqueueSnackbar(`${tipo === 'reel' ? 'Reel' : 'Historia'} guardado.`, { variant: 'success' });
      }

      if (onSave) await onSave();
      onClose();
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error al guardar multimedia.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = (entry: FileEntry, index: number) =>
    entry instanceof File ? previewUrls[index] : (entry as any).url || '';

  const TipoIcon = tipo === 'reel' ? Film : BookImage;
  const tipoLabel = tipo === 'reel' ? 'Reel' : 'Historia';
  const accentColor = tipo === 'reel' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700';

  return (
    <>
      <Modal open={open} onClose={onClose}>
        <ModalContent className="w-full max-w-[1000px] top-[5%] p-0 relative bg-white dark:bg-neutral-950 rounded-[2.5rem] overflow-hidden border border-gray-100 dark:border-white/5 shadow-2xl">
        {saving && (
          <div className="absolute inset-0 flex items-center justify-center z-[9999] bg-white/60 dark:bg-black/40 backdrop-blur-md">
            <div className="bg-white dark:bg-neutral-900 shadow-2xl rounded-3xl px-8 py-6 flex flex-col items-center gap-4 border border-blue-100 dark:border-white/5 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-2 border-blue-600/20" />
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
              </div>
              <p className="text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-[0.2em]">Guardando {tipoLabel}...</p>
            </div>
          </div>
        )}

        <ModalHeader className="px-10 pt-10 pb-6 border-b-0 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${tipo === 'reel' ? 'bg-purple-600/10 text-purple-600' : 'bg-blue-600/10 text-blue-600'}`}>
                <TipoIcon className="w-6 h-6" />
              </div>
              <ModalTitle className="text-2xl font-black text-neutral-900 dark:text-white">
                {data && (Array.isArray(data) ? data[0] : data)?.id
                  ? `Editar ${tipoLabel}`
                  : `Nueva ${tipoLabel}`}
              </ModalTitle>
            </div>
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest ml-14">
              {tipo === 'reel' ? 'Crea contenido vertical dinámico' : 'Comparte momentos efímeros'}
            </p>
          </div>
          <button 
            className="p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all group" 
            onClick={onClose}
          >
            <X className="w-6 h-6 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors" />
          </button>
        </ModalHeader>

        <ModalBody className="px-10 py-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Side: Forms */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="groupName" className="block mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Título de la {tipoLabel}
                  </label>
                  <input
                    id="groupName"
                    type="text"
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-neutral-900 border-2 transition-all rounded-2xl text-sm font-bold placeholder:text-neutral-300 focus:ring-4 ${
                      errors.groupName 
                        ? 'border-red-500/50 focus:ring-red-500/10' 
                        : 'border-transparent focus:border-blue-600/30 focus:ring-blue-600/5'
                    }`}
                    placeholder={`Ej: Mi gran aventura`}
                    value={groupName}
                    onChange={(e) => {
                      setGroupName(e.target.value);
                      if (errors.groupName) setErrors((prev) => ({ ...prev, groupName: '' }));
                    }}
                  />
                  {errors.groupName && (
                    <p className="mt-2 text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                      <X className="w-3 h-3" /> {errors.groupName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="descripcion" className="block mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Descripción <span className="opacity-50 font-medium lowercase italic">(opcional)</span>
                  </label>
                  <textarea
                    id="descripcion"
                    className="w-full px-5 py-4 bg-gray-50 dark:bg-neutral-900 border-2 border-transparent focus:border-blue-600/30 focus:ring-4 focus:ring-blue-600/5 transition-all rounded-2xl text-sm font-medium placeholder:text-neutral-300 resize-none"
                    rows={4}
                    placeholder={`Cuéntanos más sobre este contenido...`}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                  />
                </div>

                {tipo === 'reel' && (
                  <div>
                    <label htmlFor="urlDirecta" className="block mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                      Link Externo <span className="opacity-50 font-medium lowercase italic">(YouTube, TikTok, Instagram)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400">
                        <KeenIcon icon="link" className="text-lg" />
                      </div>
                      <input
                        id="urlDirecta"
                        type="text"
                        className="w-full pl-14 pr-5 py-4 bg-gray-50 dark:bg-neutral-900 border-2 border-transparent focus:border-purple-600/30 focus:ring-4 focus:ring-purple-600/5 transition-all rounded-2xl text-sm font-bold placeholder:text-neutral-300"
                        placeholder="Pega el link aquí..."
                        value={urlDirecta}
                        data-no-uppercase
                        style={{ textTransform: 'none' }}
                        onChange={(e) => setUrlDirecta(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Media Manager */}
            <div className="lg:col-span-7 space-y-6">
              <div 
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="group relative overflow-hidden bg-gray-50 dark:bg-neutral-900 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] transition-all hover:border-blue-500/50 hover:bg-blue-50/30 dark:hover:bg-blue-500/5"
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
                <div className="p-10 flex flex-col items-center text-center cursor-pointer" onClick={handleBrowse}>
                  <div className={`p-6 rounded-[1.5rem] mb-6 shadow-xl transition-all transform group-hover:scale-110 group-active:scale-95 ${
                    tipo === 'reel' ? 'bg-purple-600 text-white shadow-purple-500/30' : 'bg-blue-600 text-white shadow-blue-500/30'
                  }`}>
                    <KeenIcon icon="plus" className="text-3xl" />
                  </div>
                  <h4 className="text-base font-black text-neutral-900 dark:text-white mb-2">
                    Añade contenido visual
                  </h4>
                  <p className="text-xs font-medium text-neutral-400 max-w-[240px] leading-relaxed">
                    Arrastra imágenes o videos. <br/> Soporta MP4, MOV, JPG, PNG.
                  </p>
                </div>
              </div>

              {/* Media List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* URL Preview if exists */}
                {urlDirecta && !files.some(f => !(f instanceof File) && f.url === urlDirecta) && (
                  <div className="group relative bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                    <div className="absolute top-3 left-3 z-10">
                      <span className="px-2 py-1 bg-purple-600 text-[8px] font-black text-white uppercase tracking-widest rounded-lg">Link Externo</span>
                    </div>
                    <div className="h-44 bg-neutral-900 flex items-center justify-center overflow-hidden">
                      {getUrlPreview(urlDirecta) || (
                        <div className="flex flex-col items-center gap-2 p-6 text-center">
                          <KeenIcon icon="link" className="text-2xl text-white/20" />
                          <p className="text-[10px] font-bold text-white/50 truncate w-full">{urlDirecta}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setUrlDirecta('')}
                      className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/60 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {files.map((file, i) => {
                  const url = previewUrl(file, i);
                  const song = selectedSongs[i];
                  if (!(file instanceof File) && file.url === urlDirecta) return null;
                  const isVid = isVideoEntry(file);
                  const embedPreview = !isVid && !(file instanceof File) ? getUrlPreview(url) : null;

                  return (
                    <div key={i} className="group relative bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all">
                      <div className="h-44 bg-neutral-900 flex items-center justify-center overflow-hidden">
                        {embedPreview ? embedPreview : isVid ? (
                          <video src={url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                        )}
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col gap-2">
                        {!isVid && tipo === 'historia' && (
                          <button
                            onClick={() => handleToggleSearch(i)}
                            className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all"
                          >
                            {song ? 'Cambiar Música' : 'Añadir Música'}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => removeFile(i)}
                        className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/60 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Song Dropdown/Results Overlay */}
                      {showSearch[i] && (
                        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest">Buscador de música</span>
                            <button onClick={() => handleToggleSearch(i)} className="text-white hover:text-red-500"><X className="w-4 h-4" /></button>
                          </div>
                          <input
                            type="text"
                            placeholder="Nombre de artista o canción..."
                            value={searches[i] || ''}
                            onChange={(e) => handleSearch(e.target.value, i)}
                            className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder:text-white/30 focus:ring-2 focus:ring-blue-500 transition-all mb-3"
                          />
                          <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                            {songsList[i]?.map((songItem) => (
                              <div
                                key={songItem.id}
                                className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5"
                                onClick={() => handleSelectSong(songItem, i)}
                              >
                                <img src={songItem.image} className="w-10 h-10 rounded-lg object-cover shadow-lg" alt="" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{songItem.title}</p>
                                  <p className="text-[9px] text-white/50 font-bold italic truncate">{songItem.artist}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Selected Song Preview */}
                      {song && !showSearch[i] && (
                        <div className="absolute top-3 left-3 flex items-center gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 max-w-[70%]">
                          <img src={song.image} className="w-6 h-6 rounded-lg shrink-0" alt="" />
                          <div className="min-w-0 pr-1">
                            <p className="text-[8px] font-black text-white truncate uppercase tracking-tighter">{song.title}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {files.length === 0 && !urlDirecta && (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 dark:bg-neutral-900 rounded-[2rem] border-2 border-gray-100 dark:border-white/5 opacity-50">
                  <ImageIcon className="w-12 h-12 text-neutral-300 mb-3" />
                  <p className="text-xs font-black uppercase tracking-widest text-neutral-300">Galería Vacía</p>
                </div>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="px-10 py-8 border-t-0 flex justify-end gap-4 bg-gray-50/50 dark:bg-black/20 backdrop-blur-sm">
          <button
            className="px-8 py-4 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-white/5 text-neutral-500 dark:text-neutral-400 text-xs font-black uppercase tracking-widest transition-all border border-gray-100 dark:border-white/5"
            onClick={onClose}
            disabled={saving}
          >
            Cerrar
          </button>
          <button
            className={`px-10 py-4 rounded-2xl text-white text-xs font-black uppercase tracking-widest transition-all transform hover:scale-105 active:scale-95 shadow-xl ${
              tipo === 'reel' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/30' : 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/30'
            } disabled:opacity-50 disabled:transform-none`}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                <span>Guardando...</span>
              </div>
            ) : (
              'Publicar Contenido'
            )}
          </button>
        </ModalFooter>
      </ModalContent>
      
      </Modal>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(155, 155, 155, 0.2);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(155, 155, 155, 0.4);
        }
      `}</style>
    </>
  );
};

export { ModalMultimedia };
