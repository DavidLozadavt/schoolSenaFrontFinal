import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { enqueueSnackbar } from 'notistack';

interface CentroFormacion {
  rutaFotoUrl: string;
  nombre: string;
  correo: string;
  direccion: string;
}

interface CiudadExpedicion {
  id: number;
  descripcion: string;
  departamento: {
    id: number;
    descripcion: string;
  };
}

interface Persona {
  ciudadExpedicion: number | null;
  ciudad_expedicion_rel: CiudadExpedicion | null;
}

interface ActividadContrato {
  id: number;
  obligaciones: string;
  accionesRealizadas: string;
  evidencias: string;
  idContrato: number;
  created_at: string;
  updated_at: string;
}

interface Contrato {
  id: number;
  centroFormacion: CentroFormacion;
  persona: Persona;
  cargoSupervisor: null | string;
  supervisorContrato: null | string;
  objetoContrato: null | string;
  formaDePago: 'COMISIONES' | 'SALARIO INTEGRAL' | 'NORMAL';
  siif: null | number;
  descripcionFormaPago: string | null;
}

interface CiudadDepartamento {
  id: number;
  descripcion: string;
  departamento: {
    id: number;
    descripcion: string;
  };
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
  const [ciudades, setCiudades] = useState<CiudadDepartamento[]>([]);
  const [ciudadSearch, setCiudadSearch] = useState('');

  // Estados para actividades
  const [actividades, setActividades] = useState<ActividadContrato[]>([]);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [showActividadesModal, setShowActividadesModal] = useState(false);
  const [editingActividad, setEditingActividad] = useState<ActividadContrato | null>(null);
  const [savingActividad, setSavingActividad] = useState(false);

  //Para el conteo de actividades:
  const [totalActividades, setTotalActividades] = useState<number | null>(null);

  //Acordeon del formulario de actividades
  const [openForm, setOpenForm] = useState(true);

  const [form, setForm] = useState({
    supervisorContrato: '',
    cargoSupervisor: '',
    objetoContrato: '',
    formaDePago: 'NORMAL' as Contrato['formaDePago'],
    ciudadExpedicionId: '' as number | '',
    siif: null as null | number,
    descripcionFormaPago: ''
  });

  const [actividadForm, setActividadForm] = useState({
    obligaciones: '',
    accionesRealizadas: '',
    evidencias: ''
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resContrato, resCiudades] = await Promise.all([
          axios.get('instructores/contratoByInstructor'),
          axios.get('ciudades-departamento')
        ]);

        setCiudades(resCiudades.data);

        const data: Contrato = resContrato.data.contrato[0] ?? null;
        setContrato(data);

        if (data) {
          setForm({
            supervisorContrato: data.supervisorContrato ?? '',
            cargoSupervisor: data.cargoSupervisor ?? '',
            objetoContrato: data.objetoContrato ?? '',
            formaDePago: data.formaDePago ?? 'NORMAL',
            ciudadExpedicionId: data.persona?.ciudad_expedicion_rel?.id ?? '',
            siif: data.siif ?? null,
            descripcionFormaPago: data.descripcionFormaPago ?? ''
          });
          axios
            .get(`actividades-contrato?idContrato=${data.id}`)
            .then((res) => setTotalActividades((res.data.actividades || []).length))
            .catch(() => {});
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const loadActividades = async () => {
    if (!contrato) return;
    setLoadingActividades(true);
    try {
      const response = await axios.get(`actividades-contrato?idContrato=${contrato.id}`);
      setActividades(response.data.actividades || []);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al cargar las actividades.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setLoadingActividades(false);
    }
  };

  const handleEdit = () => setEditing(true);

  const handleCancel = () => {
    setEditing(false);
    setCiudadSearch('');
    setForm({
      supervisorContrato: contrato?.supervisorContrato ?? '',
      cargoSupervisor: contrato?.cargoSupervisor ?? '',
      objetoContrato: contrato?.objetoContrato ?? '',
      formaDePago: contrato?.formaDePago ?? 'NORMAL',
      ciudadExpedicionId: contrato?.persona?.ciudad_expedicion_rel?.id ?? '',
      siif: contrato?.siif ?? 0,
      descripcionFormaPago: contrato?.descripcionFormaPago ?? ''
    });
  };

  const handleSave = async () => {
    if (!contrato) return;
    setSaving(true);
    try {
      await axios.put(`instructores/${contrato.id}/supervisor`, form);

      const ciudadSeleccionada = ciudades.find((c) => c.id === form.ciudadExpedicionId) ?? null;
      setContrato({
        ...contrato,
        ...form,
        persona: {
          ...contrato.persona,
          ciudad_expedicion_rel: ciudadSeleccionada
        }
      });

      setEditing(false);
      setCiudadSearch('');
      enqueueSnackbar('Contrato actualizado con éxito.', { variant: 'success' });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar los cambios.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Gestión de actividades
  const handleOpenActividades = () => {
    setShowActividadesModal(true);
    loadActividades();
  };

  const handleCloseActividadesModal = () => {
    setShowActividadesModal(false);
    setEditingActividad(null);
    setActividadForm({
      obligaciones: '',
      accionesRealizadas: '',
      evidencias: ''
    });
  };

  const handleEditActividad = (actividad: ActividadContrato) => {
    setEditingActividad(actividad);
    setActividadForm({
      obligaciones: actividad.obligaciones,
      accionesRealizadas: actividad.accionesRealizadas,
      evidencias: actividad.evidencias
    });
  };

  const handleCancelActividadEdit = () => {
    setEditingActividad(null);
    setActividadForm({
      obligaciones: '',
      accionesRealizadas: '',
      evidencias: ''
    });
  };

  const handleSaveActividad = async () => {
    if (!contrato) return;

    // Validación
    if (
      !actividadForm.obligaciones.trim() ||
      !actividadForm.accionesRealizadas.trim() ||
      !actividadForm.evidencias.trim()
    ) {
      enqueueSnackbar('Todos los campos son requeridos.', { variant: 'warning' });
      return;
    }

    setSavingActividad(true);
    try {
      if (editingActividad) {
        // Actualizar
        const response = await axios.put(`actividades-contrato/${editingActividad.id}`, {
          ...actividadForm,
          idContrato: contrato.id
        });
        setActividades((prev) =>
          prev.map((a) => (a.id === editingActividad.id ? response.data.actividad : a))
        );
        enqueueSnackbar('Actividad actualizada con éxito.', { variant: 'success' });
      } else {
        // Crear
        const response = await axios.post('actividades-contrato', {
          ...actividadForm,
          idContrato: contrato.id
        });
        setActividades((prev) => [response.data.actividad, ...prev]);
        enqueueSnackbar('Actividad creada con éxito.', { variant: 'success' });
        setTotalActividades((prev) => (editingActividad ? prev : (prev ?? 0) + 1));
      }

      handleCancelActividadEdit();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al guardar la actividad.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSavingActividad(false);
    }
  };

  const handleDeleteActividad = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta actividad?')) return;

    try {
      await axios.delete(`actividades-contrato/${id}`);
      setActividades((prev) => prev.filter((a) => a.id !== id));
      enqueueSnackbar('Actividad eliminada con éxito.', { variant: 'success' });
      setTotalActividades((prev) => (prev ?? 1) - 1);
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Error al eliminar la actividad.';
      enqueueSnackbar(msg, { variant: 'error' });
    }
  };

  const ciudadesFiltradas =
    ciudadSearch.trim().length >= 2
      ? ciudades
          .filter(
            (c) =>
              c.descripcion.toLowerCase().includes(ciudadSearch.toLowerCase()) ||
              c.departamento.descripcion.toLowerCase().includes(ciudadSearch.toLowerCase())
          )
          .slice(0, 8)
      : [];

  const ciudadSeleccionadaLabel = (() => {
    if (!form.ciudadExpedicionId) return null;
    const c = ciudades.find((c) => c.id === form.ciudadExpedicionId);
    return c ? `${c.descripcion} — ${c.departamento.descripcion}` : null;
  })();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No se encontró un contrato activo.
        </p>
      </div>
    );
  }

  const supervisorAsignado = contrato.supervisorContrato || contrato.cargoSupervisor;
  const ciudadActual = contrato.persona?.ciudad_expedicion_rel;

  return (
    <div className="w-full">
      <div className="overflow-hidden">
        {/* ── Banner centro de formación ── */}
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

        {/* ── Botón de Actividades ── */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5">
          <button
            onClick={handleOpenActividades}
            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-coal-400 border border-blue-200 dark:border-blue-500/30 rounded-lg hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <i className="ki-outline ki-clipboard text-blue-600 dark:text-blue-400 text-lg" />
                {/* 👇 BURBUJA con el conteo */}
                {totalActividades !== null && totalActividades > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none ${
                      totalActividades >= 6 ? 'bg-green-500' : 'bg-orange-500'
                    }`}
                  >
                    {totalActividades > 99 ? '99+' : totalActividades}
                  </span>
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  Actividades del Contrato
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {totalActividades === null
                    ? 'Cargando...'
                    : totalActividades === 0
                      ? 'Mínimo 6 actividades requeridas'
                      : totalActividades >= 6
                        ? `${totalActividades} actividades · ✓ Listo para informe`
                        : `${totalActividades} de 6 actividades mínimas`}
                </p>
              </div>
            </div>
            <i className="ki-outline ki-right text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
          </button>
          {totalActividades !== null && (
            <div className="mt-2 px-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                  Progreso mínimo para informe
                </span>
                <span
                  className={`text-[10px] font-semibold ${
                    totalActividades >= 6
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}
                >
                  {Math.min(totalActividades, 6)}/6
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-coal-300 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalActividades >= 6 ? 'bg-green-500' : 'bg-orange-400'
                  }`}
                  style={{ width: `${Math.min((totalActividades / 6) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Sección supervisor ── */}
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

        {/* ── Sección detalles del contrato ── */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-coal-300">
          <div className="flex items-center gap-2 mb-3">
            <i className="ki-outline ki-document text-gray-400 dark:text-gray-500 text-base" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Detalles del contrato
            </span>
          </div>

          {!editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3 border border-gray-100 dark:border-coal-300 sm:col-span-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                  Descripción forma de pago
                </p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                  {contrato.descripcionFormaPago ?? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-normal italic">
                      No asignado
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3 border border-gray-100 dark:border-coal-300">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">SIIF</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {contrato.siif ?? (
                    <span className="text-yellow-600 dark:text-yellow-400 font-normal italic">
                      No asignado
                    </span>
                  )}
                </p>
              </div>
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
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  Descripción forma de pago
                </label>
                <textarea
                  rows={3}
                  value={form.descripcionFormaPago}
                  onChange={(e) =>
                    setForm({ ...form, descripcionFormaPago: e.target.value.toUpperCase() })
                  }
                  placeholder="DESCRIBA LA FORMA DE PAGO..."
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                  SIIF
                </label>
                <input
                  type="number"
                  value={form.siif ?? ''}
                  onChange={(e) =>
                    setForm({ ...form, siif: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder="Número SIIF"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

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
        </div>

        {/* ── Sección documento del instructor ── */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="ki-outline ki-geolocation text-gray-400 dark:text-gray-500 text-base" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Documento del instructor
            </span>
          </div>

          {!editing ? (
            <div className="bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3 border border-gray-100 dark:border-coal-300 inline-flex flex-col gap-0.5 min-w-48">
              <p className="text-xs text-gray-400 dark:text-gray-500">Ciudad de expedición</p>
              {ciudadActual ? (
                <div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {ciudadActual.descripcion}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {ciudadActual.departamento.descripcion}
                  </p>
                </div>
              ) : (
                <span className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                  No asignada
                </span>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                Ciudad de expedición del documento
              </label>

              {form.ciudadExpedicionId && ciudadSeleccionadaLabel && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg w-fit">
                  <i className="ki-outline ki-geolocation text-blue-500 text-sm" />
                  <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                    {ciudadSeleccionadaLabel}
                  </span>
                  <button
                    onClick={() => {
                      setForm({ ...form, ciudadExpedicionId: '' });
                      setCiudadSearch('');
                    }}
                    className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors ml-1"
                  >
                    <i className="ki-outline ki-cross text-xs" />
                  </button>
                </div>
              )}

              <div className="relative">
                <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={ciudadSearch}
                  onChange={(e) => setCiudadSearch(e.target.value)}
                  placeholder="Buscar ciudad o departamento..."
                  className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {ciudadSearch.trim().length > 0 && ciudadSearch.trim().length < 2 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 flex items-center gap-1">
                  <i className="ki-outline ki-information-2 text-xs" />
                  Escribe al menos 2 caracteres para buscar.
                </p>
              )}

              {ciudadesFiltradas.length > 0 && (
                <div className="mt-1.5 border border-gray-200 dark:border-coal-300 rounded-lg overflow-hidden bg-white dark:bg-coal-400 shadow-sm">
                  {ciudadesFiltradas.map((ciudad, idx) => (
                    <button
                      key={ciudad.id}
                      onClick={() => {
                        setForm({ ...form, ciudadExpedicionId: ciudad.id });
                        setCiudadSearch('');
                      }}
                      className={[
                        'w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors',
                        idx !== ciudadesFiltradas.length - 1
                          ? 'border-b border-gray-100 dark:border-coal-300'
                          : ''
                      ].join(' ')}
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {ciudad.descripcion}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 shrink-0">
                        {ciudad.departamento.descripcion}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {ciudadSearch.trim().length >= 2 && ciudadesFiltradas.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                  <i className="ki-outline ki-information-2 text-xs" />
                  No se encontraron ciudades con ese nombre.
                </p>
              )}
            </div>
          )}

          {editing && (
            <div className="flex justify-end gap-2 pt-5 mt-2 border-t border-gray-100 dark:border-coal-300">
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

      {/* ── Modal de Actividades ── */}
      {showActividadesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-coal-300 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
                  <i className="ki-outline ki-clipboard text-blue-600 dark:text-blue-400 text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Actividades del Contrato
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Contrato #{contrato.id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseActividadesModal}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-400 flex items-center justify-center transition-colors"
              >
                <i className="ki-outline ki-cross text-gray-500 dark:text-gray-400 text-lg" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Formulario para crear/editar */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-500/5 dark:to-indigo-500/5 rounded-xl p-5 mb-6 border border-blue-200 dark:border-blue-500/30">
                <div
                  onClick={() => setOpenForm(!openForm)}
                  className="cursor-pointer flex items-center justify-between mb-4"
                >
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <i className="ki-outline ki-add-item text-blue-600 dark:text-blue-400" />
                    {editingActividad ? 'Editar Actividad' : 'Nueva Actividad'}
                  </h3>

                  <i
                    className={`ki-outline ${
                      openForm ? 'ki-up' : 'ki-down'
                    } text-gray-500 transition-transform`}
                  />
                </div>

                {openForm && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                        Obligaciones
                      </label>
                      <textarea
                        rows={3}
                        value={actividadForm.obligaciones}
                        onChange={(e) =>
                          setActividadForm({
                            ...actividadForm,
                            obligaciones: e.target.value.toUpperCase()
                          })
                        }
                        placeholder="DESCRIPCIÓN DE LAS OBLIGACIONES..."
                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                        Acciones Realizadas
                      </label>
                      <textarea
                        rows={3}
                        value={actividadForm.accionesRealizadas}
                        onChange={(e) =>
                          setActividadForm({
                            ...actividadForm,
                            accionesRealizadas: e.target.value.toUpperCase()
                          })
                        }
                        placeholder="DESCRIPCIÓN DE LAS ACCIONES REALIZADAS..."
                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
                        Evidencias
                      </label>
                      <textarea
                        rows={3}
                        value={actividadForm.evidencias}
                        onChange={(e) =>
                          setActividadForm({
                            ...actividadForm,
                            evidencias: e.target.value.toUpperCase()
                          })
                        }
                        placeholder="EVIDENCIAS PRESENTADAS..."
                        className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      {editingActividad && (
                        <button
                          onClick={handleCancelActividadEdit}
                          className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-300 transition-all"
                        >
                          Cancelar edición
                        </button>
                      )}
                      <button
                        onClick={handleSaveActividad}
                        disabled={savingActividad}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50"
                      >
                        {savingActividad ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <i className="ki-outline ki-check text-sm" />
                            {editingActividad ? 'Actualizar' : 'Crear Actividad'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de actividades */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <i className="ki-outline ki-notification-status text-gray-400" />
                  Actividades Registradas
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-coal-400 text-gray-600 dark:text-gray-400">
                    {actividades.length}
                  </span>
                </h3>

                {loadingActividades ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : actividades.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-coal-400 rounded-lg border border-gray-200 dark:border-coal-300">
                    <i className="ki-outline ki-file-deleted text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay actividades registradas
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Crea tu primera actividad usando el formulario de arriba
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actividades.map((actividad, index) => (
                      <div
                        key={actividad.id}
                        className="bg-white dark:bg-coal-400 rounded-lg border border-gray-200 dark:border-coal-300 p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                              <i className="ki-outline ki-document text-indigo-600 dark:text-indigo-400 text-sm" />
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Actividad # {index + 1}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">
                                {new Date(actividad.created_at).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditActividad(actividad)}
                              className="w-7 h-7 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 flex items-center justify-center transition-colors"
                              title="Editar"
                            >
                              <i className="ki-outline ki-pencil text-blue-600 dark:text-blue-400 text-sm" />
                            </button>
                            <button
                              onClick={() => handleDeleteActividad(actividad.id)}
                              className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center transition-colors"
                              title="Eliminar"
                            >
                              <i className="ki-outline ki-trash text-red-600 dark:text-red-400 text-sm" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Obligaciones:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                              {actividad.obligaciones}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Acciones Realizadas:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                              {actividad.accionesRealizadas}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                              Evidencias:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                              {actividad.evidencias}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContratoGeneralInstructor;
