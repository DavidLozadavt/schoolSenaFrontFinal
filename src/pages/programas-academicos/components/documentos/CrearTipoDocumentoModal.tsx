import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface CrearTipoDocumentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (documento?: any) => void;
  /** Si se pasa, el documento se crea en este proceso y se oculta el selector. */
  idProcesoFijo?: number | null;
}

export const CrearTipoDocumentoModal = ({ isOpen, onClose, onSave, idProcesoFijo }: CrearTipoDocumentoModalProps) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idProceso, setIdProceso] = useState<number>(0);
  const [procesos, setProcesos] = useState<{ id: number; nombreProceso: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setDescripcion('');
      setIdProceso(idProcesoFijo ?? 0);
      const fn = async () => {
        setLoading(true);
        try {
          const res = await axios.get('procesos');
          const list = Array.isArray(res.data) ? res.data : [];
          setProcesos(list);
          if (idProcesoFijo != null) setIdProceso(idProcesoFijo);
          else if (list.length) setIdProceso(list[0].id);
        } catch (e) {
          console.error('Error cargando procesos:', e);
        } finally {
          setLoading(false);
        }
      };
      fn();
    }
  }, [isOpen, idProcesoFijo]);

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      alert('Ingrese el título del documento.');
      return;
    }
    const pid = idProcesoFijo ?? (idProceso || (procesos[0]?.id ?? 0));
    if (!pid) {
      alert('Cree al menos un proceso antes de agregar tipos de documento.');
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post('tipo_documentos', {
        tituloDocumento: titulo.trim(),
        descripcion: descripcion.trim(),
        idProceso: pid,
        idEstado: 1,
        fechaTipo: 'NINGUNA',
      });
      const raw = res.data;
      const idDoc = raw?.idTipoDocumento ?? raw?.id;
      const nuevoDoc = idDoc != null ? { id: idDoc } : undefined;
      onSave(nuevoDoc);
      onClose();
    } catch (e: any) {
      console.error(e);
      alert(e?.response?.data?.message || 'Error al crear tipo de documento.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
            Crear tipo de documento
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
              Título del documento
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Cédula, Hoja de vida"
              className="w-full px-3 py-2 border border-gray-300 dark:border-coal-100 rounded-lg bg-white dark:bg-coal-300 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
              Descripción
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción breve"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-coal-100 rounded-lg bg-white dark:bg-coal-300 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
          {idProcesoFijo == null && (loading ? (
            <p className="text-xs text-gray-500">Cargando procesos…</p>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase text-gray-600 dark:text-gray-400 mb-1">
                Proceso
              </label>
              <select
                value={idProceso}
                onChange={(e) => setIdProceso(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-coal-100 rounded-lg bg-white dark:bg-coal-300 text-gray-800 dark:text-white text-sm"
              >
                <option value={0}>Seleccionar proceso</option>
                {procesos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombreProceso}</option>
                ))}
              </select>
            </div>
          ))}
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
            disabled={saving || !titulo.trim()}
            className="px-4 py-2 text-sm font-bold uppercase rounded-lg bg-primary text-white hover:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando…' : '+ Aceptar'}
          </button>
        </div>
      </div>
    </div>
  );
};
