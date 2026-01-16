import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  data?: any;
  open: boolean;
  onClose?: () => void;
  onSave?: () => void;
}

const ModalCuentasPuc = ({ open, onClose, onSave, data }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
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

  const [nombreSubcuentaPropia, setNombreSubcuentaPropia] = useState('');
  const [codigo, setCodigo] = useState('');
  const [subCuentaPuc, setSubCuentaPuc] = useState('');
  const [clasePuc, setClasePuc] = useState('');

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!open) return;

    const init = async () => {
      if (!data) {
        setNombreSubcuentaPropia('');
        setCodigo('');
        setSubCuentaPuc('');
        setClasePuc('');
        setGruposPuc([]);
        setCuentasPuc([]);
        setSubCuentasPuc([]);
        setSubCuentasPropias([]);
        setErrors({});

        await fetchClasesPuc();
        return;
      }

      setNombreSubcuentaPropia(data.nombreSubcuentaPropia || '');
      setCodigo(data.codigo || '');
      setSubCuentaPuc(data.subcuenta_id?.toString() || '');
      setClasePuc(data.subCuenta?.cuenta?.grupo?.clase?.id?.toString() || '');

      const claseId = data.subCuenta?.cuenta?.grupo?.clase?.id;
      const grupoId = data.subCuenta?.cuenta?.grupo?.id;
      const cuentaId = data.subCuenta?.cuenta?.id;

      if (claseId) {
        await fetchGruposPuc(claseId);
      }
      if (grupoId) {
        await fetchCuentasPuc(grupoId);
      }
      if (cuentaId) {
        await fetchSubCuentasPuc(cuentaId);
      }
      if (data.codigo) {
        await fetchSubCuentasPropias(data.codigo);
      }
    };

    init();
  }, [open, data]);

  const validateField = (field: string, value: string): string => {
    if (!value.trim()) {
      switch (field) {
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
    field: 'nombreSubcuentaPropia' | 'codigo' | 'subCuentaPuc' | 'clasePuc',
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
      nombreSubcuentaPropia,
      codigo,
      subcuenta_id: subCuentaPuc,
      idClaseCuenta: clasePuc
    };

    try {
      if (data?.id) {
        await axios.put(`update_subcuenta_propia/${data.id}`, payload);
        enqueueSnackbar('Actualizado con éxito.', { variant: 'success' });
      } else {
        await axios.post('store_subcuenta_propia', payload);
        enqueueSnackbar('Guardado con éxito.', { variant: 'success' });
      }

      if (onSave) {
        onSave();
      }
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', { variant: 'error' });
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
    fetchClasesPuc();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? 'Editar Cuenta' : 'Nueva Cuenta'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          <div className="p-2">
            {!data && (
              <>
                <div className="mb-2">
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
                  {errors.clasePuc && (
                    <p className="text-red-500 text-sm mt-1">{errors.clasePuc}</p>
                  )}
                </div>

                <div className="mb-2">
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

                <div className="mb-2">
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

                <div className="mb-2">
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
              </>
            )}
            <div className="mb-2">
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
              <label className="block text-sm font-medium mb-2">Código Generado *</label>
              <input
                type="text"
                name="codigo"
                placeholder="Ingrese el Código"
                className="input"
                disabled
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
            <div className="flex justify-end gap-3 mt-4 ">
              <button className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalCuentasPuc };
