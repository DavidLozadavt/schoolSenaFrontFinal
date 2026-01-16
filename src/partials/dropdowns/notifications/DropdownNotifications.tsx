import { KeenIcon } from '@/components';
import { MenuSub } from '@/components/menu';
import { Tab, TabPanel, Tabs, TabsList } from '@/components/tabs';
import { DropdownNotificationsAll } from './DropdownNotificationsAll';
import { DropdownNotificationNoRead } from './DropdownNotificationsNoRead';
import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

interface IDropdownNotificationProps {
  menuTtemRef: any;
}

const DropdownNotifications = ({ menuTtemRef }: IDropdownNotificationProps) => {

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const handleClose = () => {
    if (menuTtemRef.current) {
      menuTtemRef.current.hide();
    }
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`notificaciones`);
      setNotifications(response.data);
    } catch (error) {
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  }, []);

 

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const buildHeader = () => {
    return (
      <div className="flex items-center justify-between gap-2.5 text-sm text-gray-900 font-semibold px-5 py-2.5 border-b border-b-gray-200">
        Notificaciones
        <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={handleClose}>
          <KeenIcon icon="cross" />
        </button>
      </div>
    );
  };

  const buildTabs = () => {
    const noReadNotifications = notifications.filter((item) => item.estado_id === 1);
    const readNotifications = notifications.filter((item) => item.estado_id === 2);
    return (
      <Tabs defaultValue={1} className="">
        <TabsList className="justify-between px-5 mb-2">
          <div className="flex items-center gap-5">
            <Tab value={1}>Todas</Tab>
            <Tab value={2} className="relative">
              Sin Leer
            </Tab>
            <Tab value={3}>Leidas</Tab>
          </div>
        </TabsList>
        <TabPanel value={1}>
          <DropdownNotificationsAll items={notifications} />
        </TabPanel>
        <TabPanel value={2}>
          <DropdownNotificationNoRead items={noReadNotifications} />
        </TabPanel>
        <TabPanel value={3}>
          <DropdownNotificationNoRead items={readNotifications} />
        </TabPanel>
      </Tabs>
    );
  };

  return (
    <MenuSub rootClassName="w-full max-w-[460px]" className="light:border-gray-300">
      {buildHeader()}
      {buildTabs()}
    </MenuSub>
  );
};

export { DropdownNotifications };
