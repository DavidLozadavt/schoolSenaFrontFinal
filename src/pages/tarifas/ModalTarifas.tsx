import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { TarifasInterface } from './model/TarifasInterface';
import { ClaseVehiculosInterface } from '../afiliacion-vehiculos/models/ClaseVehiculosInterface';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  tarifa?: TarifasInterface;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTarifas = ({ open, onClose, tarifa, onSave }: ModalProps) => {
  const [claseVehiculos, setClaseVehiculos] = useState<ClaseVehiculosInterface[]>([]);
    const { enqueueSnackbar } = useSnackbar();
  
  const [formData, setFormData] = useState({
    idClaseVehiculo: '',
    tarifa: '',
    porcentaje: ''
  });
  const [errors, setErrors] = useState({
    idClaseVehiculo: '',
    tarifa: ''
  });

  useEffect(() => {
    if (open) {
      setFormData({
        idClaseVehiculo: '',
        tarifa: '',
        porcentaje: ''
      });
      setErrors({
        idClaseVehiculo: '',
        tarifa: ''
      });
      fetchClaseVehiculos();
    }
  }, [open]);

  useEffect(() => {
    if (tarifa) {
      setFormData({
        idClaseVehiculo: tarifa.idClaseVehiculo.toString(),
        tarifa: Math.round(tarifa.tarifa).toString(),
        porcentaje: tarifa.porcentaje?.toString() || ''
      });
    }
  }, [tarifa]);

  const fetchClaseVehiculos = async () => {
    try {
      const response = await axios.get('clase_vehiculos');
      setClaseVehiculos(response.data);
    } catch (error) {
      console.error('Error al cargar clases de vehículos:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    // Si el valor ya contiene puntos, removerlos primero
    const cleanValue = value.replace(/\./g, '').replace(/\D/g, '');
    if (!cleanValue) return '';
    
    const number = parseInt(cleanValue);
    if (isNaN(number)) return '';
    
    return new Intl.NumberFormat('es-CO').format(number);
  };

  const parseCurrency = (value: string) => {
    return value.replace(/\D/g, '');
  };

  const validateForm = () => {
    const newErrors = {
      idClaseVehiculo: '',
      tarifa: ''
    };
    let isValid = true;

    if (!formData.idClaseVehiculo) {
      newErrors.idClaseVehiculo = 'La clase de vehículo es requerida';
      isValid = false;
    }

    if (!formData.tarifa) {
      newErrors.tarifa = 'La tarifa es requerida';
      isValid = false;
    } else if (parseFloat(formData.tarifa) < 0) {
      newErrors.tarifa = 'La tarifa debe ser mayor o igual a 0';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        idClaseVehiculo: parseInt(formData.idClaseVehiculo),
        tarifa: parseFloat(formData.tarifa),
        porcentaje: formData.porcentaje ? parseFloat(formData.porcentaje) : null
      };

      if (tarifa) {
        await axios.put(`clase_vehiculo_tarifas/${tarifa.id}`, payload);
        enqueueSnackbar('Tarifa actualizada con éxito.', {
          variant: 'success'
        });
      } else {
        await axios.post('clase_vehiculo_tarifas', payload);
        enqueueSnackbar('Tarifa guardada con éxito.', {
          variant: 'success'
        });
      }
      
      setFormData({
        idClaseVehiculo: '',
        tarifa: '',
        porcentaje: ''
      });
      
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      console.error('Error al guardar tarifa:', error);
      
      // Capturar errores de validación del servidor
      if (error.response?.data?.errors) {
        const serverErrors = error.response.data.errors;
        setErrors({
          idClaseVehiculo: serverErrors.idClaseVehiculo?.[0] || '',
          tarifa: serverErrors.tarifa?.[0] || ''
        });
      }
      
      // Mostrar mensaje general de error si existe
      if (error.response?.data?.message) {
        enqueueSnackbar(error.response.data.message, {
          variant: 'error'
        });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{tarifa ? 'Editar Tarifa' : 'Nueva Tarifa'}</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="w-[calc(100%-2rem)] mx-auto space-y-4">
            {/* Clase de Vehículo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clase de Vehículo <span className="text-red-500">*</span>
              </label>
              <select
                name="idClaseVehiculo"
                className={`select w-full ${errors.idClaseVehiculo ? 'border-red-500' : ''}`}
                value={formData.idClaseVehiculo}
                onChange={handleChange}
              >
                <option value="">Seleccione una clase</option>
                {claseVehiculos.map((clase) => (
                  <option key={clase.id} value={clase.id}>
                    {clase.nombre}
                  </option>
                ))}
              </select>
              {errors.idClaseVehiculo && (
                <span className="text-red-500 text-sm">{errors.idClaseVehiculo}</span>
              )}
            </div>

            {/* Tarifa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tarifa <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  $
                </span>
                <input
                  name="tarifa"
                  type="text"
                  className={`input w-full pl-8 ${errors.tarifa ? 'border-red-500' : ''}`}
                  placeholder="0"
                  value={formData.tarifa ? formatCurrency(formData.tarifa) : ''}
                  onChange={(e) => {
                    const cleanValue = parseCurrency(e.target.value);
                    handleChange({
                      ...e,
                      target: { ...e.target, name: 'tarifa', value: cleanValue }
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                />
              </div>
              {errors.tarifa && (
                <span className="text-red-500 text-sm">{errors.tarifa}</span>
              )}
            </div>

            {/* Porcentaje (opcional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Porcentaje (Opcional)
              </label>
              <input
                name="porcentaje"
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="input w-full"
                placeholder="Ingrese el porcentaje"
                value={formData.porcentaje}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Guardar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTarifas };