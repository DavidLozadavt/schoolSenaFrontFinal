import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import {
  compactReactSelectNoOptions,
  compactReactSelectWrapClassNames,
} from '@/components/forms/compactReactSelect';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { CompetenciaAccesible, FichaMaterialCompetencia, MaterialCompetenciaItem } from './materialCompetencia.types';

interface ModalMoverMaterialCompetenciaProps {
  open: boolean;
  material: MaterialCompetenciaItem | null;
  competenciaActual: CompetenciaAccesible;
  fichaActual: FichaMaterialCompetencia;
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

const etiquetaFicha = (f: FichaMaterialCompetencia) =>
  f.etiqueta || [f.codigo || f.id, f.programa, f.jornada?.toUpperCase()].filter(Boolean).join(' · ');

const ModalMoverMaterialCompetencia: React.FC<ModalMoverMaterialCompetenciaProps> = ({
  open,
  material,
  competenciaActual,
  fichaActual,
  onClose,
  onSuccess,
  onError,
}) => {
  const [competencias, setCompetencias] = useState<CompetenciaAccesible[]>([]);
  const [idDestino, setIdDestino] = useState<number | null>(null);
  const [fichas, setFichas] = useState<FichaMaterialCompetencia[]>([]);
  const [idFichaDestino, setIdFichaDestino] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFichas, setLoadingFichas] = useState(false);
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
    setIdDestino(competenciaActual.id);
    setIdFichaDestino(null);
    setFichas([]);
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
          if (!c.id || vistos.has(c.id)) return false;
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

  useEffect(() => {
    if (!open || !idDestino) {
      setFichas([]);
      setIdFichaDestino(null);
      return;
    }
    let cancelled = false;
    setLoadingFichas(true);
    setIdFichaDestino(null);
    (async () => {
      try {
        const lista = await materialCompetenciaService.listarFichas(idDestino);
        if (cancelled) return;
        setFichas(lista);
        const otra = lista.find((f) => !(idDestino === competenciaActual.id && f.id === fichaActual.id));
        setIdFichaDestino(otra?.id ?? (lista.length === 1 ? lista[0].id : null));
      } catch {
        if (cancelled) return;
        setFichas([]);
        setIdFichaDestino(null);
      } finally {
        if (!cancelled) setLoadingFichas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, idDestino, competenciaActual.id, fichaActual.id]);

  const opciones = useMemo(
    () => competencias.map((c) => ({ value: c.id, label: etiquetaCompetencia(c) })),
    [competencias]
  );

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleMover = async () => {
    if (!material || !idDestino || !idFichaDestino || saving) return;
    if (origenBloqueado && idDestino !== competenciaActual.id) return;
    setSaving(true);
    try {
      const res = await materialCompetenciaService.mover(
        competenciaActual.id,
        material.id,
        idDestino,
        idFichaDestino
      );
      onSuccess(res.message || 'Material movido correctamente a la competencia y ficha seleccionadas.');
      onClose();
    } catch (err) {
      onError(materialCompetenciaService.errorMessage(err, 'No se pudo mover el material.'));
    } finally {
      setSaving(false);
    }
  };

  const mismoDestino = idDestino === competenciaActual.id && idFichaDestino === fichaActual.id;
  const bloqueoCompetencia = Boolean(origenBloqueado && idDestino !== competenciaActual.id);
  const destinoValido = Boolean(idDestino && idFichaDestino && !mismoDestino && !bloqueoCompetencia);

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-lg w-[calc(100%-1.5rem)]">
        <ModalHeader>
          <ModalTitle>Mover material</ModalTitle>
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
                Competencia y ficha actuales
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-100 break-words">
                {etiquetaCompetencia(competenciaActual)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-200 mt-0.5">
                {etiquetaFicha(fichaActual)}
              </p>
            </div>

            {bloqueoCompetencia ? (
              <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                {origenBloqueado}
              </div>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-200">
                El material se mueve a la competencia y ficha de destino. No se duplica. La fecha y el
                horario no forman parte de la asignación.
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
                isDisabled={loading || saving}
                isSearchable
                noOptionsMessage={() =>
                  loading ? 'Cargando...' : competencias.length === 0 ? 'No hay competencias disponibles' : compactReactSelectNoOptions()
                }
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 130 }) }}
              />
              {errorCarga ? <p className="text-xs text-red-600 dark:text-red-300 mt-1">{errorCarga}</p> : null}
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-white mb-1 block">
                Ficha de destino
              </label>
              <Select
                placeholder={loadingFichas ? 'Cargando fichas...' : 'Seleccione una ficha'}
                options={fichas.map((f) => ({ value: f.id, label: etiquetaFicha(f) }))}
                value={
                  fichas
                    .map((f) => ({ value: f.id, label: etiquetaFicha(f) }))
                    .find((o) => o.value === idFichaDestino) ?? null
                }
                onChange={(opt) => setIdFichaDestino(opt?.value ?? null)}
                classNames={selectClassNames}
                isDisabled={loading || loadingFichas || saving || !idDestino}
                isSearchable
                noOptionsMessage={() =>
                  loadingFichas ? 'Cargando...' : fichas.length === 0 ? 'No hay fichas compatibles' : compactReactSelectNoOptions()
                }
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                menuPosition="fixed"
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 130 }) }}
              />
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
