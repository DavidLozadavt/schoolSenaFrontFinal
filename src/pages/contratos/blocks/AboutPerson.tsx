import { ContratoInterface } from '../model/ContratoInterface';
import { KeenIcon } from '@/components';

interface AboutPersonProps {
  contrato: ContratoInterface;
  onEdit?: () => void;
}

const AboutPerson = ({ contrato, onEdit }: AboutPersonProps) => {
  const nombreCompleto = [
    contrato?.persona?.nombre1,
    contrato?.persona?.nombre2,
    contrato?.persona?.apellido1,
    contrato?.persona?.apellido2
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  const formatCelular = (celular?: string) => {
    if (!celular) return 'N/A';
    // Formatear como +57 300 123 4567 si es posible
    const cleaned = celular.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `+57 ${cleaned.slice(-10).match(/.{1,3}/g)?.join(' ') || cleaned}`;
    }
    return celular;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeenIcon icon="user" className="text-lg text-primary" />
            <h3 className="card-title">Acerca de la Persona</h3>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Editar datos de la persona"
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
              <p className="text-xs text-gray-500 mb-1">Nombre Completo</p>
              <p className="text-xs font-bold text-gray-900">{nombreCompleto || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Identificación</p>
              <p className="text-xs font-bold text-gray-900">{contrato?.persona?.identificacion || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Celular</p>
              <p className="text-xs font-bold text-gray-900">{formatCelular(contrato?.persona?.celular)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Dirección</p>
              <p className="text-xs font-bold text-gray-900">{contrato?.persona?.direccion || 'N/A'}</p>
            </div>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Correo Electrónico</p>
              <p className="text-xs font-bold text-gray-900">{contrato?.persona?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Fecha de Nacimiento</p>
              <p className="text-xs font-bold text-gray-900">{contrato?.persona?.fechaNac || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Sexo</p>
              <p className="text-xs font-bold text-gray-900">{contrato?.persona?.sexo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">RH</p>
              <p className="text-xs font-bold text-gray-900">{contrato?.persona?.rh || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AboutPerson};
