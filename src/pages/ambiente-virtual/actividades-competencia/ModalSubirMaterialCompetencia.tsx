import React, { useEffect, useRef, useState } from 'react';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { extensionFromFileName } from '@/pages/ambiente-virtual/actividades/materialDocumentoSupport';
import { TIPO_MATERIAL_OPTIONS } from '@/pages/ambiente-virtual/actividades/tipoMaterialApoyo';
import { materialCompetenciaService } from './materialCompetenciaService';
import type { MaterialCompetenciaItem, MaterialCompetenciaRecursoItem } from './materialCompetencia.types';
import {
  DOCUMENTO_COMPETENCIA_ACCEPT,
  DOCUMENTO_COMPETENCIA_FORMATOS_LABEL,
  MULTIMEDIA_ACCEPT,
  MULTIMEDIA_FORMATOS_LABEL,
  clasificarEnlace,
  etiquetaFormatoEnlace,
  esAudioFormato,
  nombreRecurso,
  recursosPorTipo,
  validateDocumentoCompetenciaFile,
  validateMultimediaCompetenciaFile,
} from './materialCompetenciaRecurso';

interface ModalSubirMaterialCompetenciaProps {
  open: boolean;
  idCompetencia: number;
  competenciaNombre?: string;
  material?: MaterialCompetenciaItem | null;
  onClose: () => void;
  onSuccess: (message: string, material?: MaterialCompetenciaItem) => void;
  onError: (message: string) => void;
}

interface EnlaceDraft {
  key: string;
  url: string;
  titulo: string;
}

const nuevoEnlace = (): EnlaceDraft => ({ key: `${Date.now()}-${Math.random()}`, url: '', titulo: '' });

const ModalSubirMaterialCompetencia: React.FC<ModalSubirMaterialCompetenciaProps> = ({
  open,
  idCompetencia,
  competenciaNombre,
  material,
  onClose,
  onSuccess,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipoMaterial, setTipoMaterial] = useState('');
  const [documentos, setDocumentos] = useState<File[]>([]);
  const [multimedia, setMultimedia] = useState<File[]>([]);
  const [enlaces, setEnlaces] = useState<EnlaceDraft[]>([nuevoEnlace()]);
  const [existentes, setExistentes] = useState<MaterialCompetenciaRecursoItem[]>([]);
  const [saving, setSaving] = useState(false);
  const esEdicion = Boolean(material?.id);

  useEffect(() => {
    if (!open) return;
    setTitulo(material?.titulo || '');
    setDescripcion(material?.descripcion || '');
    setTipoMaterial(material?.tipoMaterial || '');
    setDocumentos([]);
    setMultimedia([]);
    setEnlaces([nuevoEnlace()]);
    setExistentes(material ? recursosPorTipo(material).todos : []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  }, [open, material]);

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const agregarDocumentos = (lista: FileList | null) => {
    if (!lista?.length) return;
    const next = [...documentos];
    for (const file of Array.from(lista)) {
      const err = validateDocumentoCompetenciaFile(file);
      if (err) {
        onError(err);
        return;
      }
      next.push(file);
    }
    setDocumentos(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const agregarMultimedia = (lista: FileList | null) => {
    if (!lista?.length) return;
    const next = [...multimedia];
    for (const file of Array.from(lista)) {
      const err = validateMultimediaCompetenciaFile(file);
      if (err) {
        onError(err);
        return;
      }
      next.push(file);
    }
    setMultimedia(next);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const quitarExistente = async (recurso: MaterialCompetenciaRecursoItem) => {
    if (!material?.id || recurso.id == null) return;
    if (!window.confirm('¿Quitar este recurso del material? Los demás se conservan.')) return;
    setSaving(true);
    try {
      const actualizado = await materialCompetenciaService.eliminarRecurso(idCompetencia, material.id, recurso.id);
      setExistentes(recursosPorTipo(actualizado).todos);
      onSuccess('Recurso eliminado.', actualizado);
    } catch (err) {
      onError(materialCompetenciaService.errorMessage(err, 'No se pudo eliminar el recurso.'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (!titulo.trim()) {
      onError('El nombre del material es obligatorio.');
      return;
    }
    const enlacesValidos: { url: string; titulo: string }[] = [];
    for (const enlace of enlaces) {
      if (!enlace.url.trim() && !enlace.titulo.trim()) continue;
      const clasif = clasificarEnlace(enlace.url);
      if (!clasif.ok || !clasif.url) {
        onError(clasif.mensaje || 'Hay un enlace inválido.');
        return;
      }
      enlacesValidos.push({ url: clasif.url, titulo: enlace.titulo.trim() });
    }
    if (esEdicion) {
      for (const rec of existentes.filter((r) => r.tipo === 'ENLACE')) {
        const clasif = clasificarEnlace(rec.urlExterna || rec.url || '');
        if (!clasif.ok || !clasif.url) {
          onError(clasif.mensaje || 'Hay un enlace guardado inválido.');
          return;
        }
      }
    }
    if (!esEdicion && documentos.length === 0 && multimedia.length === 0 && enlacesValidos.length === 0) {
      onError('Agregue al menos un documento, archivo multimedia o enlace.');
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('descripcion', descripcion.trim().slice(0, 3000));
      if (tipoMaterial) fd.append('tipoMaterial', tipoMaterial);
      documentos.forEach((file) => fd.append('documentos[]', file));
      multimedia.forEach((file) => fd.append('multimedia[]', file));
      enlacesValidos.forEach((enlace, i) => {
        fd.append(`enlaces[${i}][url]`, enlace.url);
        if (enlace.titulo) fd.append(`enlaces[${i}][titulo]`, enlace.titulo);
      });
      if (esEdicion) {
        existentes
          .filter((r) => r.tipo === 'ENLACE' && r.id != null)
          .forEach((rec, i) => {
            fd.append(`enlacesActualizar[${i}][id]`, String(rec.id));
            fd.append(`enlacesActualizar[${i}][url]`, rec.urlExterna || rec.url || '');
            fd.append(`enlacesActualizar[${i}][titulo]`, rec.titulo || '');
          });
      }
      const saved = esEdicion
        ? await materialCompetenciaService.actualizar(idCompetencia, material!.id, fd)
        : await materialCompetenciaService.subir(idCompetencia, fd);
      onSuccess(esEdicion ? 'Material actualizado.' : 'Material agregado a la competencia.', saved);
      onClose();
    } catch (err) {
      onError(materialCompetenciaService.errorMessage(err, 'Error al guardar el material.'));
    } finally {
      setSaving(false);
    }
  };

  const docsExistentes = existentes.filter((r) => r.tipo === 'DOCUMENTO');
  const mediaExistentes = existentes.filter((r) => r.tipo === 'MULTIMEDIA');
  const enlacesExistentes = existentes.filter((r) => r.tipo === 'ENLACE');

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-2xl w-[calc(100%-1.5rem)] max-h-[92vh] overflow-hidden flex flex-col">
        <ModalHeader>
          <ModalTitle>{esEdicion ? 'Editar material' : 'Agregar material'}</ModalTitle>
        </ModalHeader>
        <ModalBody className="overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {competenciaNombre ? (
              <p className="text-xs text-gray-600 dark:text-gray-200">
                Competencia destino:{' '}
                <span className="font-semibold text-gray-900 dark:text-white">{competenciaNombre}</span>
              </p>
            ) : null}

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Nombre del material</label>
              <input
                type="text"
                className="input w-full"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={255}
                data-preserve-case
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Descripción</label>
              <textarea
                className="textarea w-full min-h-[80px]"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value.slice(0, 3000))}
                maxLength={3000}
                data-preserve-case
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-1">Tipo de material</label>
              <select className="select w-full" value={tipoMaterial} onChange={(e) => setTipoMaterial(e.target.value)}>
                <option value="">Sin tipo</option>
                {TIPO_MATERIAL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Documentos</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-300">Uno o varios archivos. {DOCUMENTO_COMPETENCIA_FORMATOS_LABEL}</p>
              </div>
              {docsExistentes.map((rec) => (
                <div key={`doc-${rec.id}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate min-w-0" title={nombreRecurso(rec)}>
                    {nombreRecurso(rec)}
                    {rec.formato ? ` · ${String(rec.formato).toUpperCase()}` : ''}
                  </span>
                  <button type="button" className="text-red-600 shrink-0" disabled={saving} onClick={() => void quitarExistente(rec)}>
                    Quitar
                  </button>
                </div>
              ))}
              {documentos.map((file, i) => (
                <div key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate min-w-0" title={file.name}>
                    {file.name} · {extensionFromFileName(file.name).toUpperCase() || 'ARCHIVO'}
                  </span>
                  <button type="button" className="text-red-600 shrink-0" onClick={() => setDocumentos((prev) => prev.filter((_, idx) => idx !== i))}>
                    Quitar
                  </button>
                </div>
              ))}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={DOCUMENTO_COMPETENCIA_ACCEPT}
                className="hidden"
                onChange={(e) => agregarDocumentos(e.target.files)}
              />
              <button type="button" className="btn btn-light btn-sm" onClick={() => fileInputRef.current?.click()}>
                <KeenIcon icon="document" className="text-sm mr-1.5" />
                Agregar documentos
              </button>
            </section>

            <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Videos y archivos multimedia</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-300">{MULTIMEDIA_FORMATOS_LABEL}</p>
              </div>
              {mediaExistentes.map((rec) => (
                <div key={`media-${rec.id}`} className="flex items-center justify-between gap-2 text-xs">
                  <span className="truncate min-w-0" title={nombreRecurso(rec)}>
                    {nombreRecurso(rec)} · {esAudioFormato(rec.formato) ? 'AUDIO' : 'VIDEO'}
                    {rec.formato ? ` · ${String(rec.formato).toUpperCase()}` : ''}
                  </span>
                  <button type="button" className="text-red-600 shrink-0" disabled={saving} onClick={() => void quitarExistente(rec)}>
                    Quitar
                  </button>
                </div>
              ))}
              {multimedia.map((file, i) => {
                const ext = extensionFromFileName(file.name);
                return (
                  <div key={`${file.name}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate min-w-0" title={file.name}>
                      {file.name} · {esAudioFormato(ext) ? 'AUDIO' : 'VIDEO'} · {ext.toUpperCase()}
                    </span>
                    <button type="button" className="text-red-600 shrink-0" onClick={() => setMultimedia((prev) => prev.filter((_, idx) => idx !== i))}>
                      Quitar
                    </button>
                  </div>
                );
              })}
              <input
                ref={mediaInputRef}
                type="file"
                multiple
                accept={MULTIMEDIA_ACCEPT}
                className="hidden"
                onChange={(e) => agregarMultimedia(e.target.files)}
              />
              <button type="button" className="btn btn-light btn-sm" onClick={() => mediaInputRef.current?.click()}>
                Agregar archivos multimedia
              </button>
            </section>

            <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Enlaces</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-300">
                  YouTube, PDF externos o páginas web. El tipo se identifica automáticamente.
                </p>
              </div>
              {enlacesExistentes.map((rec) => (
                <div key={`link-${rec.id}`} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-2">
                  <input
                    type="url"
                    className="input w-full"
                    value={rec.urlExterna || rec.url || ''}
                    onChange={(e) =>
                      setExistentes((prev) =>
                        prev.map((row) =>
                          row.id === rec.id ? { ...row, urlExterna: e.target.value, url: e.target.value } : row
                        )
                      )
                    }
                  />
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Título (opcional)"
                    value={rec.titulo || ''}
                    maxLength={255}
                    data-preserve-case
                    onChange={(e) =>
                      setExistentes((prev) => prev.map((row) => (row.id === rec.id ? { ...row, titulo: e.target.value } : row)))
                    }
                  />
                  <button type="button" className="btn btn-sm btn-light" disabled={saving} onClick={() => void quitarExistente(rec)}>
                    Quitar
                  </button>
                  <p className="sm:col-span-3 text-[10px] text-gray-500 dark:text-gray-300">
                    Guardado · {etiquetaFormatoEnlace(clasificarEnlace(rec.urlExterna || rec.url || '').formato)}
                  </p>
                </div>
              ))}
              {enlaces.map((enlace, i) => {
                const clasif = enlace.url.trim() ? clasificarEnlace(enlace.url) : null;
                return (
                  <div key={enlace.key} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-2">
                    <input
                      type="url"
                      className="input w-full"
                      placeholder="https://..."
                      value={enlace.url}
                      onChange={(e) =>
                        setEnlaces((prev) => prev.map((row, idx) => (idx === i ? { ...row, url: e.target.value } : row)))
                      }
                    />
                    <input
                      type="text"
                      className="input w-full"
                      placeholder="Título (opcional)"
                      value={enlace.titulo}
                      maxLength={255}
                      data-preserve-case
                      onChange={(e) =>
                        setEnlaces((prev) => prev.map((row, idx) => (idx === i ? { ...row, titulo: e.target.value } : row)))
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={() => setEnlaces((prev) => (prev.length <= 1 ? [nuevoEnlace()] : prev.filter((_, idx) => idx !== i)))}
                    >
                      Quitar
                    </button>
                    {clasif?.ok ? (
                      <p className="sm:col-span-3 text-[10px] text-gray-500 dark:text-gray-300">
                        Detectado: {etiquetaFormatoEnlace(clasif.formato)}
                      </p>
                    ) : null}
                  </div>
                );
              })}
              <button type="button" className="btn btn-light btn-sm" onClick={() => setEnlaces((prev) => [...prev, nuevoEnlace()])}>
                Agregar enlace
              </button>
            </section>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn btn-light" onClick={handleClose} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar material'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalSubirMaterialCompetencia;
