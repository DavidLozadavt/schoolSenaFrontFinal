import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import { useState } from 'react';
import { ModalAboutContract } from '../ModalAboutContract';

interface TrazabilityContractProps {
  title: string;
  contrato: ContratoInterface;
}

const TrazabilityContract = ({ title, contrato }: TrazabilityContractProps) => {
  const otrosContratos = contrato?.otrosContratos || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [idContract, setIdContract] = useState<number | null>(null);

  const openModal = (id: number) => {
    setIdContract(id);
    setIsModalOpen(true);
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <KeenIcon icon="document" className="text-lg text-primary" />
          <h3 className="card-title">{title}</h3>
        </div>
      </div>

      <div className="card-body">
        <table className="table table-border align-middle text-gray-700 font-medium text-sm">
          <thead>
            <tr>
              <th className="text-xs text-gray-500 font-medium">Código</th>
              <th className="text-xs text-gray-500 font-medium">Detalle</th>
              <th className="text-xs text-gray-500 font-medium">Fecha del Detalle</th>
              <th className="text-xs text-gray-500 font-medium w-[100px]">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {otrosContratos.length > 0 ? (
              otrosContratos.map((item: any, index: any) => (
                <tr key={index}>
                  <td className="text-xs font-bold text-gray-900">{item.archivoContrato[0]?.idContrato}</td>
                  <td className="text-xs font-bold text-gray-900">{item.archivoContrato[0]?.observacion}</td>
                  <td className="text-xs font-bold text-gray-900">{item.archivoContrato[0]?.fecha}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-icon btn-clear btn-light"
                      onClick={() => openModal(item.archivoContrato[0]?.idContrato)}
                    >
                      <KeenIcon icon="information-2" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  <p className="text-xs text-gray-500">No hay contratos disponibles.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ModalAboutContract
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        idContract={idContract}
      />
    </div>
  );
};

export { TrazabilityContract };
