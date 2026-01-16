import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { ClaseProductosInterface } from './models/ClaseProductosInterface';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ModalTipoProducto = ({ open, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [claseProductos, setClaseProductos] = useState<ClaseProductosInterface[]>([]);

  const [clasesPuc, setClasesPuc] = useState<any[]>([]);
  const [gruposPuc, setGruposPuc] = useState<any[]>([]);
  const [cuentasPuc, setCuentasPuc] = useState<any[]>([]);
  const [subCuentasPuc, setSubCuentasPuc] = useState<any[]>([]);
  const [subCuentasPropias, setSubCuentasPropias] = useState<any[]>([]);

  const [errors, setErrors] = useState<{
    nombreTipoProducto?: string;
    descripcion?: string;
    claseProductoSelect?: string;
    nombreSubcuentaPropia?: string;
    codigo?: string;
    subCuentaPuc?: string;
    clasePuc?: string;
  }>({});

  const [nombreTipoProducto, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [claseProductoSelect, setClaseProductoSelect] = useState('');
  const [nombreSubcuentaPropia, setNombreSubcuentaPropia] = useState('');
  const [codigo, setCodigo] = useState('');
  const [subCuentaPuc, setSubCuentaPuc] = useState('');
  const [clasePuc, setClasePuc] = useState('');

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      setNombre('');
      setDescripcion('');
      setClaseProductoSelect('');
      setNombreSubcuentaPropia('');
      setCodigo('');
      setSubCuentaPuc('');
      setClasePuc('');
      setGruposPuc([]);
      setCuentasPuc([]);
      setSubCuentasPuc([]);
      setSubCuentasPropias([]);
      setErrors({});
    }
  }, [open]);

  const validateField = (field: string, value: string): string => {
    if (!value.trim()) {
      switch (field) {
        case 'nombreTipoProducto':
          return 'El Nombre es obligatorio';
        case 'descripcion':
          return 'La Descripción es obligatoria';
        case 'claseProductoSelect':
          return 'La Clase de Producto es obligatoria';
        case 'nombreSubcuentaPropia':
          return 'El Nombre de la Subcuenta Propia es obligatorio';
        case 'codigo':
          return 'El Código es obligatorio';
        case 'subCuentaPuc':
          return 'Debe seleccionar una SubCuenta PUC';
        case 'clasePuc':
          return 'Debe seleccionar una Clase PUC';
        default:
          return '';
      }
    }
    return '';
  };

  const handleFieldChange = (
    field:
      | 'nombreTipoProducto'
      | 'descripcion'
      | 'claseProductoSelect'
      | 'nombreSubcuentaPropia'
      | 'codigo'
      | 'subCuentaPuc'
      | 'clasePuc',
    value: string
  ) => {
    setErrors((prev) => {
      const newErrors = { ...prev, [field]: validateField(field, value) };
      if (value.trim()) delete newErrors[field];
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors = {
      nombreTipoProducto: validateField('nombreTipoProducto', nombreTipoProducto),
      descripcion: validateField('descripcion', descripcion),
      claseProductoSelect: validateField('claseProductoSelect', claseProductoSelect),
      nombreSubcuentaPropia: validateField('nombreSubcuentaPropia', nombreSubcuentaPropia),
      codigo: validateField('codigo', codigo),
      subCuentaPuc: validateField('subCuentaPuc', subCuentaPuc),
      clasePuc: validateField('clasePuc', clasePuc)
    };
    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      nombreTipoProducto,
      descripcion,
      idClaseProducto: claseProductoSelect,
      nombreSubcuentaPropia,
      codigo,
      subcuenta_id: subCuentaPuc,
      idClaseCuenta: clasePuc
    };

    try {
      await axios.post('tipo_productos', payload);
      enqueueSnackbar('Guardado con éxito.', { variant: 'success' });
      onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', { variant: 'error' });
    }
  };

  const fetchClaseProductos = async () => {
    setLoading(true);
    try {
      const response = await axios.get('clase_productos');
      setClaseProductos(response.data);
    } catch (error) {
      setError('Error al cargar las clases de producto');
    } finally {
      setLoading(false);
    }
  };

  const fetchClasesPuc = async () => {
    setLoading(true);
    try {
      const response = await axios.get('clases');
      setClasesPuc(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchGruposPuc = async (id: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`grupos_by_id/${id}`);
      setGruposPuc(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCuentasPuc = async (id: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`cuentas_by_id/${id}`);
      setCuentasPuc(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCuentasPuc = async (id: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`subcuentas_by_id/${id}`);
      setSubCuentasPuc(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubCuentasPropias = async (codigo: string) => {
    setLoading(true);
    try {
      const response = await axios.get(`subcuentas_by_code?codigo=${codigo}`);
      setSubCuentasPropias(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaseProductos();
    fetchClasesPuc();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{'Nuevo Tipo de Producto'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div>
            <label htmlFor="nombreTipoProducto" className="block mb-1 text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombreTipoProducto"
              className={`input p-2 border ${errors.nombreTipoProducto ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Nombre"
              value={nombreTipoProducto}
              onChange={(e) => {
                setNombre(e.target.value);
                handleFieldChange('nombreTipoProducto', e.target.value);
              }}
            />
            {errors.nombreTipoProducto && (
              <p className="text-red-500 text-sm mt-1">{errors.nombreTipoProducto}</p>
            )}
          </div>

          <div>
            <label htmlFor="descripcion" className="block mb-1 text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="descripcion"
              className={`textarea p-2 border ${errors.descripcion ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Descripción"
              rows={2}
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                handleFieldChange('descripcion', e.target.value);
              }}
            />
            {errors.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Clase de Producto *</label>
            <div className="flex items-center">
              <select
                name="claseProducto"
                className={`select ${errors.claseProductoSelect ? 'border-red-500' : ''}`}
                value={claseProductoSelect}
                onChange={(e) => {
                  setClaseProductoSelect(e.target.value);
                  handleFieldChange('claseProductoSelect', e.target.value);
                }}
              >
                <option value="">Seleccione una opción</option>
                {claseProductos.map((clase) => (
                  <option key={clase.id} value={clase.id}>
                    {clase.nombreClaseProducto}
                  </option>
                ))}
              </select>
            </div>
            {errors.claseProductoSelect && (
              <p className="text-red-500 text-sm mt-1">{errors.claseProductoSelect}</p>
            )}
          </div>

          <div className="flex items-center mt-2 ">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500">Plan Único de Cuentas</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Puc Clases *</label>
            <div className="flex items-center">
              <select
                name="clasePuc"
                className="select"
                value={clasePuc}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setClasePuc(selectedId);
                  handleFieldChange('clasePuc', selectedId);
                  fetchGruposPuc(Number(selectedId));
                }}
              >
                <option value="">Seleccione una opción</option>
                {clasesPuc.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombreClase} - {item.codigo}
                  </option>
                ))}
              </select>
            </div>
            {errors.clasePuc && <p className="text-red-500 text-sm mt-1">{errors.clasePuc}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Puc Grupos</label>
            <div className="flex items-center">
              <select
                name="grupoPuc"
                className="select"
                onChange={(e) => fetchCuentasPuc(Number(e.target.value))}
              >
                <option value="">Seleccione una opción</option>
                {gruposPuc.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombreGrupo} - {item.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Puc Cuentas</label>
            <div className="flex items-center">
              <select
                name="cuentaPuc"
                className="select"
                onChange={(e) => fetchSubCuentasPuc(Number(e.target.value))}
              >
                <option value="">Seleccione una opción</option>
                {cuentasPuc.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.titulo} - {item.codigo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Puc SubCuentas *</label>
            <div className="flex items-center">
              <select
                name="subCuentaPuc"
                className="select"
                value={subCuentaPuc}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  setSubCuentaPuc(selectedId);
                  handleFieldChange('subCuentaPuc', selectedId);

                  const selectedSubCuenta = subCuentasPuc.find(
                    (item) => item.id.toString() === selectedId
                  );
                  if (selectedSubCuenta) {
                    setCodigo(selectedSubCuenta.codigo);
                    fetchSubCuentasPropias(selectedSubCuenta.codigo);
                  }
                }}
              >
                <option value="">Seleccione una opción</option>
                {subCuentasPuc.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombreSubcuenta} - {item.codigo}
                  </option>
                ))}
              </select>
            </div>
            {errors.subCuentaPuc && (
              <p className="text-red-500 text-sm mt-1">{errors.subCuentaPuc}</p>
            )}
          </div>

          <hr className="mt-4 mb-4" />

          <div>
            <label className="block text-sm font-medium mb-2">Nombre Subcuenta Propia *</label>
            <input
              type="text"
              name="nombreSubcuentaPropia"
              placeholder="Ingrese el Nombre de la Subcuenta Propia"
              className="input"
              value={nombreSubcuentaPropia}
              onChange={(e) => {
                setNombreSubcuentaPropia(e.target.value);
                handleFieldChange('nombreSubcuentaPropia', e.target.value);
              }}
            />
            {errors.nombreSubcuentaPropia && (
              <p className="text-red-500 text-sm mt-1">{errors.nombreSubcuentaPropia}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Código *</label>
            <input
              type="text"
              name="codigo"
              placeholder="Ingrese el Código"
              className="input"
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value);
                handleFieldChange('codigo', e.target.value);
              }}
            />
            {errors.codigo && <p className="text-red-500 text-sm mt-1">{errors.codigo}</p>}
          </div>

          {subCuentasPropias.length > 0 && (
            <div className="card min-w-full mt-10">
              <div className="h-10 flex items-center justify-center">
                <p className="text-sm font-semibold">Subcuentas similares existentes</p>
              </div>

              <div className="card-table">
                <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border">Id</th>
                      <th className="p-2 border">Nombre SubCuenta</th>
                      <th className="p-2 border">Código</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subCuentasPropias.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-100">
                        <td className="p-2 border">{item.id}</td>
                        <td className="p-2 border">{item.nombreSubcuentaPropia}</td>
                        <td className="p-2 border">{item.codigo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTipoProducto };
