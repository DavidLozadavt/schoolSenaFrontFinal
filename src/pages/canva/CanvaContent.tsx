import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { KeenIcon } from '@/components';

import { CardBoard, CardNFT2Row } from '@/partials/cards';
import { CardBoardRow } from '@/partials/cards/CardBoardRow';
import Spinner from '@/components/loaders/Spinner';


interface ImageBoard {
  id: number;
  urlFile: string;
}

export interface BoardItemInterface {
  id: string;
  nombreBoard: string;
  background: string;
  image_board: ImageBoard;
  total_cards: number;
  total_atrasado_por_vencer: number;
  total_fecha_cercana: number;
  created_at?: any;
  onReload?: () => Promise<void>;
}

interface BoardInterface {
  id: number;
  idBoard: number;
  board: BoardItemInterface;
}

interface CanvaContentProps {
  reload: boolean;
}

const CanvaContent = ({ reload }: CanvaContentProps) => {
  const [activeTab, setActiveTab] = useState<'cards' | 'list'>('cards');
  const [boards, setBoards] = useState<BoardItemInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('1');

  const handleTabClick = (tab: 'cards' | 'list') => {
    setActiveTab(tab);
  };

  const fetchBoards = async () => {
    setLoading(true);
    try {
      const response = await axios.get<BoardInterface[]>('get_my_boards');
      setBoards(response.data.map((item) => item.board));
    } catch (error) {
      setError('Error al cargar los tableros');
    } finally {
      setLoading(false);
    }
  };

  const filteredBoards = boards
  .filter((board) =>
    board.nombreBoard.toLowerCase().includes(searchQuery.toLowerCase())
  )
  .sort((a, b) => {
    if (a.total_fecha_cercana >= 1 && b.total_fecha_cercana < 1) {
      return -1;
    }
    if (a.total_fecha_cercana < 1 && b.total_fecha_cercana >= 1) {
      return 1;
    }


    if (sortOption === '1') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); 
    } else {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
  });


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
  };

  useEffect(() => {
    fetchBoards();
  }, [reload]);


  if (error) {
    return <p>{error}</p>;
  }

  const renderItem = (board: BoardItemInterface) => (
    <CardBoard
      id={board.id}
      nombreBoard={board.nombreBoard}
      background={board.background}
      image_board={board.image_board}
      total_cards={board.total_cards}
      total_atrasado_por_vencer={board.total_atrasado_por_vencer}
      total_fecha_cercana={board.total_fecha_cercana}
      onReload={fetchBoards}
    />
  );

  const renderRowItem = (board: BoardItemInterface) => (
    <CardBoardRow
      id={board.id}
      nombreBoard={board.nombreBoard}
      background={board.background}
      image_board={board.image_board}
      total_cards={board.total_cards}
      total_atrasado_por_vencer={board.total_atrasado_por_vencer}
      total_fecha_cercana={board.total_fecha_cercana}
    />
  );

  return (
    
    <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">

      <div className="flex flex-wrap items-center gap-5 justify-between">
        <h3 className="text-md text-gray-900 font-medium">Mostrando {filteredBoards.length} Tableros</h3>
        <div className="flex items-center flex-wrap gap-5">
          <div className="flex items-center gap-2.5">
            <select
              className="select select-sm w-28"
              value={sortOption}
              onChange={handleSortChange}
            >
              <option value="1">Más reciente</option>
              <option value="2">Más antiguo</option>
            </select>
          </div>

          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                placeholder="Buscar Tablero"
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </label>
          </div>

          <div className="btn-tabs btn-tabs-sm" data-tabs="true">
            <a
              href="#"
              className={`btn btn-icon ${activeTab === 'cards' ? 'active' : ''}`}
              onClick={() => handleTabClick('cards')}
              data-tab-toggle="#network_cards"
            >
              <KeenIcon icon="category" />
            </a>
            <a
              href="#"
              className={`btn btn-icon ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => handleTabClick('list')}
              data-tab-toggle="#network_list"
            >
              <KeenIcon icon="row-horizontal" />
            </a>
          </div>
        </div>
      </div>
      {loading && <Spinner />}

      {activeTab === 'cards' ? (
        <div id="network_cards">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">
            {filteredBoards.map((item) => renderItem(item))}
          </div>
        </div>
      ) : (
        <div id="network_list">
          <div className="flex flex-col gap-5 lg:gap-7.5">
            {filteredBoards.map((item) => {
              return renderRowItem(item);
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export { CanvaContent };
