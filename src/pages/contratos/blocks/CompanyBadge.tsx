import { ContratoInterface } from '../model/ContratoInterface';
import { KeenIcon } from '@/components';
import { useState } from 'react';
import { ModalUpdateCompany } from '../ModalUpdateCompany';

interface ICommunityBadgesProps {
  title: string;
  contrato: ContratoInterface;
  onSave?: () => void;
}

const CompanyBadge = ({ title, contrato, onSave }: ICommunityBadgesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <KeenIcon icon="office-bag" className="text-lg text-primary" />
              <h3 className="card-title">{title}</h3>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Editar empresa"
            >
              <KeenIcon className="text-sm text-primary" icon="pencil" />
            </button>
          </div>
        </div>

      <div className="card-body">
        <div className="flex items-start gap-4">
          {/* Logo SENA - verde con texto blanco, o imagen si existe */}
          {contrato?.empresa?.rutaLogoUrl ? (
            <img
              src={contrato.empresa.rutaLogoUrl}
              alt="Logo SENA"
              className="w-20 h-20 object-contain rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl">SENA</span>
            </div>
          )}
          
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 mb-1">{contrato?.empresa?.razonSocial || 'SENA'}</p>
            {contrato?.persona?.usuario?.centroFormacion?.nombre ? (
              <p className="text-xs text-gray-600 mb-3">
                {contrato.persona.usuario.centroFormacion.nombre}
              </p>
            ) : null}
            <p className="text-xs font-bold text-gray-900 mb-1">
              NIT: {contrato?.empresa?.nit || 'N/A'}{contrato?.empresa?.digitoVerificacion ? `-${contrato.empresa.digitoVerificacion}` : ''}
            </p>
            <p className="text-xs font-bold text-gray-900">
              Área: <span className="font-normal">{contrato?.area?.nombre || 'N/A'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>

      <ModalUpdateCompany
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        empresa={contrato?.empresa}
        contratoId={contrato?.id}
        area={contrato?.area}
        contrato={contrato}
        onSave={() => {
          if (onSave) {
            onSave();
          }
          setIsModalOpen(false);
        }}
      />
    </>
  );
};

export { CompanyBadge, type ICommunityBadgesProps };
