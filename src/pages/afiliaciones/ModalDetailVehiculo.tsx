import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import { AfiliacionInterface, VehiculoInterface } from './models/AfiliacionInterface';
import { useConfirm } from '@/hooks';
import { IRecentUploadsItem } from '../contratos/blocks';
import { toAbsoluteUrl } from '@/utils';
import { ModalUpdateDocumentVehiculo } from './ModalUpdateDocumentVehiculo';

interface ModalProps {
  open: boolean;
  data?: any; //vehiculo
  vinculacion?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalDetailVehiculo = ({ open, data,vinculacion, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const { confirmAction } = useConfirm();
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<IRecentUploadsItem | null>(null);

  const items: IRecentUploadsItem[] = (results || []).map((item) => {
    const dateObj = new Date(item.fecha_vigencia);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    return {
      image: 'pdf.svg',
      desc: item.tipo_documento?.tituloDocumento || 'Sin título',
      date: formattedDate,
         tipoFecha: item.tipo_documento?.tipoFecha || 'Sin título',
      fileUrl: item.rutaUrl,
      id: item.id
    };
  });

  const fetchData = useCallback(async () => {
    if (!data?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`get_documents_by_vehiculo/${data?.id}`);
      setResults(response.data);
    } catch (error) {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const handleAfterSave = () => {
    fetchData();
    setModalOpen(false);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderItem = (item: IRecentUploadsItem, index: number) => {
    return (
      <div key={index} className="flex items-center gap-3">
        <div className="flex items-center grow gap-2.5">
          <img src={toAbsoluteUrl(`/media/file-types/${item.image}`)} alt="" />

          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary mb-px">
              <a href={item?.fileUrl} target="_blank" rel="noopener noreferrer">
                {item.desc}
              </a>
            </span>

             <span className="text-xs text-gray-700">{item.tipoFecha}: {item.date}</span>
          </div>
        </div>

        <button
          onClick={() => {
            setSelectedDocument(item);
            setModalOpen(true);
          }}
        >
          <KeenIcon className="text-lg" icon="pencil" />
        </button>
      </div>
    );
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[680px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Vehículo - {vinculacion?.numero || 'N/A'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}
          <div className="card relative rounded-md">
            <div className="card-body pt-4 pb-3">
              <table className="table-auto w-full">
                <tbody>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Placa:</td>
                    <td className="text-sm text-gray-900 pb-3.5">{data?.placa || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Chasis:</td>
                    <td className="text-sm text-gray-900 pb-3.5">{data?.chasis || 'N/A'}</td>
                  </tr>

                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Número de Puestos:</td>
                    <td className="text-sm text-gray-900 pb-3.5">{data?.numPuestos || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Motor:</td>
                    <td className="text-sm text-gray-900 pb-3.5">{data?.motor || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Combustible:</td>
                    <td className="text-sm text-gray-900 pb-3.5">
                      {data?.tipoCombustible || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Marca:</td>
                    <td className="text-sm text-gray-900 pb-3.5">{data?.marca?.marca || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Modelo:</td>
                    <td className="text-sm text-gray-900 pb-3.5">
                      {data?.modelo?.modelo || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Tipo de Vehículo:</td>
                    <td className="text-sm text-gray-900 pb-3.5">
                      {data?.tipo_vehiculo?.tipo || 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-sm text-gray-600 pb-3.5 pe-3">Clase de Vehículo:</td>
                    <td className="text-sm text-gray-900 pb-3.5">
                      {data?.clase_vehiculo?.nombre || 'N/A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card relative rounded-md">
            <div className="card-body ">
              {items.length > 0 ? (
                <div className="grid gap-2.5 lg:gap-5">
                  {items.map((item, index) => renderItem(item, index))}
                </div>
              ) : (
                <div className="text-gray-500 text-center">No hay documentos disponibles.</div>
              )}
            </div>
          </div>
          <ModalUpdateDocumentVehiculo
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
            }}
            documento={selectedDocument}
            onSave={handleAfterSave}
          />

          <div className="flex justify-end gap-3 mt-4 ">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalDetailVehiculo };
