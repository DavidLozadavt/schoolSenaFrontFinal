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
        <h3 className="card-title">{title}</h3>
      </div>

      <table className="table table-border align-middle text-gray-700 font-medium text-sm">
        <thead>
          <tr>
            <th>Código</th>
            <th>Detalle</th>
            <th>Fecha del Detalle</th>
            <th className="w-[100px]">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {otrosContratos.length > 0 ? (
            otrosContratos.map((item: any, index: any) => (
              <tr key={index}>
                <td>{item.archivoContrato[0]?.idContrato}</td>
                <td>{item.archivoContrato[0]?.observacion}</td>
                <td>{item.archivoContrato[0]?.fecha}</td>
                <td className="text-center">
                  <button
                    className="btn btn-sm btn-icon btn-clear btn-light"
                    onClick={() => openModal(item.archivoContrato[0]?.idContrato)}
                  >
                    <KeenIcon
                      icon="information-2"
                    />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center">
                No hay contratos disponibles.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
