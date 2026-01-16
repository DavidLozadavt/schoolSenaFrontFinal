import React, { forwardRef, useCallback, useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader } from '@/components/modal';
import { KeenIcon, Menu, MenuItem, MenuToggle } from '@/components';
import { Tab, TabPanel, Tabs, TabsList } from '@/components/tabs';
import { DropdownCrud2 } from '@/partials/dropdowns/general';
import { useViewport } from '@/hooks';
import {
  ModalSearchCard,
  ModalSearchMixed,
  ModalSearchSettings,
  ModalSearchIntegrations,
  ModalSearchUsers,
  ModalSearchEmpty,
  ModalSearchNoResults,
  IModalSearchDocsItem,
  IModalSearchUsersItem,
  IModalSearchSettingsItem,
  IModalSearchIntegrationsItem
} from './';
import axios from 'axios';
import { ModalSearchCardArchivate } from './ModalSearchCardArchivate';
interface ModalSearchProps {
  open: boolean;
  onClose: () => void;
}

interface Card {
  id: number;
  titulo: string;
  descripcion: string;
}

interface ListTask {
  id: number;
  nombreList: string;
  cards: Card[];
}

interface Board {
  id: number;
  nombreBoard: string;
  lists_task: ListTask[];
}

const ModalSearch = forwardRef<HTMLDivElement, ModalSearchProps>(({ open, onClose }, ref) => {
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const [users, setUsers] = useState<any[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [filteredCards, setFilteredCards] = useState<Card[]>([]);
  const [filteredAtrasadoCards, setFilteredAtrasadoCards] = useState<Card[]>([]);

  const [activeTab, setActiveTab] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<string>('');
  const offset = 200;

  useEffect(() => {
    setScrollableHeight(viewportHeight - offset);
  }, [viewportHeight]);


  useEffect(() => {
    if (open) {
      setActiveTab(4);
      setSearchQuery(''); 
    }
  }, [open]);
  

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(`users_company`);
      setUsers(response.data);
      setAllUsers(response.data);
    } catch (error) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCards = useCallback(async () => {
    try {
      const response = await axios.get(`get_my_boards`);

      const allCards = response.data.flatMap(
        (item: any) => item.board.lists_task?.flatMap((list: any) => list.cards || []) || []
      );

      const archivadoCards = response.data.flatMap(
        (item: any) =>
          item.board.lists_task?.flatMap(
            (list: any) =>
              list.cards?.filter((card: any) =>
                card.card_details?.some((detail: any) => detail.estado === 'ARCHIVADO')
              ) || []
          ) || []
      );

      setCards(allCards);
      setFilteredAtrasadoCards(archivadoCards);
    } catch (error) {
      setError('Error al cargar las tarjetas');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (activeTab === 4) {
      setUsers(
        query === ''
          ? allUsers
          : allUsers.filter(
              (user) =>
                user.persona?.nombre1?.toLowerCase().includes(query) ||
                user.persona?.nombre2?.toLowerCase().includes(query) ||
                user.persona?.apellido1?.toLowerCase().includes(query) ||
                user.persona?.email?.toLowerCase().includes(query)
            )
      );
    } else if (activeTab === 5) {
      const results = cards.filter(
        (card) =>
          card.titulo.toLowerCase().includes(query) ||
          card.descripcion?.toLowerCase().includes(query)
      );
      setFilteredCards(results);
    } else if (activeTab === 6) {
      const atrasadoResults = filteredAtrasadoCards.filter(
        (card) =>
          card.titulo.toLowerCase().includes(query) ||
          card.descripcion?.toLowerCase().includes(query)
      );

      setFilteredAtrasadoCards(atrasadoResults);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent | null, newTab: number | string | null) => {
    setActiveTab(newTab as number);
    setSearchQuery('');

    if (newTab === 5) {
      setFilteredCards([]);
    } else if (newTab === 6) {
      fetchCards();
      setFilteredAtrasadoCards([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchCards();
  }, [fetchUsers, fetchCards]);

  return (
    <Modal open={open} onClose={onClose} ref={ref}>
      <ModalContent className="max-w-[600px] top-[5%]">
        <ModalHeader className="py-4 px-5">
          <KeenIcon icon="magnifier" className="text-gray-700 text-xl" />
          <input
            type="text"
            value={searchQuery}
            name="query"
            className="input px-0 border-none bg-transparent shadow-none ml-2.5"
            onChange={handleSearchInput}
            placeholder="Buscar..."
          />
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="p-0 pb-5">
          <Tabs value={activeTab} onChange={handleTabChange}>
            <TabsList className="justify-between px-5 mb-2.5">
              <div className="flex items-center gap-5">
                <Tab value={4}>Usuarios</Tab>
                <Tab value={5}>Tarjetas</Tab>
                <Tab value={6}>Tarjetas Archivadas</Tab>
              </div>
              <Menu className="items-stretch"></Menu>
            </TabsList>
            <div className="scrollable-y-auto" style={{ maxHeight: `${scrollableHeight}px` }}>
              <TabPanel value={4}>
                <ModalSearchUsers items={users} />
              </TabPanel>
              <TabPanel value={5}>
                <ModalSearchCard items={filteredCards} />
              </TabPanel>
              <TabPanel value={6}>
                <ModalSearchCardArchivate items={filteredAtrasadoCards} onReload={fetchCards} />
              </TabPanel>
            </div>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
});

export { ModalSearch };
