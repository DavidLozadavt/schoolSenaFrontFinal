import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ProcesoItem {
  id: number;
  nombreProceso: string;
  descripcion?: string;
}

interface Doc {
  id: number;
  codigo: number;
  nombre: string;
  descripcion: string;
}

interface VerDocumentosProcesoModalProps {
  isOpen: boolean;
  onClose: () => void;
  proceso: ProcesoItem | null;
}

export const VerDocumentosProcesoModal = ({
  isOpen,
  onClose,
  proceso,
}: VerDocumentosProcesoModalProps) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && proceso?.id) {
      setLoading(true);
      axios
        .get(`proceso/${proceso.id}/documentos-pide`)
        .then((res) => {
          if (res.data?.status === 'success' && res.data?.data?.documentos) {
            setDocs(res.data.data.documentos);
          } else {
            setDocs([]);
          }
        })
        .catch(() => setDocs([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, proceso?.id]);

  if (!isOpen) return null;

  const label = proceso?.nombreProceso ?? `Proceso #${proceso?.id}`;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-coal-600 rounded-xl shadow-lg border border-gray-200 dark:border-coal-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-50 dark:bg-coal-200">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800 dark:text-white">
            Documentos que pide – {label}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white"
          >
            <i className="text-lg ki-filled ki-cross" />
          </button>
        </div>
        <div className="p-5 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : docs.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic py-4 text-center">
              No hay documentos asignados a este proceso.
            </p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex justify-between items-start gap-3 py-2 border-b border-gray-100 dark:border-coal-100/50 last:border-0"
                >
                  <div>
                    <span className="font-medium text-gray-800 dark:text-white">{d.nombre}</span>
                    {d.descripcion && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{d.descripcion}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">#{d.codigo}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-coal-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-bold uppercase rounded-lg bg-primary text-white hover:bg-primary-active"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
