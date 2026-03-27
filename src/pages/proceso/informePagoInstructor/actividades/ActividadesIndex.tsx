import React, { useEffect, useState } from 'react';
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
}

interface ActividadesIndexProps {
  idRmi: number;
}

const ActividadesIndex: React.FC<ActividadesIndexProps> = ({ idRmi }) => {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);

  // States for the Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    descripcion: '',
    fechaInicial: '',
    fechaFinal: '',
    numeroHoras: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`actividades-instructores?idRmi=${idRmi}`);
      const filtered: Actividad[] = res.data;
      setActividades(filtered);
    } catch (error) {
      console.error(error);
      enqueueSnackbar('Error cargando las actividades', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [idRmi]);

  const handleOpenCreate = () => {
    setForm({
      descripcion: '',
      fechaInicial: '',
      fechaFinal: '',
      numeroHoras: ''
    });
    setEditingId(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (actividad: Actividad) => {
    setForm({
      descripcion: actividad.descripcion,
      fechaInicial: actividad.fechaInicial ? actividad.fechaInicial.slice(0, 10) : '',
      fechaFinal: actividad.fechaFinal ? actividad.fechaFinal.slice(0, 10) : '',
      numeroHoras: actividad.numeroHoras.toString()
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        idRmi,
        numeroHoras: Number(form.numeroHoras)
      };

      if (editingId) {
        await axios.put(`actividades-instructores/${editingId}`, payload);
        enqueueSnackbar('Actividad actualizada', { variant: 'success' });
      } else {
        await axios.post('actividades-instructores', payload);
        enqueueSnackbar('Actividad registrada', { variant: 'success' });
      }
      setIsFormOpen(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Error al guardar la actividad';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

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
              <th className="px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {actividades.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No se encontraron actividades para este periodo.
                </td>
              </tr>
            ) : (
              actividades.map((actividad) => (
                <tr key={actividad.id} className="border-b border-gray-100 dark:border-coal-300 hover:bg-gray-50/50 dark:hover:bg-coal-500/50">
                  <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 max-w-[250px]">
                    {actividad.descripcion}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {actividad.fechaInicial ? actividad.fechaInicial.slice(0, 10) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {actividad.fechaFinal ? actividad.fechaFinal.slice(0, 10) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {actividad.numeroHoras}
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
                <div className="col-span-1">
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
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-coal-300 mt-6">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 hover:bg-gray-100 dark:bg-coal-400 dark:hover:bg-coal-300 rounded-lg transition-colors border border-gray-200 dark:border-coal-300"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
