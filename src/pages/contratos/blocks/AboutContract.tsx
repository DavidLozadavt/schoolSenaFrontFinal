import { ContratoInterface } from '../model/ContratoInterface';

interface IAboutTable {
  status: string;
  info: string;
}
interface IAboutTables extends Array<IAboutTable> {}

interface AboutContractProps {
  contrato: ContratoInterface;
}
const AboutContract = ({ contrato }: AboutContractProps) => {
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

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Acerca del Contrato</h3>
      </div>

      <div className="card-body pt-4 pb-3">
        <table className="table-auto">
          <tbody>
            <tr>
              <td className="text-sm text-gray-600 pb-3.5 pe-3">Cargo:</td>
              <td className="text-sm text-gray-900 pb-3.5">
                {contrato?.salario?.rol?.name || 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="text-sm text-gray-600 pb-3.5 pe-3">Tipo de Contrato:</td>
              <td className="text-sm text-gray-900 pb-3.5">
                {contrato?.tipoContrato?.nombreTipoContrato || 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="text-sm text-gray-600 pb-3.5 pe-3">Fecha de Contrato:</td>
              <td className="text-sm text-gray-900 pb-3.5">
                {contrato?.fechaContratacion || 'N/A'}
              </td>
            </tr>

            {contrato?.tipoContrato?.nombreTipoContrato !== 'TERMINO INDEFINIDO' && (
              <>
                <tr>
                  <td className="text-sm text-gray-600 pb-3.5 pe-3">Fecha Final del Contrato:</td>
                  <td className="text-sm text-gray-900 pb-3.5">
                    {contrato?.fechaFinalContrato || 'N/A'}
                  </td>
                </tr>
                <tr>
                  <td className="text-sm text-gray-600 pb-3.5 pe-3">Valor Total del Contrato:</td>
                  <td className="text-sm text-gray-900 pb-3.5">
                    {formatCOP(contrato?.valorTotalContrato)}
                  </td>
                </tr>
              </>
            )}

            <tr>
              <td className="text-sm text-gray-600 pb-3.5 pe-3">Sueldo Mensual:</td>
              <td className="text-sm text-gray-900 pb-3.5">
                {formatCOP(contrato?.salario?.valor)}
              </td>
            </tr>

            <tr>
              <td className="text-sm text-gray-600 pb-3.5 pe-3">Objeto del Contrato:</td>
              <td className="text-sm text-gray-900 pb-3.5">{contrato?.objetoContrato || 'N/A'}</td>
            </tr>

            {contrato?.observacion && (
              <tr>
                <td className="text-sm text-gray-600 pb-3.5 pe-3">Observaciones:</td>
                <td className="text-sm text-gray-900 pb-3.5">{contrato?.observacion}</td>
              </tr>
            )}

            <tr>
              <td className="text-sm text-gray-600 pb-3.5 pe-3">Estado:</td>
              <td className="text-sm text-gray-900 pb-3.5">{contrato?.estado?.estado || 'N/A'}</td>
            </tr>
             <tr>
              <td className="text-sm text-gray-600 pb-3.5 pe-3">Area:</td>
              <td className="text-sm text-gray-900 pb-3.5">{contrato?.area?.nombre || 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export { AboutContract, type IAboutTable, type IAboutTables };
