import { ContratoInterface } from '../model/ContratoInterface';
import { KeenIcon } from '@/components';

interface AboutContractProps {
  contrato: ContratoInterface;
  onEdit?: () => void;
}

const AboutContract = ({ contrato, onEdit }: AboutContractProps) => {
  const formatCOP = (value: any) => {
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Código de Contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{contrato?.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.tipoContrato?.nombreTipoContrato || 'N/A'}
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
                {contrato?.fechaFinalContrato || 'N/A'}
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
          </div>

          {/* Columna Derecha */}
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cargo</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.salario?.rol?.name || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Objeto del Contrato</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {contrato?.objetoContrato || 'N/A'}
              </p>
            </div>
            {contrato?.observacion && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observaciones</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{contrato.observacion}</p>
              </div>
            )}
            {contrato?.otrosi && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Otrosí</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{contrato.otrosi}</p>
              </div>
            )}
            {contrato?.actividadRiesgo && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Actividad de Riesgo</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {contrato.actividadRiesgo.nombre || contrato.actividadRiesgo.descripcion || 'N/A'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { AboutContract };
