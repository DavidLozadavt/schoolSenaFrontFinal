import React, { useEffect, useState, useRef } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useAuthContext } from '@/auth';

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
  actividadEditar?: Actividad | null;
  idMateria?: number;
}

const ModalCrearActividad: React.FC<ModalCrearActividadProps> = ({
  open,
  onClose,
  onSave,
  onSuccess,
  actividadEditar,
  idMateria
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

  const autoResize = (ref: React.RefObject<HTMLTextAreaElement | null>, minH = 40) => {
    const ta = ref.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.max(ta.scrollHeight, minH)}px`;
    }
  };

  useEffect(() => {
    autoResize(descripcionRef, 80);
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
        setDocumentoFile(null);
      }
    }
  }, [open, actividadEditar, idMateria, authContext?.empresa?.id, authContext?.persona?.id]);

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
        await axios.put(`actividades/${actividadEditar.id}`, { ...payload, pathDocumentoActividad: pathDoc });
        onSuccess?.('Actividad actualizada correctamente');
      } else {
        const createRes = await axios.post('actividades', payload);
        const id = createRes.data?.id;
        if (id && documentoFile) {
          const fd = new FormData();
          fd.append('documento', documentoFile);
          await axios.post(`actividades/${id}/upload-documento`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }
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
      <ModalContent className="max-w-[600px] top-[10%] max-h-[90vh] overflow-y-auto p-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:[display:none]">
        <ModalHeader>
          <ModalTitle>{actividadEditar ? 'Editar Actividad' : 'Crear Actividad'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-4 px-0 py-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Actividad *</label>
              <select
                className="input w-full p-2 text-sm"
                value={formData.tipoActividad || 'sin evidencia'}
                onChange={(e) => handleChange('tipoActividad', e.target.value as TipoActividadEnum)}
                required
              >
                <option value="sin evidencia">Sin evidencia</option>
                <option value="con evidencia">Con evidencia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título de la Actividad *</label>
              <input
                type="text"
                className="input w-full p-2 text-sm"
                placeholder="Título de la actividad"
                value={formData.tituloActividad || ''}
                onChange={(e) => handleChange('tituloActividad', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción de la Actividad *</label>
              <textarea
                ref={descripcionRef}
                className="input w-full p-2 text-sm min-h-[80px] overflow-hidden resize-none"
                placeholder="Descripción de la actividad"
                value={formData.descripcionActividad || ''}
                onChange={(e) => handleChange('descripcionActividad', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Documento base de la actividad</label>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
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
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {documentoFile ? documentoFile.name : 'Ningún archivo seleccionado'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Formatos aceptados: .pdf, .doc, .docx</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estrategia de la Actividad *</label>
              <textarea
                ref={estrategiaRef}
                className="input w-full p-2 text-sm min-h-[40px] overflow-hidden resize-none"
                placeholder="Estrategia pedagógica"
                value={formData.estrategia || ''}
                onChange={(e) => handleChange('estrategia', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Entregables *</label>
              <textarea
                ref={entregablesRef}
                className="input w-full p-2 text-sm min-h-[40px] overflow-hidden resize-none"
                placeholder="Entregables esperados"
                value={formData.entregables || ''}
                onChange={(e) => handleChange('entregables', e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <button type="button" className="btn bg-red-600 hover:bg-red-700 text-white" onClick={onClose}>
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
