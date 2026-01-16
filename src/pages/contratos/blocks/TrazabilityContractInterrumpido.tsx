import { KeenIcon } from '@/components';
import clsx from 'clsx';
import { ContratoInterface } from '../model/ContratoInterface';
import { IAboutTable, IAboutTables } from './AboutContract';

interface TrazabilityContractInterrumpidoProps {
  contrato: ContratoInterface;
  title: string;
}

const TrazabilityContractInterrumpido = ({
  contrato,
  title
}: TrazabilityContractInterrumpidoProps) => {
  const archivoContrato = Array.isArray(contrato?.archivoContrato) && contrato.archivoContrato.length > 0 ? contrato.archivoContrato[0] : null;

  const tables: IAboutTables = [
    {
      status: 'Observacion:',
      info: archivoContrato?.observacion || 'No hay observación disponible'
    },
    {
      status: 'Comprobante:',
      info: archivoContrato ? `<a href="${archivoContrato?.rutaArchivoContratoUrl}" target="_blank" class="text-gray-800 hover:text-primary-active">Revisar Comprobante</a>` : 'No hay comprobante'
    }
  ];

  const renderTable = (table: IAboutTable, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 pb-3.5 pe-3">{table.status}</td>
        <td
          className="text-sm text-gray-900 pb-3.5"
          dangerouslySetInnerHTML={{ __html: table.info }}
        />
      </tr>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="card-body pt-4 pb-3">
        <table className="table-auto">
          <tbody>
            {tables.map((table, index) => {
              return renderTable(table, index);
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { TrazabilityContractInterrumpido };