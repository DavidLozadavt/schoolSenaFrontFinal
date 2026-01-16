import { Link } from 'react-router-dom';
import { KeenIcon, Menu } from '@/components';
import { CommonHexagonBadge } from '../common';
import { ReactNode } from 'react';

interface IRoleProps {
  path: string;
  title: string;
  subTitle: string;
  description: string;
  team: string;
  badge: ReactNode;
  onRoleClick: () => void;
  onRoleDelete: () => void;
}

const CardRole = ({
  path,
  title,
  subTitle,
  description,
  team,
  badge,
  onRoleClick,
  onRoleDelete
}: IRoleProps) => {
  return (
    <div className="card flex flex-col gap-5 p-5 lg:p-7.5">
      <div className="flex items-center flex-wrap justify-between gap-1">
        <div className="flex items-center gap-2.5">
          <CommonHexagonBadge badge={badge} />

          <div className="flex flex-col">
            <Link
              to={path}
              className="text-md font-semibold text-gray-900 hover:text-primary-active mb-px"
              onClick={(event) => event.preventDefault()}
            >
              {title}
            </Link>
            <span className="text-2sm font-medium text-gray-600">{subTitle}</span>
          </div>
        </div>

        <Menu className="items-stretch">
          <button
            type="button"
            className="flex justify-center items-center p-1"
            onClick={onRoleClick}
          >
            <KeenIcon icon="notepad-edit" className="text-2xl" />
          </button>

          <button
            type="button"
            className="flex justify-center items-center p-1"
            onClick={onRoleDelete}
          >
            <KeenIcon icon="trash" className="text-2xl" />
          </button>
        </Menu>
      </div>

      <p className="text-2sm text-gray-600 font-medium">{description}</p>
      <span className="text-2sm text-gray-700 font-medium">{team}</span>
    </div>
  );
};

export { CardRole, type IRoleProps };