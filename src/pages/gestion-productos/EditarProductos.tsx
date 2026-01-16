import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';

interface ProductoInterface {
  id: number;
  nombreProducto?: string;
  caracteristicas?: string;
  valorCompra?: number;
  valorVenta?: number;
  porcentajeUtilidad?: number;
  cantidad?: number;
  totalDistribuido?: number;
  estado?: 'PUBLICO' | 'PRIVADO';
  imagen?: string;
  rutaProductoUrl?: string;
  ultimoHistorialPrecio?: {
    valorCompra?: number;
    ValorVenta?: number;
    porcentajeUtilidad?: number;
  };
  ivaSi?: 'SI' | 'NO';
  porcentajeIva?: number;
}

interface ModalEditarProductoProps {
  open: boolean;
  producto?: ProductoInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalEditarProducto = ({ open, producto, onClose, onSave }: ModalEditarProductoProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [form, setForm] = useState<ProductoInterface>({
    id: 0,
    nombreProducto: '',
    valorCompra: 0,
    valorVenta: 0,
    porcentajeUtilidad: 0,
    cantidad: 0,
    estado: 'PUBLICO',
    imagen: '',
    ivaSi: 'NO',
    porcentajeIva: 0
  });

  const [cantidadASumar, setCantidadASumar] = useState<number>(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (producto && open) {
      const precio = producto.ultimoHistorialPrecio || {};
      const baseData = {
        id: producto.id,
        nombreProducto: producto.nombreProducto || producto.caracteristicas || 'Sin nombre',
        valorCompra: precio.valorCompra ?? producto.valorCompra ?? 0,
        valorVenta: precio.ValorVenta ?? producto.valorVenta ?? 0,
        porcentajeUtilidad: precio.porcentajeUtilidad ?? producto.porcentajeUtilidad ?? 0,
        cantidad: producto.cantidad ?? 0,
        estado: producto.estado || 'PUBLICO',
        imagen: producto.imagen || producto.rutaProductoUrl || '',
        ivaSi: producto.ivaSi || 'NO',
        porcentajeIva: producto.porcentajeIva ?? 0
      };
      setForm(baseData);
      setPreviewImageUrl(producto.rutaProductoUrl || producto.imagen || null);
      setSelectedFile(null);
      setCantidadASumar(0);
      setErrors({});
    }
  }, [producto, open]);

  const handleChange = (field: keyof ProductoInterface, value: any) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'valorCompra' || field === 'porcentajeUtilidad') {
        const compra = Number(updated.valorCompra ?? 0);
        const utilidad = Number(updated.porcentajeUtilidad ?? 0);
        updated.valorVenta = Number((compra + (compra * utilidad) / 100).toFixed(2));
      }

      if (field === 'valorVenta' && (updated.valorCompra ?? 0) > 0) {
        const compra = Number(updated.valorCompra ?? 0);
        const venta = Number(updated.valorVenta ?? 0);
        updated.porcentajeUtilidad = Number((((venta - compra) / compra) * 100).toFixed(2));
      }

      return updated;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreviewImageUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.nombreProducto?.trim()) newErrors.nombreProducto = 'El nombre es obligatorio.';
    if (!form.valorCompra) newErrors.valorCompra = 'El valor de compra es obligatorio.';
    if (!form.valorVenta) newErrors.valorVenta = 'El valor de venta es obligatorio.';
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => e === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      const formData = new FormData();
      formData.append('idProducto', String(form.id));
      formData.append('nombreProducto', form.nombreProducto || '');
      formData.append('valorCompra', String(form.valorCompra || 0));
      formData.append('valorVenta', String(form.valorVenta || 0));
      formData.append('porcentajeUtilidad', String(form.porcentajeUtilidad || 0));
      formData.append('cantidad', String(cantidadASumar || 0));
      formData.append('publicacion', form.estado || 'PUBLICO');
      formData.append('ivaSi', form.ivaSi || 'NO');
      formData.append('porcentajeIva', String(form.porcentajeIva || 0));
      if (selectedFile) formData.append('imagen', selectedFile);

      await axios.post('update_valor_venta_producto', formData);
      enqueueSnackbar('Producto actualizado correctamente', { variant: 'success' });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error('Error al guardar producto:', error);
      enqueueSnackbar('Error al actualizar producto', { variant: 'error' });
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        {/* 👇 Aquí se mueve el onClick al div interno */}
        <div onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              <KeenIcon icon="warehouse" className="mr-2" />
              {`Configuración del producto ${form.nombreProducto || ''}`}
            </ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>

          <ModalBody className="grid pl-2 pr-2 gap-3 px-0 py-5">
            <div>
              <label className="block mb-1 text-sm font-medium">Nombre del Producto</label>
              <textarea
                className={`textarea p-2 border rounded-md w-full ${
                  errors.nombreProducto ? 'border-red-500' : 'border-gray-300'
                }`}
                value={form.nombreProducto || ''}
                onChange={(e) => handleChange('nombreProducto', e.target.value)}
              />
              {errors.nombreProducto && (
                <p className="mt-1 text-sm text-red-500">{errors.nombreProducto}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Valor de Compra (COP)</label>
              <NumericFormat
                className={`input p-2 border rounded-md w-full ${
                  errors.valorCompra ? 'border-red-500' : 'border-gray-300'
                }`}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={0}
                fixedDecimalScale={false}
                allowNegative={false}
                value={form.valorCompra ?? ''}
                onValueChange={(values) => handleChange('valorCompra', values.floatValue || 0)}
              />
              {errors.valorCompra && (
                <p className="mt-1 text-sm text-red-500">{errors.valorCompra}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Porcentaje de Utilidad (%)</label>
              <NumericFormat
                className="input p-2 border rounded-md w-full border-gray-300"
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale={false}
                allowNegative={false}
                suffix="%"
                value={form.porcentajeUtilidad ?? ''}
                onValueChange={(values) =>
                  handleChange('porcentajeUtilidad', values.floatValue || 0)
                }
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Valor de Venta (COP)</label>
              <NumericFormat
                className={`input p-2 border rounded-md w-full ${
                  errors.valorVenta ? 'border-red-500' : 'border-gray-300'
                }`}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={0}
                fixedDecimalScale={false}
                allowNegative={false}
                value={form.valorVenta ?? ''}
                onValueChange={(values) => handleChange('valorVenta', values.floatValue || 0)}
              />
              {errors.valorVenta && (
                <p className="mt-1 text-sm text-red-500">{errors.valorVenta}</p>
              )}
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">IVA</label>
              <select
                className="input p-2 border rounded-md w-full border-gray-300"
                value={form.ivaSi || 'NO'}
                onChange={(e) => handleChange('ivaSi', e.target.value as 'SI' | 'NO')}
              >
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Porcentaje IVA (%)</label>
              <NumericFormat
                className="input p-2 border rounded-md w-full border-gray-300"
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale={false}
                allowNegative={false}
                suffix="%"
                value={form.porcentajeIva ?? ''}
                onValueChange={(values) => handleChange('porcentajeIva', values.floatValue || 0)}
                disabled={form.ivaSi === 'NO'}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Cantidad Actual</label>
              <input
                type="text"
                className="input p-2 border rounded-md w-full border-gray-300 bg-gray-100"
                value={producto?.totalDistribuido ?? 0}
                readOnly
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Cantidad a Sumar</label>
              <input
                type="text"
                className="input p-2 border rounded-md w-full border-gray-300"
                value={cantidadASumar}
                onChange={(e) => setCantidadASumar(Number(e.target.value) || 0)}
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Estado</label>
              <select
                className="input p-2 border rounded-md w-full border-gray-300"
                value={form.estado}
                onChange={(e) => handleChange('estado', e.target.value)}
              >
                <option value="PUBLICO">PUBLICO</option>
                <option value="PRIVADO">PRIVADO</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Imagen del producto</label>

              <div className="flex items-center gap-3">
                {/* <label
                  htmlFor="fileInput"
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md"
                >
                  {selectedFile ? 'Cambiar imagen' : 'Seleccionar imagen'}
                </label> */}
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
              </div>

              <label className="block mb-1 text-sm font-medium mt-2">Previsualización</label>

              {previewImageUrl && (
                <img
                  src={previewImageUrl}
                  alt="Preview"
                  className="mt-1 max-h-40 rounded-lg border border-gray-200 shadow-sm"
                />
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3 mt-4">
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </ModalBody>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default ModalEditarProducto;
