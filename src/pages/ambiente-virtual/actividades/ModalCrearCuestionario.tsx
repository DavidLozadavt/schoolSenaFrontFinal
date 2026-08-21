import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

const CLASIFICACION_OPCIONES = ['General'] as const;
type ClasificacionCuestionario = (typeof CLASIFICACION_OPCIONES)[number];

const TIPO_PREGUNTA_OPCIONES = ['Párrafo', 'Varias opciones'] as const;
type TipoPregunta = (typeof TIPO_PREGUNTA_OPCIONES)[number];

interface OpcionPregunta {
  id: string;
  texto: string;
  esCorrecta: boolean;
}

interface Pregunta {
  id: string;
  tipo: TipoPregunta;
  titulo: string;
  explicacionRespuesta: string;
  fotoFile: File | null;
  opciones: OpcionPregunta[];
}

interface CuestionarioEditar {
  id: number;
  tituloActividad?: string;
  descripcionActividad?: string;
  autor?: string;
  idMateria?: number;
  preguntas?: {
    id?: number;
    descripcion?: string;
    explicacionRespuesta?: string | null;
    tipoPregunta?: { tipoPregunta: string };
    respuestas?: { descripcionRespuesta: string; chkCorrecta: boolean }[];
  }[];
}

interface ModalCrearCuestionarioProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  onSuccess?: (message: string) => void;
  idMateria?: number;
  cuestionarioEditar?: CuestionarioEditar | null;
}

const generarId = () => Math.random().toString(36).slice(2, 11);

const ImagenPreviewPregunta: React.FC<{ file: File }> = ({ file }) => {
  const [url, setUrl] = useState<string>('');
  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return (
    <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-coal-400 max-w-[200px]">
      <img src={url} alt="Vista previa" className="w-full h-auto max-h-[150px] object-contain" />
    </div>
  );
};

const ModalCrearCuestionario: React.FC<ModalCrearCuestionarioProps> = ({ open, onClose, onSave, onSuccess, idMateria: idMateriaProp, cuestionarioEditar }) => {
  const [titulo, setTitulo] = useState('');
  const [clasificacion, setClasificacion] = useState<ClasificacionCuestionario | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [idMateria, setIdMateria] = useState<number>(0);
  const [materias, setMaterias] = useState<any[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = !!cuestionarioEditar?.id;

  useEffect(() => {
    if (open) {
      axios.get('materia').then((r) => {
        const data = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setMaterias(data);
        const valorInicial = idMateriaProp ?? cuestionarioEditar?.idMateria ?? 0;
        setIdMateria(valorInicial);
      }).catch(() => setMaterias([]));
    }
  }, [open, idMateriaProp, cuestionarioEditar?.idMateria]);

  useEffect(() => {
    if (open && idMateriaProp) setIdMateria(idMateriaProp);
  }, [open, idMateriaProp]);

  useEffect(() => {
    if (open && cuestionarioEditar?.id) {
      axios.get(`actividades/${cuestionarioEditar.id}`).then((r) => {
        const data = r.data;
        setTitulo(data.tituloActividad || '');
        setClasificacion((data.autor || '') as ClasificacionCuestionario | '');
        setDescripcion(data.descripcionActividad || '');
        setIdMateria(data.idMateria || 0);
        setPreguntas((data.preguntas || []).map((p: any) => ({
          id: generarId(),
          tipo: (p.tipoPregunta?.tipoPregunta || 'Párrafo') as TipoPregunta,
          titulo: p.descripcion || '',
          explicacionRespuesta: p.explicacionRespuesta || '',
          fotoFile: null,
          opciones: (p.respuestas || []).map((r: any) => ({
            id: generarId(),
            texto: r.descripcionRespuesta || '',
            esCorrecta: !!r.chkCorrecta
          }))
        })));
      }).catch(() => {
        setTitulo(cuestionarioEditar.tituloActividad || '');
        setClasificacion((cuestionarioEditar.autor || '') as ClasificacionCuestionario | '');
        setDescripcion(cuestionarioEditar.descripcionActividad || '');
        setIdMateria(cuestionarioEditar.idMateria || 0);
        setPreguntas((cuestionarioEditar.preguntas || []).map((p) => ({
          id: generarId(),
          tipo: (p.tipoPregunta?.tipoPregunta || 'Párrafo') as TipoPregunta,
          titulo: p.descripcion || '',
          explicacionRespuesta: p.explicacionRespuesta || '',
          fotoFile: null,
          opciones: (p.respuestas || []).map((r) => ({
            id: generarId(),
            texto: r.descripcionRespuesta || '',
            esCorrecta: !!r.chkCorrecta
          }))
        })));
      });
    } else if (open && !cuestionarioEditar) {
      setTitulo('');
      setClasificacion('');
      setDescripcion('');
      setPreguntas([]);
    }
  }, [open, cuestionarioEditar?.id]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    // Solo el RAP del contexto de clase. Nunca materias[0]: asociaría un RAP incorrecto.
    const idMateriaFinal = Number(idMateriaProp || idMateria || 0);
    if (!idMateriaFinal || !Number.isFinite(idMateriaFinal) || idMateriaFinal <= 0) {
      alert('No se identificó el RAP de la clase. No se puede guardar el cuestionario.');
      return;
    }
    setSaving(true);
    try {
      const preguntasPayload = preguntas.map((p) => ({
        tipo: p.tipo,
        titulo: p.titulo,
        explicacionRespuesta: p.explicacionRespuesta.trim() || null,
        opciones: p.tipo === 'Varias opciones' ? p.opciones.map((o) => ({ texto: o.texto, esCorrecta: o.esCorrecta })) : []
      }));

      const fd = new FormData();
      fd.append('titulo', titulo.trim());
      fd.append('clasificacion', clasificacion || '');
      fd.append('descripcion', descripcion);
      fd.append('idMateria', String(idMateriaFinal));
      fd.append('preguntas', JSON.stringify(preguntasPayload));

      preguntas.forEach((p, i) => {
        if (p.fotoFile) fd.append(`foto_pregunta_${i}`, p.fotoFile);
      });

      if (isEdit && cuestionarioEditar?.id) {
        fd.append('_method', 'PUT');
        await axios.post(`cuestionarios/${cuestionarioEditar.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        onSuccess?.('Cuestionario actualizado correctamente');
      } else {
        await axios.post('cuestionarios', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        onSuccess?.('Cuestionario creado correctamente');
      }
      onSave?.();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Error guardando cuestionario:', err);
      alert(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join('\n') : err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitulo('');
    setClasificacion('');
    setDescripcion('');
    setPreguntas([]);
  };

  const handleAñadirPregunta = () => {
    setPreguntas((prev) => [
      ...prev,
      {
        id: generarId(),
        tipo: 'Varias opciones',
        titulo: '',
        explicacionRespuesta: '',
        fotoFile: null,
        opciones: [
          { id: generarId(), texto: '', esCorrecta: false },
          { id: generarId(), texto: '', esCorrecta: false }
        ]
      }
    ]);
  };

  const actualizarPregunta = (id: string, cambios: Partial<Pregunta>) => {
    setPreguntas((prev) => prev.map((p) => (p.id === id ? { ...p, ...cambios } : p)));
  };

  const eliminarPregunta = (id: string) => {
    setPreguntas((prev) => prev.filter((p) => p.id !== id));
  };

  const añadirOpcion = (idPregunta: string) => {
    setPreguntas((prev) =>
      prev.map((p) =>
        p.id === idPregunta
          ? { ...p, opciones: [...p.opciones, { id: generarId(), texto: '', esCorrecta: false }] }
          : p
      )
    );
  };

  const actualizarOpcion = (idPregunta: string, idOpcion: string, texto: string, esCorrecta: boolean) => {
    setPreguntas((prev) =>
      prev.map((p) => {
        if (p.id !== idPregunta) return p;
        if (esCorrecta) {
          return {
            ...p,
            opciones: p.opciones.map((o) =>
              o.id === idOpcion ? { ...o, texto, esCorrecta: true } : { ...o, esCorrecta: false }
            )
          };
        }
        return {
          ...p,
          opciones: p.opciones.map((o) => (o.id === idOpcion ? { ...o, texto, esCorrecta } : o))
        };
      })
    );
  };

  const eliminarOpcion = (idPregunta: string, idOpcion: string) => {
    setPreguntas((prev) =>
      prev.map((p) =>
        p.id === idPregunta ? { ...p, opciones: p.opciones.filter((o) => o.id !== idOpcion) } : p
      )
    );
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <div className="flex min-h-[100dvh] w-full items-center justify-center p-3 sm:px-5 sm:py-10 box-border pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-2xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <ModalContent className="!flex w-full !max-w-none !flex-col !overflow-hidden !rounded-2xl border border-gray-200/90 bg-white !p-0 shadow-2xl dark:border-gray-600/60 dark:bg-coal-400 max-h-[min(94dvh,960px)]">
            <ModalHeader className="!shrink-0 border-b border-gray-100 dark:border-gray-600/80 px-5 sm:px-6 py-3.5">
              <ModalTitle>{isEdit ? 'Editar cuestionario' : 'Crear cuestionario'}</ModalTitle>
              <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0 text-red-600 hover:bg-red-50" onClick={onClose}>
                <KeenIcon icon="cross" />
              </button>
            </ModalHeader>
            <ModalBody className="cuestionario-modal-scroll !flex !min-h-0 !flex-1 !flex-col !overflow-y-auto [scrollbar-gutter:stable] !px-5 !py-5 sm:!px-6">
              <form onSubmit={handleGuardar} className="modal-form-actividades space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Título del cuestionario</label>
              <input
                type="text"
                className="input w-full p-2 text-sm"
                placeholder="Ingrese título del cuestionario"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                data-preserve-case
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Clasificación de Actividad</label>
              <select
                className="input w-full p-2 text-sm"
                value={clasificacion}
                onChange={(e) => setClasificacion((e.target.value || '') as ClasificacionCuestionario | '')}
              >
                <option value="">Seleccione clasificación</option>
                {CLASIFICACION_OPCIONES.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">RAP</label>
              {idMateriaProp ? (
                <div className="p-2 text-sm rounded bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                  {(() => {
                    const m = materias.find((x) => x.id === idMateriaProp);
                    return m ? `${m.codigo ? `${m.codigo} - ` : ''}${m.nombreMateria || m.nombre || ''}` : `RAP del RAPS`;
                  })()}
                </div>
              ) : (
                <select
                  className="input w-full p-2 text-sm"
                  value={idMateria || ''}
                  onChange={(e) => setIdMateria(Number(e.target.value))}
                  required
                >
                  <option value="">Seleccione RAP</option>
                  {materias.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.codigo ? `${m.codigo} - ` : ''}{m.nombreMateria || m.nombre || `RAP ${m.id}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Descripción del cuestionario</label>
              <textarea
                className="input w-full p-2 text-sm min-h-[100px] max-h-[350px] overflow-y-auto overflow-x-hidden resize-y break-words"
                style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                placeholder="Ingrese descripción del cuestionario"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                data-preserve-case
                rows={5}
              />
            </div>

            {/* Preguntas */}
            {preguntas.map((pregunta) => (
              <div
                key={pregunta.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 bg-gray-50/50 dark:bg-coal-400/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-600 dark:text-white">
                    Pregunta {preguntas.indexOf(pregunta) + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => eliminarPregunta(pregunta.id)}
                    className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50"
                    title="Eliminar pregunta"
                  >
                    <KeenIcon icon="trash" className="text-sm" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Tipo de pregunta</label>
                  <select
                    className="input w-full p-2 text-sm"
                    value={pregunta.tipo}
                    onChange={(e) => actualizarPregunta(pregunta.id, { tipo: e.target.value as TipoPregunta })}
                  >
                    {TIPO_PREGUNTA_OPCIONES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Pregunta</label>
                  <input
                    type="text"
                    className="input w-full p-2 text-sm"
                    placeholder="Ingrese el texto de la pregunta"
                    value={pregunta.titulo}
                    onChange={(e) => actualizarPregunta(pregunta.id, { titulo: e.target.value })}
                    data-preserve-case
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Imagen (opcional)</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`foto-${pregunta.id}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) actualizarPregunta(pregunta.id, { fotoFile: f });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById(`foto-${pregunta.id}`)?.click()}
                      className="btn btn-sm btn-light"
                    >
                      Seleccionar archivo
                    </button>
                    <span className="text-xs text-gray-500 dark:text-white">
                      {pregunta.fotoFile ? pregunta.fotoFile.name : 'Sin archivos seleccionados'}
                    </span>
                  </div>
                  {pregunta.fotoFile && (
                    <ImagenPreviewPregunta file={pregunta.fotoFile} />
                  )}
                </div>

                {pregunta.tipo === 'Varias opciones' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">Opciones</label>
                    <div className="space-y-2">
                      {pregunta.opciones.map((opcion) => (
                        <div key={opcion.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            className="input flex-1 p-2 text-sm"
                            placeholder="Texto de la opción"
                            value={opcion.texto}
                            onChange={(e) =>
                              actualizarOpcion(pregunta.id, opcion.id, e.target.value, opcion.esCorrecta)
                            }
                            data-preserve-case
                          />
                          <label className="flex items-center gap-1 shrink-0 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={opcion.esCorrecta}
                              onChange={(e) =>
                                actualizarOpcion(pregunta.id, opcion.id, opcion.texto, e.target.checked)
                              }
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600 dark:text-white">Correcta</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => eliminarOpcion(pregunta.id, opcion.id)}
                            className="p-1.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200"
                            title="Eliminar opción"
                          >
                            <KeenIcon icon="trash" className="text-sm" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => añadirOpcion(pregunta.id)}
                      className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      + AÑADIR OPCIÓN
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">
                    Explicación de la respuesta correcta
                  </label>
                  <textarea
                    className="input w-full p-2 text-sm min-h-[80px] max-h-[250px] overflow-y-auto overflow-x-hidden resize-y break-words"
                    style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}
                    placeholder="Explique por qué la respuesta seleccionada es correcta..."
                    value={pregunta.explicacionRespuesta}
                    onChange={(e) =>
                      actualizarPregunta(pregunta.id, { explicacionRespuesta: e.target.value })
                    }
                    data-preserve-case
                    rows={3}
                  />
                </div>
              </div>
            ))}

                <div className="flex justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-600/50">
                  <button type="button" onClick={handleAñadirPregunta} className="btn btn-primary">
                    + AÑADIR PREGUNTA
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Guardando...' : isEdit ? 'Actualizar cuestionario' : '+ GUARDAR CUESTIONARIO'}
                  </button>
                </div>
              </form>
            </ModalBody>
          </ModalContent>
        </div>
      </div>
    </Modal>
  );
};

export default ModalCrearCuestionario;
