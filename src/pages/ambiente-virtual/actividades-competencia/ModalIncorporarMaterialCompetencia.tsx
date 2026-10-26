import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { MaterialCompetenciaElegible } from './materialCompetencia.types';

interface ModalIncorporarMaterialCompetenciaProps {
  open: boolean;
  idCompetencia: number;
  competenciaNombre?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const origenLabel = (origen?: string | null) => {
  if (origen === 'ACTIVIDAD') return 'Documento de actividad';
  if (origen === 'MATERIAL_APOYO') return 'Material de apoyo';
  return origen || '—';
};

const formatearFecha = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
};

const ModalIncorporarMaterialCompetencia: React.FC<ModalIncorporarMaterialCompetenciaProps> = ({
  open,
  idCompetencia,
  competenciaNombre,
  onClose,
  onSuccess,
  onError,
}) => {
  const [q, setQ] = useState('');
  const [qDebounced, setQDebounced] = useState('');
  const [items, setItems] = useState<MaterialCompetenciaElegible[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setQDebounced(q), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const cargar = useCallback(async () => {
    if (!open || idCompetencia <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await materialCompetenciaService.elegibles(idCompetencia, qDebounced);
      setItems(data);
    } catch (err) {
      setItems([]);
      setError(
        materialCompetenciaService.errorMessage(err, 'No se pudieron cargar los materiales existentes.')
      );
    } finally {
      setLoading(false);
    }
  }, [open, idCompetencia, qDebounced]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const clave = (it: MaterialCompetenciaElegible) =>
    `${it.origen}-${it.idActividad ?? 0}-${it.idMaterialApoyoActividad ?? 0}`;

  const incorporar = async (it: MaterialCompetenciaElegible) => {
    const key = clave(it);
    setSavingKey(key);
    try {
      await materialCompetenciaService.incorporar(idCompetencia, {
        origen: it.origen,
        idActividad: it.idActividad,
        idMaterialApoyoActividad: it.idMaterialApoyoActividad,
      });
      onSuccess('Material incorporado a la competencia.');
      setItems((prev) => prev.filter((row) => clave(row) !== key));
    } catch (err) {
      onError(materialCompetenciaService.errorMessage(err, 'Error al incorporar el material.'));
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-4xl">
        <ModalHeader>
          <ModalTitle>Agregar material existente</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-3">
            {competenciaNombre ? (
              <p className="text-xs text-gray-600 dark:text-gray-200">
                Se listan recursos de todos los RAP de{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{competenciaNombre}</span>.
              </p>
            ) : null}

            <input
              type="text"
              className="input w-full"
              placeholder="Buscar por nombre, actividad, instructor o tipo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            {error ? <div className="text-xs text-red-600 dark:text-red-300">{error}</div> : null}

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden max-h-[28rem] overflow-y-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-coal-500">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-white">Nombre</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-600 dark:text-white w-[140px]">Tipo</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-600 dark:text-white">Actividad</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-600 dark:text-white w-[140px]">Instructor</th>
                    <th className="text-left py-2 px-2 text-xs font-semibold text-gray-600 dark:text-white w-[90px]">Fecha</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-white w-[120px]">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-gray-600 dark:text-gray-200">
                        {qDebounced
                          ? 'No hay materiales que coincidan con la búsqueda.'
                          : 'No hay materiales elegibles para este RAP.'}
                      </td>
                    </tr>
                  ) : (
                    items.map((it) => {
                      const key = clave(it);
                      return (
                        <tr key={key} className="border-b border-gray-200 dark:border-gray-700">
                          <td className="py-2.5 px-3 text-sm text-gray-900 dark:text-white min-w-0">
                            <span className="block truncate" title={it.titulo}>
                              {it.titulo}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-xs text-gray-700 dark:text-gray-200">{origenLabel(it.origen)}</td>
                          <td className="py-2.5 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                            <span className="block truncate" title={it.actividadTitulo || undefined}>
                              {it.actividadTitulo || '—'}
                            </span>
                            {it.rapNombre ? (
                              <span className="block truncate text-[10px] text-gray-500 dark:text-gray-300" title={it.rapNombre}>
                                {it.rapNombre}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-2 text-xs text-gray-700 dark:text-gray-200 min-w-0">
                            <span className="block truncate" title={it.instructor?.nombreCompleto || undefined}>
                              {it.instructor?.nombreCompleto || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-xs text-gray-600 dark:text-gray-200">
                            {formatearFecha(it.created_at)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              disabled={savingKey === key}
                              onClick={() => void incorporar(it)}
                            >
                              {savingKey === key ? 'Agregando...' : 'Incorporar'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button type="button" className="btn btn-light" onClick={onClose}>
                <KeenIcon icon="cross" className="text-sm mr-1.5" />
                Cerrar
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalIncorporarMaterialCompetencia;
