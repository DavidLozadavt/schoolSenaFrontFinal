import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CrearTipoDocumentoModal } from './CrearTipoDocumentoModal';

interface Ficha {
  id: number;
  grado?: { nombreGrado: string } | null;
  programa?: { nombrePrograma: string; codigoPrograma: string } | null;
}

interface ProcesoItem {
  id: number;
  nombreProceso: string;
  descripcion?: string;
}

interface TipoRow {
  id: number;
  codigo: number;
  tipoDocumento: string;
  descripcion: string;
  asignado: boolean;
  activo?: boolean; // Solo para fichas
}

interface AsignarTiposDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  /** Por proceso (Documentos – [PROGRAM] → doc icon). */
  proceso?: ProcesoItem | null;
  /** Por ficha (Fichas → Asignar tipos). */
  ficha?: Ficha | null;
}

export const AsignarTiposDocumentoModal = ({
  isOpen,
  onClose,
  onSave,
  proceso,
  ficha,
}: AsignarTiposDocumentoModalProps) => {
  const [tipos, setTipos] = useState<TipoRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [crearOpen, setCrearOpen] = useState(false);

  const mode = proceso ? 'proceso' : 'ficha';
  const entityId = proceso?.id ?? ficha?.id;

  const load = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const base = mode === 'proceso' ? `proceso/${entityId}` : `ficha/${entityId}`;
      const res = await axios.get(`${base}/tipos-documento`);
      if (res.data?.status === 'success' && res.data?.data?.tipos) {
        // Para fichas, el backend ya incluye 'activo' en la respuesta
        setTipos(res.data.data.tipos);
      } else {
        setTipos([]);
      }
    } catch (e) {
      console.error('Error cargando tipos:', e);
      setTipos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && entityId) load();
  }, [isOpen, entityId, mode]);

  const toggle = (id: number) => {
    setTipos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, asignado: !t.asignado } : t))
    );
  };

  const toggleActivo = async (id: number, nuevoEstado: boolean) => {
    if (mode !== 'ficha' || !entityId) return;
    try {
      await axios.put(`ficha/${entityId}/documento/${id}/autorizar`, { activo: nuevoEstado });
      setTipos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, activo: nuevoEstado } : t))
      );
    } catch (e: any) {
      console.error('Error al cambiar estado:', e);
      alert(e?.response?.data?.message || 'Error al cambiar estado del documento.');
    }
  };

  const handleGuardar = async () => {
    if (!entityId) return;
    const ids = tipos.filter((t) => t.asignado).map((t) => t.id);
    setSaving(true);
    try {
      const base = mode === 'proceso' ? `proceso/${entityId}` : `ficha/${entityId}`;
      await axios.put(`${base}/tipos-documento`, { ids });
      // Si es ficha y hay documentos asignados, asegurar que tengan activo=true
      if (mode === 'ficha' && ids.length > 0) {
        // El backend ya maneja activo=true por defecto en sync
      }
      onSave();
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || 'Error al guardar asignación.');
    } finally {
      setSaving(false);
    }
  };

  const handleCrearSave = () => {
    setCrearOpen(false);
    load();
  };

  if (!isOpen) return null;

  const label =
    mode === 'proceso'
      ? (proceso?.nombreProceso ?? `Proceso #${entityId}`)
      : (ficha?.grado?.nombreGrado ?? `Ficha #${entityId}`);

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200 flex-shrink-0">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
              Asignar tipos de documentos – {label}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCrearOpen(true)}
                className="px-3 py-1.5 text-xs font-bold uppercase rounded-lg bg-primary text-white hover:bg-primary-active"
              >
                + Agregar tipo de documento
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
              >
                <i className="text-lg ki-filled ki-cross" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tipos.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic py-6 text-center">
                No hay tipos de documento. Use “+ Agregar tipo de documento” para crear.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-coal-100">
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Código</th>
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Tipo de documento</th>
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Descripción</th>
                      <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Asignar</th>
                      {mode === 'ficha' && (
                        <th className="py-2 pr-4 font-bold uppercase text-gray-600 dark:text-gray-400">Estado</th>
                      )}
                      <th className="py-2 font-bold uppercase text-gray-600 dark:text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tipos.map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 dark:border-coal-100/50">
                        <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{t.codigo}</td>
                        <td className="py-2 pr-4 font-medium text-gray-800 dark:text-white">{t.tipoDocumento}</td>
                        <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{t.descripcion || '—'}</td>
                        <td className="py-2 pr-4">
                          <button
                            type="button"
                            onClick={() => toggle(t.id)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                              t.asignado ? 'bg-primary' : 'bg-gray-200 dark:bg-coal-400'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                t.asignado ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        {mode === 'ficha' && (
                          <td className="py-2 pr-4">
                            {t.asignado ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => toggleActivo(t.id, !(t.activo ?? true))}
                                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                                    (t.activo ?? true) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                  }`}
                                  title={(t.activo ?? true) ? 'Activo - Click para inactivar' : 'Inactivo - Click para activar'}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                      (t.activo ?? true) ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                                <span className={`text-xs font-medium ${(t.activo ?? true) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {(t.activo ?? true) ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">Asignar primero</span>
                            )}
                          </td>
                        )}
                        <td className="py-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm(`¿Eliminar "${t.tipoDocumento}"?`)) {
                                try {
                                  await axios.delete(`tipo_documentos/${t.id}`);
                                  load();
                                } catch (e: any) {
                                  alert(e?.response?.data?.message || 'Error al eliminar.');
                                }
                              }
                            }}
                            title="Eliminar"
                            className="flex items-center justify-center w-8 h-8 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                          >
                            <i className="text-lg ki-outline ki-trash" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="flex justify-between gap-2 px-5 py-4 border-t border-gray-200 dark:border-coal-100 flex-shrink-0">
            <button
              type="button"
              onClick={handleGuardar}
              disabled={saving}
              className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-primary text-white hover:bg-primary-active disabled:opacity-50"
            >
              + Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-gray-200 dark:bg-coal-400 text-gray-700 dark:text-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
      <CrearTipoDocumentoModal
        isOpen={crearOpen}
        onClose={() => setCrearOpen(false)}
        onSave={handleCrearSave}
      />
    </>
  );
};
