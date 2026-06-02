import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../components/Toast';
import ModalError from '@/pages/gestion-sedes-sena/ModalError';

interface Program {
  id: number;
  name: string;
  codigo: string;
}

interface Periodo {
  id: number;
  nombrePeriodo: string;
}

interface Sede {
  id: number;
  nombre: string;
}

interface AperturarProgramaProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
  onAperturaComplete?: () => void;
}

const AperturarPrograma: React.FC<AperturarProgramaProps> = ({
  isOpen,
  onClose,
  program,
  onAperturaComplete = () => {}
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleError, setHandleError] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [messageToast, setMessageToast] = useState('');
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [aperturas, setAperturas] = useState<any[]>([]);
  const [loadingAperturas, setLoadingAperturas] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    idPeriodo: '',
    idSede: '',
    estado: 'ABIERTO',
    tipoCalificacion: 'NUMERICO',
    fechaInicialClases: new Date().toISOString().split('T')[0],
    fechaFinalClases: new Date().toISOString().split('T')[0],
    fechaInicialInscripciones: new Date().toISOString().split('T')[0],
    fechaFinalInscripciones: new Date().toISOString().split('T')[0],
    fechaInicialMatriculas: new Date().toISOString().split('T')[0],
    fechaFinalMatriculas: new Date().toISOString().split('T')[0],
    fechaInicialPlanMejoramiento: new Date().toISOString().split('T')[0],
    fechaFinalPlanMejoramiento: new Date().toISOString().split('T')[0],
    observacion: ''
  });

  // Cargar periodos y sedes
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && program) {
      loadAperturas();
    }
  }, [isOpen, program]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [periodosRes, sedesRes] = await Promise.all([
        axios.get('/periodos'),
        axios.get('/sedes')
      ]);

      setPeriodos(periodosRes.data.data || periodosRes.data);
      setSedes(sedesRes.data.data || sedesRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('No se pudieron cargar los datos necesarios');
    } finally {
      setLoadingData(false);
    }
  };

  const loadAperturas = async () => {
    if (!program) return;
    try {
      setLoadingAperturas(true);
      const res = await axios.get('/aperturaPrograma');
      const data = res.data.data || res.data;
      // filter by program id if backend doesn't support query param
      const filtered = Array.isArray(data)
        ? data.filter((a: any) => a.idPrograma === program.id || a.programa?.id === program.id)
        : [];
      setAperturas(filtered);
    } catch (err) {
      console.error('Error cargando aperturas:', err);
    } finally {
      setLoadingAperturas(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program) return;

    try {
      setLoading(true);
      setError(null);

      const payload = {
        idPrograma: program.id,
        ...formData,
        idPeriodo: parseInt(formData.idPeriodo),
        idSede: parseInt(formData.idSede)
      };

      let response;
      if (editingId) {
        response = await axios.patch(`/aperturaPrograma/${editingId}`, payload);
      } else {
        response = await axios.post('/aperturaPrograma', payload);
      }

      if (
        response.data?.status === 'success' ||
        response.status === 201 ||
        response.status === 200
      ) {
        const successMessage = editingId
          ? 'Apertura actualizada correctamente'
          : 'Apertura creada correctamente';
        setMessageToast(successMessage);
        setShowToast(true);

        // reset and close shortly after showing toast (similar UX a CrearEditarFicha)
        setTimeout(async () => {
          resetForm();
          setEditingId(null);
          await loadAperturas();
          onAperturaComplete?.();
          onClose();
        }, 700);
      }
    } catch (err: any) {
      console.error('Error al aperturar programa:', err);
      const msg =
        err.response?.data?.message || 'No se pudo aperturar el programa. Intenta nuevamente.';
      setError(msg);
      setMessageError(msg);
      setHandleError(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      idPeriodo: '',
      idSede: '',
      estado: 'ABIERTO',
      tipoCalificacion: 'NUMERICO',
      fechaInicialClases: new Date().toISOString().split('T')[0],
      fechaFinalClases: new Date().toISOString().split('T')[0],
      fechaInicialInscripciones: new Date().toISOString().split('T')[0],
      fechaFinalInscripciones: new Date().toISOString().split('T')[0],
      fechaInicialMatriculas: new Date().toISOString().split('T')[0],
      fechaFinalMatriculas: new Date().toISOString().split('T')[0],
      fechaInicialPlanMejoramiento: new Date().toISOString().split('T')[0],
      fechaFinalPlanMejoramiento: new Date().toISOString().split('T')[0],
      observacion: ''
    });
  };

  const handleEdit = (apertura: any) => {
    setEditingId(apertura.id);
    setFormData({
      idPeriodo: apertura.idPeriodo || apertura.periodo?.id || '',
      idSede: apertura.idSede || apertura.sede?.id || '',
      estado: apertura.estado || 'ABIERTO',
      tipoCalificacion: apertura.tipoCalificacion || 'NUMERICO',
      fechaInicialClases:
        apertura.fechaInicialClases?.split('T')[0] ||
        apertura.fechaInicialClases ||
        new Date().toISOString().split('T')[0],
      fechaFinalClases:
        apertura.fechaFinalClases?.split('T')[0] ||
        apertura.fechaFinalClases ||
        new Date().toISOString().split('T')[0],
      fechaInicialInscripciones:
        apertura.fechaInicialInscripciones?.split('T')[0] ||
        apertura.fechaInicialInscripciones ||
        new Date().toISOString().split('T')[0],
      fechaFinalInscripciones:
        apertura.fechaFinalInscripciones?.split('T')[0] ||
        apertura.fechaFinalInscripciones ||
        new Date().toISOString().split('T')[0],
      fechaInicialMatriculas:
        apertura.fechaInicialMatriculas?.split('T')[0] ||
        apertura.fechaInicialMatriculas ||
        new Date().toISOString().split('T')[0],
      fechaFinalMatriculas:
        apertura.fechaFinalMatriculas?.split('T')[0] ||
        apertura.fechaFinalMatriculas ||
        new Date().toISOString().split('T')[0],
      fechaInicialPlanMejoramiento:
        apertura.fechaInicialPlanMejoramiento?.split('T')[0] ||
        apertura.fechaInicialPlanMejoramiento ||
        new Date().toISOString().split('T')[0],
      fechaFinalPlanMejoramiento:
        apertura.fechaFinalPlanMejoramiento?.split('T')[0] ||
        apertura.fechaFinalPlanMejoramiento ||
        new Date().toISOString().split('T')[0],
      observacion: apertura.observacion || ''
    });
  };

  const handleNew = () => {
    setEditingId(null);
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[105] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-2xl bg-white dark:bg-coal-300 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-coal-400">
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider text-gray-800 dark:text-white">
                Aperturar Programa
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="text-lg ki-filled ki-cross" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(90vh-180px)] overflow-y-auto space-y-4">
            {/* Program Info */}
            {program && (
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-lg border border-blue-200 dark:border-blue-500/20">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">Programa:</span> {program.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <span className="font-semibold">Código:</span> {program.codigo}
                </p>
              </div>
            )}

            {/* Aperturas existentes */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Aperturas existentes
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNew}
                  disabled={loading}
                  className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Nuevo
                </button>
              </div>
            </div>

            {loadingAperturas ? (
              <div className="py-2">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {aperturas.length === 0 && (
                  <p className="text-sm text-gray-500">No hay aperturas para este programa.</p>
                )}
                {aperturas.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {a.periodo?.nombrePeriodo || `ID ${a.id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Estado: {a.estado} · {a.tipoCalificacion}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(a)}
                        className="text-sm px-2 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-200 dark:border-red-500/20">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {editingId && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-yellow-800">Editando apertura #{editingId}</div>
                      <button
                        type="button"
                        onClick={handleNew}
                        className="text-sm text-yellow-700 underline"
                      >
                        Cancelar edición
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Período */}
                    <div>
                      <label
                        htmlFor="idPeriodo"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Período <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="idPeriodo"
                        name="idPeriodo"
                        value={formData.idPeriodo}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar período</option>
                        {periodos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombrePeriodo}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sede */}
                    <div>
                      <label
                        htmlFor="idSede"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Sede <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="idSede"
                        name="idSede"
                        value={formData.idSede}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">Seleccionar sede</option>
                        {sedes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Estado */}
                    <div>
                      <label
                        htmlFor="estado"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Estado <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="ABIERTO">Abierto</option>
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                        <option value="CERRADO">Cerrado</option>
                      </select>
                    </div>

                    {/* Tipo de Calificación */}
                    <div>
                      <label
                        htmlFor="tipoCalificacion"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Tipo de Calificación <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="tipoCalificacion"
                        name="tipoCalificacion"
                        value={formData.tipoCalificacion}
                        onChange={handleInputChange}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="NUMERICO">Numérico</option>
                        <option value="DESEMPEÑO">Desempeño</option>
                      </select>
                    </div>
                  </div>

                  {/* Sección de Fechas */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Fechas de Clases
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="fechaInicialClases"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Inicial <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaInicialClases"
                          name="fechaInicialClases"
                          value={formData.fechaInicialClases}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="fechaFinalClases"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Final <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaFinalClases"
                          name="fechaFinalClases"
                          value={formData.fechaFinalClases}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inscripciones */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Fechas de Inscripciones
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="fechaInicialInscripciones"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Inicial <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaInicialInscripciones"
                          name="fechaInicialInscripciones"
                          value={formData.fechaInicialInscripciones}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="fechaFinalInscripciones"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Final <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaFinalInscripciones"
                          name="fechaFinalInscripciones"
                          value={formData.fechaFinalInscripciones}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Matrículas */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Fechas de Matrículas
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="fechaInicialMatriculas"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Inicial <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaInicialMatriculas"
                          name="fechaInicialMatriculas"
                          value={formData.fechaInicialMatriculas}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="fechaFinalMatriculas"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Final <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaFinalMatriculas"
                          name="fechaFinalMatriculas"
                          value={formData.fechaFinalMatriculas}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plan de Mejoramiento */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                      Fechas de Plan de Mejoramiento
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="fechaInicialPlanMejoramiento"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Inicial <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaInicialPlanMejoramiento"
                          name="fechaInicialPlanMejoramiento"
                          value={formData.fechaInicialPlanMejoramiento}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="fechaFinalPlanMejoramiento"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Final <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          id="fechaFinalPlanMejoramiento"
                          name="fechaFinalPlanMejoramiento"
                          value={formData.fechaFinalPlanMejoramiento}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observación */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <label
                      htmlFor="observacion"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Observación <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="observacion"
                      name="observacion"
                      value={formData.observacion}
                      onChange={handleInputChange}
                      placeholder="Añade observaciones sobre la apertura del programa..."
                      rows={3}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-coal-400 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-coal-400">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || loadingData}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-coal-500 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-coal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || loadingData}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {editingId ? 'Actualizando...' : 'Aperturando...'}
                </>
              ) : (
                <>
                  <i className="ki-outline ki-toggle-on-circle" />
                  {editingId ? 'Actualizar' : 'Aperturar'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <Toast message={messageToast} isOpen={showToast} onClose={() => setShowToast(false)} />
      <ModalError
        isOpen={handleError}
        message={messageError}
        onClose={() => setHandleError(false)}
      />
    </>
  );
};

export default AperturarPrograma;
