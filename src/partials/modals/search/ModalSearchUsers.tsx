import React from 'react';
import { toAbsoluteUrl } from '@/utils';
import { KeenIcon } from '@/components';
import { IModalSearchUsersItem } from './types';

interface IModalSearchUsersProps {
  items: any[];
  more?: boolean;
}

const ModalSearchUsers = ({ items, more = true }: IModalSearchUsersProps) => {
  return (
    <div className="menu menu-default p-0 flex-col">
      <div className="grid gap-1">
        {items.map((item, index) => (
          <div className="menu-item" key={index}>
            <div className="menu-link flex justify-between gap-2">
              {/* User avatar and info */}
              <div className="flex items-center gap-2.5">
                <img
                  src={toAbsoluteUrl(`${item?.persona?.rutaFotoUrl}`)}
                  className="rounded-full size-9 shrink-0"
                  alt={item.persona.nombre1}
                />
                <div className="flex flex-col">
                  <a
                    href="#"
                    className="text-sm font-semibold text-gray-900 hover:text-primary-active mb-px"
                  >
                    {item?.persona?.nombre1} {item?.persona?.nombre2} {item?.persona?.apellido1}{' '}
                    {item?.persona?.apellido2}
                  </a>
                  <span className="text-2sm font-normal text-gray-500">{item.persona.email}</span>
                </div>
              </div>

              {/* Status badge and action button */}
              <div className="flex items-center gap-2.5">
                <div className={`badge badge-pill badge-outline gap-1.5`}>
                  {item?.salario?.rol?.name}
                </div>
                <button className="btn btn-icon btn-light btn-clear btn-sm">
                  <KeenIcon icon="messages" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Conditional "Go to Users" button */}
        {!more && (
          <div className="menu-item px-4 pt-2">
            <a href="#" className="btn btn-sm btn-light justify-center">
              Go to Users
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export { ModalSearchUsers };
