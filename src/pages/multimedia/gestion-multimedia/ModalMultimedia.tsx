import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
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

const ModalMultimedia = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [groupName, setGroupName] = useState(data?.nombreGrupo || '');
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

      if (grupo?.grupos_multimedia && Array.isArray(grupo.grupos_multimedia)) {
        const existing: FileEntry[] = grupo.grupos_multimedia.map((m: any) => ({
          id: m.id,
          url: m.urlMultimedia ?? m.url ?? '',
          existing: true
        }));

        const parsedSongs: (Song | null)[] = grupo.grupos_multimedia.map((m: any) => {
          if (!m.cancion) return null;
          try {
            const firstParse = typeof m.cancion === 'string' ? JSON.parse(m.cancion) : m.cancion;
            return typeof firstParse === 'string' ? JSON.parse(firstParse) : firstParse;
          } catch (err) {
            console.warn('Error al parsear canción:', err);
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
                  console.warn('No se pudo obtener info de la canción', song.id);
                  return song;
                }
              }
              return song;
            })
          );
          setSelectedSongs(updatedSongs);
        };

        setFiles(existing);
        setPreviewUrls(existing.map((m: any) => m.urlMultimedia ?? m.url ?? ''));
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
      }

      setErrors({});
    }
  }, [open, data]);

  const isVideo = (entry: FileEntry) => {
    const name = entry instanceof File ? entry.name : entry.url;
    return /\.(mp4|webm|ogg|mov)$/i.test(name);
  };

  const onFiles = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected);
    const entries: FileEntry[] = arr;
    const newUrls = arr.map((f) => URL.createObjectURL(f));

    setFiles((prev) => [...prev, ...entries]);
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
    if (!groupName.trim()) err.groupName = 'Nombre del grupo requerido';
    setErrors(err);
    return Object.keys(err).length === 0;
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

      files.forEach((entry, i) => {
        if (entry instanceof File) {
          form.append('archivos[]', entry);

          if (!isVideo(entry) && selectedSongs[i]) {
            form.append(`archivos_cancion[${i}]`, JSON.stringify(selectedSongs[i]));
          }
        } else {
          if ((entry as any).id) {
            form.append('archivos_ids[]', String((entry as any).id));

            if (!isVideo(entry) && selectedSongs[i]) {
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
        enqueueSnackbar('Grupo multimedia actualizado.', { variant: 'success' });
      } else {
        await axios.post('store_grupo_multimedia', form);
        enqueueSnackbar('Grupo multimedia guardado.', { variant: 'success' });
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
    entry instanceof File ? previewUrls[index] : entry.url || '';

  return (
    <Modal open={open}>
      <ModalContent className="w-full max-w-[900px] top-[10%] p-4 relative">
        {saving && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/20 dark:bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-black shadow-xl rounded-xl px-6 py-4 flex items-center gap-3 border border-blue-100 animate-fadeIn">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent dark:border-blue-600 dark:border-t-transparent"></div>
              <p className="text-blue-600 dark:text-blue-600 font-semibold text-base">
                Guardando multimedia...
              </p>
            </div>
          </div>
        )}

        <ModalHeader>
          <ModalTitle>
            <KeenIcon icon="image" className="mr-2" />
            Gestión Multimedia
          </ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-6 px-0 py-5">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white dark:bg-neutral-900"
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <div className="mb-3 text-sm text-gray-600">
              <KeenIcon icon="plus" className="inline mr-2 text-lg" />
              Arrastra imágenes o videos aquí o
              <button type="button" onClick={handleBrowse} className="ml-2 text-blue-600 underline">
                Añadir Archivos Multimedia
              </button>
            </div>

            {/* 🔥🔥 GRID DE 3 EN 3 — ÚNICA PARTE MODIFICADA */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {files.map((file, i) => {
                const url = previewUrl(file, i);
                const song = selectedSongs[i];
                const isVid = isVideo(file);

                return (
                  <div
                    key={i}
                    className="relative w-full p-3 bg-white dark:bg-neutral-900 rounded-lg border border-gray-300 dark:border-neutral-700"
                  >
                    {isVid ? (
                      <video
                        src={url}
                        controls
                        className="w-full h-40 rounded-md object-cover"
                      />
                    ) : (
                      <img src={url} alt="" className="w-full h-40 object-cover rounded-md" />
                    )}

                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>

                    {!isVid && (
                      <>
                        <button
                          onClick={() => handleToggleSearch(i)}
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-md text-sm mt-2"
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
                              className="w-full border border-gray-300 rounded-md p-2 text-sm"
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
                                    <div className="flex-1">
                                      <p className="font-semibold text-xs">{songItem.title}</p>
                                      <p className="text-[10px] text-gray-500">
                                        {songItem.artist}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {song && (
                          <div className="w-full mt-4 rounded-xl bg-white dark:bg-neutral-900 p-3">
                            <div className="flex flex-col items-center text-center">
                              <img
                                src={song.image}
                                alt={song.title}
                                className="w-12 h-12 object-cover rounded-lg mb-3"
                              />
                              <p className="text-sm font-semibold text-neutral-950 dark:text-slate-50">
                                {song.title}
                              </p>
                              <p className="text-xs text-gray-500 mb-2 text-neutral-950 dark:text-slate-50">
                                {song.artist}
                              </p>
                              <audio
                                controls
                                src={song.preview_url}
                                className="w-full mt-1 rounded-md"
                              ></audio>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {files.length === 0 && (
              <div className="text-gray-500">No hay archivos seleccionados</div>
            )}
          </div>

          <div>
            <label htmlFor="groupName" className="block mb-1 text-sm font-medium">
              Nombre del grupo de historias
            </label>
            <input
              id="groupName"
              type="text"
              className={`input p-2 border ${
                errors.groupName ? 'border-red-500' : 'border-gray-300'
              } rounded-md w-full`}
              placeholder="Nombre del grupo"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (errors.groupName) setErrors((prev) => ({ ...prev, groupName: '' }));
              }}
            />
            {errors.groupName && <p className="mt-1 text-sm text-red-500">{errors.groupName}</p>}
          </div>

          <div className="flex justify-end gap-3 px-4 mt-2">
            <button
              className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Aceptar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalMultimedia };
