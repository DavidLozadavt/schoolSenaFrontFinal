import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

interface Actividad {
  id: number;
  idRmi: number;
  descripcion: string;
  fechaInicial: string;
  fechaFinal: string;
  numeroHoras: number;
  documento: string | null;
  rutaDocumentoUrl: string | null;
}

interface ActividadesIndexProps {
  idRmi: number;
  idContrato:number
}

const ActividadesIndex: React.FC<ActividadesIndexProps> = ({ idRmi, idContrato }) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeDoc, setRemoveDoc] = useState(false); // flag para quitar doc en edición

  const [form, setForm] = useState({
    descripcion: '',
    fechaInicial: '',
    fechaFinal: '',
    numeroHoras: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`actividades-instructores?idRmi=${idRmi}&idContrato=${idContrato}`);
      setActividades(res.data);
    } catch {
      enqueueSnackbar('Error cargando las actividades', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [idRmi]);

  const resetForm = () => {
    setForm({ descripcion: '', fechaInicial: '', fechaFinal: '', numeroHoras: '' });
    setSelectedFile(null);
    setRemoveDoc(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (actividad: Actividad) => {
    resetForm();
    setForm({
      descripcion: actividad.descripcion,
      fechaInicial: actividad.fechaInicial?.slice(0, 10) ?? '',
      fechaFinal: actividad.fechaFinal?.slice(0, 10) ?? '',
      numeroHoras: actividad.numeroHoras.toString(),
    });
    setEditingId(actividad.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta actividad?')) return;
    try {
      await axios.delete(`actividades-instructores/${id}`);
      enqueueSnackbar('Actividad eliminada con éxito', { variant: 'success' });
      loadData();
    } catch {
      enqueueSnackbar('Error al eliminar la actividad', { variant: 'error' });
    }
  };

  const handleDeleteDocumento = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar el documento?')) return;
    setDeletingDocId(id);
    try {
      await axios.delete(`actividades-instructores/${id}/documento`);
      enqueueSnackbar('Documento eliminado', { variant: 'success' });
      loadData();
    } catch {
      enqueueSnackbar('Error al eliminar el documento', { variant: 'error' });
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        // PUT con archivo requiere POST + _method=PUT (multipart/form-data)
        const formData = new FormData();
        formData.append('_method', 'PUT');
        formData.append('descripcion', form.descripcion);
        formData.append('fechaInicial', form.fechaInicial);
        formData.append('fechaFinal', form.fechaFinal);
        formData.append('numeroHoras', form.numeroHoras);
        formData.append('idRmi', String(idRmi));
        formData.append('idContrato', String(idContrato));
        if (selectedFile) formData.append('documento', selectedFile);
        if (removeDoc) formData.append('removeDocumento', '1');

        await axios.post(`actividades-instructores/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('Actividad actualizada', { variant: 'success' });
      } else {
        const formData = new FormData();
        formData.append('descripcion', form.descripcion);
        formData.append('fechaInicial', form.fechaInicial);
        formData.append('fechaFinal', form.fechaFinal);
        formData.append('numeroHoras', form.numeroHoras);
        formData.append('idRmi', String(idRmi));
        formData.append('idContrato', String(idContrato));
        if (selectedFile) formData.append('documento', selectedFile);

        await axios.post('actividades-instructores', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        enqueueSnackbar('Actividad registrada', { variant: 'success' });
      }

      setIsFormOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar la actividad';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Actividad que se está editando (para mostrar doc actual en el modal)
  const actividadEditando = actividades.find((a) => a.id === editingId) ?? null;

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Actividades del periodo
          </h3>
          <p className="text-sm text-gray-500">Gestione las actividades asignadas</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all shadow-sm"
        >
          <i className="ki-outline ki-plus text-sm" /> Nueva Actividad
        </button>
      </div>

      <div className="overflow-x-auto bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-coal-500 border-b border-gray-200 dark:border-coal-300">
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Descripción</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Fecha Inicial</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Fecha Final</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">N° Horas</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300">Documento</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  No se encontraron actividades para este periodo.
                </td>
              </tr>
            ) : (
              actividades.map((actividad) => (
                <tr
                  key={actividad.id}
                  className="border-b border-gray-100 dark:border-coal-300 hover:bg-gray-50/50 dark:hover:bg-coal-500/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-[220px]">
                    {actividad.descripcion}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {actividad.fechaInicial?.slice(0, 10) ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {actividad.fechaFinal?.slice(0, 10) ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {actividad.numeroHoras}
                  </td>

                  {/* Columna documento */}
                  <td className="px-4 py-3 text-sm">
                    {actividad.rutaDocumentoUrl ? (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={actividad.rutaDocumentoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-500/10 dark:text-green-400 rounded-md transition-colors"
                          title="Ver documento"
                        >
                          <i className="ki-outline ki-document text-sm" />
                          Ver
                        </a>
                        <button
                          onClick={() => handleDeleteDocumento(actividad.id)}
                          disabled={deletingDocId === actividad.id}
                          className="inline-flex items-center justify-center w-6 h-6 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 rounded-md transition-colors disabled:opacity-50"
                          title="Eliminar documento"
                        >
                          {deletingDocId === actividad.id ? (
                            <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <i className="ki-outline ki-cross text-xs" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">Sin documento</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => handleOpenEdit(actividad)}
                      className="inline-flex items-center justify-center w-7 h-7 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-md transition-colors"
                      title="Editar"
                    >
                      <i className="ki-outline ki-pencil text-sm" />
                    </button>
                    <button
                      onClick={() => handleDelete(actividad.id)}
                      className="inline-flex items-center justify-center w-7 h-7 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <i className="ki-outline ki-trash text-sm" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Formulario CRUD */}
      <Modal open={isFormOpen} onClose={() => setIsFormOpen(false)} className="mx-4 sm:mx-auto max-w-lg w-full">
        <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full">
          <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
            <ModalTitle>{editingId ? 'Editar Actividad' : 'Nueva Actividad'}</ModalTitle>
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <i className="ki-outline ki-cross text-lg" />
            </button>
          </ModalHeader>
          <ModalBody className="p-5">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Fecha Inicial <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fechaInicial}
                    onChange={(e) => setForm({ ...form, fechaInicial: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Fecha Final <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.fechaFinal}
                    onChange={(e) => setForm({ ...form, fechaFinal: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Número de Horas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.numeroHoras}
                    onChange={(e) => setForm({ ...form, numeroHoras: e.target.value })}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Campo documento */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                    Documento <span className="text-gray-400">(PDF, DOC, DOCX — máx. 5MB)</span>
                  </label>

                  {/* Documento actual en modo edición */}
                  {editingId && actividadEditando?.rutaDocumentoUrl && !removeDoc && !selectedFile && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded-lg">
                      <i className="ki-outline ki-document text-green-600 dark:text-green-400 text-sm" />
                      <a
                        href={actividadEditando.rutaDocumentoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-700 dark:text-green-400 font-medium underline underline-offset-2 flex-1 truncate"
                      >
                        Documento actual
                      </a>
                      <button
                        type="button"
                        onClick={() => setRemoveDoc(true)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                        title="Quitar documento"
                      >
                        <i className="ki-outline ki-cross text-xs" />
                      </button>
                    </div>
                  )}

                  {/* Aviso de que se va a quitar el doc */}
                  {removeDoc && !selectedFile && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/30 rounded-lg">
                      <i className="ki-outline ki-information-2 text-yellow-600 text-sm" />
                      <span className="text-xs text-yellow-700 dark:text-yellow-400 flex-1">
                        El documento actual será eliminado al guardar.
                      </span>
                      <button
                        type="button"
                        onClick={() => setRemoveDoc(false)}
                        className="text-xs text-yellow-600 hover:underline"
                      >
                        Deshacer
                      </button>
                    </div>
                  )}

                  {/* Archivo seleccionado */}
                  {selectedFile && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg">
                      <i className="ki-outline ki-document text-blue-500 text-sm" />
                      <span className="text-xs text-blue-700 dark:text-blue-400 font-medium flex-1 truncate">
                        {selectedFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <i className="ki-outline ki-cross text-xs" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setSelectedFile(file);
                      if (file) setRemoveDoc(false);
                    }}
                    className="w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-500/10 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-coal-300 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-coal-400 dark:hover:bg-coal-300 rounded-lg transition-colors border border-gray-200 dark:border-coal-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ActividadesIndex;