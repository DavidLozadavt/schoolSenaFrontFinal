import React, { useEffect, useState } from 'react';
import { ProyectoFormativoProps } from '../../types';
import axios from 'axios';
import { exportarPlaneacionExcel } from './utils/Exportplaneacion';

const ProyectoFormativo: React.FC<ProyectoFormativoProps> = ({
  isOpen,
  onClose,
  program,
  ficha
}) => {
  const [proyectos, setProyectos] = useState<{ id: number; nombreProyecto: string }[]>([]);
  const [idProyectoFormativo, setIdProyectoFormativo] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const loadProyectos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('/proyectos-formativos', {
          params: { idPrograma: program.id }
        });
        setProyectos(response.data);
        // Pre-seleccionar si ya tiene uno asignado
        if (ficha.idProyectoFormativo) {
          setIdProyectoFormativo(ficha.idProyectoFormativo);
        }
      } catch {
        setError('No se pudieron cargar los proyectos formativos.');
      } finally {
        setLoading(false);
      }
    };
    loadProyectos();
  }, [isOpen, program.id]);

  useEffect(() => {
    if (!isOpen || !ficha?.id) return;

    const loadProyectoDetalle = async () => {
      try {
        const response = await axios.get(`/fichapry/${ficha.id}/proyecto-formativo`);
      } catch (err) {}
    };

    loadProyectoDetalle();
  }, [isOpen, ficha?.id]);

  const handleGuardar = async () => {
    if (!idProyectoFormativo) {
      setError('Debes seleccionar un proyecto formativo.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.put(`/fichasproyecto/${ficha.id}/proyecto-formativo`, {
        idProyectoFormativo
      });
      setSuccess(true);
      setTimeout(() => {
        onClose?.();
      }, 1200);
    } catch {
      setError('Ocurrió un error al asignar el proyecto formativo.');
    } finally {
      setSaving(false);
    }
  };
  const handleExportExcel = async () => {
    if (typeof window === 'undefined') return; // Evitar SSR
    try {
      await exportarPlaneacionExcel({
        id: ficha.id,
        codigo: ficha.codigo,
        instructorLider:
          `${ficha.instructorLider?.persona?.nombre1} ${ficha.instructorLider?.persona?.apellido1}` ||
          '',
        jornada: ficha.jornada.nombreJornada || '',
        programa: program.nombre
      });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      setError('No se pudo exportar el Excel. Intenta de nuevo.');
    }
  };

  if (!isOpen) return null;

  const proyectoSeleccionado = proyectos.find((p) => p.id === idProyectoFormativo);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Banner Header */}
        <div className="relative flex-shrink-0 w-full h-32 overflow-hidden">
          <img
            src={
              program.imageUrl ||
              'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600'
            }
            className="absolute inset-0 object-cover w-full h-full brightness-[0.35]"
            alt="Banner del programa"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Título sobre el banner */}
          <div className="absolute bottom-0 left-0 p-4">
            <p className="text-xs font-medium text-white/60 uppercase tracking-widest mb-0.5">
              Ficha {ficha.codigo}
            </p>
            <h2 className="text-base font-semibold text-white leading-tight line-clamp-1">
              {program.nombre || 'Programa de formación'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="absolute z-10 flex items-center justify-center w-8 h-8 text-white transition-all border rounded-full top-3 right-3 bg-white/10 hover:bg-danger backdrop-blur-md border-white/30 hover:scale-110"
            aria-label="Cerrar modal"
          >
            <i className="text-sm ki-outline ki-cross"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-1">
              Proyecto formativo
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selecciona el proyecto formativo que se asignará a esta ficha.
            </p>
          </div>

          {/* Select */}
          <div className="relative">
            {loading ? (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-coal-600 text-sm text-gray-400">
                <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full animate-spin"></span>
                Cargando proyectos...
              </div>
            ) : (
              <select
                value={idProyectoFormativo}
                onChange={(e) =>
                  setIdProyectoFormativo(e.target.value ? Number(e.target.value) : '')
                }
                className="w-full px-3 py-2.5 pr-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-600 text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer"
              >
                <option value="">— Seleccionar proyecto —</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreProyecto}
                  </option>
                ))}
              </select>
            )}
            {!loading && (
              <i className="ki-outline ki-arrow-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"></i>
            )}
          </div>

          {/* Preview del seleccionado */}
          {proyectoSeleccionado && (
            <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-primary/5 border border-primary/20 justify-center items-center">
              <i className="ki-outline ki-check-circle text-primary mt-0.5 text-base flex-shrink-0"></i>
              <p className="text-xs text-primary font-medium leading-snug">
                {proyectoSeleccionado.nombreProyecto}
              </p>
            </div>
          )}

          {/* Feedback */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20 text-xs text-danger font-medium">
              <i className="ki-outline ki-information-2 text-sm"></i>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-success/10 border border-success/20 text-xs text-success font-medium">
              <i className="ki-outline ki-check-circle text-sm"></i>
              Proyecto formativo asignado correctamente.
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-coal-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              disabled={saving || loading || !idProyectoFormativo}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <i className="ki-outline ki-check text-sm"></i>
                  Asignar proyecto
                </>
              )}
            </button>
            {idProyectoFormativo && (
              <button
                onClick={handleExportExcel}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-success text-white hover:bg-success/90 flex items-center gap-2"
              >
                <i className="ki-outline ki-file-down text-sm"></i>
                Exportar Excel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProyectoFormativo;
