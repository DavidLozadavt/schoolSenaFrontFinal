import { Fragment, useCallback, useEffect, useState } from 'react';
import { useLayout } from '@/providers';
import { CommonAvatarsBoard } from '@/partials/common/CommonAvatarsBoard';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { useNavigate } from 'react-router-dom';
import { ModalBoardUsers } from './ModalBoardUsers';
import { ModalBoardDeleteUsers } from './ModalBoardDeleteUsers';

interface Card {
  id: number | string;
  titulo: string;
}

interface ListItem {
  id: number | string;
  nombreList: string;
  cards: Card[];
}

const BoardPageHeader = () => {
  const { currentLayout } = useLayout();
  const [idBoard, setIdBoard] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [persons, setPersons] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const [userBoardModalOpen, setBoardUserModalOpen] = useState(false);
  const [userBoardDeleteModalOpen, setBoardUserDeleteModalOpen] = useState(false);

  useEffect(() => {
    const idBoard = localStorage.getItem('idBoard');
    if (idBoard) {
      setIdBoard(idBoard);
    } else {
      navigate('/aplicaciones/canva');
    }
  }, [navigate]);

  const fetchUsersBoard = useCallback(async () => {
    if (!idBoard) return;
    setLoading(true);
    try {
      const response = await axios.get<any[]>(`get_persons_by_board/${idBoard}`);
      setUsers(response.data);
    } catch (error) {
      setError('Error al cargar las personas');
    } finally {
      setLoading(false);
    }
  }, [idBoard]);

  const fetchUsersAssignBoard = useCallback(async () => {
    if (!idBoard) return;
    setLoading(true);
    try {
      const response = await axios.get<any[]>(`get_persons_to_assing_board/${idBoard}`);
      setPersons(response.data);
    } catch (error) {
      setError('Error al cargar las personas');
    } finally {
      setLoading(false);
    }
  }, [idBoard]);

  useEffect(() => {
    fetchUsersBoard();
    fetchUsersAssignBoard();
  }, [fetchUsersBoard, fetchUsersAssignBoard]);

  if (loading) {
    // return <p>Cargando...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  const avatarData = users.map((user) => ({
    filename: user?.user?.persona?.rutaFotoUrl
  }));

  const handleBackClick = () => {
    localStorage.removeItem('idBoard');
    navigate('/aplicaciones/canva');
  };

  const handleAfterSave = () => {
    fetchUsersAssignBoard();
    fetchUsersBoard();
    setBoardUserModalOpen(false);
    setBoardUserDeleteModalOpen(false);
  };


  const handleBoardUserModalOpen = () => {
    setBoardUserModalOpen(true);
  };

  const handleModalClose = () => {
    setBoardUserModalOpen(false);
  };

  const handleBoardUserDeleteModalOpen = () => {
    setBoardUserDeleteModalOpen(true);
  };
  
  const handleBoardUserDeleteModalClose = () => {
    setBoardUserDeleteModalOpen(false);
  };

  return (
    <div className="container-fixed p-2">
      <div className="flex justify-between items-center border-b pb-3 mb-3 max-w-[1230px] w-full">
        <button className="btn btn-sm btn-light text-sm" onClick={handleBackClick}>
          <KeenIcon icon="arrow-left" />
          Volver
        </button>

        <div className="flex items-center space-x-2 ml-auto justify-end ">
          <span className="text-sm whitespace-nowrap">Miembros |</span>
          <CommonAvatarsBoard
            size="size-6.5"
            group={avatarData}
            onClickAvatar={handleBoardUserDeleteModalOpen}
          />
          <button
            onClick={handleBoardUserModalOpen}
            className="btn btn-sm btn-light text-sm whitespace-nowrap"
          >
            <KeenIcon icon="users" />
            Agregar
          </button>
        </div>
      </div>

      <ModalBoardUsers
        open={userBoardModalOpen}
        onClose={handleModalClose}
        persons={persons}
        onSave={handleAfterSave}
      />

      <ModalBoardDeleteUsers
        open={userBoardDeleteModalOpen}
        onClose={handleBoardUserDeleteModalClose}
        persons={users}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { BoardPageHeader };
