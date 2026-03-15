import { useCallback, useEffect, useRef, useState } from 'react';
import { KeenIcon } from '@/components/keenicons';
import { Menu, MenuItem, MenuToggle } from '@/components';
import { DropdownUser } from '@/partials/dropdowns/user';
import { DropdownNotifications } from '@/partials/dropdowns/notifications';
import { DropdownApps } from '@/partials/dropdowns/apps';
import { DropdownChat } from '@/partials/dropdowns/chat';
import { ModalSearch } from '@/partials/modals/search/ModalSearch';
import { useAuthContext } from '@/auth';
import axios from 'axios';

const HeaderTopbar = () => {
  const itemChatRef = useRef<any>(null);
  const itemAppsRef = useRef<any>(null);
  const itemNotificationsRef = useRef<any>(null);
  const authContext = useAuthContext();
  const { persona, auth } = authContext;
  const handleShow = () => {
    window.dispatchEvent(new Event('resize'));
  };

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const handleOpen = () => setSearchModalOpen(true);
  const handleClose = () => {
    setSearchModalOpen(false);
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`notificacionSistema`);
      setNotifications(response?.data?.data ?? []);
    } catch {
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  //Función centralizada — la usan tanto el badge como el dropdown
  const marcarComoLeida = useCallback(async (id: number) => {
    try {
      await axios.patch(`notificacionSistema/${id}`, { estado_id: 2 });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, estado_id: 2 } : n)));
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  }, []);

  const unreadCount = notifications.filter((n) => n.estado_id === 1).length;

  // No renderizar dropdowns si no hay sesión activa
  if (!auth) return null;

  return (
    <div className="flex items-stretch gap-1 lg:gap-3.5">
      <div className="flex items-center">
        <button
          onClick={handleOpen}
          className="btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-500"
        >
          <KeenIcon icon="magnifier" />
        </button>
        <ModalSearch open={searchModalOpen} onClose={handleClose} />
      </div>

      <Menu className="items-stretch">
        <MenuItem
          ref={itemChatRef}
          onShow={handleShow}
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [170, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuToggle>
            <div className="btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-500 menu-item-show:bg-primary-light menu-item-show:text-primary">
              <KeenIcon icon="messages" />
            </div>
          </MenuToggle>

          {DropdownChat({ menuTtemRef: itemChatRef })}
        </MenuItem>
      </Menu>

      {/* <Menu className="items-stretch"> */}
      {/* <MenuItem
          ref={itemAppsRef}
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [10, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuToggle>
            <div className="btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-500 menu-item-show:bg-primary-light menu-item-show:text-primary">
              <KeenIcon icon="element-11" />
            </div>
          </MenuToggle>

          {DropdownApps()}
        </MenuItem> */}
      {/* </Menu> */}

      <Menu className="items-stretch">
        <MenuItem
          ref={itemNotificationsRef}
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [70, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuToggle>
            <div className="relative btn btn-icon btn-icon-lg size-9 rounded-full hover:bg-primary-light hover:text-primary text-gray-500 menu-item-show:bg-primary-light menu-item-show:text-primary">
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] text-xs text-white bg-green-500 rounded-full px-1 animate-pulse">
                  {unreadCount}
                </span>
              )}
              <KeenIcon icon="notification" />
            </div>
          </MenuToggle>

          {DropdownNotifications({
            menuTtemRef: itemNotificationsRef,
            notifications,
            loading,
            error,
            marcarComoLeida
          })}
        </MenuItem>
      </Menu>

      <Menu className="items-stretch -me-2">
        <MenuItem
          toggle="dropdown"
          trigger="click"
          dropdownProps={{
            placement: 'bottom-end',
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [20, 0] // [skid, distance]
                }
              }
            ]
          }}
        >
          <MenuToggle>
            <div className="btn btn-icon rounded-full">
              <img
                className="size-9 rounded-full border-2 border-success shrink-0"
                src={persona?.rutaFotoUrl}
                alt=""
              />
            </div>
          </MenuToggle>
          {DropdownUser()}
        </MenuItem>
      </Menu>
    </div>
  );
};

export { HeaderTopbar };
