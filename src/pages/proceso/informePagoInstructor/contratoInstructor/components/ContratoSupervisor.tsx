import React from 'react';
import { Contrato, ContratoFormData, CiudadDepartamento } from '../types';
import { FORMAS_DE_PAGO, FORMA_PAGO_STYLES } from '../constants';

interface ContratoSupervisorProps {
  contrato: Contrato | null;
  editing: boolean;
  saving: boolean;
  form: ContratoFormData;
  ciudades: CiudadDepartamento[];
  ciudadSearch: string;
  ciudadesFiltradas: CiudadDepartamento[];
  ciudadSeleccionadaLabel: string | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFormChange: (newForm: ContratoFormData) => void;
  onCiudadSearchChange: (search: string) => void;
}

export const ContratoSupervisor: React.FC<ContratoSupervisorProps> = ({
  contrato,
  editing,
  saving,
  form,
  ciudades,
  ciudadSearch,
  ciudadesFiltradas,
  ciudadSeleccionadaLabel,
  onEdit,
  onCancel,
  onSave,
  onFormChange,
  onCiudadSearchChange
}) => {
  if (!contrato) return null;

  const supervisorAsignado = contrato.supervisorContrato || contrato.cargoSupervisor;
  const ciudadActual = contrato.persona?.ciudad_expedicion_rel;

  return (
    <div className="overflow-hidden">
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
              onClick={onEdit}
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
                    onFormChange({ ...form, supervisorContrato: e.target.value.toUpperCase() })
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
                    onFormChange({ ...form, cargoSupervisor: e.target.value.toUpperCase() })
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
                  onFormChange({
                    ...form,
                    formaDePago: e.target.value as Contrato['formaDePago']
                  })
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
                  onFormChange({ ...form, descripcionFormaPago: e.target.value.toUpperCase() })
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
                  onFormChange({
                    ...form,
                    siif: e.target.value ? Number(e.target.value) : null
                  })
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
                  onFormChange({ ...form, objetoContrato: e.target.value.toUpperCase() })
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
                    onFormChange({ ...form, ciudadExpedicionId: '' });
                    onCiudadSearchChange('');
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
                onChange={(e) => onCiudadSearchChange(e.target.value)}
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
                {ciudadesFiltradas.map((ciudad) => (
                  <button
                    key={ciudad.id}
                    onClick={() => {
                      onFormChange({ ...form, ciudadExpedicionId: ciudad.id });
                      onCiudadSearchChange('');
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-coal-300 border-b border-gray-100 dark:border-coal-300 last:border-b-0 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{ciudad.descripcion}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {ciudad.departamento.descripcion}
                      </p>
                    </div>
                    <i className="ki-outline ki-right text-gray-300 dark:text-gray-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            {ciudadSearch.trim().length >= 2 && ciudadesFiltradas.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                <i className="ki-outline ki-search text-xs" />
                No se encontraron resultados.
              </p>
            )}
          </div>
        )}

        {editing && (
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-300 transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-all disabled:opacity-50"
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
  );
};
