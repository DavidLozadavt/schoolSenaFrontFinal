import { Link } from 'react-router-dom';

import {
  KeenIcon,
  Menu,
  MenuIcon,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuToggle,
  MenuTitle
} from '@/components';
import { DropdownCardBoard } from '../dropdowns/general';
import { BoardItemInterface } from '@/pages/canva/CanvaContent';
import axios from 'axios';
import { useConfirm } from '@/hooks';
import { ModalBoard } from '@/pages/canva/ModalBoard';
import { useState } from 'react';

const CardBoard = ({
  id,
  image_board,
  background,
  nombreBoard,
  total_atrasado_por_vencer,
  total_cards,
  total_fecha_cercana,
  onReload
}: BoardItemInterface) => {
  const { confirmAction } = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleViewBoardClick = () => {
    localStorage.setItem('idBoard', id);
  };

  const deleteUserCard = async () => {
    try {
      const response = await axios.delete(`delete_board/${id}`);
      if (onReload) await onReload();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleDeleteBoard = () => {
    confirmAction('Esta acción eliminará todo el contenido dentro del tablero.', deleteUserCard);
  };

  const handleUpdateBoard = () => {
    setIsModalOpen(true);
  };

  const handleAfterSave = async () => {
    if (onReload) await onReload();
    setIsModalOpen(false);
  };

  const board = {
    id,
    image_board,
    background,
    nombreBoard,
    total_atrasado_por_vencer,
    total_cards,
    total_fecha_cercana
  };

  return (
    <div className="card relative">
      <div
        className="card-header card-rounded-t flex justify-end items-start relative p-0 bg-no-repeat bg-cover bg-center h-[120px]"
        style={{
          backgroundImage: image_board ? `url(${image_board.urlFile})` : 'none',
          backgroundColor:
            image_board || background ? (image_board ? 'transparent' : background) : 'blue'
        }}
      >
        {total_fecha_cercana > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-fade-in-out">
            {total_fecha_cercana} {total_fecha_cercana === 1 ? 'Tarea Nueva' : 'Tareas Nuevas'}
          </span>
        )}

        <div className="menu mt-2.5 mr-2.5" data-menu="true">
          <Menu className="items-stretch">
            <MenuItem
              toggle="dropdown"
              trigger="click"
              dropdownProps={{
                placement: 'bottom-end',
                modifiers: [
                  {
                    name: 'offset',
                    options: {
                      offset: [0, 10] // [skid, distance]
                    }
                  }
                ]
              }}
            >
              <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear mb-2.5-">
                <KeenIcon icon="setting-2" />
              </MenuToggle>

              <MenuSub className="menu-default" rootClassName="w-full max-w-[175px]">
                <MenuItem path="#" onClick={handleUpdateBoard}>
                  <MenuLink>
                    <MenuIcon>
                      <KeenIcon icon="notepad-edit" />
                    </MenuIcon>
                    <MenuTitle>Editar</MenuTitle>
                  </MenuLink>
                </MenuItem>
                <MenuItem path="#" onClick={handleDeleteBoard}>
                  <MenuLink>
                    <MenuIcon>
                      <KeenIcon icon="trash" />
                    </MenuIcon>
                    <MenuTitle>Eliminar</MenuTitle>
                  </MenuLink>
                </MenuItem>
              </MenuSub>
            </MenuItem>
          </Menu>
        </div>
      </div>

      <div className="card-body pt-0">
        <div className="flex items-center justify-center gap-1.5 mb-px mt-3">
          <a
            href="#"
            className="hover:text-primary-active text-base leading-5 font-medium text-gray-900"
          >
            {nombreBoard}
          </a>
        </div>

        <div className="flex items-center justify-center flex-wrap gap-2 lg:gap-5 mb-3 mt-3">
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 border-[0.5px] border-dashed border-gray-400 rounded-md px-2.5 py-2">
            <span className="text-gray-900 text-sm leading-none font-medium">Tarjetas</span>
            <span className="text-gray-700 text-xs">{total_cards}</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 border-[0.5px] border-dashed border-gray-400 rounded-md px-2.5 py-2">
            <span className="text-gray-900 text-sm leading-none font-medium">Pendientes</span>
            <span className="text-gray-700 text-xs">{total_atrasado_por_vencer}</span>
          </div>
        </div>
      </div>

      <div className="card-footer justify-center">
        <Link
          to="/aplicaciones/canva/board"
          className="btn btn-link"
          onClick={handleViewBoardClick}
        >
          Ver Tablero
        </Link>
      </div>

      <ModalBoard
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        board={board}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { CardBoard };
