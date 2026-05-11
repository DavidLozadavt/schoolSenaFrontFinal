import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import {
  compactReactSelectClassNames,
  compactReactSelectNoOptions,
  filterOptionNormalized
} from '@/components/forms/compactReactSelect';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';

export interface RapOpcion {
  id: number;
  nombreMateria?: string;
  codigo?: string | null;
}

interface ModalMoverActividadRapProps {
  open: boolean;
  onClose: () => void;
  actividad: Actividad | null;
  idFicha: number;
  /** id de `horarioMateria` de la clase (ruta), para alinear planeación con el backend. */
  idHorarioMateria?: number;
  onSave: () => void;
  onSuccess?: (message: string) => void;
}

/** Texto completo del RAP (búsqueda + tooltip), mismo criterio que el `<select>` anterior. */
function rapLabelCompleto(r: RapOpcion): string {
  const base = [r.codigo, r.nombreMateria].filter(Boolean).join(' — ');
  return base.trim() !== '' ? base : `RAP ${r.id}`;
}

const selectClassNames = {
  ...compactReactSelectClassNames,
  control: () =>
    `${compactReactSelectClassNames.control()} min-w-0 max-w-full`,
  singleValue: () =>
    `${compactReactSelectClassNames.singleValue()} !max-w-[calc(100%-1.5rem)] truncate`,
  menu: () => `${compactReactSelectClassNames.menu()} !min-w-full !max-w-full shadow-md rounded-md`,
  menuList: () => `${compactReactSelectClassNames.menuList()} max-h-56 overflow-y-auto overflow-x-hidden`,
  option: (state: { isFocused: boolean; isSelected: boolean; isDisabled?: boolean }) =>
    `${compactReactSelectClassNames.option(state)} min-w-0 max-w-full ${
      state.isDisabled ? 'opacity-60 cursor-not-allowed' : ''
    }`
} as const;

const ModalMoverActividadRap: React.FC<ModalMoverActividadRapProps> = ({
  open,
  onClose,
  actividad,
  idFicha,
  idHorarioMateria,
  onSave,
  onSuccess
}) => {
  const [opcionesRap, setOpcionesRap] = useState<RapOpcion[]>([]);
  const [idDestino, setIdDestino] = useState<number>(0);
  const [loadingRaps, setLoadingRaps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const idMateriaActual = actividad?.idMateria;

  const textoRapActual = useMemo(() => {
    const cod = actividad?.materia?.codigo?.trim();
    const nom = actividad?.materia?.nombreMateria?.trim();
    const joined = [cod, nom].filter(Boolean).join(' — ');
    if (joined) return joined;
    if (idMateriaActual != null) return `RAP ID ${idMateriaActual}`;
    return '—';
  }, [actividad?.materia?.codigo, actividad?.materia?.nombreMateria, idMateriaActual]);

  const destinoSeleccionado = useMemo(
    () => (idDestino ? opcionesRap.find((r) => r.id === idDestino) ?? null : null),
    [idDestino, opcionesRap]
  );

  const destinoValido =
    Boolean(idDestino) && idMateriaActual != null && idDestino !== idMateriaActual;

  useEffect(() => {
    if (!open || idFicha <= 0) return;
    setError('');
    setIdDestino(0);
    setLoadingRaps(true);
    axios
      .get<RapOpcion[]>(`fichas/${idFicha}/raps-horario-actividades`)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : [];
        setOpcionesRap(raw.filter((r) => r && typeof r.id === 'number'));
      })
      .catch(() => {
        setOpcionesRap([]);
        setError('No se pudieron cargar los RAP de la ficha.');
      })
      .finally(() => setLoadingRaps(false));
  }, [open, idFicha]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!actividad?.id || idFicha <= 0) {
      setError('Faltan datos de actividad o ficha.');
      return;
    }
    if (!destinoValido) {
      setError('Selecciona un RAP destino distinto al actual.');
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, number> = {
        idFicha,
        idRapDestino: idDestino
      };
      if (idHorarioMateria && idHorarioMateria > 0) {
        payload.id_horario_materia = idHorarioMateria;
      }
      await axios.put(`actividades/${actividad.id}/mover-rap`, payload);
      onSuccess?.('Actividad movida correctamente.');
      onSave();
      onClose();
    } catch (err: unknown) {
      const ex = err as {
        response?: { data?: { error?: string; message?: string; errors?: Record<string, string[]> } };
      };
      const errs = ex.response?.data?.errors;
      const firstField =
        errs && typeof errs === 'object'
          ? Object.values(errs).find((v) => Array.isArray(v) && v.length)?.[0]
          : undefined;
      const msg =
        ex.response?.data?.error ||
        ex.response?.data?.message ||
        firstField ||
        ex.response?.data?.errors?.idRapDestino?.[0] ||
        'No se pudo mover la actividad. Verifica el RAP seleccionado.';
      setError(typeof msg === 'string' ? msg : 'No se pudo mover la actividad. Verifica el RAP seleccionado.');
    } finally {
      setSaving(false);
    }
  };

  const onSelectDestino = (opt: SingleValue<RapOpcion>) => {
    setIdDestino(opt?.id ?? 0);
    setError('');
  };

  const esRapActual = (r: RapOpcion) => idMateriaActual != null && r.id === idMateriaActual;

  return (
    <Modal open={open} onClose={onClose} zIndex={120} className="flex items-center justify-center p-4 sm:p-6">
      <ModalContent className="max-w-[min(100vw-2rem,760px)] w-full max-h-[min(90vh,900px)] overflow-hidden flex flex-col my-auto">
        <ModalHeader>
          <ModalTitle>Mover actividad</ModalTitle>
          <button
            type="button"
            className="btn btn-sm btn-icon btn-light btn-clear text-red-600 hover:text-red-700"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="overflow-y-auto flex-1 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-5 pb-1">
            <section>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Actividad
              </p>
              <p
                className="mt-1 text-sm font-medium text-gray-900 dark:text-white leading-snug break-words"
                title={actividad?.tituloActividad || undefined}
              >
                {actividad?.tituloActividad || '—'}
              </p>
            </section>

            <section>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                RAP actual
              </p>
              <p
                className="mt-1 text-sm text-gray-800 dark:text-gray-200 leading-snug line-clamp-3"
                title={textoRapActual}
              >
                {textoRapActual}
              </p>
            </section>

            <section className="min-w-0">
              <label
                htmlFor="rap-destino-select"
                className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5"
              >
                RAP destino
              </label>
              <Select<RapOpcion, false>
                inputId="rap-destino-select"
                instanceId="mover-actividad-rap-destino"
                options={opcionesRap}
                value={destinoSeleccionado}
                onChange={onSelectDestino}
                placeholder={loadingRaps ? 'Cargando RAP…' : 'Buscar por código o nombre del RAP…'}
                isClearable
                isSearchable
                isDisabled={loadingRaps || saving}
                isLoading={loadingRaps}
                isOptionDisabled={esRapActual}
                getOptionValue={(r) => String(r.id)}
                getOptionLabel={rapLabelCompleto}
                formatOptionLabel={(r) => {
                  const full = rapLabelCompleto(r);
                  return (
                    <div className="min-w-0 max-w-full py-0.5" title={full}>
                      <div className="text-sm font-medium leading-snug truncate">{full}</div>
                      {esRapActual(r) ? (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">RAP actual (no disponible)</div>
                      ) : null}
                    </div>
                  );
                }}
                filterOption={(option, raw) =>
                  filterOptionNormalized(
                    [
                      option.data.codigo,
                      option.data.nombreMateria,
                      rapLabelCompleto(option.data),
                      String(option.data.id)
                    ],
                    raw
                  )
                }
                classNamePrefix="react-select-mover-rap"
                classNames={selectClassNames}
                noOptionsMessage={compactReactSelectNoOptions}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                styles={{
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            </section>

            {error ? (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" className="btn btn-light" onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || loadingRaps || !destinoValido}
              >
                {saving ? 'Moviendo…' : 'Mover actividad'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalMoverActividadRap;
