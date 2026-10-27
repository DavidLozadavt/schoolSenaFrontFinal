import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { useAuthContext } from '@/auth';
import { CarpetaViajeraItem, ArchivoCarpeta } from '../types/carpetasViajeras';
import { handleOpenArchivo } from '../hooks/openDocument';

const CarpetaViajera: React.FC = () => {
  const { persona } = useAuthContext();

  const [carpetas, setCarpetas] = useState<CarpetaViajeraItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingCarpeta, setEditingCarpeta] = useState<CarpetaViajeraItem | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  const [selectedCarpeta, setSelectedCarpeta] = useState<CarpetaViajeraItem | null>(null);
  const [showFilesModal, setShowFilesModal] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Form states
  const [formData, setFormData] = useState({
    nivel_academico: 'TECNICO' as 'BACHILLERATO' | 'TECNICO' | 'TECNOLOGO',
    modulo: '',
    total_horas: '' as number | '',
    total: '' as number | '',
    codigo_transferencia: ''
  });

  const [editFormData, setEditFormData] = useState({
    nivel_academico: 'TECNICO' as 'BACHILLERATO' | 'TECNICO' | 'TECNOLOGO',
    modulo: '',
    total_horas: '' as number | '',
    total: '' as number | '',
    codigo_transferencia: ''
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch carpetas viajeras del instructor
  const fetchCarpetas = useCallback(async () => {
    setLoading(true);
    try {
      const personaId = persona?.id;
      const url = personaId ? `carpetas-viajeras?persona_id=${personaId}` : 'carpetas-viajeras';
      const response = await axios.get(url);

      // Soporta tanto array plano como { data: [...] } (Resource/paginado)
      const raw = response.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

      setCarpetas(list);
    } catch (error: any) {
      console.error('Error al cargar carpetas viajeras:', error);
      enqueueSnackbar('No se pudieron cargar las carpetas viajeras', { variant: 'error' });
      setCarpetas([]); // importante: nunca dejar carpetas en estado no-array
    } finally {
      setLoading(false);
    }
  }, [persona?.id]);

  useEffect(() => {
    fetchCarpetas();
  }, [fetchCarpetas]);

  // Open Edit Modal
  const handleOpenEditModal = (item: CarpetaViajeraItem) => {
    if (item.aprobada) {
      enqueueSnackbar('No se puede editar una carpeta que ya ha sido aprobada.', {
        variant: 'warning'
      });
      return;
    }
    setEditingCarpeta(item);
    setEditFormData({
      nivel_academico: item.nivel_academico,
      modulo: item.modulo,
      total_horas: item.total_horas,
      total: Number(item.total) || 0,
      codigo_transferencia: item.codigo_transferencia || ''
    });
    setShowEditModal(true);
  };

  // Handle Edit Carpeta
  const handleUpdateCarpeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCarpeta) return;

    if (!editFormData.modulo.trim()) {
      enqueueSnackbar('El nombre del módulo es obligatorio', { variant: 'warning' });
      return;
    }

    setUpdating(true);
    try {
      const payload = {
        ...editFormData,
        total_horas: editFormData.total_horas === '' ? 0 : Number(editFormData.total_horas),
        total: editFormData.total === '' ? 0 : Number(editFormData.total)
      };

      const response = await axios.put<CarpetaViajeraItem>(
        `carpetas-viajeras/${editingCarpeta.id}`,
        payload
      );
      enqueueSnackbar('Carpeta viajera actualizada con éxito', { variant: 'success' });
      setCarpetas((prev) => prev.map((c) => (c.id === editingCarpeta.id ? response.data : c)));
      setShowEditModal(false);
      setEditingCarpeta(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al actualizar la carpeta viajera';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  // Handle Crear Carpeta
  const handleCreateCarpeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!persona?.id) {
      enqueueSnackbar('No se encontró el ID del usuario/persona autenticado.', {
        variant: 'warning'
      });
      return;
    }

    if (!formData.modulo.trim()) {
      enqueueSnackbar('El nombre del módulo es obligatorio', { variant: 'warning' });
      return;
    }

    setCreating(true);
    try {
      const payload = {
        ...formData,
        total_horas: formData.total_horas === '' ? 0 : Number(formData.total_horas),
        total: formData.total === '' ? 0 : Number(formData.total),
        persona_id: persona.id,
        aprobada: false,
        pago: 'PENDIENTE'
      };

      const response = await axios.post<CarpetaViajeraItem>('carpetas-viajeras', payload);
      enqueueSnackbar('Carpeta viajera creada con éxito', { variant: 'success' });
      setCarpetas((prev) => [response.data, ...prev]);
      setShowCreateModal(false);
      setFormData({
        nivel_academico: 'TECNICO',
        modulo: '',
        total_horas: '' as number | '',
        total: '' as number | '',
        codigo_transferencia: ''
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al crear la carpeta viajera';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setCreating(false);
    }
  };

  // Handle Upload Archivo
  const handleUploadArchivo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCarpeta || !selectedFile) {
      enqueueSnackbar('Seleccione un archivo válido para subir', { variant: 'warning' });
      return;
    }

    setUploading(true);
    try {
      const data = new FormData();
      data.append('archivo', selectedFile);
      data.append('aprobada', '0');

      const response = await axios.post<ArchivoCarpeta>(
        `carpetas-viajeras/${selectedCarpeta.id}/archivos`,
        data,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      enqueueSnackbar('Archivo adjuntado correctamente', { variant: 'success' });

      // Actualizar estado local
      const updatedArchivos = [...(selectedCarpeta.archivos || []), response.data];
      const allApproved = updatedArchivos.length > 0 && updatedArchivos.every((a) => a.aprobada);
      const updatedCarpeta = {
        ...selectedCarpeta,
        archivos: updatedArchivos,
        aprobada: allApproved
      };
      setSelectedCarpeta(updatedCarpeta);
      setCarpetas((prev) => prev.map((c) => (c.id === selectedCarpeta.id ? updatedCarpeta : c)));

      setSelectedFile(null);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al subir el archivo';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Delete Archivo
  const handleDeleteArchivo = async (archivoId: number) => {
    if (!selectedCarpeta) return;
    if (!window.confirm('¿Está seguro de eliminar este archivo?')) return;

    try {
      await axios.delete(`carpetas-viajeras/${selectedCarpeta.id}/archivos/${archivoId}`);
      enqueueSnackbar('Archivo eliminado correctamente', { variant: 'success' });

      const updatedArchivos = (selectedCarpeta.archivos || []).filter((a) => a.id !== archivoId);
      const allApproved = updatedArchivos.length > 0 && updatedArchivos.every((a) => a.aprobada);
      const updatedCarpeta = {
        ...selectedCarpeta,
        archivos: updatedArchivos,
        aprobada: allApproved
      };
      setSelectedCarpeta(updatedCarpeta);
      setCarpetas((prev) => prev.map((c) => (c.id === selectedCarpeta.id ? updatedCarpeta : c)));
    } catch (error: any) {
      enqueueSnackbar('Error al eliminar el archivo', { variant: 'error' });
    }
  };

  // Delete Carpeta
  const handleDeleteCarpeta = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta carpeta viajera y todos sus archivos?'))
      return;

    try {
      await axios.delete(`carpetas-viajeras/${id}`);
      enqueueSnackbar('Carpeta viajera eliminada correctamente', { variant: 'success' });
      setCarpetas((prev) => prev.filter((c) => c.id !== id));
      if (selectedCarpeta?.id === id) {
        setShowFilesModal(false);
        setSelectedCarpeta(null);
      }
    } catch (error: any) {
      enqueueSnackbar('Error al eliminar la carpeta viajera', { variant: 'error' });
    }
  };

  // Stats
  const totalCarpetas = carpetas.length;
  const aprobadas = carpetas.filter((c) => c.aprobada).length;
  const pendientes = carpetas.filter((c) => !c.aprobada).length;
  const totalHoras = carpetas.reduce((acc, c) => acc + (Number(c.total_horas) || 0), 0);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-coal-500 p-6 rounded-2xl border border-gray-200 dark:border-coal-300 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <i className="ki-outline ki-folder text-2xl" />
            </span>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              Mis Carpetas Viajeras
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestione y radique sus carpetas viajeras para la revisión y aprobación por parte de
            secretaría.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer self-start md:self-auto"
        >
          <i className="ki-outline ki-plus text-lg" />
          Nueva Carpeta Viajera
        </button>
      </div>

      {/* Cards KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <i className="ki-outline ki-folder text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Registradas</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{totalCarpetas}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <i className="ki-outline ki-check-circle text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Aprobadas</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{aprobadas}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <i className="ki-outline ki-time text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Pendientes de Revisión</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{pendientes}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-coal-500 p-5 rounded-xl border border-gray-200 dark:border-coal-300 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <i className="ki-outline ki-timer text-xl" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Total Horas</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">{totalHoras} hrs</p>
          </div>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white">
            Listado de Carpetas Viajeras
          </h2>
          <button
            onClick={fetchCarpetas}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <i className="ki-outline ki-arrows-loop text-sm" /> Recargar
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Cargando carpetas viajeras...
          </div>
        ) : carpetas.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <i className="ki-outline ki-folder-down text-4xl text-gray-300 dark:text-gray-600" />
            <p className="text-sm">Aún no ha creado ninguna carpeta viajera.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              Crear mi primera carpeta
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-coal-400/50 text-gray-500 dark:text-gray-400 font-medium text-xs uppercase tracking-wider border-b border-gray-100 dark:border-coal-300">
                <tr>
                  <th className="px-6 py-3.5">Módulo / Programa</th>
                  <th className="px-6 py-3.5">Nivel Académico</th>
                  <th className="px-6 py-3.5">Horas</th>
                  <th className="px-6 py-3.5">Transf. / Ref</th>
                  <th className="px-6 py-3.5">Archivos</th>
                  <th className="px-6 py-3.5">Estado Aprobación</th>
                  <th className="px-6 py-3.5">Estado Pago</th>
                  <th className="px-6 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-coal-300 text-gray-700 dark:text-gray-300">
                {carpetas.map((item) => {
                  const numArchivos = item.archivos?.length || 0;
                  const aprobadosArchivos = item.archivos?.filter((a) => a.aprobada).length || 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-coal-400/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">
                        {item.modulo}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          {item.nivel_academico}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.total_horas} hrs</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        {item.codigo_transferencia || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedCarpeta(item);
                            setShowFilesModal(true);
                          }}
                          className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
                        >
                          <i className="ki-outline ki-file text-sm" />
                          {numArchivos} archivo(s) ({aprobadosArchivos} aprobados)
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {item.aprobada ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <i className="ki-outline ki-check-circle text-xs" /> Aprobada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            <i className="ki-outline ki-time text-xs" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                            item.pago === 'ENTREGADO'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : item.pago === 'CANCELADO'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {item.pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!item.aprobada ? (
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              title="Editar Carpeta"
                              className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                            >
                              <i className="ki-outline ki-pencil text-base" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title="No editable (Aprobada por Secretaría)"
                              className="p-2 text-gray-300 dark:text-gray-600 cursor-not-allowed rounded-lg"
                            >
                              <i className="ki-outline ki-pencil text-base" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedCarpeta(item);
                              setShowFilesModal(true);
                            }}
                            title="Gestionar Archivos"
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          >
                            <i className="ki-outline ki-document text-base" />
                          </button>
                          <button
                            onClick={() => handleDeleteCarpeta(item.id)}
                            title="Eliminar Carpeta"
                            className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          >
                            <i className="ki-outline ki-trash text-base" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Crear Carpeta Viajera */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-coal-500 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-coal-300 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i className="ki-outline ki-folder-add text-blue-600 text-xl" />
                Nueva Carpeta Viajera
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateCarpeta} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nivel Académico *
                </label>
                <select
                  value={formData.nivel_academico}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nivel_academico: e.target.value as 'BACHILLERATO' | 'TECNICO' | 'TECNOLOGO'
                    })
                  }
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="TECNICO">TÉCNICO</option>
                  <option value="TECNOLOGO">TECNÓLOGO</option>
                  <option value="BACHILLERATO">BACHILLERATO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Módulo / Asignatura *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Programación Orientada a Objetos"
                  value={formData.modulo}
                  onChange={(e) => setFormData({ ...formData, modulo: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Total Horas *
                  </label>
                  <input
                    type="number"
                    value={formData.total_horas ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total_horas: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Valor / Total ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.total ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        total: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Cuenta para el pago
                </label>
                <input
                  type="text"
                  placeholder="Ej: TR-2026-001"
                  value={formData.codigo_transferencia}
                  onChange={(e) =>
                    setFormData({ ...formData, codigo_transferencia: e.target.value })
                  }
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-400 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  {creating && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Guardar Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Editar Carpeta Viajera */}
      {showEditModal && editingCarpeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-coal-500 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-coal-300 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <i className="ki-outline ki-pencil text-amber-600 text-xl" />
                Editar Carpeta Viajera
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </div>

            <form onSubmit={handleUpdateCarpeta} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nivel Académico *
                </label>
                <select
                  value={editFormData.nivel_academico}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      nivel_academico: e.target.value as 'BACHILLERATO' | 'TECNICO' | 'TECNOLOGO'
                    })
                  }
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                >
                  <option value="TECNICO">TÉCNICO</option>
                  <option value="TECNOLOGO">TECNÓLOGO</option>
                  <option value="BACHILLERATO">BACHILLERATO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Módulo / Asignatura *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Programación Orientada a Objetos"
                  value={editFormData.modulo}
                  onChange={(e) => setEditFormData({ ...editFormData, modulo: e.target.value })}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Total Horas *
                  </label>
                  <input
                    type="number"
                    value={editFormData.total_horas ?? ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        total_horas: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Valor / Total ($)
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={editFormData.total ?? ''}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        total: e.target.value === '' ? '' : Number(e.target.value)
                      })
                    }
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Cuenta para el pago
                </label>
                <input
                  type="text"
                  placeholder="Ej: TR-2026-001"
                  value={editFormData.codigo_transferencia}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, codigo_transferencia: e.target.value })
                  }
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-coal-300 bg-white dark:bg-coal-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-coal-300">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-400 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-md transition-colors flex items-center gap-2"
                >
                  {updating && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  Actualizar Carpeta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gestionar y Subir Archivos */}
      {showFilesModal && selectedCarpeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-coal-500 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-coal-300 animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <i className="ki-outline ki-paperclip text-blue-600 text-xl" />
                  Archivos Adjuntos — {selectedCarpeta.modulo}
                </h3>
                <p className="text-xs text-gray-400">
                  Nivel: {selectedCarpeta.nivel_academico} | Horas: {selectedCarpeta.total_horas}
                </p>
              </div>
              <button
                onClick={() => setShowFilesModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Upload Form */}
              <form
                onSubmit={handleUploadArchivo}
                className="bg-gray-50 dark:bg-coal-400/40 p-4 rounded-xl border border-dashed border-gray-300 dark:border-coal-300 space-y-3"
              >
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Subir nuevo documento (PDF, Excel y Word - Máx 10MB)
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept=".pdf,.xls,.xlsx,.doc,.docx"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      const allowedExtensions = ['.pdf', '.xls', '.xlsx', '.doc', '.docx'];
                      const mimeTypes = [
                        'application/pdf',
                        'application/vnd.ms-excel',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/msword',
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                      ];
                      const isAllowed =
                        !file ||
                        allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)) ||
                        mimeTypes.includes(file.type);

                      if (file && !isAllowed) {
                        enqueueSnackbar(
                          'Solo se permiten archivos PDF, Excel (.xls/.xlsx) y Word (.doc/.docx).',
                          { variant: 'warning' }
                        );
                        e.target.value = '';
                        setSelectedFile(null);
                        return;
                      }

                      setSelectedFile(file);
                    }}
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className={`w-full sm:w-auto px-5 py-2 text-xs font-medium text-white rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                      uploading || !selectedFile
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                    }`}
                  >
                    {uploading && (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    Subir Archivo
                  </button>
                </div>
              </form>

              {/* Archivos List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                  Documentos Adjuntados ({selectedCarpeta.archivos?.length || 0})
                </h4>

                {!selectedCarpeta.archivos || selectedCarpeta.archivos.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 border border-gray-100 dark:border-coal-300 rounded-xl">
                    <i className="ki-outline ki-file-slash text-3xl text-gray-300 dark:text-gray-600 mb-1" />
                    <p className="text-xs">No hay archivos adjuntos en esta carpeta.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedCarpeta.archivos.map((archivo) => (
                      <div
                        key={archivo.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-coal-600 border border-gray-200 dark:border-coal-300 shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                            <i className="ki-outline ki-document text-base" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-medium text-gray-800 dark:text-white truncate">
                              {archivo.nombreArchivo ||
                                archivo.urlArchivo?.split('/').pop() ||
                                `Archivo #${archivo.id}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {archivo.aprobada ? (
                                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                  <i className="ki-outline ki-check-circle text-[10px]" /> Aprobado
                                  por secretaría
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                  <i className="ki-outline ki-time text-[10px]" /> Pendiente de
                                  revisión
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {archivo.rutaArchivoUrl && (
                            <button
                              type="button"
                              onClick={() => handleOpenArchivo(archivo, selectedCarpeta.id)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs rounded-lg font-medium hover:bg-blue-100 transition-colors flex items-center gap-1"
                            >
                              <i className="ki-outline ki-eye text-xs" /> Ver / Descargar
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteArchivo(archivo.id)}
                            title="Eliminar archivo"
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          >
                            <i className="ki-outline ki-trash text-sm" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 dark:border-coal-300 flex justify-end">
              <button
                onClick={() => setShowFilesModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-coal-400 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarpetaViajera;
