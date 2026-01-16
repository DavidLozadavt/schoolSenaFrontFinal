import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { FacturaInterface } from './models/FacturaInterface';
import { NumericFormat } from 'react-number-format';
import { useEffect, useState } from 'react';

interface ModalProps {
  open: boolean;
  data?: FacturaInterface;
  onClose: () => void;
  onSave: () => void;
}

const ModalPagoCuentaPendiente = ({ open, onClose, data, onSave }: ModalProps) => {
  const [valorAbono, setValorAbono] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValorAbono('');
      setFile(null);
      setError('');
    }
  }, [open]);

  const validateInputs = () => {
    const excedenteTotal = data?.excedente_total ?? 0;
    if (!valorAbono) {
      setError('Debe ingresar un valor.');
      return false;
    }
    if (parseFloat(valorAbono) > excedenteTotal) {
      setError(`El valor no puede superar $${excedenteTotal}`);
      return false;
    }
    setError('');
    return true;
  };

  const handleGuardar = async () => {
    if (!validateInputs()) return;

    const formData = new FormData();
    formData.append('idFactura', String(data?.id));
    formData.append('valorAbono', String(valorAbono));
    if (file) {
      formData.append('rutaComprobanteFile', file);
    }

    try {
      await axios.post('store_pago_factura', formData);
      onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar el pago:', error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[550px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Abono de Pago</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <span className="badge badge-lg badge-outline badge-primary block w-full text-left">
            <KeenIcon icon="information-2 mr-2" />
            El valor no debe superar el monto de:{' '}
            {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'COP' }).format(
              data?.excedente_total ?? 0
            )}
          </span>

          <div>
            <label htmlFor="valorAbono" className="block text-sm mb-1 font-medium">
              Valor
            </label>
            <NumericFormat
              className="input"
              prefix={'$'}
              name="valorAbono"
              decimalScale={2}
              thousandSeparator=","
              allowNegative={false}
              value={valorAbono}
              onValueChange={(values) => {
                setValorAbono(values.floatValue !== undefined ? values.floatValue.toString() : '');
                validateInputs();
              }}
              placeholder="Ingrese el valor"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div>
            <label htmlFor="archivo" className="block text-sm mb-1 font-medium">
              Recibo de Pago (Opcional)
            </label>
            <input
              type="file"
              className="file-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
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

export { ModalPagoCuentaPendiente };
