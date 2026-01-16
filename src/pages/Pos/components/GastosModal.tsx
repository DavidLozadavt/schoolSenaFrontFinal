import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
  idPunto: any 
}

interface Gasto {
  detalle: string;
  valor: string;
}

const GastosModal = ({ open, onClose, onSave, idPunto }: ModalProps) => {
  const [gastos, setGastos] = useState<Gasto[]>([{ detalle: '', valor: '' }]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [idCajaTienda, setIdCajaTienda] = useState<number | null>(null);



useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    

    axios
      .get(`caja-latest/${idPunto}`)
      .then((res) => {
        setIdCajaTienda(res.data.id);
      })
      .catch((error) => {
        console.error('Error al obtener la caja:', error);
      });

    
  }, []);
  

  useEffect(() => {
    if (open) {
      setGastos([{ detalle: '', valor: '' }]);
      setArchivo(null);
      setErrores([]);
    }
  }, [open]);

  const handleAgregarGasto = () => {
    setGastos([...gastos, { detalle: '', valor: '' }]);
  };

  const handleEliminarGasto = (index: number) => {
    if (gastos.length > 1) {
      const nuevosGastos = gastos.filter((_, i) => i !== index);
      setGastos(nuevosGastos);
    }
  };

  const handleDetalleChange = (index: number, value: string) => {
    const nuevosGastos = [...gastos];
    nuevosGastos[index].detalle = value.toUpperCase();
    setGastos(nuevosGastos);
  };

  const handleValorChange = (index: number, value: string) => {
    const raw = value.replace(/\./g, '');
    const numeric = parseInt(raw) || 0;
    const nuevosGastos = [...gastos];
    nuevosGastos[index].valor = numeric.toString();
    setGastos(nuevosGastos);
  };

  const formatCOP = (value: string) => {
    if (!value || value === '0') return '';
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(parseInt(value));
  };

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setArchivo(file);
  };

  const handleSave = async () => {
    const nuevosErrores: string[] = [];

    gastos.forEach((gasto, index) => {
      if (!gasto.detalle || !gasto.valor || gasto.valor === '0') {
        nuevosErrores.push(`Gasto ${index + 1}: Detalle y valor son obligatorios`);
      }
    });

    if (nuevosErrores.length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('productos', JSON.stringify(gastos));
      formData.append('idCaja', idCajaTienda?.toString() || '');
      if (archivo) {
        formData.append('rutaFacturaFile', archivo);
      }

      await axios.post('store_gastos', formData);

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error(error);
      setErrores(['Error al guardar los gastos']);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[700px] top-[5%] p-4 max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Registrar Gastos</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="w-[calc(100%-2rem)] mx-auto space-y-4">
            {/* Lista de gastos */}
            {gastos.map((gasto, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-gray-700">Gasto #{index + 1}</h4>
                  {gastos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarGasto(index)}
                      className="btn btn-sm btn-icon btn-light text-red-600 hover:bg-red-50"
                    >
                      <KeenIcon icon="trash" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Detalle</label>
                    <input
                      className="input p-2 border border-gray-300 rounded-md w-full"
                      placeholder="Descripción del gasto"
                      type="text"
                      value={gasto.detalle}
                      onChange={(e) => handleDetalleChange(index, e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                    <input
                      className="input p-2 border border-gray-300 rounded-md w-full"
                      placeholder="0"
                      type="text"
                      value={formatCOP(gasto.valor)}
                      onChange={(e) => handleValorChange(index, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Botón para agregar nuevo gasto */}
            <button
              type="button"
              onClick={handleAgregarGasto}
              className="btn btn-sm btn-primary"
            >
            
              Añadir Nuevo Gasto
            </button>

            {/* Campo de archivo */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Archivo (Opcional)
              </label>
              <input
                type="file"
                className="file-input w-full"
                onChange={handleArchivoChange}
                accept="image/*,.pdf"
              />
              {archivo && (
                <p className="text-sm text-gray-600 mt-2">Archivo seleccionado: {archivo.name}</p>
              )}
            </div>

            {/* Errores */}
            {errores.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                {errores.map((error, index) => (
                  <p key={index} className="text-red-600 text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleSave}>
                Guardar Gastos
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { GastosModal };
