import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import type { Actividad } from './ModalCrearActividad';

interface Aprendiz {
  id: number;
  idMatriculaAcademica: number;
  idMateria?: number;
  nombre: string;
}

interface Grupo {
  id: number;
  nombreGrupo: string;
  cantidadParticipantes: number;
  integrantesActuales?: number;
}

interface ModalAsignarActividadProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  idFicha: number;
  actividad: Actividad | null;
  /** Varias actividades para asignar en bloque */
  actividades?: Actividad[] | null;
}

const ModalAsignarActividad: React.FC<ModalAsignarActividadProps> = ({
  open,
  onClose,
  onSave,
  idFicha,
  actividad,
  actividades: actividadesProp
}) => {
  const actividadesAAsignar = actividadesProp?.length ? actividadesProp : (actividad ? [actividad] : []);
  const [aprendices, setAprendices] = useState<Aprendiz[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [aprendicesSeleccionados, setAprendicesSeleccionados] = useState<number[]>([]);
  const [gruposSeleccionados, setGruposSeleccionados] = useState<number[]>([]);
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [mostrarPickerEstudiantes, setMostrarPickerEstudiantes] = useState(false);
  const [mostrarPickerGrupos, setMostrarPickerGrupos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && idFicha) {
      setLoading(true);
      axios
        .get(`fichas/${idFicha}/asignacion-actividades/datos`)
        .then((res) => {
          setAprendices(res.data?.aprendices ?? []);
          setGrupos(res.data?.grupos ?? []);
          setActividades(res.data?.actividades ?? []);
        })
        .catch(() => {
          setAprendices([]);
          setGrupos([]);
          setActividades([]);
        })
        .finally(() => setLoading(false));
    }
  }, [open, idFicha]);

  useEffect(() => {
    if (open) {
      setAprendicesSeleccionados([]);
      setGruposSeleccionados([]);
      setFechaInicial('');
      setFechaFinal('');
      setError('');
    }
  }, [open]);

  const toggleAprendiz = (id: number) => {
    setAprendicesSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleGrupo = (id: number) => {
    setGruposSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTodosEstudiantes = () => {
    if (aprendicesSeleccionados.length === aprendices.length) {
      setAprendicesSeleccionados([]);
    } else {
      setAprendicesSeleccionados(aprendices.map((a) => a.id));
    }
  };

  const toggleTodosGrupos = () => {
    if (gruposSeleccionados.length === grupos.length) {
      setGruposSeleccionados([]);
    } else {
      setGruposSeleccionados(grupos.map((g) => g.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (actividadesAAsignar.length === 0) {
      setError('No hay actividad seleccionada');
      return;
    }
    const tieneDestinatarios =
      aprendicesSeleccionados.length > 0 || gruposSeleccionados.length > 0;
    if (!tieneDestinatarios) {
      setError('Selecciona al menos un estudiante o un grupo');
      return;
    }
    if (fechaInicial && fechaFinal) {
      const fIni = new Date(fechaInicial);
      const fFin = new Date(fechaFinal);
      if (fFin < fIni) {
        setError('La fecha final debe ser mayor o igual a la fecha inicial');
        return;
      }
    }

    setSaving(true);
    try {
      // Añadir cada actividad a planeación si aplica
      try {
        const planeacionRes = await axios.get(`planeacion/ficha/${idFicha}`);
        const data = planeacionRes.data;
        const idPlaneacion = typeof data?.id === 'number' ? data.id : (typeof data?.id === 'string' ? parseInt(data.id, 10) : null);
        if (idPlaneacion && !Number.isNaN(idPlaneacion)) {
          for (const act of actividadesAAsignar) {
            if (act.id && act.idMateria) {
              await axios.post('planeacionactividades', {
                idActividad: act.id,
                idMateria: act.idMateria,
                idPlaneacion
              });
            }
          }
        }
      } catch {
        // Ya está en planeación o error; continuar con la asignación
      }

      const payload: any = {
        actividades: actividadesAAsignar.map((a) => a.id).filter((id): id is number => id != null)
      };
      if (fechaInicial) payload.fechaInicial = fechaInicial + 'T00:00:00';
      if (fechaFinal) payload.fechaFinal = fechaFinal + 'T23:59:59';
      if (aprendicesSeleccionados.length === aprendices.length && aprendices.length > 0) {
        payload.aprendices = 'todos';
      } else if (aprendicesSeleccionados.length > 0) {
        payload.aprendices = aprendicesSeleccionados;
      }
      if (gruposSeleccionados.length === grupos.length && grupos.length > 0) {
        payload.grupos = 'todos';
      } else if (gruposSeleccionados.length > 0) {
        payload.grupos = gruposSeleccionados;
      }
      const res = await axios.post(`fichas/${idFicha}/asignacion-actividades`, payload);
      const data = res?.data;
      if (data?.exitosas === 0 && data?.omitidas === 0) {
        setError(
          'No se creó ninguna asignación. Verifica que los estudiantes o grupos seleccionados tengan matrícula académica.'
        );
        return;
      }
      onSave();
      onClose();
    } catch (err: any) {
      const data = err.response?.data;
      const msg =
        data?.error ||
        data?.message ||
        (data?.errors && typeof data.errors === 'object'
          ? Object.values(data.errors).flat().join(' ')
          : null) ||
        err.message ||
        'Error al asignar';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const textoEstudiantes =
    aprendicesSeleccionados.length === 0
      ? 'Seleccionar estudiantes'
      : aprendicesSeleccionados.length === aprendices.length
        ? 'Todos los estudiantes'
        : `${aprendicesSeleccionados.length} seleccionado(s)`;

  const textoGrupos =
    gruposSeleccionados.length === 0
      ? 'Seleccionar grupos'
      : gruposSeleccionados.length === grupos.length
        ? 'Todos los grupos'
        : `${gruposSeleccionados.length} grupo(s) seleccionado(s)`;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-lg">
        <ModalHeader>
          <ModalTitle>Asignar actividad</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {actividadesAAsignar.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
              {actividadesAAsignar.length === 1 ? (
                <>Actividad: <span className="font-semibold">{actividadesAAsignar[0].tituloActividad}</span></>
              ) : (
                <><span className="font-semibold">{actividadesAAsignar.length} actividades</span> seleccionadas</>
              )}
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            {/* Listar estudiantes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Listar estudiantes
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={textoEstudiantes}
                  className="input flex-1 text-sm bg-gray-50 dark:bg-coal-400 cursor-pointer"
                  onClick={() => {
                    setMostrarPickerGrupos(false);
                    setMostrarPickerEstudiantes(!mostrarPickerEstudiantes);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMostrarPickerGrupos(false);
                    setMostrarPickerEstudiantes(!mostrarPickerEstudiantes);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  <KeenIcon icon="users" className="text-lg" />
                </button>
              </div>
              {mostrarPickerEstudiantes && (
                <div className="mt-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                  <button
                    type="button"
                    onClick={toggleTodosEstudiantes}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2"
                  >
                    {aprendicesSeleccionados.length === aprendices.length ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                  <div className="space-y-1">
                    {aprendices.map((a) => (
                      <label key={a.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aprendicesSeleccionados.includes(a.id)}
                          onChange={() => toggleAprendiz(a.id)}
                        />
                        <span className="text-xs">{a.nombre}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Listar grupos */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Listar grupos
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={textoGrupos}
                  className="input flex-1 text-sm bg-gray-50 dark:bg-coal-400 cursor-pointer"
                  onClick={() => {
                    setMostrarPickerEstudiantes(false);
                    setMostrarPickerGrupos(!mostrarPickerGrupos);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setMostrarPickerEstudiantes(false);
                    setMostrarPickerGrupos(!mostrarPickerGrupos);
                  }}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                >
                  <KeenIcon icon="users" className="text-lg" />
                </button>
              </div>
              {mostrarPickerGrupos && (
                <div className="mt-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                  <button
                    type="button"
                    onClick={toggleTodosGrupos}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2"
                  >
                    {gruposSeleccionados.length === grupos.length ? 'Quitar todos' : 'Seleccionar todos'}
                  </button>
                  <div className="space-y-1">
                    {grupos.map((g) => (
                      <label key={g.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={gruposSeleccionados.includes(g.id)}
                          onChange={() => toggleGrupo(g.id)}
                        />
                        <span className="text-xs">
                          {g.nombreGrupo} ({g.integrantesActuales ?? 0}/{g.cantidadParticipantes})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha inicial
                </label>
                <input
                  type="date"
                  value={fechaInicial}
                  onChange={(e) => setFechaInicial(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha final
                </label>
                <input
                  type="date"
                  value={fechaFinal}
                  onChange={(e) => setFechaFinal(e.target.value)}
                  className="input w-full text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                    Asignando...
                  </>
                ) : (
                  <>
                    <KeenIcon icon="check" className="text-sm" />
                    Asignar actividad
                  </>
                )}
              </button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalAsignarActividad;
