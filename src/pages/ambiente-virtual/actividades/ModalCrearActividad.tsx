import React, { useEffect, useState, useRef } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useAuthContext } from '@/auth';
import {
  ACTIVIDAD_DOCUMENTO_ACCEPT,
  ACTIVIDAD_DOCUMENTO_FORMATOS_LABEL,
  validateActividadDocumentoFile,
} from './materialDocumentoSupport';

export const TIPO_ACTIVIDAD_ENUM = ['sin evidencia', 'con evidencia', 'cuestionario'] as const;
export type TipoActividadEnum = (typeof TIPO_ACTIVIDAD_ENUM)[number];


export interface PersonaCreador {
  id?: number;
  nombre1?: string;
  nombre2?: string;
  apellido1?: string;
  apellido2?: string;
  rutaFotoUrl?: string;
  rutaFoto?: string;
}

export interface MateriaRef {
  id?: number;
  nombreMateria?: string;
  codigo?: string;
}

export interface EstadoRef {
  id?: number;
  estado?: string;
}

export interface Actividad {
  id?: number;
  tituloActividad: string;
  descripcionActividad?: string;
  pathDocumentoActividad?: string;
  autor?: string;
  tipoActividad: TipoActividadEnum;
  idMateria: number;
  idEstado: number;
  idCompany: number;
  idPersona?: number;
  idClasificacion?: number;
  estrategia?: string;
  entregables?: string;
  persona?: PersonaCreador;
  materia?: MateriaRef;
  estado?: EstadoRef;
}

interface ModalCrearActividadProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  onSuccess?: (message: string) => void;
  /** Devuelve la actividad creada o actualizada (para enlazar en planeación). */
  onCreated?: (actividad: Actividad) => void;
  actividadEditar?: Actividad | null;
  idMateria?: number;
  /** Prefill al crear (ej. desde taller de planeación). */
  initialValues?: Partial<Actividad> | null;
}

const ModalCrearActividad: React.FC<ModalCrearActividadProps> = ({
  open,
  onClose,
  onSave,
  onSuccess,
  onCreated,
  actividadEditar,
  idMateria,
  initialValues
}) => {
  const authContext = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [clasificaciones, setClasificaciones] = useState<any[]>([]);
  const [materias, setMaterias] = useState<any[]>([]);
  const [estados, setEstados] = useState<any[]>([]);
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const descripcionRef = useRef<HTMLTextAreaElement>(null);
  const estrategiaRef = useRef<HTMLTextAreaElement>(null);
  const entregablesRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<Partial<Actividad>>({
    tituloActividad: '',
    descripcionActividad: '',
    pathDocumentoActividad: '',
    autor: '',
    tipoActividad: 'sin evidencia',
    idMateria: idMateria || 0,
    idEstado: 1,
    idCompany: authContext?.empresa?.id || 0,
    idPersona: authContext?.persona?.id,
    idClasificacion: 0,
    estrategia: '',
    entregables: ''
  });

  const autoResize = (ref: React.RefObject<HTMLTextAreaElement | null>, minH = 110) => {
    const ta = ref.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.max(ta.scrollHeight, minH)}px`;
    }
  };

  useEffect(() => {
    autoResize(descripcionRef, 72);
    autoResize(estrategiaRef, 40);
    autoResize(entregablesRef, 40);
  }, [formData.descripcionActividad, formData.estrategia, formData.entregables, open]);

  useEffect(() => {
    if (open) {
      loadCatalogos();
      if (actividadEditar) {
        setFormData({
          ...actividadEditar,
          idCompany: authContext?.empresa?.id || actividadEditar.idCompany,
          idPersona: authContext?.persona?.id || actividadEditar.idPersona
        });
      } else {
        setFormData({
          tituloActividad: initialValues?.tituloActividad || '',
          descripcionActividad: initialValues?.descripcionActividad || '',
          pathDocumentoActividad: '',
          autor: '',
          tipoActividad: initialValues?.tipoActividad || 'sin evidencia',
          idMateria: idMateria || initialValues?.idMateria || 0,
          idEstado: 1,
          idCompany: authContext?.empresa?.id || 0,
          idPersona: authContext?.persona?.id,
          idClasificacion: 0,
          estrategia: initialValues?.estrategia || '',
          entregables: initialValues?.entregables || ''
        });
        setDocumentoFile(null);
      }
    }
  }, [open, actividadEditar, idMateria, initialValues, authContext?.empresa?.id, authContext?.persona?.id]);

  const loadCatalogos = async () => {
    try {
      const [clasRes, materiasRes, estadosRes] = await Promise.allSettled([
        axios.get('clasificacionactividad').catch(() => ({ data: [] })),
        axios.get('materia').catch(() => ({ data: [] })),
        axios.get('estados').catch(() => ({ data: [] }))
      ]);

      setClasificaciones(clasRes.status === 'fulfilled' && Array.isArray(clasRes.value?.data) ? clasRes.value.data : []);
      setMaterias(materiasRes.status === 'fulfilled' && Array.isArray(materiasRes.value?.data) ? materiasRes.value.data : materiasRes.status === 'fulfilled' && materiasRes.value?.data?.data ? materiasRes.value.data.data : []);
      setEstados(estadosRes.status === 'fulfilled' && Array.isArray(estadosRes.value?.data) ? estadosRes.value.data : estadosRes.status === 'fulfilled' && estadosRes.value?.data ? [estadosRes.value.data] : [{ id: 1, estado: 'ACTIVO' }]);
    } catch (e) {
      console.warn('Error cargando catálogos:', e);
    }
  };

  const handleChange = (field: keyof Actividad, value: string | number | TipoActividadEnum) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const idMateriaFinal = formData.idMateria || idMateria || materias[0]?.id;
    if (!formData.tituloActividad || !formData.descripcionActividad || !formData.tipoActividad || !idMateriaFinal || !formData.estrategia || !formData.entregables || !formData.idCompany) {
      return;
    }
    if (documentoFile) {
      const docErr = validateActividadDocumentoFile(documentoFile);
      if (docErr) {
        alert(docErr);
        return;
      }
    }
    setLoading(true);
    try {
      const payload = {
        tituloActividad: formData.tituloActividad,
        descripcionActividad: formData.descripcionActividad || null,
        pathDocumentoActividad: formData.pathDocumentoActividad || null,
        autor: actividadEditar?.autor ?? null,
        tipoActividad: formData.tipoActividad,
        idMateria: idMateriaFinal,
        idEstado: formData.idEstado || 1,
        idCompany: formData.idCompany,
        idPersona: formData.idPersona || null,
        idClasificacion: actividadEditar?.idClasificacion ?? null,
        estrategia: formData.estrategia || null,
        entregables: formData.entregables || null
      };

      if (actividadEditar?.id) {
        let pathDoc = formData.pathDocumentoActividad || null;
        if (documentoFile) {
          const fd = new FormData();
          fd.append('documento', documentoFile);
          const uploadRes = await axios.post(`actividades/${actividadEditar.id}/upload-documento`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          pathDoc = uploadRes.data?.path ?? uploadRes.data?.url ?? null;
        }
        const updateRes = await axios.put(`actividades/${actividadEditar.id}`, {
          ...payload,
          pathDocumentoActividad: pathDoc
        });
        const updated = (updateRes.data?.data ?? updateRes.data ?? {
          ...actividadEditar,
          ...payload,
          id: actividadEditar.id,
          pathDocumentoActividad: pathDoc
        }) as Actividad;
        onCreated?.(updated);
        onSuccess?.('Actividad actualizada correctamente');
      } else {
        const createRes = await axios.post('actividades', payload);
        const createdRaw = createRes.data?.data ?? createRes.data;
        const id = createdRaw?.id;
        let pathDoc = payload.pathDocumentoActividad;
        if (id && documentoFile) {
          const fd = new FormData();
          fd.append('documento', documentoFile);
          const uploadRes = await axios.post(`actividades/${id}/upload-documento`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          pathDoc = uploadRes.data?.path ?? uploadRes.data?.url ?? null;
        }
        const created = {
          ...(typeof createdRaw === 'object' && createdRaw ? createdRaw : {}),
          id,
          tituloActividad: payload.tituloActividad,
          descripcionActividad: payload.descripcionActividad ?? undefined,
          tipoActividad: payload.tipoActividad,
          idMateria: payload.idMateria,
          idEstado: payload.idEstado,
          idCompany: payload.idCompany,
          idPersona: payload.idPersona ?? undefined,
          estrategia: payload.estrategia ?? undefined,
          entregables: payload.entregables ?? undefined,
          pathDocumentoActividad: pathDoc ?? undefined
        } as Actividad;
        onCreated?.(created);
        onSuccess?.('Actividad creada correctamente');
      }
      onSave();
      onClose();
    } catch (err) {
      console.error('Error al guardar actividad:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="relative mx-4 w-full max-w-[640px] max-h-[85vh] overflow-y-auto rounded-xl bg-white p-4 shadow-lg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <ModalHeader className="mb-2 flex items-center justify-between gap-2">
          <ModalTitle>{actividadEditar ? 'Editar Actividad' : 'Crear Actividad'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo de Actividad *</label>
              <select
                className="input w-full p-2 text-sm"
                value={formData.tipoActividad || 'sin evidencia'}
                onChange={(e) => handleChange('tipoActividad', e.target.value as TipoActividadEnum)}
                required
              >
                <option value="sin evidencia">Sin evidencia</option>
                <option value="con evidencia">Con evidencia</option>
                <option value="cuestionario">Cuestionario</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Título de la Actividad *</label>
              <textarea
                className="input w-full resize-y p-2 text-sm min-h-[40px] leading-snug break-words"
                placeholder="Título de la actividad"
                value={formData.tituloActividad || ''}
                onChange={(e) => {
                  handleChange('tituloActividad', e.target.value);
                  const ta = e.target;
                  ta.style.height = 'auto';
                  ta.style.height = `${Math.max(ta.scrollHeight, 40)}px`;
                }}
                rows={1}
                data-preserve-case
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Descripción de la Actividad *</label>
              <textarea
                ref={descripcionRef}
                className="input w-full resize-none overflow-hidden p-2 text-sm min-h-[72px]"
                placeholder="Descripción de la actividad"
                value={formData.descripcionActividad || ''}
                onChange={(e) => handleChange('descripcionActividad', e.target.value)}
                data-preserve-case
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Documento base de la actividad</label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACTIVIDAD_DOCUMENTO_ACCEPT}
                  onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary text-sm"
                >
                  Seleccionar archivo
                </button>
                <span className="text-sm text-gray-500">
                  {documentoFile ? documentoFile.name : 'Ningún archivo seleccionado'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500">{ACTIVIDAD_DOCUMENTO_FORMATOS_LABEL}</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Estrategia de la Actividad *</label>
              <textarea
                ref={estrategiaRef}
                className="input w-full resize-none overflow-hidden p-2 text-sm min-h-[40px]"
                placeholder="Estrategia pedagógica"
                value={formData.estrategia || ''}
                onChange={(e) => handleChange('estrategia', e.target.value)}
                data-preserve-case
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Entregables *</label>
              <textarea
                ref={entregablesRef}
                className="input w-full resize-none overflow-hidden p-2 text-sm min-h-[40px] break-words"
                placeholder="Entregables esperados"
                value={formData.entregables || ''}
                onChange={(e) => handleChange('entregables', e.target.value)}
                data-preserve-case
                required
              />
            </div>

            <div className="flex justify-between gap-2 pt-3">
              <button type="button" className="btn bg-red-600 text-white hover:bg-red-700" onClick={onClose}>
                X CANCELAR
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : actividadEditar ? 'Actualizar' : '+ CREAR ACTIVIDAD'}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalCrearActividad;
