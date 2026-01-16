import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalConfiguracionPagos = ({ open, onClose, data, onSave }: ModalProps) => {
  const [tituloPago, setTituloPago] = useState('');
  const [description, setDescription] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<string>('');
  const [estado, setEstado] = useState<string>('ACTIVO');
  const [idProceso, setIdProceso] = useState<number>(0);
  const [procesos, setProcesos] = useState<any[]>([]);

  const formatCurrency = (value: number): string => {
    if (value === 0) return '';
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleValueChange = (inputValue: string) => {
    const cleaned = inputValue.replace(/\D/g, '');
    const numericValue = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setValor(numericValue);
    setDisplayValue(formatCurrency(numericValue));
  };

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

    if (data) {
      setTituloPago(data.configuracion_pago?.titulo || data.tituloPago || '');
      setDescription(data.configuracion_pago?.detalle || data.descripcion || '');
      const valorData = data.configuracion_pago?.valor || 0;
      setValor(valorData);
      setDisplayValue(formatCurrency(valorData));
      setEstado(data.configuracion_pago?.estado || 'ACTIVO');
      setIdProceso(data.idProceso || 0);
    } else {
      clearFields();
    }
  }, [data, open]);

  const clearFields = () => {
    setTituloPago('');
    setDescription('');
    setValor(0);
    setDisplayValue('');
    setEstado('ACTIVO');
    setIdProceso(0);
  };

  const handleSave = async () => {
    try {
      const payload = {
        idProceso,
        titulo: tituloPago,
        detalle: description,
        valor: valor,
        estado: estado
      };

      if (data) {
        await axios.put(`update_configuracion_pago/${data.id}`, payload);
      } else {
        await axios.post('store_configuracion_pago', payload);
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
    <Modal
      open={open}
      onClose={() => {
        clearFields();
        onClose();
      }}
    >
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>
            {data ? 'Editar Configuración de Pago' : 'Nueva Configuración de Pago'}
          </ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={() => {
              clearFields();
              onClose();
            }}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="tituloDoc" className="text-sm font-medium text-gray-700">
              Titulo de la configuración
            </label>
            <input
              id="tituloDoc"
              className="input p-2 border border-gray-300 rounded-md"
              placeholder="Ingrese el titulo de la configuración"
              type="text"
              value={tituloPago}
              onChange={(e) => setTituloPago(e.target.value)}
            />
          </div>

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

          <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
            <label htmlFor="valor" className="text-sm font-medium text-gray-700">
              Valor
            </label>
            <div className="relative">
              <input
                id="valor"
                className="input  border border-gray-300 rounded-md w-full"
                placeholder="0"
                type="text"
                value={displayValue}
                onChange={(e) => handleValueChange(e.target.value)}
              />
            </div>
          </div>

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

          {data && (
            <div className="flex flex-col gap-1 w-[calc(100%-2rem)] mx-auto">
              <label htmlFor="estado" className="text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                id="estado"
                className="input p-2 border border-gray-300 rounded-md"
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="INACTIVO">INACTIVO</option>
              </select>
            </div>
          )}

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

export { ModalConfiguracionPagos };
