import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

interface CentroFormacion {
  rutaFotoUrl: string;
  nombre: string;
  correo: string;
  direccion: string;
}

interface Contrato {
  id: number;
  centroFormacion: CentroFormacion;
  cargoSupervisor: null | string;
  supervisorContrato: null | string;
  objetoContrato: null | string;
  formaDePago: 'COMISIONES' | 'SALARIO INTEGRAL' | 'NORMAL';
}

const FORMAS_DE_PAGO: Contrato['formaDePago'][] = ['COMISIONES', 'SALARIO INTEGRAL', 'NORMAL'];

const FORMA_PAGO_STYLES: Record<Contrato['formaDePago'], string> = {
  COMISIONES: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  'SALARIO INTEGRAL': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  NORMAL: 'bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400'
};

const ContratoGeneralInstructor: React.FC = () => {
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supervisorContrato: '',
    cargoSupervisor: '',
    objetoContrato: '',
    formaDePago: 'NORMAL' as Contrato['formaDePago']
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await axios.get('instructores/contratoByInstructor');
        const data: Contrato = res.data.contrato[0] ?? null;
        setContrato(data);
        setForm({
          supervisorContrato: data?.supervisorContrato ?? '',
          cargoSupervisor: data?.cargoSupervisor ?? '',
          objetoContrato: data?.objetoContrato ?? '',
          formaDePago: data?.formaDePago ?? 'NORMAL'
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setForm({
      supervisorContrato: contrato?.supervisorContrato ?? '',
      cargoSupervisor: contrato?.cargoSupervisor ?? '',
      objetoContrato: contrato?.objetoContrato ?? '',
      formaDePago: contrato?.formaDePago ?? 'NORMAL'
    });
  };

  const handleSave = async () => {
    if (!contrato) return;
    setSaving(true);
    try {
      await axios.put(`instructores/${contrato.id}/supervisor`, form);
      setContrato({ ...contrato, ...form });
      setEditing(false);
      enqueueSnackbar('Contrato actualizado con éxito.', { variant: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar los cambios.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No se encontró un contrato activo.
        </p>
      </div>
    );
  }

  const supervisorAsignado = contrato.supervisorContrato || contrato.cargoSupervisor;

  return (
    <div className="w-full">
      <div className="overflow-hidden">
        {/* Banner centro de formación */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-coal-300 flex items-center gap-4">
          <img
            src={contrato.centroFormacion.rutaFotoUrl}
            alt={contrato.centroFormacion.nombre}
            className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-coal-300 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wide">
                {contrato.centroFormacion.nombre}
              </p>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                Contrato #{contrato.id}
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <i className="ki-outline ki-sms text-xs" />
                {contrato.centroFormacion.correo}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <i className="ki-outline ki-geolocation text-xs" />
                {contrato.centroFormacion.direccion}
              </p>
            </div>
          </div>
        </div>

        {/* Sección supervisor */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-coal-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <i className="ki-outline ki-profile-circle text-gray-400 dark:text-gray-500 text-base" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Información del supervisor
              </span>
              {!supervisorAsignado && !editing && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400">
                  Pendiente
                </span>
              )}
              {supervisorAsignado && !editing && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400">
                  Asignado
                </span>
              )}
            </div>
            {!editing && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
              >
                <i className="ki-outline ki-pencil text-sm" />
                Editar
              </button>
            )}
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3 border border-gray-100 dark:border-coal-300">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Supervisor</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {contrato.supervisorContrato ?? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-normal italic">
                      No asignado
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3 border border-gray-100 dark:border-coal-300">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Cargo supervisor</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {contrato.cargoSupervisor ?? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-normal italic">
                      No asignado
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="border border-blue-200 dark:border-blue-500/30 bg-blue-50/40 dark:bg-blue-500/5 rounded-xl p-4 space-y-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <i className="ki-outline ki-information-2 text-sm" />
                Los campos se guardarán en mayúsculas automáticamente.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                    Supervisor
                  </label>
                  <input
                    type="text"
                    value={form.supervisorContrato}
                    onChange={(e) =>
                      setForm({ ...form, supervisorContrato: e.target.value.toUpperCase() })
                    }
                    placeholder="NOMBRE DEL SUPERVISOR"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                    Cargo supervisor
                  </label>
                  <input
                    type="text"
                    value={form.cargoSupervisor}
                    onChange={(e) =>
                      setForm({ ...form, cargoSupervisor: e.target.value.toUpperCase() })
                    }
                    placeholder="CARGO DEL SUPERVISOR"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sección contrato ── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="ki-outline ki-document text-gray-400 dark:text-gray-500 text-base" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Detalles del contrato
            </span>
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Forma de pago */}
              <div className="bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3 border border-gray-100 dark:border-coal-300">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Forma de pago</p>
                {contrato.formaDePago ? (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${FORMA_PAGO_STYLES[contrato.formaDePago]}`}
                  >
                    {contrato.formaDePago}
                  </span>
                ) : (
                  <span className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                    No asignado
                  </span>
                )}
              </div>

              {/* Objeto del contrato */}
              <div className="bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3 border border-gray-100 dark:border-coal-300 sm:col-span-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                  Objeto del contrato
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {contrato.objetoContrato ?? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-normal italic">
                      No asignado
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Select forma de pago */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Forma de pago
                </label>
                <select
                  value={form.formaDePago}
                  onChange={(e) =>
                    setForm({ ...form, formaDePago: e.target.value as Contrato['formaDePago'] })
                  }
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FORMAS_DE_PAGO.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {/* Textarea objeto del contrato */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Objeto del contrato
                </label>
                <textarea
                  rows={4}
                  value={form.objetoContrato}
                  onChange={(e) =>
                    setForm({ ...form, objetoContrato: e.target.value.toUpperCase() })
                  }
                  placeholder="DESCRIPCIÓN DEL OBJETO DEL CONTRATO"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Acciones (solo visibles en modo edición) */}
          {editing && (
            <div className="flex justify-end gap-2 pt-4">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-coal-400 hover:bg-gray-100 dark:hover:bg-coal-300 font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-coal-300 rounded-lg transition-all disabled:opacity-50"
              >
                <i className="ki-outline ki-cross-circle text-sm" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="ki-outline ki-check-circle text-sm" />
                )}
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContratoGeneralInstructor;
