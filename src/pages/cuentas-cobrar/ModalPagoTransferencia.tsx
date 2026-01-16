import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useEffect, useState } from 'react';
import Spinner from '@/components/loaders/Spinner';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalPagoTransferencia = ({ open, onClose, data, onSave }: ModalProps) => {
  const [fechaAbono, setFechaAbono] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errorFecha, setErrorFecha] = useState('');
  const [errorFile, setErrorFile] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    if (open) {
      setFechaAbono('');
      setFile(null);
      setErrorFecha('');
      setErrorFile('');
    }
  }, [open]);

  const validateFecha = (value: string) => {
    if (!value) {
      setErrorFecha('Debe ingresar una fecha.');
      return false;
    }
    setErrorFecha('');
    return true;
  };

  const validateFile = (file: File | null) => {
    if (!file) {
      setErrorFile('Debe seleccionar el comprobante de pago.');
      return false;
    }
    setErrorFile('');
    return true;
  };

  const handleGuardar = async () => {
    const isFechaValid = validateFecha(fechaAbono);
    const isFileValid = validateFile(file);
  
    if (!isFechaValid || !isFileValid) return;
   
    const formData = new FormData();
    formData.append("email", data.retencionSI.transaccion.contratosCliente[0].tercero.email + "");
    formData.append("idPago", data.retencionNO.id + "");
    formData.append("idPagoRetencion", data.retencionSI.id + "");
    formData.append("idPagoCompleto", data.retencionNull.id + "");
    formData.append("idContrato", data.retencionSI.transaccion.contratosCliente[0].id + "");
    formData.append('fecha', fechaAbono);
    
    if (file) {
      formData.append('rutaComprobanteFile', file);
    }
  
    try {
      setLoading(true);
      await axios.post('store_comprobante_pago', formData);
      setLoading(false);
      onSave();
      onClose();
    } catch (error) {
      setLoading(false);
      console.error('Error al guardar el pago:', error);
    }
  };
  

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
      {loading && <Spinner />}
        <ModalHeader>
          <ModalTitle>Subir Comprobante de la Transferencia</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="fechaAbono" className="block text-sm mb-1 font-medium">
              Fecha del recibo de pago
            </label>
            <input
              type="date"
              className="input"
              name="fechaAbono"
              value={fechaAbono}
              onChange={(e) => {
                setFechaAbono(e.target.value);
                validateFecha(e.target.value);
              }}
              onBlur={() => validateFecha(fechaAbono)}
            />
            {errorFecha && <p className="text-red-500 text-sm mt-1">{errorFecha}</p>}
          </div>

          <div>
            <label htmlFor="archivo" className="block text-sm mb-1 font-medium">
              Recibo de Pago
            </label>
            <input
              type="file"
              className="file-input"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                setFile(selectedFile);
                validateFile(selectedFile);
              }}
              onBlur={() => validateFile(file)}
            />
            {errorFile && <p className="text-red-500 text-sm mt-1">{errorFile}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleGuardar}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalPagoTransferencia };
