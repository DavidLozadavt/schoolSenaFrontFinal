import { Link } from 'react-router-dom';

import { KeenIcon } from '@/components';

import { CommonAvatar } from '../common';
import { INFT2Item, INFT2Props } from './CardNFT2';
import { BoardItemInterface } from '@/pages/canva/CanvaContent';

const CardBoardRow = ({
  id,
  image_board,
  background,
  nombreBoard,
  total_atrasado_por_vencer,
  total_cards,
  total_fecha_cercana
}: BoardItemInterface) => {
  const handleViewBoardClick = () => {
    localStorage.setItem('idBoard', id);
  };

  return (
    <div className="card p-7.5">
      <div className="flex items-center flex-wrap justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div
            className="w-24 h-24 flex-shrink-0 bg-cover bg-center rounded-md mr-4"
            style={{
              backgroundImage: image_board ? `url(${image_board.urlFile})` : 'none',
              backgroundColor: background || 'blue'
            }}
          ></div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 mb-px">
              <a
                href="#"
                className="hover:text-primary-active text-base leading-5 font-medium text-gray-900"
              >
                {nombreBoard}
              </a>
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-between gap-5 mb-3 mt-3 ${total_fecha_cercana > 0 ? 'ml-14' : ''}`}
        >
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 border-[0.5px] border-dashed border-gray-400 rounded-md px-2.5 py-2">
            <span className="text-gray-900 text-sm leading-none font-medium">Tarjetas</span>
            <span className="text-gray-700 text-xs">{total_cards}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 border-[0.5px] border-dashed border-gray-400 rounded-md px-2.5 py-2">
            <span className="text-gray-900 text-sm leading-none font-medium">Pendientes</span>
            <span className="text-gray-700 text-xs">{total_atrasado_por_vencer}</span>
          </div>
        </div>

        <div className="justify-between gap-5 mb-3 mt-3">
          {total_fecha_cercana > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-fade-in-out">
              {total_fecha_cercana} {total_fecha_cercana === 1 ? 'Tarea Nueva' : 'Tareas Nuevas'}
            </span>
          )}
        </div>

        <div className="flex justify-end mt-3">
          <Link
            to="/aplicaciones/canva/board"
            className="btn btn-link"
            onClick={handleViewBoardClick}
          >
            Ver Tablero
          </Link>
        </div>
      </div>
    </div>
  );
};

export { CardBoardRow };
