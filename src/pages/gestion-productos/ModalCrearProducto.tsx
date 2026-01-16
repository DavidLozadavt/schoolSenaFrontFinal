import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import axios from 'axios';
import { NumericFormat } from 'react-number-format';

import { ModalTipoProducto } from '@/pages/registrar-compra/ModalTipoProducto';
import { ModalClaseProducto } from '@/pages/registrar-compra/ModalClaseProducto';
import { ModalMarca } from './modales/ModalMarca';
import { ModalCategoria } from './modales/ModalCategoria';
import { ModalMedida } from './modales/ModalMedida';

interface ProductoForm {
  caracteristicas: string;
  idTipoProducto: string;
  idClaseProducto: string;
  idCategoria: string;
  idMarca: string;
  idMedida: string;
  modelo: string;
  serial: string;
  cantidad: number;
  valor: string;
  impuesto: string;
  imagen: File | null;
  imagenPreview?: string | null;
}

interface ProductoInterface {
  id: number;
  rutaProductoUrl?: string;
  caracteristicas?: string;
  tipoProducto?: { nombreTipoProducto: string };
  claseProducto?: { nombreClaseProducto: string };
  medida?: { valor: number; unidadMedida: string };
  nombreProducto?: string;
  valorCompra?: number;
  valorVenta?: number;
  porcentajeUtilidad?: number;
  imagen?: string | null;
}

interface ModalCrearProductoProps {
  open: boolean;
  onClose: () => void;
  onProductoCreado?: (nuevoProducto: ProductoInterface) => void;
}

const ModalCrearProducto: React.FC<ModalCrearProductoProps> = ({
  open,
  onClose,
  onProductoCreado
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);

  const [producto, setProducto] = useState<ProductoForm>({
    caracteristicas: '',
    idTipoProducto: '',
    idClaseProducto: '',
    idCategoria: '',
    idMarca: '',
    idMedida: '',
    modelo: '',
    serial: '',
    cantidad: 1,
    valor: '',
    impuesto: '',
    imagen: null,
    imagenPreview: null
  });

  const [tipoProductos, setTipoProductos] = useState<any[]>([]);
  const [claseProductos, setClaseProductos] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [medidas, setMedidas] = useState<any[]>([]);

  const [modalOpenMarca, setModalOpenMarca] = useState(false);
  const [modalOpenTipoProducto, setModalOpenTipoProducto] = useState(false);
  const [modalOpenClaseProducto, setModalOpenClaseProducto] = useState(false);
  const [modalOpenCategoria, setModalOpenCategoria] = useState(false);
  const [modalOpenMedida, setModalOpenMedida] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTipoProductos();
      fetchClaseProductos();
      fetchCategories();
      fetchBrands();
      fetchMedidas();
    }
  }, [open]);

  const fetchTipoProductos = async () => {
    try {
      const { data } = await axios.get('/tipo_productos');
      setTipoProductos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClaseProductos = async () => {
    try {
      const { data } = await axios.get('/clase_productos'); // ← NUEVO ENDPOINT
      setClaseProductos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/categorias');
      setCategories(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await axios.get('/marcas');
      setBrands(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMedidas = async () => {
    try {
      const { data } = await axios.get('/medidas');
      setMedidas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const { name, value } = target;
    type ProductoKeys = keyof ProductoForm;
    const key = name as ProductoKeys;

    setProducto((prev) => {
      const newProducto = { ...prev };

      if (
        target instanceof HTMLInputElement &&
        target.files &&
        target.files.length > 0 &&
        key === 'imagen'
      ) {
        newProducto.imagen = target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          newProducto.imagenPreview = reader.result as string;
          setProducto({ ...newProducto });
        };
        reader.readAsDataURL(target.files[0]);
      } else if (key === 'cantidad') {
        newProducto.cantidad = Number(value);
      } else {
        newProducto[key] = value as any;
      }

      return newProducto;
    });
  };

  const handleSubmit = async () => {
    const p = producto;

    const idTipoProducto = Number(p.idTipoProducto);
    const idClaseProducto = Number(p.idClaseProducto);
    const idCategoria = Number(p.idCategoria);
    const idMarca = Number(p.idMarca);
    const idMedida = Number(p.idMedida);

    if (
      !idTipoProducto ||
      !idClaseProducto ||
      !idCategoria ||
      !idMarca ||
      !idMedida ||
      !p.modelo ||
      !p.valor
    ) {
      enqueueSnackbar('Complete todos los campos obligatorios', { variant: 'warning' });
      return;
    }

    try {
      setLoading(true);

      const form = new FormData();
      form.append('caracteristicas', p.caracteristicas);
      form.append('idTipoProducto', String(idTipoProducto));
      form.append('idClaseProducto', String(idClaseProducto));
      form.append('idCategoria', String(idCategoria));
      form.append('idMarca', String(idMarca));
      form.append('idMedida', String(idMedida));
      form.append('modelo', p.modelo);
      form.append('serial', p.serial || '');
      form.append('cantidad', String(p.cantidad));
      form.append('valor', (p.valor || '').replace(/[^0-9.]/g, ''));
      form.append('impuesto', (p.impuesto || '').replace(/[^0-9.]/g, ''));
      if (p.imagen) form.append('imagen', p.imagen);

      const response = await axios.post('/store_producto_individual', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onProductoCreado?.({
        id: response.data.id,
        rutaProductoUrl: response.data.rutaProductoUrl,
        caracteristicas: p.caracteristicas,

        tipoProducto: {
          nombreTipoProducto:
            tipoProductos.find((t) => t.id === idTipoProducto)?.nombreTipoProducto || ''
        },

        claseProducto: {
          nombreClaseProducto:
            claseProductos.find((c) => c.id === idClaseProducto)?.nombreClaseProducto ||
            claseProductos.find((c) => c.id === idClaseProducto)?.nombre ||
            ''
        },

        medida: {
          valor: medidas.find((m) => m.id === idMedida)?.valor || 0,
          unidadMedida:
            medidas.find((m) => m.id === idMedida)?.unidadMedida ||
            medidas.find((m) => m.id === idMedida)?.nombreMedida ||
            ''
        },

        nombreProducto: p.modelo,
        valorCompra: Number(p.valor),
        valorVenta: Number(p.valor),
        porcentajeUtilidad: 0,

        imagen: p.imagenPreview ?? null
      });

      enqueueSnackbar('Producto creado exitosamente', { variant: 'success' });

      setProducto({
        caracteristicas: '',
        idTipoProducto: '',
        idClaseProducto: '',
        idCategoria: '',
        idMarca: '',
        idMedida: '',
        modelo: '',
        serial: '',
        cantidad: 1,
        valor: '',
        impuesto: '',
        imagen: null,
        imagenPreview: null
      });

      onClose();
    } catch (error: any) {
      console.error(error.response || error);
      const message = error.response?.data?.message || 'Error al crear el producto';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[700px] top-[10%] p-4">
        <div onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              <KeenIcon icon="warehouse" className="mr-2" />
              Crear producto
            </ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>

          <ModalBody className="grid gap-3 px-0 py-5">
            {/* --- Características --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Características</label>
              <input
                type="text"
                name="caracteristicas"
                value={producto.caracteristicas}
                onChange={handleChange}
                className="input p-2 border rounded-md w-full border-gray-300"
              />
            </div>

            {/* --- Tipo de producto --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Tipo de producto *</label>
              <div className="flex items-center gap-2">
                <select
                  name="idTipoProducto"
                  value={producto.idTipoProducto}
                  onChange={handleChange}
                  className="input p-2 border rounded-md w-full border-gray-300"
                >
                  <option value="">Seleccione</option>
                  {tipoProductos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombreTipoProducto}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalOpenTipoProducto(true)}
                  className="px-3 py-2 bg-gray-100 border rounded-md flex items-center gap-1 hover:bg-gray-200"
                >
                  <KeenIcon icon="plus" className="w-4 h-4" /> Crear
                </button>
              </div>
            </div>

            {/* --- Clase de producto --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Clase de producto *</label>
              <div className="flex items-center gap-2">
                <select
                  name="idClaseProducto"
                  value={producto.idClaseProducto}
                  onChange={handleChange}
                  className="input p-2 border rounded-md w-full border-gray-300"
                >
                  <option value="">Seleccione</option>
                  {claseProductos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombreClaseProducto || c.nombre}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalOpenClaseProducto(true)}
                  className="px-3 py-2 bg-gray-100 border rounded-md flex items-center gap-1 hover:bg-gray-200"
                >
                  <KeenIcon icon="plus" className="w-4 h-4" /> Crear
                </button>
              </div>
            </div>

            {/* --- Categoría --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Categoría *</label>
              <div className="flex items-center gap-2">
                <select
                  name="idCategoria"
                  value={producto.idCategoria}
                  onChange={handleChange}
                  className="input p-2 border rounded-md w-full border-gray-300"
                >
                  <option value="">Seleccione</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalOpenCategoria(true)}
                  className="px-3 py-2 bg-gray-100 border rounded-md flex items-center gap-1 hover:bg-gray-200"
                >
                  <KeenIcon icon="plus" className="w-4 h-4" /> Crear
                </button>
              </div>
            </div>

            {/* --- Marca --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Marca *</label>
              <div className="flex items-center gap-2">
                <select
                  name="idMarca"
                  value={producto.idMarca}
                  onChange={handleChange}
                  className="input p-2 border rounded-md w-full border-gray-300"
                >
                  <option value="">Seleccione</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.marca ?? b.nombre ?? b.nombreMarca ?? b.descripcion ?? ''}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalOpenMarca(true)}
                  className="px-3 py-2 bg-gray-100 border rounded-md flex items-center gap-1 hover:bg-gray-200"
                >
                  <KeenIcon icon="plus" className="w-4 h-4" /> Crear
                </button>
              </div>
            </div>

            {/* --- Medida --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Medida *</label>
              <div className="flex items-center gap-2">
                <select
                  name="idMedida"
                  value={producto.idMedida}
                  onChange={handleChange}
                  className="input p-2 border rounded-md w-full border-gray-300"
                >
                  <option value="">Seleccione</option>
                  {medidas?.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombreMedida || m.unidadMedida}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setModalOpenMedida(true)}
                  className="px-3 py-2 bg-gray-100 border rounded-md flex items-center gap-1 hover:bg-gray-200"
                >
                  <KeenIcon icon="plus" className="w-4 h-4" /> Crear
                </button>
              </div>
            </div>

            {/* --- Modelo --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Modelo *</label>
              <input
                type="text"
                name="modelo"
                value={producto.modelo}
                onChange={handleChange}
                className="input p-2 border rounded-md w-full border-gray-300"
              />
            </div>

            {/* --- Serial --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Serial</label>
              <input
                type="text"
                name="serial"
                value={producto.serial}
                onChange={handleChange}
                className="input p-2 border rounded-md w-full border-gray-300"
              />
            </div>

            {/* --- Cantidad --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Cantidad *</label>
              <input
                type="number"
                name="cantidad"
                min={1}
                value={producto.cantidad}
                onChange={handleChange}
                className="input p-2 border rounded-md w-full border-gray-300"
              />
            </div>

            {/* --- Valor --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Valor *</label>
              <NumericFormat
                className="input p-2 border rounded-md w-full border-gray-300"
                name="valor"
                value={producto.valor}
                thousandSeparator=","
                decimalScale={2}
                prefix="$"
                onValueChange={(values) => setProducto({ ...producto, valor: values.value })}
              />
            </div>

            {/* --- Impuesto (%) --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Impuesto (%)</label>
              <NumericFormat
                className="input p-2 border rounded-md w-full border-gray-300"
                name="impuesto"
                value={producto.impuesto}
                suffix="%"
                decimalScale={2}
                onValueChange={(values) => setProducto({ ...producto, impuesto: values.value })}
              />
            </div>

            {/* --- Imagen --- */}
            <div>
              <label className="block mb-1 text-sm font-medium">Imagen</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => document.getElementById('input-imagen')?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border rounded-md text-slate-50 flex items-center gap-2"
                >
                  Seleccionar imagen
                </button>

                {producto.imagenPreview && (
                  <img
                    src={producto.imagenPreview}
                    alt="Previsualización"
                    className="h-20 w-20 object-cover rounded-md border border-gray-300"
                  />
                )}
              </div>

              <input
                id="input-imagen"
                type="file"
                name="imagen"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />
            </div>

            {/* --- Botones --- */}
            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </ModalBody>

          {/* MODALES HIJOS */}
          <ModalTipoProducto
            open={modalOpenTipoProducto}
            onClose={() => setModalOpenTipoProducto(false)}
            onSave={() => {
              fetchTipoProductos();
              setModalOpenTipoProducto(false);
            }}
          />

          <ModalClaseProducto
            open={modalOpenClaseProducto}
            onClose={() => setModalOpenClaseProducto(false)}
            onSave={() => {
              fetchClaseProductos();
              setModalOpenClaseProducto(false);
            }}
          />

          <ModalMarca
            open={modalOpenMarca}
            onClose={() => setModalOpenMarca(false)}
            onSave={() => {
              fetchBrands();
              setModalOpenMarca(false);
            }}
          />

          <ModalCategoria
            open={modalOpenCategoria}
            onClose={() => setModalOpenCategoria(false)}
            onSave={() => {
              fetchCategories();
              setModalOpenCategoria(false);
            }}
          />

          <ModalMedida
            open={modalOpenMedida}
            onClose={() => setModalOpenMedida(false)}
            onSave={() => {
              fetchMedidas();
              setModalOpenMedida(false);
            }}
          />
        </div>
      </ModalContent>
    </Modal>
  );
};

export default ModalCrearProducto;
