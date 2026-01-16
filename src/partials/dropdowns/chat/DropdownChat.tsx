/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { getHeight, toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { KeenIcon } from '@/components';
import {
  Menu,
  MenuItem,
  MenuLink,
  MenuSub,
  MenuTitle,
  MenuToggle,
  MenuArrow,
  MenuIcon
} from '@/components/menu';
import { useViewport } from '@/hooks';
import { IDropdownChatProps, IDropdownMessage } from './types';
import { DropdownChatMessageOut } from './DropdownChatMessageOut';
import { DropdownChatMessageIn } from './DropdownChatMessageIn';
import axios from 'axios';
import { useAuthContext } from '@/auth';
import Pusher from 'pusher-js';
import { FilePond, registerPlugin } from 'react-filepond';

import FilePondPluginImagePreview from 'filepond-plugin-image-preview';

import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { ModalGrupo } from './ModalGrupo';

registerPlugin(FilePondPluginImagePreview);

const pusher = new Pusher('ffb1bc6e573141dd3f35', {
  cluster: 'us2',
  authEndpoint: `${import.meta.env.VITE_APP_API_URL}auth/pusher`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      'X-Requested-With': 'XMLHttpRequest'
    }
  }
});

const DropdownChat = ({ menuTtemRef }: IDropdownChatProps) => {
  const headerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [usersAndGroups, setUsersAndGroups] = useState<any[]>([]);
  const [messagesOneToOne, setMessagesOneToOne] = useState<any[]>([]);
  const [messagesGroup, setMessagesGroup] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [scrollableHeight, setScrollableHeight] = useState<number>(0);
  const [viewportHeight] = useViewport();
  const authContext = useAuthContext();
  const { persona, user } = authContext;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isGroupSelected, setIsGroupSelected] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedChat, setSelectedChat] = useState({
    name: '',
    image: ''
  });

  const offset = 140;

  useEffect(() => {
    if (messagesRef.current) {
      let availableHeigh: number = viewportHeight - offset;
      if (headerRef.current) availableHeigh -= getHeight(headerRef.current);

      setScrollableHeight(availableHeigh);
    }
  }, [menuTtemRef.current?.isOpen(), viewportHeight]);

  const scrollToBottom = () => {
    if (messagesRef.current) {
      requestAnimationFrame(() => {
        messagesRef.current!.scrollTop = messagesRef.current!.scrollHeight;
      });
    }
  };

  const handleAfterSave = () => {
    setIsModalOpen(false);
    fetchUsersAndGroups();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesOneToOne, messagesGroup, scrollableHeight]);

  const fetchUsersAndGroups = async () => {
    setLoading(true);
    try {
      const response = await axios.get('get_users_and_groups');
      const data = response.data;

      const users = Array.isArray(data.activationCompanyUsers) ? data.activationCompanyUsers : [];
      const groups = Array.isArray(data.groups) ? data.groups : [];

      setUsersAndGroups([...users, ...groups]);
    } catch (error) {
      setError('Error al cargar los usuarios');
      setUsersAndGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const currentUserId = user.id;

  useEffect(() => {
    if (!selectedUserId) return;

    const users = [currentUserId, selectedUserId].sort((a, b) => a - b);
    const channelName = `private-chat.${users[0]}.${users[1]}`;

    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {});

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Error en la suscripción', error);
    });

    channel.bind('client-mensaje-nuevo', (data: any) => {
      setMessagesOneToOne((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [selectedUserId]);

  const [offsetOne, setOffsetOne] = useState(0);
  const limit = 30;

  const fecthMessageOneToOne = async (idUser: any, append = false) => {
    setLoading(true);
    try {
      const response = await axios.get(`get_comments_user_to_user/${idUser}?limit=${limit}&offset=${offsetOne}`);

      const newMessages = response.data;

      if (append) {
        setMessagesOneToOne((prev) => [...newMessages, ...prev]);
      } else {
        setMessagesOneToOne(newMessages);
      }
    } catch (error) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (offsetOne > 0) {
      fecthMessageOneToOne(selectedUserId, true);
    }
  }, [offsetOne]);

  const handleLoadMore = () => {
    setOffsetOne((prev) => prev + limit);
  };

  const handleFormInput = async () => {
    if (!selectedUserId || (!message.trim() && files.length === 0)) return;

    const users = [currentUserId, selectedUserId].sort((a, b) => a - b);
    const channelName = `private-chat.${users[0]}.${users[1]}`;
    const channel = pusher.subscribe(channelName);

    let formData = new FormData();
    formData.append('idUser', selectedUserId.toString());
    formData.append('body', message);
    formData.append('origen', 'WEB');

    (files as any[]).forEach((fileObj, index) => {
      formData.append(`archivos[${index}]`, fileObj.file);
    });

    try {
      const response = await axios.post(
        `send_message_between_two_users/${selectedUserId}/comments`,
        formData
      );

      const newMessage = response.data;

      channel.trigger('client-mensaje-nuevo', {
        idUser: newMessage.idUser,
        body: newMessage.body,
        origen: newMessage.origen,
        persona: persona,
        archivos: newMessage.archivos,
        created_at: newMessage.created_at,
        side: 'left'
      });

      setMessagesOneToOne((prevMessages) => [
        ...prevMessages,
        {
          body: message,
          archivos: newMessage.archivos,
          created_at: new Date().toISOString(),
          side: 'right'
        }
      ]);

      setFiles([]);
      setMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  useEffect(() => {
    if (!selectedGroupId) return;

    const channelName = `private-group-chat.${selectedGroupId}`;

    const channel = pusher.subscribe(channelName);

    channel.bind('pusher:subscription_succeeded', () => {});

    channel.bind('pusher:subscription_error', (error: any) => {
      console.error('Error en la suscripción del grupo', error);
    });

    channel.bind('client-mensaje-nuevo', (data: any) => {
      setMessagesGroup((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [selectedGroupId]);

  const handleFormInputGroup = async () => {
    const channelName = `private-group-chat.${selectedGroupId}`;

    const channel = pusher.subscribe(channelName);

    let formData = new FormData();
    formData.append('body', message);
    formData.append('origen', 'WEB');

    (files as any[]).forEach((fileObj, index) => {
      formData.append(`archivos[${index}]`, fileObj.file);
    });

    try {
      const response = await axios.post(`send_message_to_group/${selectedGroupId}`, formData);

      const newMessage = response.data;

      channel.trigger('client-mensaje-nuevo', {
        idUser: currentUserId,
        body: newMessage.body,
        origen: newMessage.origen,
        persona: persona,
        archivos: newMessage.archivos,
        created_at: newMessage.created_at,
        side: 'left'
      });

      setMessagesGroup((prevMessages) => [
        ...prevMessages,
        {
          body: message,
          archivos: newMessage.archivos,
          created_at: new Date().toISOString(),
          side: 'right'
        }
      ]);

      setFiles([]);
      setMessage('');
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const fetchMessageGrupo = async (idGrupo: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`get_comments_by_grupo/${idGrupo}`);

      setMessagesGroup(response.data);
    } catch (error) {
      setError('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (itemId: number, isGroup: boolean) => {
    setIsGroupSelected(isGroup);

    if (isGroup) {
      setSelectedGroupId(itemId);
      setSelectedUserId(null);
      fetchMessageGrupo(itemId);

      const selectedItem = usersAndGroups.find((item) => item.id === itemId);
      if (selectedItem) {
        setSelectedChat({
          name: selectedItem.nombreGrupo,
          image: selectedItem.rutaImagenGrupo || 'https://via.placeholder.com/40'
        });
      }
    } else {
      setSelectedUserId(itemId);
      setSelectedGroupId(null);
      fecthMessageOneToOne(itemId);

      const selectedItem = usersAndGroups.find((item) => item.user?.id === itemId);
      if (selectedItem) {
        setSelectedChat({
          name: `${selectedItem.user.persona.nombre1} ${selectedItem.user.persona.apellido1}`,
          image: selectedItem.user.persona.rutaFotoUrl || 'https://via.placeholder.com/40'
        });
      }
    }
  };

  const buildChat = () => {
    if (!Array.isArray(usersAndGroups)) {
      return <div>No hay usuarios disponibles</div>;
    }

    return usersAndGroups.map((item, index) => {
      let displayName = '';
      let imageUrl =
        'https://png.pngtree.com/png-vector/20191009/ourmid/pngtree-group-icon-png-image_1796653.jpg';
      // let newMessages = Math.floor(Math.random() * 10);
      let itemId = null;
      let isGroup = false;

      if ('nombreGrupo' in item) {
        displayName = item.nombreGrupo;
        imageUrl = item.rutaImagenGrupo || imageUrl;
        itemId = item.id;
        isGroup = true;
      } else if (item.user?.persona?.nombre1) {
        displayName = `${item.user.persona.nombre1} ${item.user.persona.apellido1}`;
        imageUrl = item.user.persona.rutaFotoUrl || imageUrl;
        itemId = item.user.id;
        isGroup = false;
      }

      return (
        <div
          key={index}
          className="flex items-center justify-between gap-4 p-4 border-b border-gray-300 cursor-pointer"
          onClick={() => handleClick(itemId, isGroup)}
        >
          <div className="flex items-center gap-4">
            <img
              src={imageUrl}
              alt={displayName || 'Avatar'}
              className="w-10 h-10 rounded-full object-cover border border-gray-400"
            />
            <div>
              <div className="hover:text-primary-active text-2sm font-medium mb-px">
                {displayName}
              </div>
              {/* <div className="text-sm text-gray-500">Mensaje de prueba...</div> */}
            </div>
          </div>

          {/* {newMessages > 0 && (
            <div className="bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
              {newMessages}
            </div>
          )} */}
        </div>
      );
    });
  };

  useEffect(() => {
    fetchUsersAndGroups();
    setIsModalOpen(false);
  }, []);

  const handleClose = () => {
    if (menuTtemRef.current) {
      menuTtemRef.current.hide();
    }
  };

  const buildHeader = () => {
    const handleMenuAction = () => {
      setIsModalOpen(true);
    };

    return (
      <>
        <div className="flex items-center justify-between gap-2.5 text-sm text-gray-900 font-semibold px-5 py-2.5">
          Chat
          <div className="flex items-center gap-2.5">
            <Menu>
              <MenuItem
                toggle="dropdown"
                trigger="click"
                dropdownProps={{
                  placement: 'bottom-end',
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, 0]
                      }
                    }
                  ]
                }}
              >
                <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                  <KeenIcon icon="dots-vertical" />
                </MenuToggle>
                <MenuSub className="menu-default" rootClassName="w-full max-w-[175px] pt-2">
                  <MenuItem onClick={handleMenuAction}>
                    <MenuLink>
                      <MenuIcon>
                        <KeenIcon icon="people" />
                      </MenuIcon>
                      <MenuTitle> Crear Grupo</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                </MenuSub>
              </MenuItem>
            </Menu>

            <button
              className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
              onClick={handleClose}
            >
              <KeenIcon icon="cross" />
            </button>
          </div>
        </div>
        <div className="border-b border-b-gray-200"></div>
      </>
    );
  };

  const handleShowChat = () => {
    setIsGroupSelected(true);
    setSelectedChat({
      name: '',
      image: ''
    });
    setSelectedGroupId(null);
    setSelectedUserId(null);
    setFiles([]);
    setMessage('');
  };

  const buildTopbar = () => {
    return (
      <div className="shadow-card border-b border-gray-200 py-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 px-5">
          <div className="flex items-center flex-wrap gap-2">
            {selectedChat.name && (
              <>
                <img
                  src={selectedChat.image || 'https://via.placeholder.com/40'}
                  alt={selectedChat.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-400"
                />
                <span className="text-sm font-semibold">{selectedChat.name}</span>
              </>
            )}
          </div>

          <button onClick={() => handleShowChat()} className="btn btn-sm btn-light">
            <i className="ki-filled ki-black-left"></i>
          </button>
        </div>
      </div>
    );
  };

  const buildTopbarGroup = () => {
    const handleMenuAction = () => {
      setIsModalOpen(true);
    };
    return (
      <div className="shadow-card border-b border-gray-200 py-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2 px-5">
          <div className="flex items-center flex-wrap gap-2">
            {selectedChat.name && (
              <>
                <img
                  src={
                    'https://png.pngtree.com/png-vector/20191009/ourmid/pngtree-group-icon-png-image_1796653.jpg'
                  }
                  alt={selectedChat.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-400"
                />
                <span className="text-sm font-semibold">{selectedChat.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Menu>
              <MenuItem
                toggle="dropdown"
                trigger="click"
                dropdownProps={{
                  placement: 'bottom-end',
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, 0]
                      }
                    }
                  ]
                }}
              >
                <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                  <KeenIcon icon="dots-vertical" />
                </MenuToggle>
                <MenuSub className="menu-default" rootClassName="w-full max-w-[175px] pt-2">
                  <MenuItem onClick={handleMenuAction}>
                    <MenuLink>
                      <MenuIcon>
                        <KeenIcon icon="pencil" />
                      </MenuIcon>
                      <MenuTitle>Editar Grupo</MenuTitle>
                    </MenuLink>
                  </MenuItem>
                </MenuSub>
              </MenuItem>
            </Menu>

            <button onClick={() => handleShowChat()} className="btn btn-sm btn-light">
              <i className="ki-filled ki-black-left"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const buildMessages = () => {
    if (!messagesOneToOne.length) {
      return <div className="text-center text-gray-500 py-5">No hay mensajes todavía.</div>;
    }

    return (
      <div className="flex flex-col gap-5 py-5">
        <button
          onClick={handleLoadMore}
          className="w-40 btn btn-sm btn-light mx-auto flex items-center justify-center"
          disabled={loading}
        >
          {loading ? 'Cargando...' : 'Ver más'}
        </button>

        {messagesOneToOne.map((message, index) =>
          message.side === 'right' ? (
            <DropdownChatMessageOut
              key={index}
              text={message.body}
              file={message.archivos}
              time={new Date(message.created_at).toLocaleTimeString()}
              read={false}
            />
          ) : (
            <DropdownChatMessageIn
              key={index}
              text={message.body}
              file={message.archivos}
              time={new Date(message.created_at).toLocaleTimeString()}
              avatar={
                message.activation_company_user?.user?.persona?.rutaFotoUrl ??
                message.persona?.rutaFotoUrl
              }
            />
          )
        )}
      </div>
    );
  };

  const buildMessagesGroup = () => {
    if (!messagesGroup.length) {
      return (
        <div className="text-center text-gray-500 py-5">No hay mensajes en el grupo todavía.</div>
      );
    }

    return (
      <div className="flex flex-col gap-5 py-5">
        {messagesGroup.map((message, index) => {
          if (message.side === 'right') {
            return (
              <DropdownChatMessageOut
                key={index}
                text={message.body}
                file={message.archivos}
                time={new Date(message.created_at).toLocaleTimeString()}
                read={false}
              />
            );
          } else {
            return (
              <DropdownChatMessageIn
                key={index}
                text={message.body}
                file={message.archivos}
                time={new Date(message.created_at).toLocaleTimeString()}
                avatar={
                  message.activation_company_user?.user?.persona?.rutaFotoUrl ??
                  message.persona?.rutaFotoUrl
                }
              />
            );
          }
        })}
      </div>
    );
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<any[]>([]);

  const handleFileChange = (e: any) => {
    const selectedFiles = Array.from(e.target.files);

    const pondFiles = selectedFiles.map((file) => ({
      source: file,
      options: {
        type: 'local'
      }
    }));

    setFiles(pondFiles);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const buildForm = () => {
    return (
      <div className="grow mx-5 mb-2.5">
        <style>
          {`
            .filepond--drop-label {
              display: none;
            }
  
            .filepond--image-preview-wrapper {
              margin: -6px;
            }
  
            .filepond--list.filepond--list {
              margin: -6px;
            }
          `}
        </style>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            style={{ display: 'none' }}
          />

          {files.length > 0 && (
            <FilePond
              files={files}
              onupdatefiles={setFiles}
              allowReorder={false}
              allowRemove={true}
              allowMultiple={true}
              allowBrowse={false}
            />
          )}
        </div>

        <div className="flex items-end gap-2 mt-2">
          <div className="relative grow">
            <img
              src={persona?.rutaFotoUrl}
              className="rounded-full size-[30px] absolute left-3 top-1/2 -translate-y-1/2 z-10"
              alt=""
            />
            <input
              type="text"
              className="input h-auto py-4 ps-12 bg-transparent w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-icon btn-light btn-clear"
              onClick={openFileDialog}
            >
              <KeenIcon icon="exit-up" />
            </button>
            <button
              className="btn btn-dark btn-sm"
              onClick={selectedGroupId ? handleFormInputGroup : handleFormInput}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MenuSub rootClassName="w-full max-w-[450px]" className="light:border-gray-300">
      <div ref={headerRef}>
        {buildHeader()}
        {selectedUserId && buildTopbar()}
        {selectedGroupId && buildTopbarGroup()}
      </div>

      <div
        ref={messagesRef}
        className="scrollable-y-auto"
        style={{ maxHeight: `${scrollableHeight}px` }}
      >
        {!selectedGroupId && !selectedUserId && buildChat()}
        {selectedGroupId && buildMessagesGroup()}
        {selectedUserId && buildMessages()}
        {(selectedGroupId || selectedUserId) && <div> {buildForm()}</div>}

        <ModalGrupo
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            // setSelectedDocumentType(undefined);
          }}
          // documentmentType={selectedDocumentType}
          onSave={handleAfterSave}
        />
      </div>
    </MenuSub>
  );
};

export { DropdownChat };
