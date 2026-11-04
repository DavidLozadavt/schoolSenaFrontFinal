import React, { useState } from 'react';
import axios from 'axios';

interface CrearProcesoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const CrearProcesoModal = ({ isOpen, onClose, onSave }: CrearProcesoModalProps) => {
  const [nombreProceso, setNombreProceso] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!nombreProceso.trim()) {
      alert('Ingrese el nombre del proceso.');
      return;
    }
    setSaving(true);
    try {
      await axios.post('procesos', {
        nombreProceso: nombreProceso.trim(),
        descripcion: descripcion.trim(),
      });
      setNombreProceso('');
      setDescripcion('');
      onSave();
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || 'Error al crear proceso.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
            Crear proceso
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors"
          >
            <i className="text-lg ki-filled ki-cross" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
              Nombre proceso
            </label>
            <input
              type="text"
              value={nombreProceso}
              onChange={(e) => setNombreProceso(e.target.value)}
              placeholder="Ej. DOCUMENTOS MATRICULA"
              className="w-full px-3 py-2 border border-gray-300 dark:border-coal-100 rounded-lg bg-white dark:bg-coal-300 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
              Descripción proceso
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-coal-100 rounded-lg bg-white dark:bg-coal-300 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-coal-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !nombreProceso.trim()}
            className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-primary text-white hover:bg-primary-active disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
};
