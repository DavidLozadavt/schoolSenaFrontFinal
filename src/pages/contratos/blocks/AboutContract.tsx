import { ContratoInterface, resolveFormaPago } from '../model/ContratoInterface';
import { KeenIcon } from '@/components';

interface AboutContractProps {
  contrato: ContratoInterface;
  onEdit?: () => void;
}

/** Misma lógica que el select del modal (10/15/30). */
const labelPeriodoPago = (pp: string | number | null | undefined): string => {
  if (pp === null || pp === undefined || pp === '') return 'N/A';
  const n = Number(pp);
  if (n === 10) return 'SEMANAL';
  if (n === 15) return 'QUINCENAL';
  if (n === 30) return 'MENSUAL';
  return String(pp);
};

/** Misma etiqueta que las opciones del modal de actividad de riesgo. */
const labelActividadRiesgo = (contrato: ContratoInterface): string => {
  const act = contrato?.actividadRiesgo;
  if (!act || typeof act !== 'object') return 'N/A';
  if (act.nombre) return act.nombre;
  if (act.descripcion) return act.descripcion;
  const cod = act.codigo != null && act.codigo !== '' ? String(act.codigo) : '';
  const cl = act.clase != null && act.clase !== '' ? String(act.clase) : '';
  if (cod && cl) return `${cod} - ${cl}`;
  if (cod) return cod;
  if (cl) return cl;
  return 'N/A';
};

const displayNumeroContrato = (c: ContratoInterface): string => {
  const v = c.numeroContrato ?? c.numero_contrato;
  if (v === null || v === undefined || String(v).trim() === '') return 'N/A';
  return String(v).trim();
};

const displayNumeroDocumentoContrato = (c: ContratoInterface): string => {
  const v = c.numeroDocumentoContrato ?? c.numero_documento_contrato;
  if (v === null || v === undefined || String(v).trim() === '') return 'N/A';
  return String(v).trim();
};

const AboutContract = ({ contrato, onEdit }: AboutContractProps) => {
  const formatCOP = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = Number(value);
    if (isNaN(num)) return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const estado = contrato?.estado?.estado || 'N/A';
  const isActivo = estado.toUpperCase() === 'ACTIVO';

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeenIcon icon="document" className="text-lg text-primary" />
            <h3 className="card-title">Acerca del Contrato</h3>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Editar datos del contrato"
            >
              <KeenIcon className="text-sm text-primary" icon="pencil" />
            </button>
          )}
        </div>
      </div>

      <div className="card-body">
        {/* Campos alineados con el modal “Editar datos del contrato” */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Código de Contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{contrato?.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número de contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {displayNumeroContrato(contrato)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.tipoContrato?.nombreTipoContrato || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Número de documento (contrato)</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {displayNumeroDocumentoContrato(contrato)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha de Inicio</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.fechaContratacion || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Fecha de Finalización</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.fechaFinalContrato ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Salario</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {formatCOP(contrato?.salario?.valor)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Horas al mes</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.horasmes ?? 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Período de pago</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {labelPeriodoPago(contrato?.periodoPago)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</p>
              {isActivo ? (
                <span className="inline-block px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded">
                  ACTIVO
                </span>
              ) : (
                <p className="text-xs font-bold text-gray-900 dark:text-white">{estado}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cargo (rol)</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.salario?.rol?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Forma de pago</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {resolveFormaPago(contrato) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Supervisor del contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.supervisorContrato || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cargo supervisor</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.cargoSupervisor || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor total del contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {formatCOP(contrato?.valorTotalContrato)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actividad de riesgo</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {labelActividadRiesgo(contrato)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-2xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Textos del contrato
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Objeto del contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {contrato?.objetoContrato?.trim() ? contrato.objetoContrato : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observaciones</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {contrato?.observacion?.trim() ? contrato.observacion : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Perfil profesional</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {contrato?.perfilProfesional?.trim() ? contrato.perfilProfesional : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Otrosí</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                {contrato?.otrosi != null && String(contrato.otrosi).trim() !== ''
                  ? String(contrato.otrosi)
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AboutContract };
