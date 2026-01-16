import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import clsx from 'clsx';
import { useConfirm } from '@/hooks';
import { useSnackbar } from 'notistack';
import { TimelinesWrapper } from '@/partials/timelines/default/item';
import Spinner from '@/components/loaders/Spinner';
import { useAuthContext } from '@/auth';
import { ModalAssingUserChecklist } from './ModalAssingUserChecklist';
import { AssingDateChecklist } from './ModalAssingDateChecklist';
import { ModalTitleEdit } from '@/components/modal/ModalTitleEdit';

interface Item {
  id: number;
  descripcion: string;
  completado: number;
}

interface Checklist {
  id: number;
  nombreCheckList: string;
}

interface ChecklistComponentProps {
  checklists: Checklist[];
  checkItems: { [key: number]: Item[] };
  handleDeleteChecklist: (id: number) => void;
  handleCheckboxChange: (id: number) => void;
}

interface ModalProps {
  open: boolean;
  idCard?: string;
  title?: string;
  onClose: () => void;
  onReload?: () => void;
  onReloadSearch?: () => void;
}

const ModalCard = ({ open, onClose, idCard, title, onReload, onReloadSearch }: ModalProps) => {
  const [card, setCard] = useState<any[]>([]);
  const [cardFiles, setCardFiles] = useState<any[]>([]);
  const [cardUsers, setCardUsers] = useState<any[]>([]);
  const [checklists, setChecklist] = useState<any[]>([]);
  const [checkItems, setCheckItems] = useState<any[]>([]);
  const [cardDetail, setCardDetail] = useState<any>('');
  const [cardConfigRepeat, setCardConfigRepeat] = useState<any[]>([]);
  const [userAssign, setUserAssign] = useState<any[]>([]);
  const [checklistName, setChecklistName] = useState('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { confirmAction } = useConfirm();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editedDescriptions, setEditedDescriptions] = useState<{ [key: number]: string }>({});
  const [comments, setComments] = useState<{ [key: number]: string }>({});
  const [replyComments, setReplyComments] = useState<{ [key: number]: any[] }>({});
  const { enqueueSnackbar } = useSnackbar();
  const [isModalUserAssingOpen, setIsModalUserAssingOpen] = useState(false);
  const [isModalDateAssingOpen, setIsModalDateAssingOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ [key: number]: File | null }>({});
  const authContext = useAuthContext();
  const { persona, user } = authContext;

  // Estados para editar nombre del checklist
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const [editedChecklistName, setEditedChecklistName] = useState<string>('');

  const modules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }]
    ]
  };
  const [activeSection, setActiveSection] = useState<
    null | 'miembros' | 'checklist' | 'archivos' | 'repetir' | 'eliminar' | 'fecha'
  >(null);

  const toggleContent = (
    key: 'miembros' | 'checklist' | 'archivos' | 'repetir' | 'eliminar' | 'fecha'
  ) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

  const closeContent = (
    key: 'miembros' | 'checklist' | 'archivos' | 'repetir' | 'eliminar' | 'fecha'
  ) => {
    if (activeSection === key) {
      setChecklistName('');
      setSelectedConfigRepeat('');
      setActiveSection(null);
      setFormData({
        startDate: '',
        endDate: '',
        endTime: '',
        configuracion: ''
      });
    }
  };

  const [descripcion, setDescription] = useState<string>('Escribe algo...');
  const [originalDescription, setOriginalDescription] = useState<string>('Escribe algo...');
  const [isEditable, setIsEditable] = useState<boolean>(false);

  const options = [
    { id: 1, configuracion: 'Ninguno', valorMinutos: -1 },
    { id: 2, configuracion: 'Justo el día final', valorMinutos: 0 },
    { id: 3, configuracion: 'Un día antes', valorMinutos: 1440 },
    { id: 4, configuracion: 'Dos días antes', valorMinutos: 2880 },
    { id: 5, configuracion: 'Dos Horas Antes', valorMinutos: 120 },
    { id: 6, configuracion: 'Una Hora Antes', valorMinutos: 60 },
    { id: 7, configuracion: 'Quince minutos antes', valorMinutos: 15 },
    { id: 8, configuracion: 'Diez minutos antes', valorMinutos: 10 }
  ];

  const toggleEditable = () => {
    setIsEditable(!isEditable);
    if (!isEditable) {
      setOriginalDescription(descripcion);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(`update_card/${idCard}`, { descripcion });

      setIsEditable(false);
      fetchCard();
    } catch (error) {
      console.error('Error al guardar la descripción:', error);
    }
  };

  const handleCancelDescripcion = () => {
    setDescription(originalDescription);
    setIsEditable(false);
  };

  const fetchCard = useCallback(async () => {
    if (!idCard) return;

    setLoading(true);
    try {
      const response = await axios.get(`get_card/${idCard}`);
      const fetchedDescription = response.data[0]?.descripcion || '';

      const finalDescription = fetchedDescription.trim() ? fetchedDescription : 'Escribe algo...';

      setCard(response.data);
      setDescription(finalDescription);
    } catch (error) {
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  }, [idCard]);

  const fetchCardUsers = useCallback(async () => {
    if (!idCard) return;

    setLoading(true);
    try {
      const response = await axios.get(`get_users_card/${idCard}`);
      setCardUsers(response.data);
    } catch (error) {
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  }, [idCard]);

  const fetchCardDetail = useCallback(async () => {
    if (!idCard) return;

    setLoading(true);
    try {
      const response = await axios.get(`get_detail_card/${idCard}`);
      setCardDetail(response.data);
    } catch (error) {
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  }, [idCard]);

  const fetchCardFiles = useCallback(async () => {
    if (!idCard) return;

    setLoading(true);
    try {
      const response = await axios.get(`get_files_by_card/${idCard}`);
      setCardFiles(response.data);
    } catch (error) {
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  }, [idCard]);

  const fetchCardConfigRepeat = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`get_configuration_repeat`);
      setCardConfigRepeat(response.data);
    } catch (error) {
      setError('Error al cargar la config');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCardAssignUsers = useCallback(async () => {
    const idBoard = localStorage.getItem('idBoard');
    if (!idCard || !idBoard) return;
    setLoading(true);
    try {
      const response = await axios.get(`get_users_for_assign_card/${idBoard}/${idCard}`);
      setUserAssign(response.data);
    } catch (error) {
      setError('Error al cargar la tarjeta');
    } finally {
      setLoading(false);
    }
  }, [idCard]);

  useEffect(() => {
    if (open) {
      fetchCardAssignUsers();
    }
  }, [open, fetchCardAssignUsers]);

  const fetchCheckItemsByChecklist = async (idCheckList: number) => {
    try {
      const response = await axios.get(`get_cheklist_item_by_check/${idCheckList}`);
      const items = response.data;

      setCheckItems((prevItems) => ({
        ...prevItems,
        [idCheckList]: items
      }));
    } catch (error) {
      setError('Error al cargar los ítems del checklist');
    }
  };

  const fetchCardChecklist = useCallback(async () => {
    if (!idCard) return;

    setLoading(true);
    try {
      const response = await axios.get(`get_cheklist_by_card/${idCard}`);
      const checklists = response.data;

      setChecklist(checklists);

      checklists.forEach((checklist: { id: number }) => {
        fetchCheckItemsByChecklist(checklist.id);
      });
    } catch (error) {
      setError('Error al cargar las listas de la tarjeta');
    } finally {
      setLoading(false);
    }
  }, [idCard]);

  const checkDateCard = async (id: number) => {
    try {
      await axios.post(`complete_check_date/${id}`);

      fetchCardDetail();
      onReload?.();
    } catch (error) {
      console.error('Error al actualizar el estado del item', error);
    }
  };

  const showUpdateDateModal = (detail: any, event: any) => {
    console.log('Mostrar modal para:', detail);
    // Implementa tu lógica para mostrar el modal
  };

  const deleteDateCard = async (id: number) => {
    try {
      await axios.delete(`delete_date_card/${id}`);
      fetchCardDetail();
    } catch (error) {
      console.error('Error al actualizar el estado del item', error);
    }
  };

  const handleDeleteDateCard = (id: number) => {
    confirmAction('Esta acción eliminará la fecha de la tarjeta.', () => deleteDateCard(id));
  };

  //eliminar repetir tarjeta
  const deleteConfigurationRepeat = async (id: number) => {
    try {
      await axios.put(`delete_configuration_repeat/${id}`);
      fetchCardDetail();
    } catch (error) {
      console.error('Error al eliminar la configuración ', error);
    }
  };

  const handleDeleteRecordateCard = (id: number) => {
    confirmAction('Esta acción eliminará esta configuración de la tarjeta.', () =>
      deleteConfigurationRepeat(id)
    );
  };

  //fin eliminar repetir tarjeta

  const saveChecklist = async () => {
    if (!checklistName.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`store_ckeklist/${idCard}`, {
        nombreCheckList: checklistName
      });

      setChecklistName('');
      onReload?.();
      setActiveSection(null);

      await fetchCardChecklist();
    } catch (error) {
      console.error('Error al guardar el checklist:', error);
      setError('Error al guardar el checklist');
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      enqueueSnackbar('Debe seleccionar un archivo antes de enviar.', {
        variant: 'solid',
        state: 'warning'
      });
      return;
    }

    const formData = new FormData();
    formData.append('fileCard', selectedFile);
    formData.append('idCard', `${idCard}`);
    formData.append('fileName', selectedFile.name);

    setLoading(true);

    try {
      const response = await axios.post('store_files_card', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onReload?.();
      setSelectedFile(null);
      setActiveSection(null);

      await fetchCardFiles();
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      setError('Error al subir el archivo');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (id: number) => {
    try {
      await axios.post(`check_descheck_item/${id}`);

      fetchCardChecklist();
      onReload?.();
    } catch (error) {
      console.error('Error al actualizar el estado del item', error);
    }
  };

  const handleUserClick = async (id: number | number[]) => {
    const ids = Array.isArray(id) ? id : [id];

    const data = {
      users: ids,
      idCard: idCard
    };

    setLoading(true);

    try {
      await axios.post('assign_card', data);

      await fetchCardAssignUsers();
      await fetchCardUsers();
      onReload?.();
    } catch (error) {
      console.error('Error al asignar:', error);
      setError('Error al asignar usuarios');
    } finally {
      setLoading(false);
    }
  };

  //elimnar respuesta item
  const deleteResonseItem = async (response: any) => {
    try {
      await axios.delete(`delete_comment_item_check/${response.id}`);
      fetchReplyComments(response.idChecklisteItem);
    } catch (error) {
      console.error('Error al eliminar', error);
    }
  };

  const handleDeleteResonseItem = (response: any) => {
    confirmAction('Esta acción eliminará la respuesta.', () => deleteResonseItem(response));
  };
  //end eliminar respuesta item

  //bloque nuevo items
  type ChecklistId = number;

  const [newItems, setNewItems] = useState<Record<ChecklistId, string>>({});
  const [addingItems, setAddingItems] = useState<Record<ChecklistId, boolean>>({});
  const handleAddItem = async (checklistId: ChecklistId) => {
    const newItem = newItems[checklistId] || '';
    if (newItem.trim() === '') {
      enqueueSnackbar('El campo no puede estar vacío.', {
        variant: 'solid',
        state: 'warning'
      });

      return;
    }

    try {
      const response = await axios.post(`store_item_checklist/${checklistId}`, {
        checklistId,
        descripcion: newItem
      });

      sendEmailDataItem(response.data.id);
      setNewItems((prev) => ({ ...prev, [checklistId]: '' }));
      fetchCardChecklist();
      onReload?.();
      setAddingItems((prev) => ({ ...prev, [checklistId]: false }));
    } catch (error) {
      alert('Ocurrió un error al guardar el ítem.');
    }
  };

  const handleCancel = (checklistId: ChecklistId) => {
    setNewItems((prev) => ({ ...prev, [checklistId]: '' }));
    setAddingItems((prev) => ({ ...prev, [checklistId]: false }));
  };

  const [showAutocompleteItems, setShowAutocompleteItems] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [filteredEmailsItems, setFilteredEmailsItems] = useState<{ [key: number]: string[] }>({});
  const [selectedEmailsItems, setSelectedEmailsItems] = useState<{ [key: number]: string[] }>({});

  const handleEmailAutocompleteItem = (
    itemId: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const value = (event.target as HTMLInputElement).value;
    const atIndex = value.lastIndexOf('@');

    if (atIndex !== -1) {
      const searchText = value.slice(atIndex + 1).toLowerCase();

      if (Array.isArray(cardUsers)) {
        const matches = cardUsers
          .filter((user) => user?.user?.email)
          .map((user) => user.user.email)
          .filter((email) => email.toLowerCase().startsWith(searchText));

        setFilteredEmailsItems((prev) => ({
          ...prev,
          [itemId]: matches
        }));

        setShowAutocompleteItems((prev) => ({
          ...prev,
          [itemId]: matches.length > 0
        }));
      }
    } else {
      setShowAutocompleteItems((prev) => ({
        ...prev,
        [itemId]: false
      }));
    }
  };

  const handleEmailSelectItem = (itemId: number, email: string) => {
    setNewItems((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] || '').replace(/@\S*$/, `@${email} `)
    }));

    setSelectedEmailsItems((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), email]
    }));

    setShowAutocompleteItems((prev) => ({
      ...prev,
      [itemId]: false
    }));
  };

  const sendEmailDataItem = (selectedCheckItemId: number) => {
    const allEmails = Object.values(selectedEmailsItems).flat();
    const uniqueEmails = [...new Set(allEmails)];

    axios
      .post('store_mencion_check_item', {
        selectedCheckItemId,
        emails: uniqueEmails
      })
      .then((response) => {
        setSelectedEmailsItems({});
        console.log('Comentarios enviados con éxito:', response.data);
      })
      .catch((error) => {
        console.error('Error al enviar los correos:', error);
      });
  };

  //fin bloque nuevo item

  const [selectedConfigRepeat, setSelectedConfigRepeat] = useState('');

  //bloque repetir
  const handleSaveRepeat = async () => {
    if (!selectedConfigRepeat) {
      return;
    }

    if (!cardDetail || !cardDetail.id) {
      enqueueSnackbar('No se puede guardar la configuración porque falta la fecha de la tarjeta.', {
        variant: 'solid',
        state: 'warning'
      });

      setSelectedConfigRepeat('');
      return;
    }

    try {
      await axios.post(`store_configuration_repeat/${cardDetail.id}`, {
        idConfiguracionRepeat: selectedConfigRepeat
      });

      setSelectedConfigRepeat('');
      fetchCardDetail();
    } catch (error) {
      console.log(error);
    }
  };

  //fin bloque repetir

  const handleArchivedCard = () => {
    confirmAction('Esta acción archivará la tarjeta.', saveArchiveCard);
  };

  // Funciones para archivar y desarchivar
  const saveArchiveCard = async () => {
    try {
      const response = await axios.post(`store_archive_card/${idCard}`);
      fetchCardDetail();
      onReload?.();
    } catch (error) {
      console.error('Error al archivar:', error);
    }
  };

  const handleUnarchivedCard = () => {
    confirmAction('Esta acción desarchivará la tarjeta.', saveUnarchiveCard);
  };

  const saveUnarchiveCard = async () => {
    try {
      const response = await axios.post(`store_unarchive_card/${idCard}`);
      fetchCardDetail();
      onReload?.();
      onReloadSearch?.();
    } catch (error) {
      console.error('Error al desarchivar:', error);
    }
  };

  //fin bloque archivar

  const [showComments, setShowComments] = useState<{ [key: number]: boolean }>({});

  const toggleCommentVisibility = (id: number) => {
    setShowComments((prev) => ({
      ...prev,
      [id]: !prev[id] // Cambia el estado del ítem actual
    }));
  };

  const [showReplyComments, setShowReplyComments] = useState<{ [key: number]: boolean }>({});

  const toggleReplyCommentVisibility = async (idItem: number) => {
    setShowReplyComments((prev) => {
      const newState = { ...prev, [idItem]: !prev[idItem] };
      if (!prev[idItem]) {
        // Cargar respuestas solo si no están visibles
        fetchReplyComments(idItem);
      }
      return newState;
    });
  };

  //bloque eliminar usuario de la tarjeta
  const deleteUserCard = async (id: number) => {
    try {
      const response = await axios.delete(`delete_assign_card/${id}`);
      fetchCardAssignUsers();
      fetchCardUsers();
      onReload?.();
    } catch (error) {
      console.error('Error al archivar:', error);
    }
  };

  const handleDeleteUserCard = (id: number) => {
    confirmAction('Esta acción eliminará al usuario de la tarjeta.', () => deleteUserCard(id));
  };
  // fin bloque eliminar usuario de la tarjeta

  //bloque la tarjeta
  const deleteCard = async () => {
    try {
      const response = await axios.delete(`delete_card/${idCard}`);
      onReload?.();
      onClose?.();
    } catch (error) {
      console.error('Error al elimimar la tarjeta:', error);
    }
  };

  const handleDeleteCard = () => {
    confirmAction(
      'Esta acción eliminará todas las asignaciones asociadas a la tarjeta. Podría haber información sensible que se perderá, esta acción no se puede deshacer.',
      deleteCard
    );
  };
  // fin bloque eliminar la tarjeta

  //bloque eliminar checklist
  const deleteChecklist = async (id: number) => {
    try {
      const response = await axios.delete(`delete_check_list/${id}`);
      fetchCardChecklist();
      onReload?.();
    } catch (error) {
      console.error('Error al archivar:', error);
    }
  };

  const handleDeleteChecklist = (id: number) => {
    confirmAction('Esta acción eliminará el checklist.', () => deleteChecklist(id));
  };

  // Funciones para editar nombre del checklist
  const handleEditChecklistClick = (id: number, currentName: string) => {
    setEditingChecklistId(id);
    setEditedChecklistName(currentName);
  };

  const handleSaveChecklistName = async (id: number) => {
    try {
      await axios.put(`update_checklist/${id}`, {
        nombreCheckList: editedChecklistName
      });
      setEditingChecklistId(null);
      setEditedChecklistName('');
      fetchCardChecklist();
      enqueueSnackbar('Nombre del checklist actualizado correctamente.', { variant: 'success' });
    } catch (error) {
      console.error('Error al actualizar el nombre del checklist:', error);
      enqueueSnackbar('Error al actualizar el nombre del checklist.', { variant: 'error' });
    }
  };

  const handleCancelEditChecklist = () => {
    setEditingChecklistId(null);
    setEditedChecklistName('');
  };
  //fin bloque editar checklist

  //bloque crear fecha a la tarjeta
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    endTime: '',
    configuracion: ''
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const response = await axios.post(`store_card_datail/${idCard}`, formData);
      setFormData({
        startDate: '',
        endDate: '',
        endTime: '',
        configuracion: ''
      });
      fetchCardDetail();
    } catch (error) {
      console.error('Error al enviar los datos:', error);
    }
  };

  const isFormInvalid = !formData.endDate || !formData.endTime;
  // fin bloque crear fecha a la tarjeta

  //bloque editar descripcion item

  const handleEditDescriptionItemClick = (itemId: number, currentDescription: string) => {
    setEditingItemId(itemId);
    setEditedDescriptions((prev) => ({
      ...prev,
      [itemId]: currentDescription
    }));
  };

  const handleSaveDescriptionItem = async (itemId: number) => {
    try {
      const updatedDescription = editedDescriptions[itemId];
      if (!updatedDescription) {
        console.warn('No hay cambios en la descripción');
        return;
      }

      const response = await axios.put(`update_item_check/${itemId}`, {
        descripcion: updatedDescription
      });
      fetchCardChecklist();

      if (response.status === 200) {
        setEditingItemId(null);
      } else {
        console.error('Error al actualizar la descripción');
      }
    } catch (error) {
      console.error('Error al enviar la solicitud al servidor:', error);
    }
  };

  const handleCancelDescriptionItem = () => {
    setEditingItemId(null);
  };

  const handleDescriptionItemChange = (itemId: number, newValue: string) => {
    setEditedDescriptions((prev) => ({
      ...prev,
      [itemId]: newValue
    }));
  };
  //fin bloque editar descripcion item

  //bloque eliminar checklist
  const deleteChecklistItem = async (id: number) => {
    try {
      const response = await axios.delete(`delete_check_item/${id}`);
      fetchCardChecklist();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleDeleteChecklistItem = (id: number) => {
    confirmAction('Esta acción eliminará este ítem.', () => deleteChecklistItem(id));
  };
  //fin bloque eliminar checklist

  //bloque de comentar item y sugerencias

  const [showAutocomplete, setShowAutocomplete] = useState<{ [key: number]: boolean }>({});
  const [filteredEmails, setFilteredEmails] = useState<{ [key: number]: string[] }>({});

  const [selectedEmails, setSelectedEmails] = useState<{ [key: number]: string[] }>({});

  const handleCommentChange = (itemId: number, value: string) => {
    setComments((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleEmailAutocomplete = (
    itemId: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const value = (event.target as HTMLInputElement).value;
    const atIndex = value.lastIndexOf('@');

    if (atIndex !== -1) {
      const searchText = value.slice(atIndex + 1).toLowerCase();

      if (Array.isArray(cardUsers)) {
        const matches = cardUsers
          .filter((user) => user?.user?.email)
          .map((user) => user.user.email)
          .filter((email) => email.toLowerCase().startsWith(searchText));

        setFilteredEmails((prev) => ({
          ...prev,
          [itemId]: matches
        }));
        setShowAutocomplete((prev) => ({
          ...prev,
          [itemId]: matches.length > 0
        }));
      }
    } else {
      setShowAutocomplete((prev) => ({
        ...prev,
        [itemId]: false
      }));
    }
  };

  const handleEmailSelect = (itemId: number, email: string) => {
    setSelectedEmails((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), email]
    }));

    setComments((prev) => {
      const currentComment = prev[itemId] || '';
      const lastChar = currentComment.slice(-1);
      const newComment = lastChar === '@' ? currentComment + email : currentComment + ` @${email}`;
      return { ...prev, [itemId]: newComment };
    });

    setShowAutocomplete((prev) => ({
      ...prev,
      [itemId]: false
    }));
  };

  const sendEmailData = (idComment: number) => {
    const allEmails = Object.values(selectedEmails).flat();
    const uniqueEmails = [...new Set(allEmails)];

    axios
      .post('store_mencion_comment', {
        idComment,
        emails: uniqueEmails
      })
      .then((response) => {
        setSelectedEmails({});
        console.log('Comentarios enviados con éxito:', response.data);
      })
      .catch((error) => {
        console.error('Error al enviar los correos:', error);
      });
  };

  const handleSendComment = async (itemId: number) => {
    const formData = new FormData();
    formData.append('comment', comments[itemId] || '');
    formData.append('idChecklisteItem', itemId.toString());

    if (selectedFiles[itemId]) {
      const file = selectedFiles[itemId];
      const fileExtension = file.name.split('.').pop();
      const fileName = file.name;
      formData.append('fileItem', file);
      formData.append('nameFile', fileName);
      formData.append('type', fileExtension || '');
    } else {
      formData.append('type', '');
      formData.append('extension', '');
    }

    setLoading(true);

    try {
      const response = await axios.post('store_comment_item_check', formData);

      enqueueSnackbar('Comentario enviado con éxito.', { variant: 'success' });

      await fetchReplyComments(response.data.idChecklisteItem);
      setComments((prev) => ({ ...prev, [itemId]: '' }));
      setSelectedFiles((prev) => ({ ...prev, [itemId]: null }));

      sendEmailData(response.data.id);
    } catch (error) {
      enqueueSnackbar('Error al enviar el comentario.', {
        variant: 'solid',
        state: 'danger'
      });
      console.error('Error al enviar el comentario', error);
      setError('Error al enviar el comentario');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (itemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => ({ ...prev, [itemId]: files[0] }));
    }
  };

  //fin bloque comentar

  //bloque eliminar file

  const deleteFile = async (id: number) => {
    try {
      const response = await axios.delete(`delete_file_card/${id}`);
      fetchCardFiles();
    } catch (error) {
      console.error('Error al eliminar:', error);
    }
  };

  const handleDeleteFileCard = (id: number) => {
    confirmAction('Esta acción eliminará este archivo.', () => deleteFile(id));
  };

  //fin bloque eliminar file

  //comments items

  const fetchReplyComments = async (idComment: number) => {
    try {
      const response = await axios.get(`get_comment_check_item/${idComment}`);
      setReplyComments((prevReplies) => ({
        ...prevReplies,
        [idComment]: response.data
      }));
    } catch (error) {
      setError('Error al cargar las respuestas.');
    }
  };
  //fin comment items

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const openUserAssignModal = (id: number) => {
    setSelectedItemId(id);
    setIsModalUserAssingOpen(true);
  };

  const openDateAssignModal = (id: number) => {
    setSelectedItemId(id);
    setIsModalDateAssingOpen(true);
  };

  const handleAfterSaveOptionChecklist = () => {
    setIsModalUserAssingOpen(false);
    setIsModalDateAssingOpen(false);
    fetchCardChecklist();
  };

  const deleteUserChecklist = async (id: number) => {
    try {
      await axios.delete(`delete_user_item_check/${id}`);
      fetchCardChecklist();
    } catch (error) {
      console.error('Error al eliminar la configuración ', error);
    }
  };

  const handleDeleteUserChecklist = (id: number) => {
    confirmAction('Esta acción eliminará al usuario de este checklist.', () =>
      deleteUserChecklist(id)
    );
  };

  const deleteDateChecklist = async (id: number) => {
    try {
      await axios.delete(`delete_item_check_detail/${id}`);
      fetchCardChecklist();
    } catch (error) {
      console.error('Error al eliminar la configuración ', error);
    }
  };

  const handleDeleteDateChecklist = (id: number) => {
    confirmAction('Esta acción eliminará la fecha de este checklist.', () =>
      deleteDateChecklist(id)
    );
  };

  useEffect(() => {
    fetchCard();
    fetchCardConfigRepeat();
    fetchCardDetail();
    fetchCardAssignUsers();
    fetchCardFiles();
    fetchCardChecklist();
    fetchCardUsers();
    setActiveSection(null);
  }, [
    fetchCard,
    fetchCardUsers,
    fetchCardChecklist,
    fetchCardFiles,
    fetchCardDetail,
    fetchCardAssignUsers,
    fetchCardConfigRepeat
  ]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[950px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitleEdit
            title={title}
            onSave={async (newTitle) => {
              try {
                await axios.put(`update_card/${idCard}`, { titulo: newTitle });
                fetchCard();
              } catch (error) {
                console.error('Error al actualizar el título:', error);
              }
            }}
          />

          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid grid-cols-[70%_30%] gap-4 px-0 py-5 relative">
          {loading && <Spinner />}

          <div>
            <TimelinesWrapper icon="people" line={true}>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-800">Responsables de la Tarjeta</div>
                <span className="text-xs font-medium text-gray-500">
                  Gestiona los miembros de la tarjeta
                </span>

                {cardUsers.length > 0 ? (
                  <div className="flex flex-wrap gap-4 mt-2">
                    {cardUsers.map((user) => (
                      <div key={user.id} className="text-center">
                        <div className="relative w-9 h-9 rounded-full overflow-hidden mx-auto border-2 border-gray-300 group">
                          <img
                            src={user.user.persona?.rutaFotoUrl || 'https://via.placeholder.com/50'}
                            alt={user.user.persona?.nombre1 || 'Avatar'}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => handleDeleteUserCard(user.id)}
                            className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <KeenIcon icon="trash" className="text-lg text-red-500" />
                          </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-700 font-medium">
                          {user.user.persona?.nombre1 || 'Sin Nombre'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-center text-gray-500">
                    No hay miembros asignados a esta tarjeta.
                  </div>
                )}
              </div>
            </TimelinesWrapper>

            <TimelinesWrapper icon="calendar" line={true}>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-800">Fecha</div>
                <span className="text-xs font-medium text-gray-500">
                  Gestiona las fechas, recordatorios y estado de la tarjeta
                </span>

                {cardDetail.id ? (
                  <div className="p-4">
                    <div className="flex items-center justify-start">
                      <label>
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={Number(cardDetail.completado) === 1}
                          onChange={() => checkDateCard(cardDetail.id)}
                        />
                      </label>

                      <div
                        className="cursor-pointer ml-4"
                        onClick={(e) => showUpdateDateModal(cardDetail, e)}
                      >
                        {cardDetail.estado === 'COMPLETADO' ? (
                          <span>Completado el {cardDetail.fechaCompletado}</span>
                        ) : (
                          <>
                            {!cardDetail.fechaInicial &&
                              cardDetail.fechaFinal &&
                              cardDetail.hora && (
                                <span>
                                  Fecha de vencimiento el {cardDetail.fechaFinal} a las{' '}
                                  {cardDetail.hora}
                                </span>
                              )}
                            {cardDetail.fechaInicial &&
                              cardDetail.fechaFinal &&
                              cardDetail.hora && (
                                <span>
                                  Desde {cardDetail.fechaInicial} al {cardDetail.fechaFinal} a las{' '}
                                  {cardDetail.hora}
                                </span>
                              )}
                            {cardDetail.fechaInicial &&
                              !cardDetail.fechaFinal &&
                              cardDetail.hora && (
                                <span>
                                  Desde {cardDetail.fechaInicial} a las {cardDetail.hora}
                                </span>
                              )}
                          </>
                        )}
                      </div>

                      <span
                        className={clsx('badge badge-outline ml-3', {
                          'badge-danger': cardDetail?.estado === 'ATRASADO',
                          'badge-primary': cardDetail?.estado === 'COMPLETADO',
                          'badge-warning': cardDetail?.estado === 'POR VENCER'
                        })}
                      >
                        {cardDetail.estado}
                      </span>

                      <button onClick={() => handleDeleteDateCard(cardDetail.id)}>
                        <KeenIcon icon="trash" className="ml-3 text-lg text-red-700" />
                      </button>
                    </div>

                    {cardDetail.configuracion_repeat?.configuracion && (
                      <div className="mt-4 flex items-center justify-start">
                        <div className="ml-8">
                          Repetir: {cardDetail.configuracion_repeat.configuracion}
                        </div>
                        <button onClick={() => handleDeleteRecordateCard(cardDetail.id)}>
                          <KeenIcon icon="trash" className="ml-3 text-lg text-red-700" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-gray-500 text-center">
                    No hay fechas ni recordatorios configurados para esta tarjeta.
                  </div>
                )}
              </div>
            </TimelinesWrapper>

            <TimelinesWrapper icon="textalign-justifycenter" line={true}>
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Descripción</div>
                    <span className="text-xs font-medium text-gray-500">
                      Gestiona la descripción de la tarjeta
                    </span>
                  </div>
                  {!isEditable && (
                    <button onClick={toggleEditable}>
                      <KeenIcon className="text-lg" icon="pencil" />
                    </button>
                  )}
                </div>

                <ReactQuill
                  value={descripcion}
                  onChange={handleDescriptionChange}
                  theme="snow"
                  placeholder="Escribe aquí la descripción..."
                  readOnly={!isEditable}
                  modules={modules}
                />
                {isEditable && (
                  <div className="flex justify-end space-x-2 mt-4">
                    <button className="btn btn-sm btn-primary" onClick={handleSave}>
                      Guardar
                    </button>
                    <button className="btn btn-sm btn-light" onClick={handleCancelDescripcion}>
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </TimelinesWrapper>

            {checklists.length > 0 && (
              <>
                <TimelinesWrapper icon="double-check" line={true}>
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-800">Checklist</div>
                    <span className="text-xs font-medium text-gray-500">
                      Gestiona los checklist de la tarjeta
                    </span>

                    {checklists.map((checklist) => {
                      const items = checkItems[checklist.id] || [];
                      const totalItems = items.length;
                      const completedItems = items.filter(
                        (item: any) => Number(item.completado) === 1
                      ).length;
                      const progressPercentage =
                        totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

                      return (
                        <div key={checklist.id} className="mb-6">
                          <div className="flex items-center justify-between">
                            {editingChecklistId === checklist.id ? (
                              <>
                                <input
                                  type="text"
                                  value={editedChecklistName}
                                  onChange={(e) => setEditedChecklistName(e.target.value)}
                                  className="input mt-2 mb-2 flex-1 mr-2"
                                  autoFocus
                                />
                                <button
                                  className="text-green-500 hover:text-green-700 mr-2"
                                  onClick={() => handleSaveChecklistName(checklist.id)}
                                >
                                  <KeenIcon icon="check" className="text-xl" />
                                </button>
                                <button
                                  className="text-gray-500 hover:text-gray-700"
                                  onClick={handleCancelEditChecklist}
                                >
                                  <KeenIcon icon="cross" className="text-xl" />
                                </button>
                              </>
                            ) : (
                              <>
                                <h3 className="mt-2 text-3sm font-bold text-gray-700 mb-2">
                                  {checklist.nombreCheckList}
                                </h3>

                                <div className="flex items-center gap-2">
                                  <button
                                    className="text-blue-500 hover:text-blue-700"
                                    onClick={() =>
                                      handleEditChecklistClick(
                                        checklist.id,
                                        checklist.nombreCheckList
                                      )
                                    }
                                  >
                                    <KeenIcon icon="pencil" className="text-xl" />
                                  </button>

                                  <button
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteChecklist(checklist.id)}
                                  >
                                    <KeenIcon icon="trash" className="text-xl" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="progress h-2 bg-gray-300 rounded">
                            <div
                              className="progress-bar h-2 bg-blue-500 rounded transition-all duration-500 ease-in-out"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          <p>{Math.round(progressPercentage)}% Completado</p>

                          <ul>
                            {items.map((item: any) => (
                              <li key={item.id} className="flex flex-col p-2 rounded-lg">
                                <div className="flex flex-col items-start">
                                  <div className="flex items-start w-full">
                                    <input
                                      type="checkbox"
                                      checked={Number(item.completado) === 1}
                                      onChange={() => handleCheckboxChange(item.id)}
                                      className="mt-1.5"
                                    />
                                    {editingItemId === item.id ? (
                                      <input
                                        type="text"
                                        value={editedDescriptions[item.id] || ''}
                                        onChange={(e) =>
                                          handleDescriptionItemChange(item.id, e.target.value)
                                        }
                                        className="input ml-2"
                                      />
                                    ) : (
                                      <span
                                        className={`ml-3 font-semibold text-gray-700 ${
                                          item.completado === 1 ? 'line-through text-gray-500' : ''
                                        }`}
                                      >
                                        {item.descripcion
                                          .split(' ')
                                          .map((word: any, index: any) =>
                                            word.startsWith('@') ? (
                                              <span key={index} className="text-blue-600 underline">
                                                {word}
                                              </span>
                                            ) : (
                                              <React.Fragment key={index}>{word}</React.Fragment>
                                            )
                                          )
                                          .reduce((prev: any, curr: any) => [prev, ' ', curr])}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center mt-2 ml-6 w-full">
                                    {item?.check_item_user && (
                                      <>
                                        <span className="mr-2 badge badge-outline">
                                          {item?.check_item_user?.user?.persona?.nombre1}{' '}
                                          {item?.check_item_user?.user?.persona?.apellido1}{' '}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleDeleteUserChecklist(item?.check_item_user?.id)
                                          }
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <KeenIcon icon="trash" className="text-xl" />
                                        </button>
                                      </>
                                    )}
                                    {item?.check_item_detail && (
                                      <>
                                        <span className="badge badge-outline ml-2">
                                          {item.check_item_detail.fechaFinal}{' '}
                                          {item.check_item_detail.hora}
                                        </span>
                                        <button
                                          onClick={() =>
                                            handleDeleteDateChecklist(item.check_item_detail.id)
                                          }
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <KeenIcon icon="trash" className="text-xl ml-2" />
                                        </button>
                                      </>
                                    )}
                                  </div>

                                  <div className="flex items-center mt-2 w-full">
                                    <button
                                      className="text-sm underline flex items-center"
                                      onClick={() => toggleCommentVisibility(item.id)}
                                    >
                                      {showComments[item.id] ? (
                                        <>
                                          <KeenIcon icon="up" className="mr-2" /> Responder
                                          <span className="ml-1 text-gray-500">
                                            (
                                            {replyComments[item.id]
                                              ? replyComments[item.id].length
                                              : (item.comment_check_items_count ?? 0)}
                                            )
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <KeenIcon icon="down" className="mr-2" /> Responder
                                          <span className="ml-1 text-gray-500">
                                            (
                                            {replyComments[item.id]?.length ??
                                              item.comment_check_items_count ??
                                              0}
                                            )
                                          </span>
                                        </>
                                      )}
                                    </button>

                                    <div className="flex ml-auto space-x-2">
                                      {editingItemId === item.id ? (
                                        <>
                                          <button
                                            onClick={() => handleSaveDescriptionItem(item.id)}
                                          >
                                            <KeenIcon icon="check-squared text-lg" />
                                          </button>
                                          <button onClick={() => handleCancelDescriptionItem()}>
                                            <KeenIcon icon="cross-square text-lg" />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            onClick={() =>
                                              handleEditDescriptionItemClick(
                                                item.id,
                                                item.descripcion
                                              )
                                            }
                                          >
                                            <KeenIcon
                                              icon="pencil"
                                              className="text-gray-600 text-lg"
                                            />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteChecklistItem(item.id)}
                                          >
                                            <KeenIcon
                                              icon="trash"
                                              className="text-gray-600 text-lg"
                                            />
                                          </button>
                                        </>
                                      )}

                                      {!item?.check_item_user && (
                                        <button onClick={() => openUserAssignModal(item.id)}>
                                          <KeenIcon icon="user" className="text-gray-600 text-lg" />
                                        </button>
                                      )}

                                      {!item?.check_item_detail && (
                                        <button onClick={() => openDateAssignModal(item.id)}>
                                          <KeenIcon
                                            icon="calendar"
                                            className="text-gray-600 text-lg"
                                          />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {showComments[item.id] && (
                                  <div>
                                    <form
                                      onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendComment(item.id);
                                      }}
                                    >
                                      <div className="grow mt-2.5">
                                        {/* Contenedor principal del input y botones */}
                                        <div className="relative">
                                          {/* FOTO DE PERFIL */}
                                          <img
                                            src={persona?.rutaFotoUrl}
                                            className="rounded-full w-8 h-8 absolute left-2 top-1/2 -translate-y-1/2"
                                            alt=""
                                          />

                                          {/* INPUT DE COMENTARIO */}
                                          <input
                                            type="text"
                                            value={comments[item.id] || ''}
                                            onChange={(e) =>
                                              handleCommentChange(item.id, e.target.value)
                                            }
                                            onKeyUp={(e) => handleEmailAutocomplete(item.id, e)}
                                            placeholder="Escribe un comentario..."
                                            className="input w-full h-12 pl-12 pr-36 bg-transparent border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          />

                                          {/* AUTOCOMPLETADO DE EMAIL */}
                                          {showAutocomplete[item.id] && (
                                            <ul className="absolute bg-white border border-gray-300 rounded-md z-10 w-full mt-1">
                                              {filteredEmails[item.id]?.map((email, index) => (
                                                <li
                                                  key={index}
                                                  onClick={() => handleEmailSelect(item.id, email)}
                                                  className="input p-2 cursor-pointer hover:bg-gray-200"
                                                >
                                                  {email}
                                                </li>
                                              ))}
                                            </ul>
                                          )}

                                          {/* BOTONES DERECHA */}
                                          <div className="flex items-center gap-2 absolute right-3 top-1/2 -translate-y-1/2">
                                            <input
                                              type="file"
                                              onChange={(e) => handleFileChange(item.id, e)}
                                              className="hidden"
                                              id={`file-input-${item.id}`}
                                            />
                                            <label htmlFor={`file-input-${item.id}`}>
                                              <KeenIcon
                                                icon="exit-up"
                                                className="text-xl cursor-pointer"
                                              />
                                            </label>

                                            <button
                                              type="submit"
                                              className="btn btn-dark btn-sm"
                                              disabled={
                                                !comments[item.id] && !selectedFiles[item.id]
                                              }
                                            >
                                              Enviar
                                            </button>
                                          </div>
                                        </div>

                                        {selectedFiles[item.id] && (
                                          <div className="flex items-center gap-3 mt-3 ml-12">
                                            {selectedFiles[item.id] &&
                                              (selectedFiles[item.id]!.type.startsWith('image/') ? (
                                                <img
                                                  src={URL.createObjectURL(selectedFiles[item.id]!)}
                                                  alt="Vista previa"
                                                  className="w-12 h-12 rounded-md object-cover border border-gray-200 shadow-sm"
                                                />
                                              ) : (
                                                <div className="flex items-center text-gray-700 bg-gray-100 px-2 py-1 rounded text-sm">
                                                  <KeenIcon icon="file" className="text-lg mr-2" />
                                                  {selectedFiles[item.id]!.name}
                                                </div>
                                              ))}

                                            {/* Botón para quitar archivo */}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setSelectedFiles((prev) => ({
                                                  ...prev,
                                                  [item.id]: null
                                                }))
                                              }
                                              className="text-gray-500 hover:text-red-500"
                                            >
                                              <KeenIcon icon="cross" className="text-lg" />
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </form>

                                    {(replyComments[item.id]?.length > 0 ||
                                      item.comment_check_items_count > 0) && (
                                      <button
                                        className="text-sm underline flex items-center mt-2"
                                        onClick={() => toggleReplyCommentVisibility(item.id)}
                                      >
                                        {showReplyComments[item.id] ? (
                                          <>
                                            <KeenIcon icon="up" className="mr-2" /> Ocultar las
                                            Respuestas
                                          </>
                                        ) : (
                                          <>
                                            <KeenIcon icon="down" className="mr-2" /> Ver todas las
                                            Respuestas
                                          </>
                                        )}
                                      </button>
                                    )}

                                    {showReplyComments[item.id] && (
                                      <div>
                                        {replyComments[item.id] &&
                                        replyComments[item.id].length > 0 ? (
                                          <ul>
                                            {replyComments[item.id].map((reply) => (
                                              <li key={reply.id} className="mb-4 border-b pb-4">
                                                <div className="flex mt-4 items-start space-x-4">
                                                  <img
                                                    src={reply.user?.persona?.rutaFotoUrl}
                                                    alt={`${reply.user?.persona?.nombre1} ${reply.user?.persona?.apellido1}`}
                                                    className="w-9 h-9 rounded-full border border-gray-300"
                                                  />

                                                  <div className="flex-1 relative">
                                                    <div className="text-sm font-medium text-gray-800">
                                                      {reply.user?.persona?.nombre1}{' '}
                                                      {reply.user?.persona?.nombre2}{' '}
                                                      {reply.user?.persona?.apellido1}{' '}
                                                      {reply.user?.persona?.apellido2}
                                                    </div>

                                                    {reply?.comment && (
                                                      <p className="text-gray-600">
                                                        {reply?.comment
                                                          .split(' ')
                                                          .map((word: any, index: any) => {
                                                            if (word.startsWith('@')) {
                                                              return (
                                                                <span
                                                                  key={index}
                                                                  className="text-blue-600 underline mr-2"
                                                                >
                                                                  {word}
                                                                </span>
                                                              );
                                                            }
                                                            return `${word} `;
                                                          })}
                                                      </p>
                                                    )}

                                                    {reply.nameFile && (
                                                      <div>
                                                        <a
                                                          href={reply?.rutaUrlItem}
                                                          target="_blank"
                                                          className="text-blue-500 text-sm underline"
                                                        >
                                                          {reply?.nameFile}
                                                        </a>
                                                      </div>
                                                    )}

                                                    <div className="text-xs mt-1 text-gray-500">
                                                      {new Date(reply?.created_at).toLocaleString()}
                                                    </div>

                                                    {Number(reply.idUser) === Number(user?.id) && (
                                                      <button
                                                        onClick={() =>
                                                          handleDeleteResonseItem(reply)
                                                        }
                                                        className="absolute top-0 right-0 text-gray-400 hover:text-red-500 transition"
                                                        title="Eliminar comentario"
                                                      >
                                                        <KeenIcon icon="trash" />
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <span className="text-gray-500 text-justity"></span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>

                          {addingItems[checklist.id] ? (
                            <div className="mt-4">
                              <input
                                type="text"
                                value={newItems[checklist.id] || ''}
                                onChange={(e) =>
                                  setNewItems((prev) => ({
                                    ...prev,
                                    [checklist.id]: e.target.value
                                  }))
                                }
                                onKeyUp={(e) => handleEmailAutocompleteItem(checklist.id, e)}
                                placeholder="Nuevo ítem..."
                                className="input w-full"
                              />

                              {showAutocompleteItems[checklist.id] && (
                                <div className="autocomplete-dropdown">
                                  {filteredEmailsItems[checklist.id]?.map((email) => (
                                    <div
                                      key={email}
                                      className="input"
                                      onClick={() => handleEmailSelectItem(checklist.id, email)}
                                    >
                                      {email}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex justify-end space-x-2 mt-2">
                                <button
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleAddItem(checklist.id)}
                                >
                                  Guardar
                                </button>
                                <button
                                  className="btn btn-sm btn-light"
                                  onClick={() => handleCancel(checklist.id)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            // <div className="mt-4">
                            //   <input
                            //     type="text"
                            //     value={newItems[checklist.id] || ''}
                            //     onChange={(e) =>
                            //       setNewItems((prev) => ({
                            //         ...prev,
                            //         [checklist.id]: e.target.value
                            //       }))
                            //     }
                            //     placeholder="Nuevo ítem..."
                            //     className="input w-full"
                            //   />
                            //   <div className="flex justify-end space-x-2 mt-2">
                            //     <button
                            //       className="btn btn-sm btn-primary"
                            //       onClick={() => handleAddItem(checklist.id)}
                            //     >
                            //       Guardar
                            //     </button>
                            //     <button
                            //       className="btn btn-sm btn-light"
                            //       onClick={() => handleCancel(checklist.id)}
                            //     >
                            //       Cancelar
                            //     </button>
                            //   </div>
                            // </div>
                            <button
                              className="btn btn-sm btn-light text-sm mt-4"
                              onClick={() =>
                                setAddingItems((prev) => ({ ...prev, [checklist.id]: true }))
                              }
                            >
                              Añadir Ítem
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TimelinesWrapper>
              </>
            )}

            <TimelinesWrapper icon="files" line={true}>
              <div className="flex flex-col">
                <div className="text-sm font-medium text-gray-800">Archivos</div>
                <span className="text-xs font-medium text-gray-500">
                  Gestiona los archivos de la tarjeta
                </span>

                {cardFiles.length > 0 ? (
                  <>
                    <p className="flex items-center mb-4 mt-2">
                      <KeenIcon icon="files" className="mr-2" /> Archivos
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {cardFiles.map((file, index) => {
                        const nombreArchivo = file.nombre || 'Desconocido';
                        const isImage = /\.(png|jpeg|gif|bmp|svg|webp|jpg)$/i.test(nombreArchivo);
                        const fileExtension = nombreArchivo.includes('.')
                          ? nombreArchivo.split('.').pop()?.toUpperCase()
                          : 'N/A';

                        return (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row items-center border border-gray-300 rounded-md p-4 shadow-sm"
                          >
                            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-700 rounded-md overflow-hidden shrink-0">
                              {isImage ? (
                                <img
                                  src={file.rutaUrl}
                                  alt={nombreArchivo}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-medium text-center">
                                  {fileExtension}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 mt-4 sm:mt-0 sm:ml-4 overflow-hidden">
                              <p
                                className="text-gray-800 font-medium truncate"
                                title={nombreArchivo}
                              >
                                {nombreArchivo}
                              </p>

                              <div className="flex space-x-2 mt-2">
                                <a href={file.rutaUrl} target="_blank" rel="noopener noreferrer">
                                  <button className="btn btn-sm btn-light text-sm">
                                    <KeenIcon icon="eye" />
                                  </button>
                                </a>
                                <button
                                  className="btn btn-sm btn-light text-sm"
                                  onClick={() => handleDeleteFileCard(file.id)}
                                >
                                  <KeenIcon icon="trash" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 text-center text-gray-500">
                    No hay archivos asociados a esta tarjeta.
                  </div>
                )}
              </div>
            </TimelinesWrapper>
          </div>

          <div className="flex flex-col gap-2 pr-4">
            <p className="text-center mb-2">Añadir a la Tarjeta</p>

            <div>
              <button
                className="btn h-10 btn-sm btn-light text-sm w-full"
                onClick={() => toggleContent('miembros')}
              >
                <span className="flex items-center">
                  <KeenIcon icon="user" className="mr-1" />
                  Miembros
                </span>
              </button>
              {activeSection === 'miembros' && (
                <div className="mt-2 p-2 rounded">
                  <div className="space-y-2">
                    {userAssign.length > 0 ? (
                      userAssign.map((user, index) => (
                        <div key={user.id}>
                          <div className="flex items-center justify-between p-2 rounded shadow-sm">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => handleUserClick(user.id)}
                            >
                              <img
                                src={user?.persona?.rutaFotoUrl}
                                alt={`${user?.persona?.nombre1} ${user?.persona?.apellido1}`}
                                className="w-8 h-8 rounded-full"
                              />
                              <div className="ml-3">
                                <p className="text-sm font-semibold">
                                  {user.persona.nombre1} {user.persona.apellido1}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => handleUserClick(user.id)}>
                              <KeenIcon icon="plus-squared" />
                            </button>
                          </div>
                          {index < userAssign.length - 1 && (
                            <div className="border-b border-b-gray-200 my-2"></div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-gray-500 font-medium mt-2">
                        Ya no quedan miembros por asignar
                      </div>
                    )}
                  </div>
                  {userAssign.length > 0 && (
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        className="text-xs text-blue-500 mt-4"
                        onClick={() => closeContent('miembros')}
                      >
                        Listo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <button
                className="btn  h-10 btn-sm btn-light text-sm w-full"
                onClick={() => toggleContent('checklist')}
              >
                <KeenIcon icon="double-check" />
                Checklist
              </button>
              {activeSection === 'checklist' && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <input
                    type="text"
                    className="input"
                    placeholder="Nombre Checklist"
                    value={checklistName}
                    onChange={(e) => setChecklistName(e.target.value)}
                  />

                  <div className="flex justify-end gap-2 mt-2">
                    <button className="btn btn-sm text-xs text-blue-500" onClick={saveChecklist}>
                      Guardar
                    </button>
                    <button
                      className="btn btn-sm text-xs text-red-500"
                      onClick={() => closeContent('checklist')}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <button
                className="btn  h-10 btn-sm btn-light text-sm w-full"
                onClick={() => toggleContent('archivos')}
              >
                <KeenIcon icon="paper-clip" />
                Archivos
              </button>
              {activeSection === 'archivos' && (
                <div className="mt-2 p-2 bg-gray-100 rounded">
                  <input
                    className="file-input"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button className="btn btn-sm text-xs text-blue-500" onClick={uploadFile}>
                      Subir Archivo
                    </button>
                    <button
                      className="btn btn-sm text-xs text-red-500"
                      onClick={() => closeContent('archivos')}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!cardDetail.id && (
              <div>
                <button
                  className="btn  h-10 btn-sm btn-light text-sm w-full"
                  onClick={() => toggleContent('fecha')}
                >
                  <KeenIcon icon="calendar" />
                  Fecha
                </button>
                {activeSection === 'fecha' && (
                  <div className="mt-2 p-2 bg-gray-100 rounded">
                    <form onSubmit={handleSubmit}>
                      <label className="block mb-2 text-sm font-medium">
                        Fecha Inicial (Opcional)
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          className="input"
                        />
                      </label>

                      <label className="block mb-2 text-sm font-medium">
                        Fecha Final
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </label>

                      <label className="block mb-2 text-sm font-medium">
                        Hora Final
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          required
                          className="input"
                        />
                      </label>

                      <label className="block mb-2 text-sm font-medium">
                        Recordatorio (Opcional)
                        <select
                          name="configuracion"
                          value={formData.configuracion}
                          onChange={handleChange}
                          className="select"
                        >
                          <option value="">Selecciona una opción</option>
                          {options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.configuracion}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          type="submit"
                          className={`btn btn-sm text-xs text-blue-500 ${
                            isFormInvalid ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={isFormInvalid}
                        >
                          Guardar
                        </button>
                        <button
                          className="btn btn-sm text-xs text-red-500"
                          onClick={() => closeContent('fecha')}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {!cardDetail.configuracion_repeat?.id && (
              <div>
                <button
                  className="btn  h-10 btn-sm btn-light text-sm w-full"
                  onClick={() => toggleContent('repetir')}
                >
                  <KeenIcon icon="time" />
                  Repetir
                </button>
                {activeSection === 'repetir' && (
                  <div className="mt-2 p-2 bg-gray-100 rounded">
                    <select
                      className="select"
                      value={selectedConfigRepeat}
                      onChange={(e) => setSelectedConfigRepeat(e.target.value)}
                    >
                      <option value="">Selecciona una configuración</option>
                      {cardConfigRepeat.map((config) => (
                        <option key={config.id} value={config.id}>
                          {config.configuracion}
                        </option>
                      ))}
                    </select>
                    <div className="flex justify-end mt-2">
                      <button
                        className="btn btn-sm text-xs text-blue-500"
                        onClick={handleSaveRepeat}
                      >
                        Guardar
                      </button>
                      <button
                        className="btn btn-sm text-xs text-red-500"
                        onClick={() => closeContent('repetir')}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {cardDetail.estado === 'ARCHIVADO' ? (
              <div>
                <button
                  className="btn h-10 btn-sm btn-light text-sm w-full"
                  onClick={() => handleUnarchivedCard()}
                >
                  <KeenIcon icon="archive" />
                  Desarchivar
                </button>
              </div>
            ) : (
              <div>
                <button
                  className="btn h-10 btn-sm btn-light text-sm w-full"
                  onClick={() => handleArchivedCard()}
                >
                  <KeenIcon icon="archive" />
                  Archivar
                </button>
              </div>
            )}
            <div>
              <button
                className="btn  h-10 btn-sm btn-light text-sm w-full"
                onClick={() => handleDeleteCard()}
              >
                <KeenIcon icon="trash" />
                Eliminar
              </button>
            </div>
          </div>
        </ModalBody>

        <ModalAssingUserChecklist
          open={isModalUserAssingOpen}
          onClose={() => {
            setIsModalUserAssingOpen(false);
          }}
          users={cardUsers}
          idChecklist={selectedItemId}
          onSave={handleAfterSaveOptionChecklist}
        />

        <AssingDateChecklist
          open={isModalDateAssingOpen}
          onClose={() => {
            setIsModalDateAssingOpen(false);
          }}
          users={cardUsers}
          idChecklist={selectedItemId}
          onSave={handleAfterSaveOptionChecklist}
        />
      </ModalContent>
    </Modal>
  );
};

export { ModalCard };
