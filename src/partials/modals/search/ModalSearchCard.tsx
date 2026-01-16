import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import React, { useState } from 'react';
import { IModalSearchDocsItem } from './types';
import { ModalCard } from '@/pages/canva/ModalCard';

// Define the interface for the items
interface IModalSearchDocsProps {
  items: any[];
}

const ModalSearchCard = ({ items }: IModalSearchDocsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null); // Estado para manejar el id de la tarjeta seleccionada

 
  const openModal = (id: string, title: string) => {
    setSelectedCardId(id); 
    setIsModalOpen(true);
  };

  return (
    <div className="menu menu-default p-0 flex-col">
      <div className="grid">
        {items.map((item, index) => (
          <div className="menu-item" key={index}>
            <div className="menu-link flex items-center">
              <div className="flex items-center grow gap-2.5">
                <KeenIcon icon="abstract-26" />

                {selectedCardId === item.id && (
                  <ModalCard
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    idCard={item.id}
                    title={item.titulo}
                  />
                )}

                <div className="flex flex-col"    onClick={() => openModal(item.id, item.titulo)}>
                  <span className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-primary mb-px"
                 
                  >
                    {item.titulo}
                  </span>
                  <span className="text-xs font-medium text-gray-500">{item?.descripcion}</span>
                </div>
              </div>
             
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { ModalSearchCard };
