import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useEffect, useState } from 'react';
import Spinner from '@/components/loaders/Spinner';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}

const ModalTransferenciaAbonoCuentaCobrar = ({ open, onClose, data, onSave }: ModalProps) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [valorAbono, setValorAbono] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (open) {
      setValorAbono('');
      setFile(null);
      setError('');
    }
  }, [open]);

  const validateInputs = () => {
    const excedenteTotal = data?.transacciones[0]?.faltante ?? 0;
    if (!valorAbono) {
      setError('Debe ingresar un valor.');
      return false;
    }
    if (parseFloat(valorAbono) > excedenteTotal) {
      setError(
        `El valor no puede superar $${new Intl.NumberFormat('es-ES', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(excedenteTotal)}`
      );
      return false;
    }
    setError('');
    return true;
  };

  const handleGuardar = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('idTransaccion', String(data?.transacciones[0]?.id));
    formData.append('valorAbono', String(valorAbono));
    if (file) {
      formData.append('rutaComprobanteFile', file);
    }

    try {
      await axios.post('store_abono_pago_cuenta_cobrar', formData);
      enqueueSnackbar('Pago registrado exitosamente', {
        variant: 'success'
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar el pago:', error);
      enqueueSnackbar('Error al registrar el pago. Intente nuevamente.', {
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  const parseCurrency = (value: string) => {
    return value.replace(/[^0-9]/g, '');
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
          {loading && <Spinner />}
          <span className="badge badge-lg badge-outline badge-primary block w-full text-left">
            <KeenIcon icon="information-2 mr-2" />
            El valor no debe superar el monto de: $
            {new Intl.NumberFormat('es-ES', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(data?.transacciones[0]?.faltante ?? 0)}
          </span>

          <div>
            <label htmlFor="valorAbono" className="block text-sm mb-1 font-medium">
              Valor
            </label>

            <input
              type="text"
              name="valorAbono"
              placeholder="Ingrese el valor"
              value={currencyFormatter.format(Number(valorAbono || 0))}
              onChange={(e) => {
                const parsed = parseCurrency(e.target.value);
                setValorAbono(parsed);
                validateInputs();
              }}
              className="input"
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

export { ModalTransferenciaAbonoCuentaCobrar };
