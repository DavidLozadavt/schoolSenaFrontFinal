import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { Film, BookImage } from 'lucide-react';

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
    <Modal open={open}>
      <ModalContent className="w-full max-w-[900px] top-[5%] p-4 relative">
        {saving && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 shadow-xl rounded-xl px-6 py-4 flex items-center gap-3 border border-blue-100">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
              <p className="text-blue-600 font-semibold text-base">Guardando {tipoLabel}...</p>
            </div>
          </div>
        )}

        <ModalHeader>
          <ModalTitle>
            <TipoIcon className={`w-5 h-5 mr-2 inline ${tipo === 'reel' ? 'text-purple-600' : 'text-blue-600'}`} />
            {data && (Array.isArray(data) ? data[0] : data)?.id
              ? `Editar ${tipoLabel}`
              : `Nuevo ${tipoLabel}`}
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          {/* Nombre */}
          <div>
            <label htmlFor="groupName" className="block mb-1 text-sm font-medium">
              Nombre del {tipoLabel}
            </label>
            <input
              id="groupName"
              type="text"
              className={`input p-2 border ${errors.groupName ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder={`Nombre del ${tipoLabel}`}
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (errors.groupName) setErrors((prev) => ({ ...prev, groupName: '' }));
              }}
            />
            {errors.groupName && <p className="mt-1 text-sm text-red-500">{errors.groupName}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label htmlFor="descripcion" className="block mb-1 text-sm font-medium">
              Descripción <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="descripcion"
              className="input p-2 border border-gray-300 rounded-md w-full resize-none"
              rows={2}
              placeholder={`Descripción del ${tipoLabel}`}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          {/* URL Directa (Solo para Reels) */}
          {tipo === 'reel' && (
            <div>
              <label htmlFor="urlDirecta" className="block mb-1 text-sm font-medium">
                URL del Video / Reel <span className="text-gray-400 font-normal">(opcional si subes archivo)</span>
              </label>
              <input
                id="urlDirecta"
                type="text"
                className="input p-2 border border-gray-300 rounded-md w-full"
                placeholder="https://ejemplo.com/video.mp4 o link de TikTok/Instagram"
                value={urlDirecta}
                data-no-uppercase
                style={{ textTransform: 'none' }}
                onChange={(e) => setUrlDirecta(e.target.value)}
              />

              {/* Vista previa de la URL directa */}
              {urlDirecta && (
                <div className="mt-3 relative p-3 bg-blue-50 dark:bg-neutral-800 rounded-lg border border-blue-200 dark:border-neutral-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Vista Previa URL
                    </span>
                    <button 
                      onClick={() => setUrlDirecta('')}
                      className="bg-gray-400 hover:bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                  
                  {getUrlPreview(urlDirecta) || (
                    <div className="text-center py-4 text-xs text-gray-500 italic">
                      Link reconocido: <br/> {urlDirecta}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Drop zone + archivos */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 dark:border-neutral-600 rounded-lg p-5 text-center bg-white dark:bg-neutral-900"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              <KeenIcon icon="plus" className="inline mr-2 text-lg" />
              Arrastra imágenes o videos aquí o
              <button type="button" onClick={handleBrowse} className="ml-2 text-blue-600 underline">
                Añadir Archivos
              </button>
            </div>

            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {/* Vista previa de URL Directa si existe */}
              {urlDirecta && !files.some(f => !(f instanceof File) && f.url === urlDirecta) && (
                <div className="relative w-full p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="mb-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider">Vista Previa URL</div>
                  {getUrlPreview(urlDirecta) || (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-100 dark:bg-neutral-800 rounded-md text-gray-400 text-xs px-4">
                      Link reconocido: {urlDirecta}
                    </div>
                  )}
                  <button
                    onClick={() => setUrlDirecta('')}
                    className="absolute top-2 right-2 bg-gray-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow"
                  >
                    ×
                  </button>
                </div>
              )}

              {files.map((file, i) => {
                const url = previewUrl(file, i);
                const song = selectedSongs[i];
                
                // Si esta URL de archivo ya se está mostrando como urlDirecta, la saltamos para no duplicar
                if (!(file instanceof File) && file.url === urlDirecta) return null;

                const isVid = isVideoEntry(file);
                const embedPreview = !isVid && !(file instanceof File) ? getUrlPreview(url) : null;

                return (
                  <div
                    key={file instanceof File ? `file-${file.name}-${i}` : `existing-${(file as any).id || i}`}
                    className="relative w-full p-3 bg-white dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
                  >
                    {embedPreview ? (
                      embedPreview
                    ) : isVid ? (
                      <video src={url} controls className="w-full h-40 rounded-md object-cover" />
                    ) : (
                      <img src={url} alt="" className="w-full h-40 object-cover rounded-md" />
                    )}

                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow"
                    >
                      ×
                    </button>

                    {!isVid && tipo === 'historia' && (
                      <>
                        <button
                          onClick={() => handleToggleSearch(i)}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white py-1.5 rounded-md text-xs mt-2"
                        >
                          {song ? 'Cambiar Canción' : 'Añadir Canción'}
                        </button>

                        {showSearch[i] && (
                          <div className="mt-2">
                            <input
                              type="text"
                              placeholder="Buscar canción"
                              value={searches[i] || ''}
                              onChange={(e) => handleSearch(e.target.value, i)}
                              className="w-full border border-gray-300 rounded-md p-2 text-sm dark:bg-neutral-800 dark:border-neutral-600"
                            />
                            {songsList[i]?.length > 0 && (
                              <div className="max-h-40 overflow-auto mt-1 border rounded-lg dark:bg-neutral-900">
                                {songsList[i].map((songItem) => (
                                  <div
                                    key={songItem.id}
                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer"
                                    onClick={() => handleSelectSong(songItem, i)}
                                  >
                                    <img
                                      src={songItem.image}
                                      alt={songItem.title}
                                      className="w-8 h-8 rounded object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-xs truncate">{songItem.title}</p>
                                      <p className="text-[10px] text-gray-500 truncate">{songItem.artist}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {song && (
                          <div className="w-full mt-3 rounded-xl bg-gray-50 dark:bg-neutral-800 p-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={song.image}
                                alt={song.title}
                                className="w-10 h-10 object-cover rounded-lg shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate">{song.title}</p>
                                <p className="text-[10px] text-gray-500 truncate">{song.artist}</p>
                              </div>
                            </div>
                            <audio controls src={song.preview_url} className="w-full mt-2 rounded-md" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {files.length === 0 && (
              <div className="text-gray-400 text-sm py-4">No hay archivos seleccionados</div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-gray-700 dark:text-gray-200"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className={`px-5 py-2 rounded-lg text-white font-medium ${accentColor} disabled:opacity-50`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalMultimedia };
