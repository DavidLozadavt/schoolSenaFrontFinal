import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { IdocuensType } from './model/TipoDocumentInterface';

interface ModalProps {
  open: boolean;
  documentmentType?: IdocuensType;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTipoDocumento = ({ open, onClose, documentmentType, onSave }: ModalProps) => {
  const [tituloDoc, setTituloDoc] = useState('');
  const [description, setDescription] = useState('');
  const [idProceso, setIdProceso] = useState<number>(0); 
  const [procesos, setProcesos] = useState<any[]>([]);
  const [fechaTipo, setFechaTipo] = useState<'FECHA EXPEDICION' | 'FECHA VIGENCIA' | 'NINGUNA'>('NINGUNA');

  useEffect(() => {
    const fetchProcesos = async () => {
      try {
        const response = await axios.get('procesos');
        setProcesos(response.data); 
      } catch (error) {
        console.error('Error al obtener los procesos:', error);
      }
    };

    fetchProcesos();

    if (documentmentType) {
      setTituloDoc(documentmentType.tipoDocumento.tituloDocumento);
      setDescription(documentmentType.tipoDocumento.descripcion);
      setIdProceso(documentmentType.idProceso); 
      setFechaTipo(documentmentType.tipoDocumento.fechaTipo || 'NINGUNA'); 
    } else {
      clearFields();
    }
  }, [documentmentType, open]);

  const clearFields = () => {
    setTituloDoc('');
    setDescription('');
    setIdProceso(0);
    setFechaTipo('NINGUNA');
  };

  const handleSave = async () => {
    try {
      const data = { 
        idProceso,
        tituloDocumento: tituloDoc,
        descripcion: description,
        fechaTipo, 
        idEstado: 1
      };

      if (documentmentType) {
        await axios.put(`tipo_documentos/${documentmentType.id}`, data);
      } else {
        await axios.post('tipo_documentos', data);
      }

      if (onSave) {
        onSave();
      }
      clearFields(); 
    } catch (error) {
      console.error('Error al guardar el documento:', error);
    }
  };

  return (
    <Modal open={open} onClose={() => { clearFields(); onClose(); }}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{documentmentType ? 'Editar Tipo de Pago' : 'Nuevo Tipo de Documento'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={() => { clearFields(); onClose(); }}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">

          {/* Tipo documento */}
          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="tituloDoc" className="text-sm font-medium text-gray-700">
              Tipo de documento
            </label>
            <input
              id="tituloDoc"
              className="input p-2 border border-gray-300 rounded-md"
              placeholder="Ingrese el tipo documento"
              type="text"
              value={tituloDoc}
              onChange={(e) => setTituloDoc(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="descripcion" className="text-sm font-medium text-gray-700">
              Descripción
            </label>
            <input
              id="descripcion"
              className="input p-2 border border-gray-300 rounded-md"
              placeholder="Ingrese la descripción"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Proceso */}
          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="proceso" className="text-sm font-medium text-gray-700">
              Proceso
            </label>
            <select
              id="proceso"
              className="input p-2 border border-gray-300 rounded-md"
              value={idProceso}
              onChange={(e) => setIdProceso(Number(e.target.value))}
            >
              <option value={0}>Seleccione un proceso</option>
              {procesos.map((proceso) => (
                <option key={proceso.id} value={proceso.id}>
                  {proceso.nombreProceso}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Fecha */}
          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="fechaTipo" className="text-sm font-medium text-gray-700">
              Tipo de fecha
            </label>
            <select
              id="fechaTipo"
              className="input p-2 border border-gray-300 rounded-md"
              value={fechaTipo}
              onChange={(e) => setFechaTipo(e.target.value as any)}
            >
              <option value="FECHA EXPEDICION">FECHA EXPEDICION</option>
              <option value="FECHA VIGENCIA">FECHA VIGENCIA</option>
              <option value="NINGUNA">NINGUNA</option>
            </select>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 px-4 mt-4">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => {
                clearFields();
                onClose();
              }}
            >
              Cancelar
            </button>
            <button onClick={handleSave} className="btn btn-sm btn-primary">
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTipoDocumento };
