import { ContratoInterface } from '../model/ContratoInterface';
import { KeenIcon } from '@/components';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ModalUpdateCompany } from '../ModalUpdateCompany';

interface ICommunityBadgesProps {
  title: string;
  contrato: ContratoInterface;
  onSave?: () => void;
}

const CompanyBadge = ({ title, contrato, onSave }: ICommunityBadgesProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const centroId = useMemo(() => {
    return (
      (contrato as any)?.idCentroFormacion ??
      contrato?.persona?.usuario?.idCentroFormacion ??
      contrato?.persona?.usuario?.centroFormacion?.id ??
      (contrato as any)?.centroFormacion?.id ??
      null
    );
  }, [contrato]);

  const centroNombreDirecto =
    contrato?.persona?.usuario?.centroFormacion?.nombre ??
    (contrato as any)?.centroFormacion?.nombre ??
    null;

  const [centroNombre, setCentroNombre] = useState<string | null>(centroNombreDirecto);

  useEffect(() => {
    // Si el nombre ya viene directo, no consultamos.
    if (centroNombreDirecto) {
      setCentroNombre(centroNombreDirecto);
      return;
    }

    if (!centroId) {
      setCentroNombre(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await axios.get('centrosFormacion');
        const centros = res?.data?.data || res?.data || [];
        const found = Array.isArray(centros)
          ? centros.find((c: any) => String(c?.id) === String(centroId))
          : null;
        if (!cancelled) setCentroNombre(found?.nombre ?? null);
      } catch {
        if (!cancelled) setCentroNombre(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [centroId, centroNombreDirecto]);

  return (
    <>
      <div className="card w-full">
        <div className="card-header">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <KeenIcon icon="office-bag" className="text-lg text-primary" />
              <h3 className="card-title text-xs">{title}</h3>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Editar empresa"
            >
              <KeenIcon className="text-xs text-primary" icon="pencil" />
            </button>
          </div>
        </div>

      <div className="card-body !p-2.5">
        <div className="flex items-start gap-2">
          {/* Logo SENA - verde con texto blanco, o imagen si existe */}
          {contrato?.empresa?.rutaLogoUrl ? (
            <img
              src={contrato.empresa.rutaLogoUrl}
              alt="Logo SENA"
              className="w-12 h-12 object-contain rounded-lg"
            />
          ) : (
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">SENA</span>
            </div>
          )}
          
          <div className="flex-1">
            <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-2">
              Centro de formación:{' '}
              <span className="text-gray-800 dark:text-gray-200">
                {centroNombre ? centroNombre : 'N/A'}
              </span>
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-white mb-0.5">
              {contrato?.empresa?.razonSocial || 'SENA'}
            </p>
            <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5">
              NIT: {contrato?.empresa?.nit || 'N/A'}{contrato?.empresa?.digitoVerificacion ? `-${contrato.empresa.digitoVerificacion}` : ''}
            </p>
            <p className="text-[11px] font-bold text-gray-900 dark:text-white">
              Área: <span className="font-normal text-gray-800 dark:text-gray-200">{contrato?.area?.nombre || 'N/A'}</span>
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
