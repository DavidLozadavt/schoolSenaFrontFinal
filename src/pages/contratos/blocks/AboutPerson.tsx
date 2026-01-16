import { ContratoInterface } from '../model/ContratoInterface';

interface IAboutTable {
  status: string;
  info: string;
}
interface IAboutTables extends Array<IAboutTable> {}

interface AboutPersonProps {
  contrato: ContratoInterface;
}

const AboutPerson = ({ contrato }: AboutPersonProps) => {
  const tables: IAboutTables = [
    {
      status: 'Nombre:',
      info: [
        contrato?.persona?.nombre1,
        contrato?.persona?.nombre2,
        contrato?.persona?.apellido1,
        contrato?.persona?.apellido2
      ]
        .filter(Boolean)
        .join(' ')
    },
    {
      status: 'Correo Electrónico:',
      info: contrato?.persona?.email ?? ''

    },
    { status: 'Identificación:', info: contrato?.persona?.identificacion ?? '' },
    { status: 'Fecha de Nacimiento:', info: contrato?.persona?.fechaNac ?? '' },
    { status: 'Celular:', info: contrato?.persona?.celular ?? '' },
    { status: 'Dirección:', info: contrato?.persona?.direccion ?? '' },
    { status: 'Sexo:', info: contrato?.persona?.sexo ?? '' },
    { status: 'Rh:', info: contrato?.persona?.rh ?? '' }

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
        <h3 className="card-title">Acerca de la Persona</h3>
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

export { AboutPerson};
