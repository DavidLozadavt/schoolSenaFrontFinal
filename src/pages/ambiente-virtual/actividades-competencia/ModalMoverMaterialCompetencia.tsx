import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import {
  compactReactSelectNoOptions,
  compactReactSelectWrapClassNames,
} from '@/components/forms/compactReactSelect';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { CompetenciaAccesible, MaterialCompetenciaItem } from './materialCompetencia.types';

interface ModalMoverMaterialCompetenciaProps {
  open: boolean;
  material: MaterialCompetenciaItem | null;
  competenciaActual: CompetenciaAccesible;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const selectClassNames = {
  ...compactReactSelectWrapClassNames,
  control: (state: { isFocused: boolean; isDisabled: boolean }) =>
    `${compactReactSelectWrapClassNames.control()} dark:text-white ${
      state.isDisabled ? 'opacity-60' : ''
    } ${state.isFocused ? '!border-primary ring-2 ring-primary/30' : 'hover:border-primary/40'}`,
  singleValue: () => `${compactReactSelectWrapClassNames.singleValue()} dark:!text-white`,
  placeholder: () => 'text-gray-400 dark:!text-white/90 text-sm whitespace-normal',
  menu: () => `${compactReactSelectWrapClassNames.menu()} dark:text-white`,
  option: (state: { isFocused: boolean; isSelected: boolean }) =>
    `${compactReactSelectWrapClassNames.option(state)} dark:!text-white ${state.isSelected ? '!text-white' : ''}`,
};

const etiquetaCompetencia = (c: CompetenciaAccesible) =>
  c.codigo ? `${c.codigo} · ${c.nombreMateria}` : c.nombreMateria;

const ModalMoverMaterialCompetencia: React.FC<ModalMoverMaterialCompetenciaProps> = ({
  open,
  material,
  competenciaActual,
  onClose,
  onSuccess,
  onError,
}) => {
  const [competencias, setCompetencias] = useState<CompetenciaAccesible[]>([]);
  const [idDestino, setIdDestino] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const origenBloqueado =
    material?.origen === 'ACTIVIDAD' || material?.origen === 'MATERIAL_APOYO'
      ? material.origen === 'ACTIVIDAD'
        ? 'Este material está vinculado a una actividad. No se puede mover a otra competencia porque la actividad, sus evidencias y calificaciones permanecerían en el RAP original.'
        : 'Este material está vinculado a una actividad. No se puede mover a otra competencia porque el material de apoyo debe permanecer con su actividad original.'
      : null;

  useEffect(() => {
    if (!open) return;
    setIdDestino(null);
    setErrorCarga(null);
    setSaving(false);
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await materialCompetenciaService.listarCompetencias();
        if (cancelled) return;
        const vistos = new Set<number>();
        const unicas = res.data.filter((c) => {
          if (!c.id || c.id === competenciaActual.id || vistos.has(c.id)) return false;
          vistos.add(c.id);
          return true;
        });
        setCompetencias(unicas);
      } catch (err) {
        if (cancelled) return;
        setCompetencias([]);
        setErrorCarga(
          materialCompetenciaService.errorMessage(err, 'No se pudieron cargar las competencias.')
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, competenciaActual.id]);

  const opciones = useMemo(
    () => competencias.map((c) => ({ value: c.id, label: etiquetaCompetencia(c) })),
    [competencias]
  );

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleMover = async () => {
    if (!material || !idDestino || saving || origenBloqueado) return;
    setSaving(true);
    try {
      const res = await materialCompetenciaService.mover(competenciaActual.id, material.id, idDestino);
      onSuccess(res.message || 'Material movido correctamente a la competencia seleccionada.');
      onClose();
    } catch (err) {
      onError(materialCompetenciaService.errorMessage(err, 'No se pudo mover el material.'));
    } finally {
      setSaving(false);
    }
  };

  const destinoValido = Boolean(idDestino && idDestino !== competenciaActual.id && !origenBloqueado);

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-lg w-[calc(100%-1.5rem)]">
        <ModalHeader>
          <ModalTitle>Mover material a otra competencia</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Material
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                {material?.titulo || '—'}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Competencia actual
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-100 break-words">
                {etiquetaCompetencia(competenciaActual)}
              </p>
            </div>

            {origenBloqueado ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                {origenBloqueado}
              </div>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-200">
                El material será trasladado a la competencia seleccionada. Sus documentos, videos, enlaces y
                demás recursos se conservarán.
              </p>
            )}

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                Competencia de destino
              </label>
              <Select
                placeholder={loading ? 'Cargando competencias...' : 'Buscar por código o nombre'}
                options={opciones}
                value={opciones.find((o) => o.value === idDestino) ?? null}
                onChange={(opt) => setIdDestino(opt?.value ?? null)}
                classNames={selectClassNames}
                isDisabled={loading || saving || Boolean(origenBloqueado)}
                isSearchable
                noOptionsMessage={() =>
                  loading ? 'Cargando...' : competencias.length === 0 ? 'No hay otras competencias disponibles' : compactReactSelectNoOptions()
                }
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 130 }) }}
              />
              {errorCarga ? <p className="text-xs text-red-600 dark:text-red-300 mt-1">{errorCarga}</p> : null}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn btn-light" onClick={handleClose} disabled={saving}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!destinoValido || saving || loading}
                onClick={() => void handleMover()}
              >
                {saving ? 'Moviendo...' : 'Mover material'}
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalMoverMaterialCompetencia;
