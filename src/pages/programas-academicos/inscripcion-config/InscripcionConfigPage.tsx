import { Fragment, useEffect, useState } from 'react';
import axios from 'axios';
import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { KeenIcon } from '@/components';
import Toast from '@/pages/programas-academicos/components/Toast';

interface Formulario {
  id: number;
  titulo: string;
  descripcion?: string;
}

interface Config {
  idFormularioInscripcion: number | null;
  inscripcionHabilitada: number;
  fechaInicioInscripcion: string | null;
  fechaFinInscripcion: string | null;
}

const InscripcionConfigPage = () => {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [idFormularioInscripcion, setIdFormularioInscripcion] = useState<number | ''>('');
  const [inscripcionHabilitada, setInscripcionHabilitada] = useState<boolean>(false);
  const [fechaInicioInscripcion, setFechaInicioInscripcion] = useState<string>('');
  const [fechaFinInscripcion, setFechaFinInscripcion] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  // Cargar datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [formsRes, configRes] = await Promise.all([
          axios.get<Formulario[]>('inscripcion/formularios'),
          axios.get<Config>('inscripcion/configuracion')
        ]);

        setFormularios(formsRes.data);

        const config = configRes.data;
        setIdFormularioInscripcion(config.idFormularioInscripcion ?? '');
        setInscripcionHabilitada(config.inscripcionHabilitada === 1);
        
        // Convertir formato de fecha para input datetime-local o date (YYYY-MM-DDTHH:MM)
        if (config.fechaInicioInscripcion) {
          setFechaInicioInscripcion(config.fechaInicioInscripcion.slice(0, 16));
        }
        if (config.fechaFinInscripcion) {
          setFechaFinInscripcion(config.fechaFinInscripcion.slice(0, 16));
        }
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la configuración de inscripción.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        idFormularioInscripcion: idFormularioInscripcion === '' ? null : Number(idFormularioInscripcion),
        inscripcionHabilitada: inscripcionHabilitada ? 1 : 0,
        fechaInicioInscripcion: fechaInicioInscripcion ? fechaInicioInscripcion.replace('T', ' ') + ':00' : null,
        fechaFinInscripcion: fechaFinInscripcion ? fechaFinInscripcion.replace('T', ' ') + ':00' : null
      };

      const response = await axios.post('inscripcion/configuracion', payload);
      setToastMessage(response.data.message || 'Configuración guardada correctamente.');
      setToastOpen(true);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error al guardar la configuración. Verifique las fechas.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Configuración de Inscripción" />
            <ToolbarDescription>
              Vincula un formulario a tu página de NexiService y define las fechas límite para inscripciones.
            </ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="card max-w-3xl mx-auto">
          <div className="card-header">
            <h3 className="card-title">Habilitación del Botón Público en NexiService</h3>
          </div>

          {loading ? (
            <div className="card-body py-10 text-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="mt-2 text-sm text-gray-500">Cargando configuración...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="card-body space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-800 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Toggle Habilitación Manual */}
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-coal-800/20">
                <div className="flex flex-col gap-1 pr-4">
                  <span className="font-semibold text-gray-900 dark:text-white">Habilitar Botón de Inscripción</span>
                  <span className="text-xs text-gray-500">
                    Si se desmarca, el botón "Inscribirse" no se mostrará en NexiService.
                  </span>
                </div>
                <label className="switch switch-sm">
                  <input
                    type="checkbox"
                    checked={inscripcionHabilitada}
                    onChange={(e) => setInscripcionHabilitada(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Selector de Formularios */}
              <div className="flex flex-col gap-2">
                <label className="form-label font-semibold text-gray-900 dark:text-white">Formulario Asociado</label>
                <select
                  className="select select-sm w-full"
                  value={idFormularioInscripcion}
                  onChange={(e) => setIdFormularioInscripcion(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Seleccionar formulario --</option>
                  {formularios.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.titulo}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-500">
                  El formulario debe estar creado previamente en el módulo de Formularios.
                </span>
              </div>

              {/* Fechas de Vigencia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="form-label font-semibold text-gray-900 dark:text-white">Fecha y Hora de Inicio</label>
                  <input
                    type="datetime-local"
                    className="input input-sm w-full"
                    value={fechaInicioInscripcion}
                    onChange={(e) => setFechaInicioInscripcion(e.target.value)}
                  />
                  <span className="text-xs text-gray-500">
                    Opcional. Inicio de la disponibilidad.
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="form-label font-semibold text-gray-900 dark:text-white">Fecha y Hora de Fin</label>
                  <input
                    type="datetime-local"
                    className="input input-sm w-full"
                    value={fechaFinInscripcion}
                    onChange={(e) => setFechaFinInscripcion(e.target.value)}
                  />
                  <span className="text-xs text-gray-500">
                    Opcional. Cierre automático de inscripciones.
                  </span>
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-900">
                <button
                  type="submit"
                  className="btn btn-sm btn-primary flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <span key="spinner" className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <KeenIcon key="icon" icon="check-square" />
                  )}
                  Guardar Configuración
                </button>
              </div>
            </form>
          )}
        </div>
      </Container>

      <Toast message={toastMessage} isOpen={toastOpen} onClose={() => setToastOpen(false)} />
    </Fragment>
  );
};

export default InscripcionConfigPage;
