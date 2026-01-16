import { Fragment, useCallback, useEffect, useState } from 'react';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { BoardPageHeader } from './BoardPageHeader';
import { ModalCard } from './ModalCard';
import clsx from 'clsx';
import Spinner from '@/components/loaders/Spinner';

interface CanvaContentProps {
  reload: boolean;
}

interface Card {
  id: string;
  titulo: string;
  descripcion: string;

  card_details: {
    id: number;
    idCard: number;
    fechaInicial: string;
    fechaFinal: string | null;
    completado: number;
    estado: string;
    hora: string;
  }[];
}

interface ListItem {
  id: number | string;
  nombreList: string;
  cards: Card[];
}

const BoardPage = () => {
  const { currentLayout } = useLayout();
  const [idBoard, setIdBoard] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIdCard, setSelectedIdCard] = useState<string>('');
  const [selectedTitleCard, setSelectedTitleCard] = useState<string>('');

  //crear tarjeta
  const [editingListId, setEditingListId] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editedValue, setEditedValue] = useState('');

  //crear lista
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const navigate = useNavigate();

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

  const fetchListBoard = useCallback(async () => {
    if (!idBoard) return;
    setLoading(true);
    try {
      const response = await axios.get<ListItem[]>(`get_list_by_board/${idBoard}`);

      const updatedList = response.data.map((listItem) => ({
        ...listItem,
        id: String(listItem.id),
        cards: listItem.cards
          .filter((card: Card) => {
            if (card.card_details && card.card_details.length > 0) {
              return card.card_details.some((detail: any) => detail.estado !== 'ARCHIVADO');
            }
            return true;
          })
          .map((card: Card) => ({
            ...card,
            id: String(card.id),
            card_details: card.card_details
              ? card.card_details.filter((detail: any) => detail.estado !== 'ARCHIVADO')
              : []
          }))
      }));

      setList(updatedList);
    } catch (error) {
      setError('Error al cargar las personas');
    } finally {
      setLoading(false);
    }
  }, [idBoard]);

  useEffect(() => {
    fetchUsersBoard();
    fetchListBoard();
  }, [fetchUsersBoard, fetchListBoard]);



  const moverTarjetaToList = async (idCard: any, idList: any) => {
    const data = {
      idList: idList
    };
    try {
      const response = await axios.put(`update_card/${idCard}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error al mover la tarjeta:', error);
      throw error;
    }
  };

  const onDragEnd = async (result: any) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    const sourceList = list.find((l) => l.id === source.droppableId);
    const destinationList = list.find((l) => l.id === destination.droppableId);

    const sourceCards = Array.from(sourceList.cards);
    const [movedCard] = sourceCards.splice(source.index, 1);

    const typedMovedCard = movedCard as Card;

    const sourceListId = String(sourceList.id);
    const destinationListId = String(destinationList.id);

    if (sourceList.id === destinationList.id) {
      sourceCards.splice(destination.index, 0, typedMovedCard);

      const updatedList = list.map((l) =>
        l.id === sourceList.id ? { ...l, cards: sourceCards } : l
      );

      setList(updatedList);

      await moverTarjetaToList(typedMovedCard.id, sourceListId);
    } else {
      const destinationCards = Array.from(destinationList.cards);
      destinationCards.splice(destination.index, 0, typedMovedCard);

      const updatedList = list.map((l) => {
        if (l.id === sourceList.id) return { ...l, cards: sourceCards };
        if (l.id === destinationList.id) return { ...l, cards: destinationCards };
        return l;
      });

      setList(updatedList);

      await moverTarjetaToList(typedMovedCard.id, destinationListId);
    }
  };

  const handleCardClick = (id: string, title: string) => {
    setSelectedIdCard(id);
    setSelectedTitleCard(title);
    setIsModalOpen(true);
  };

  const handleSaveList = async () => {
    if (!newListName.trim()) return;

    try {
      await axios.post(`store_list/${idBoard}`, { nombreList: newListName });
      setNewListName('');
      setIsCreatingList(false);
      fetchListBoard();
    } catch (error) {
      console.error('Error al crear la lista:', error);
    }
  };

  const handleCancelCreateList = () => {
    setNewListName('');
    setIsCreatingList(false);
  };

  const handleSaveCard = async (idList: number) => {
    if (!newCardTitle.trim()) return;

    try {
      const response = await axios.post(`store_card/${idList}`, {
        titulo: newCardTitle
      });

      setNewCardTitle('');
      fetchListBoard();
      setEditingListId(null);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  //bloque editar nombre list
  const handleEditClick = (listItem: any) => {
    setEditingId(listItem.id);
    setEditedValue(listItem.nombreList);
  };

  const handleInputChange = (e: any) => {
    setEditedValue(e.target.value);
  };

  const handleBlur = async (listItem: any) => {
    setEditingId(null);

    try {
      await axios.put(`update_list/${listItem.id}`, {
        nombreList: editedValue
      });
      fetchListBoard();
    } catch (error) {
      console.error('Error al actualizar:', error);
    }
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && <BoardPageHeader />}

      <Container>
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto' }}>
          {loading && <Spinner />}

            {list.map((listItem) => (
              <Droppable droppableId={listItem.id.toString()} key={listItem.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      border: '1px solid #ccc',
                      minWidth: '260px',
                      maxWidth: '260px',
                      marginBottom: '20px',
                      padding: '10px',
                      borderRadius: '5px',
                      display: 'flex',
                      flexDirection: 'column',
                      height: listItem.cards.length > 0 ? '500px' : '140px',
                      overflowY: 'auto'
                    }}
                  >
                    {editingId === listItem.id ? (
                      <input
                        type="text"
                        className="input"
                        value={editedValue}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur(listItem)}
                        autoFocus
                      />
                    ) : (
                      <h2 onClick={() => handleEditClick(listItem)}>{listItem.nombreList}</h2>
                    )}

                    <div>
                      {listItem.cards.map((card: any, index: any) => (
                        <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => handleCardClick(card.id, card.titulo)}
                              style={{
                                border: '1px solid #ccc',
                                padding: '10px',
                                margin: '5px 0',
                                borderRadius: '5px',
                                ...provided.draggableProps.style
                              }}
                            >
                            <p className="font-bold">{card.titulo}</p>


                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {card.items_completados > 0 && (
                                  <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <KeenIcon icon="questionnaire-tablet" />
                                    <span>
                                      {card.items_completados}/{card.items_no_completados}
                                    </span>
                                  </div>
                                )}
                                {card.files_count > 0 && (
                                  <div
                                    style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                                  >
                                    <KeenIcon icon="paper-clip" />
                                    <span>{card.files_count}</span>
                                  </div>
                                )}
                              </div>

                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  marginTop: '10px'
                                }}
                              >
                                {card.members.map((member: any, idx: number) => (
                                  <img
                                    key={idx}
                                    src={
                                      member.user?.persona?.rutaFotoUrl ||
                                      'https://via.placeholder.com/40'
                                    }
                                    alt={member.user?.persona?.nombre1 || 'Avatar'}
                                    style={{
                                      width: '30px',
                                      height: '30px',
                                      borderRadius: '50%',
                                      objectFit: 'cover',
                                      border: '1px solid #ddd'
                                    }}
                                  />
                                ))}
                              </div>

                              {card.card_details[0]?.estado && (
                                <span
                                  className={clsx('badge badge-outline mt-4', {
                                    'badge-danger': card.card_details[0]?.estado === 'ATRASADO',
                                    'badge-primary': card.card_details[0]?.estado === 'COMPLETADO',
                                    'badge-warning': card.card_details[0]?.estado === 'POR VENCER'
                                  })}
                                >
                                  {card.card_details[0]?.estado}
                                </span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                    {editingListId === listItem.id ? (
                      <div style={{ marginTop: '10px' }}>
                        <input
                          type="text"
                          value={newCardTitle}
                          onChange={(e) => setNewCardTitle(e.target.value)}
                          placeholder="Título de la tarjeta"
                          className="input"
                          style={{ padding: '5px', width: '100%' }}
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSaveCard(listItem.id)}
                          >
                            Guardar
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => {
                              setEditingListId(null);
                              setNewCardTitle('');
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="btn h-10 btn-sm btn-light text-sm mt-2"
                        onClick={() => setEditingListId(listItem.id)}
                      >
                        <KeenIcon icon="plus" />
                        Crear Tarjeta
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            ))}

            <div
              style={{
                border: '1px solid #ccc',
                minWidth: '260px',
                maxHeight: '100px',
                marginBottom: '20px',
                padding: '10px',
                borderRadius: '5px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {isCreatingList ? (
                <div>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Nombre de la nueva lista"
                    className="input"
                    style={{ padding: '5px', width: '100%' }}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={handleSaveList}>
                      Guardar
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={handleCancelCreateList}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn h-10 btn-sm btn-light text-sm"
                  onClick={() => setIsCreatingList(true)}
                >
                  <KeenIcon icon="plus" />
                  Crear Nueva Lista
                </button>
              )}
            </div>
          </div>
        </DragDropContext>
      </Container>

      <ModalCard
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        idCard={selectedIdCard}
        title={selectedTitleCard}
        onReload={fetchListBoard} 
      />
    </Fragment>
  );
};

export { BoardPage };
