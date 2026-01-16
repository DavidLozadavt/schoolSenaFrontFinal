import { ContratoInterface } from '../model/ContratoInterface';

interface ICommunityBadgesProps {
  title: string;
  contrato: ContratoInterface;
}

const CompanyBadge = ({ title, contrato }: ICommunityBadgesProps) => {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title text-center">{title}</h3>
      </div>

      <div className="card-body pb-7.5 flex flex-col items-center">
        <img
          src={contrato?.empresa?.rutaLogoUrl}
          alt="Logo de la empresa"
          className="h-[100px] w-[180px] object-contain"
        />
        <p className="text-center font-semibold">{contrato?.empresa?.razonSocial}</p>
        <p className="text-center text-gray-600">
          Nit: {contrato?.empresa?.nit} - {contrato?.empresa?.digitoVerificacion}
        </p>
      </div>
    </div>
  );
};

export { CompanyBadge, type ICommunityBadgesProps };
