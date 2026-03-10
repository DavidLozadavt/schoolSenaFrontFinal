import React, { useState, useEffect, useMemo } from 'react';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';

interface MaterialApoyo {
  id: number;
  titulo: string;
  descripcion?: string;
  urlDocumento?: string;
  urlAdicional?: string;
}

interface FichaInfo {
  idFicha: number;
  codigo?: string;
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  jornada?: string;
  instructorLider?: {
    rutaFoto?: string;
    nombre?: string;
  };
}

interface ActividadAprendiz {
  idCalificacionActividad: number;
  idActividad: number;
  codigo?: string;
  tituloActividad: string;
  descripcionActividad?: string;
  pathDocumentoActividad?: string;
  tipoActividad: string;
  entregables?: string;
  estrategia?: string;
  autor?: string;
  idMateria?: number;
  materia?: { nombreMateria: string; codigo?: string };
  estado?: { estado: string };
  fechaInicial: string;
  fechaFinal: string;
  calificacionNumerica?: string;
  calificacionEstandart?: string;
  ComentarioDocente?: string;
  ComentarioEstudiante?: string;
  archivo?: string;
  asignadoPor?: string;
  instructorRutaFoto?: string;
  ficha?: FichaInfo;
  materialesApoyo: MaterialApoyo[];
}

const getDocumentUrl = (path: string | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (axios.defaults.baseURL || '').replace(/\/api\/?$/, '') || window.location.origin;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;
  return `${base.replace(/\/$/, '')}/${storagePath}`;
};

const AVATAR_DEFAULT = '/media/brand-logos/user.svg';

const getInstructorFotoUrl = (path: string | undefined): string => {
  if (!path) return AVATAR_DEFAULT;
  const url = getDocumentUrl(path);
  return url || AVATAR_DEFAULT;
};

const formatFecha = (s: string) => {
  if (!s) return '-';
  try {
    const d = new Date(s);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return s;
  }
};

const formatFechaEntrega = (ini: string, fin: string) => {
  const fi = formatFecha(ini);
  const ff = formatFecha(fin);
  return `Extensión: ${fi} hasta ${ff}`;
};

const truncar = (texto: string, max: number) => {
  if (!texto) return '-';
  return texto.length <= max ? texto : texto.slice(0, max) + '...';
};

// Modal Responder
const ModalResponder: React.FC<{
  open: boolean;
  onClose: () => void;
  actividad: ActividadAprendiz | null;
  onEntregado: () => void;
}> = ({ open, onClose, actividad, onEntregado }) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [comentario, setComentario] = useState('');
  const [entregando, setEntregando] = useState(false);

  useEffect(() => {
    if (!open) {
      setArchivo(null);
      setComentario('');
    }
  }, [open]);

  const handleEntregar = async () => {
    if (!actividad) return;
    setEntregando(true);
    try {
      const fd = new FormData();
      fd.append('idCalificacionActividad', String(actividad.idCalificacionActividad));
      if (archivo) fd.append('archivo', archivo);
      if (comentario.trim()) fd.append('ComentarioEstudiante', comentario.trim());
      await axios.post('actividades-aprendiz/entregar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onEntregado();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.error || 'Error al entregar');
    } finally {
      setEntregando(false);
    }
  };

  if (!actividad) return null;
  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Responder actividad</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{actividad.tituloActividad}</p>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Archivo (PDF, DOC, DOCX)</label>
            <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="input w-full text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Comentario (opcional)</label>
            <textarea placeholder="Comentario" value={comentario} onChange={(e) => setComentario(e.target.value.slice(0, 2000))} className="input w-full text-sm min-h-[80px]" maxLength={2000} />
          </div>
          {actividad.archivo && <p className="text-xs text-amber-600 dark:text-amber-400">Ya entregaste un archivo anteriormente</p>}
          <div className="flex gap-2 justify-end">
            <button className="btn btn-sm btn-light" onClick={onClose}>Cancelar</button>
            <button className="btn btn-sm btn-primary" onClick={handleEntregar} disabled={entregando}>{entregando ? 'Enviando...' : 'Enviar entrega'}</button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Modal Ver Actividad
const ModalVerActividad: React.FC<{ open: boolean; onClose: () => void; actividad: ActividadAprendiz | null }> = ({ open, onClose, actividad }) => {
  if (!actividad) return null;
  const docUrl = getDocumentUrl(actividad.pathDocumentoActividad);
  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <ModalHeader>
          <ModalTitle>Ver actividad</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="overflow-y-auto space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{actividad.tituloActividad}</h3>
          {actividad.descripcionActividad && <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{actividad.descripcionActividad}</p>}
          {actividad.entregables && <div><p className="text-xs font-medium text-gray-500 mb-1">Entregables</p><p className="text-sm">{actividad.entregables}</p></div>}
          {actividad.materia && <p className="text-sm">{actividad.materia.codigo ? `${actividad.materia.codigo} - ` : ''}{actividad.materia.nombreMateria}</p>}
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
              <KeenIcon icon="download" /> Abrir documento
            </a>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Modal Material de apoyo
const ModalMaterialApoyo: React.FC<{ open: boolean; onClose: () => void; actividad: ActividadAprendiz | null }> = ({ open, onClose, actividad }) => {
  if (!actividad) return null;
  const materiales = actividad.materialesApoyo || [];
  const docUrl = getDocumentUrl(actividad.pathDocumentoActividad);
  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Material de apoyo</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="space-y-3">
          {actividad.pathDocumentoActividad && (
            <div className="p-3 rounded bg-gray-50 dark:bg-coal-500/30">
              <p className="text-xs font-medium text-gray-500 mb-1">Documento de la actividad</p>
              <a href={docUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1">
                <KeenIcon icon="download" /> Abrir documento
              </a>
            </div>
          )}
          {materiales.length === 0 && !docUrl ? (
            <p className="text-sm text-gray-500">No hay material de apoyo</p>
          ) : (
            materiales.map((m) => (
              <div key={m.id} className="p-3 rounded border border-gray-200 dark:border-gray-600">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{m.titulo || 'Material'}</p>
                {m.urlDocumento && <a href={getDocumentUrl(m.urlDocumento) || '#'} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-1"><KeenIcon icon="download" /> Documento</a>}
                {m.urlAdicional && <a href={m.urlAdicional} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 mt-1"><KeenIcon icon="share" /> Enlace</a>}
              </div>
            ))
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

// Modal Observaciones (Calificación)
const ModalObservaciones: React.FC<{ open: boolean; onClose: () => void; actividad: ActividadAprendiz | null }> = ({ open, onClose, actividad }) => {
  if (!actividad) return null;
  return (
    <Modal open={open} onClose={onClose} zIndex={110}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Calificación obtenida</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Respuesta del profesor</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">{actividad.ComentarioDocente || 'Sin observaciones'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Calificación numérica</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{actividad.calificacionNumerica ?? 'Sin calificar'}</p>
          </div>
          <div className="flex justify-end">
            <button className="btn btn-sm btn-primary" onClick={onClose}>Aceptar</button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

const ListaActividadesAprendiz: React.FC = () => {
  const [actividades, setActividades] = useState<ActividadAprendiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todas');
  const [modalActivo, setModalActivo] = useState<'responder' | 'ver' | 'material' | 'observaciones' | null>(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadAprendiz | null>(null);

  useEffect(() => {
    axios.get('actividades-aprendiz').then((r) => setActividades(r.data?.data || [])).catch(() => setActividades([])).finally(() => setLoading(false));
  }, []);

  const filtradas = useMemo(() => {
    let list = actividades;
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((a) =>
        (a.tituloActividad || '').toLowerCase().includes(s) ||
        (a.asignadoPor || '').toLowerCase().includes(s) ||
        (a.materia?.nombreMateria || '').toLowerCase().includes(s)
      );
    }
    if (filtroEstado !== 'todas') {
      const ahora = new Date();
      list = list.filter((a) => {
        const ini = new Date(a.fechaInicial);
        const fin = new Date(a.fechaFinal);
        if (filtroEstado === 'activa') return ahora >= ini && ahora <= fin;
        if (filtroEstado === 'vencida') return ahora > fin;
        if (filtroEstado === 'proxima') return ahora < ini;
        return true;
      });
    }
    return list;
  }, [actividades, search, filtroEstado]);

  const abrirModal = (tipo: 'responder' | 'ver' | 'material' | 'observaciones', act: ActividadAprendiz) => {
    setActividadSeleccionada(act);
    setModalActivo(tipo);
  };

  const cerrarModal = () => {
    setModalActivo(null);
    setActividadSeleccionada(null);
  };

  const recargar = () => {
    axios.get('actividades-aprendiz').then((r) => setActividades(r.data?.data || []));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Menú de búsqueda */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="input input-sm w-auto min-w-[160px]"
        >
          <option value="todas">Todas las actividades</option>
          <option value="activa">Activas</option>
          <option value="vencida">Vencidas</option>
          <option value="proxima">Próximas</option>
        </select>
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar actividad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm flex-1"
          />
          <button className="btn btn-sm btn-primary" type="button">
            <KeenIcon icon="search" />
          </button>
        </div>
      </div>

      {actividades.length === 0 ? (
        <div className="text-center py-12">
          <KeenIcon icon="check-squared" className="text-4xl text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-900 dark:text-white">No tienes actividades asignadas</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="table table-auto w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-coal-500/50">
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Código</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Instructor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Actividad</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Descripción</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Nota</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Entregables</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Rap</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Fecha de entrega</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Estado</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((act) => {
                const ahora = new Date();
                const ini = new Date(act.fechaInicial);
                const fin = new Date(act.fechaFinal);
                const vigente = ahora >= ini && ahora <= fin;
                const vencida = ahora > fin;
                const estado = vigente ? 'Activa' : vencida ? 'FINALIZADO' : 'Próxima';
                return (
                  <tr key={act.idCalificacionActividad} className="border-b border-gray-100 dark:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-coal-500/20">
                    <td className="py-3 px-4">{act.codigo || act.idActividad}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={getInstructorFotoUrl(act.instructorRutaFoto)}
                          alt={act.asignadoPor || 'Instructor'}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = AVATAR_DEFAULT; }}
                        />
                        <span className="text-xs font-medium text-gray-900 dark:text-white uppercase">{act.asignadoPor || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{act.tituloActividad}</td>
                    <td className="py-3 px-4 max-w-[180px]">
                      <span className="line-clamp-2">{truncar(act.descripcionActividad, 50)}</span>
                    </td>
                    <td className="py-3 px-4">
                      {act.calificacionNumerica != null ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{act.calificacionNumerica}</span>
                      ) : (
                        <span className="text-gray-400">Sin calificar</span>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[150px]">
                      <span className="line-clamp-2">{truncar(act.entregables, 40)}</span>
                    </td>
                    <td className="py-3 px-4 text-xs">{act.materia?.codigo ? `${act.materia.codigo} - ${act.materia.nombreMateria || ''}` : '-'}</td>
                    <td className="py-3 px-4 text-xs">{formatFechaEntrega(act.fechaInicial, act.fechaFinal)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium ${vencida ? 'text-red-600 dark:text-red-400' : vigente ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {estado}
                      </span>
                    </td>
                    <td className="py-3 px-4">{act.tipoActividad === 'cuestionario' ? 'Cuestionario' : 'Normal'}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-1">
                          <button title="Responder actividad" className="btn btn-icon btn-sm btn-light" onClick={() => abrirModal('responder', act)}>
                            <KeenIcon icon="file-up" className="text-sm" />
                          </button>
                          <button title="Ver actividad" className="btn btn-icon btn-sm btn-light" onClick={() => abrirModal('ver', act)}>
                            <KeenIcon icon="document" className="text-sm" />
                          </button>
                        </div>
                        <div className="flex gap-1">
                          <button title="Material de apoyo" className="btn btn-icon btn-sm btn-light" onClick={() => abrirModal('material', act)}>
                            <KeenIcon icon="file-down" className="text-sm" />
                          </button>
                          <button title="Observaciones" className="btn btn-icon btn-sm btn-light" onClick={() => abrirModal('observaciones', act)}>
                            <KeenIcon icon="information" className="text-sm" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modales */}
      <ModalResponder open={modalActivo === 'responder'} onClose={cerrarModal} actividad={actividadSeleccionada} onEntregado={recargar} />
      <ModalVerActividad open={modalActivo === 'ver'} onClose={cerrarModal} actividad={actividadSeleccionada} />
      <ModalMaterialApoyo open={modalActivo === 'material'} onClose={cerrarModal} actividad={actividadSeleccionada} />
      <ModalObservaciones open={modalActivo === 'observaciones'} onClose={cerrarModal} actividad={actividadSeleccionada} />
    </div>
  );
};

export default ListaActividadesAprendiz;
