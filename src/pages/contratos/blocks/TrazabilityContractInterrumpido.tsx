import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';

interface TrazabilityContractInterrumpidoProps {
  contrato: ContratoInterface;
  title: string;
}

const TrazabilityContractInterrumpido = ({
  contrato,
  title
}: TrazabilityContractInterrumpidoProps) => {
  const archivoContrato = Array.isArray(contrato?.archivoContrato) && contrato.archivoContrato.length > 0 ? contrato.archivoContrato[0] : null;

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <KeenIcon icon="information-2" className="text-lg text-primary" />
          <h3 className="card-title">{title}</h3>
        </div>
      </div>

      <div className="card-body">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Observacion</p>
            <p className="text-xs font-bold text-gray-900 dark:text-white">
              {archivoContrato?.observacion || 'No hay observación disponible'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Comprobante</p>
            {archivoContrato?.rutaArchivoContratoUrl ? (
              <a
                href={archivoContrato.rutaArchivoContratoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-primary hover:underline"
              >
                Revisar Comprobante
              </a>
            ) : (
              <p className="text-xs font-bold text-gray-900 dark:text-white">No hay comprobante</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { TrazabilityContractInterrumpido };