import { KeenIcon } from '@/components';
import { ContratoInterface } from '../model/ContratoInterface';
import { useState, useEffect } from 'react';
import { ModalUpdateDocument } from '../ModalUpdateDocument';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { getAuth } from '@/auth';
import Toast from '../../programas-academicos/components/Toast';
import ConfirmarEliminar from '../../programas-academicos/components/ConfirmarEliminar';


interface IRecentUploadsItem {
  image: string;
  desc: string;
  date: string;
  tipoFecha?: any;
  fileUrl?: string;
  id?: any;
}
interface IRecentUploadsItems extends Array<IRecentUploadsItem> {}

interface IRecentUploadsProps {
  title: string;
  onSave?: () => void;
  contrato: ContratoInterface;
}

const ContractFiles = ({ title, contrato, onSave }: IRecentUploadsProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalNewDocumentOpen, setIsModalNewDocumentOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<IRecentUploadsItem | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newDocumentType, setNewDocumentType] = useState<string>('');
  const [availableDocumentTypes, setAvailableDocumentTypes] = useState<any[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<IRecentUploadsItem | null>(null);

  useEffect(() => {
    if (isModalNewDocumentOpen && contrato?.tipoContrato?.nombreTipoContrato) {
      console.log('Cargando tipos de documentos para:', contrato.tipoContrato.nombreTipoContrato);
      fetchDocumentTypes(contrato.tipoContrato.nombreTipoContrato);
    } else if (isModalNewDocumentOpen) {
      console.warn('No se puede cargar tipos de documentos: tipoContrato o nombreTipoContrato no disponible', {
        tipoContrato: contrato?.tipoContrato,
        nombreTipoContrato: contrato?.tipoContrato?.nombreTipoContrato
      });
    }
  }, [isModalNewDocumentOpen, contrato?.tipoContrato?.nombreTipoContrato]);

  const fetchDocumentTypes = async (nombreProceso: string) => {
    try {
      const response = await axios.get(
        `contrato-tipo-documento?nombreProceso=${encodeURIComponent(nombreProceso)}`
      );
      console.log('Tipos de documentos recibidos:', response.data);
      console.log('Nombre del proceso:', nombreProceso);
      console.log('Es array?', Array.isArray(response.data));
      console.log('Cantidad de documentos:', response.data?.length || 0);
      
      // Asegurarse de que response.data sea un array
      const documentos = Array.isArray(response.data) ? response.data : [];
      setAvailableDocumentTypes(documentos);
      
      if (documentos.length === 0) {
        console.warn('No se encontraron tipos de documentos para el proceso:', nombreProceso);
      }
    } catch (error: any) {
      console.error('Error al cargar tipos de documentos:', error);
      console.error('Respuesta del error:', error.response?.data);
      setAvailableDocumentTypes([]);
      if (error.response?.status === 404) {
        enqueueSnackbar('No se encontraron tipos de documentos para este proceso.', { variant: 'warning' });
      }
    }
  };


  const handleAfterSave = () => {
    if (onSave) {
      onSave();
    }
    setIsModalOpen(false);
    setIsModalNewDocumentOpen(false);
    setNewFile(null);
    setNewDocumentType('');
  };

  const handleNewDocumentSave = async () => {
    if (!newFile || !newDocumentType) {
      enqueueSnackbar('Debe seleccionar un archivo y un tipo de documento.', { variant: 'error' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('idContrato', contrato.id?.toString() || '');
      formData.append('idAsignacionTipoDocumentoProceso', newDocumentType);
      formData.append('rutaFile', newFile);

      await axios.post('contrato-documento', formData);
      setToastMessage('Documento cargado con éxito.');
      setShowToast(true);
      handleAfterSave();
    } catch (error) {
      enqueueSnackbar('Error al cargar el documento.', { variant: 'error' });
    }
  };

  const handleConfirmChange = (id?: any) => {
    if (id === undefined) return;
    setDocumentToDelete(id);
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!documentToDelete) return;
    await handleSave(documentToDelete);
    setShowConfirmDelete(false);
    setDocumentToDelete(null);
  };

  const handleSave = async (id: any) => {
    try {
      await axios.post(`delete_documento_contrato`, {
        idDocumento: id.id
      });
      setToastMessage('Documento eliminado con éxito.');
      setShowToast(true);
      if (onSave) {
        onSave();
      }
    } catch (error: unknown) {
      enqueueSnackbar('Error al eliminar el documento.', { variant: 'error' });
    }
  };

  const items: IRecentUploadsItems = (contrato.documentosContrato || []).map((item) => ({
    image: 'pdf.svg',
    desc: item.AsignacionTipoDocumentoProceso.tipoDocumento.tituloDocumento,
    date: `${new Date(item.fechaCarga).toLocaleString()}`,
    fileUrl: item.rutaFileUrl,
    id: item.id
  }));

  const handleViewDocument = (id: any) => {
    if (!id) return;
    const token = getAuth();
    const url = `${axios.defaults.baseURL}download_documento_contrato/${id}?token=${token || ''}`;
    window.open(url, '_blank');
  };

  const handleDownloadDocument = async (id: any, fileName: string) => {
    if (!id) return;
    try {
      const token = getAuth();
      const url = `${axios.defaults.baseURL}download_documento_contrato/${id}?token=${token || ''}`;
      
      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token || ''}`
        }
      });

      // Obtener el tipo MIME del response
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const fileURL = window.URL.createObjectURL(blob);
      
      // Obtener la extensión del tipo MIME o usar el nombre del archivo
      let extension = 'pdf';
      if (contentType.includes('pdf')) extension = 'pdf';
      else if (contentType.includes('word') || contentType.includes('msword')) extension = 'doc';
      else if (contentType.includes('excel') || contentType.includes('spreadsheet')) extension = 'xls';
      else if (contentType.includes('image')) extension = contentType.split('/')[1];
      else if (contentType.includes('text')) extension = 'txt';
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `${fileName || 'documento'}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(fileURL);
      
      setToastMessage('Documento descargado con éxito.');
      setShowToast(true);
    } catch (error) {
      console.error('Error al descargar el documento:', error);
      enqueueSnackbar('Error al descargar el documento.', { variant: 'error' });
    }
  };

  const handleEditDocument = (item: IRecentUploadsItem) => {
    setSelectedDocument(item);
    setIsModalOpen(true);
  };

  const renderItem = (item: IRecentUploadsItem, index: number) => {
    return (
      <div 
        key={index} 
        className="flex items-center gap-3 py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <KeenIcon icon="document" className="text-lg text-primary flex-shrink-0" />
        <button
          onClick={() => handleViewDocument(item.id)}
          className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white hover:text-primary transition-colors"
        >
          {item.desc}
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => handleDownloadDocument(item.id, item.desc)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Descargar documento"
          >
            <KeenIcon icon="file-down" className="text-lg text-gray-400 dark:text-gray-500 hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => handleEditDocument(item)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Editar documento"
          >
            <KeenIcon icon="pencil" className="text-lg text-gray-400 dark:text-gray-500 hover:text-primary transition-colors" />
          </button>
          <button
            onClick={() => handleConfirmChange(item)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Eliminar documento"
          >
            <KeenIcon icon="trash" className="text-lg text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <KeenIcon icon="document" className="text-lg text-primary" />
            <h3 className="card-title">{title}</h3>
          </div>
        </div>

        <div className="card-body">
          {items.length > 0 ? (
            <div className="space-y-0">
              {items.map((item, index) => renderItem(item, index))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No hay documentos disponibles.</div>
          )}
        </div>

        <div className="card-footer border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => setIsModalNewDocumentOpen(true)}
            className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-3 px-4 flex items-center justify-center gap-2 hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-transparent dark:bg-transparent"
          >
            <KeenIcon icon="file-up" className="text-lg text-primary" />
            <span className="text-sm font-medium text-primary">Cargar Nuevo Documento</span>
          </button>
        </div>
      </div>

      <ModalUpdateDocument
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
        }}
        documento={selectedDocument}
        onSave={handleAfterSave}
      />

      {/* Modal para cargar nuevo documento */}
      <Modal open={isModalNewDocumentOpen} onClose={() => setIsModalNewDocumentOpen(false)}>
        <ModalContent className="max-w-[500px] top-[15%] p-4">
          <ModalHeader>
            <ModalTitle>Cargar Nuevo Documento</ModalTitle>
            <button
              className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
              onClick={() => setIsModalNewDocumentOpen(false)}
            >
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody className="grid gap-5 px-0 py-5">
            <div>
              <label htmlFor="documentType" className="block text-sm font-medium mb-2">
                Tipo de Documento
              </label>
              <select
                id="documentType"
                value={newDocumentType}
                onChange={(e) => setNewDocumentType(e.target.value)}
                className="select w-full"
              >
                <option value="">Seleccione un tipo</option>
                {availableDocumentTypes.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.tipoDocumento?.tituloDocumento || 'Documento sin nombre'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="newFile" className="block text-sm font-medium mb-2">
                Archivo
              </label>
              <input
                type="file"
                id="newFile"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setNewFile(e.target.files[0]);
                  }
                }}
                className="file-input"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4 px-4">
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => setIsModalNewDocumentOpen(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleNewDocumentSave}>
                Guardar
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Toast
        message={toastMessage}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />

      <ConfirmarEliminar
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setDocumentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        nombrePrograma={documentToDelete?.desc || 'el documento'}
      />
    </>
  );
};

export {
  ContractFiles,
  type IRecentUploadsItem,
  type IRecentUploadsItems,
  type IRecentUploadsProps
};
