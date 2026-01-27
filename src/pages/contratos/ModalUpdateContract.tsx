import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { ContratoInterface } from './model/ContratoInterface';

interface ModalUpdateContractProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoInterface;
  onSave: () => void;
}

const ModalUpdateContract = ({ open, onClose, contrato, onSave }: ModalUpdateContractProps) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    objetoContrato: '',
    observacion: '',
    perfilProfesional: '',
    idtipoContrato: '',
    fechaContratacion: '',
    fechaFinalContrato: '',
    idActividadRiesgo: '',
    salario: '',
    otrosi: ''
  });

  const [tiposContrato, setTiposContrato] = useState<any[]>([]);
  const [actividadesRiesgo, setActividadesRiesgo] = useState<any[]>([]);

  useEffect(() => {
    if (open && contrato) {
      const fechaInicio = contrato.fechaContratacion 
        ? (typeof contrato.fechaContratacion === 'string' 
          ? contrato.fechaContratacion.split('T')[0] 
          : contrato.fechaContratacion)
        : '';
      
      const fechaFinal = contrato.fechaFinalContrato 
        ? (typeof contrato.fechaFinalContrato === 'string' 
          ? contrato.fechaFinalContrato.split('T')[0] 
          : contrato.fechaFinalContrato)
        : '';

      setFormData({
        objetoContrato: contrato.objetoContrato || '',
        observacion: contrato.observacion || '',
        perfilProfesional: contrato.perfilProfesional || '',
        idtipoContrato: contrato.idtipoContrato?.toString() || '',
        fechaContratacion: fechaInicio,
        fechaFinalContrato: fechaFinal,
        idActividadRiesgo: (contrato as any).actividadRiesgo?.id?.toString() || '',
        salario: contrato.salario?.valor?.toString() || '',
        otrosi: contrato.otrosi || ''
      });
    }
  }, [open, contrato]);

  const fetchTiposContrato = useCallback(async () => {
    try {
      const response = await axios.get('contrato-tipos-contrato');
      setTiposContrato(response.data);
    } catch (err) {
      console.error('Error al cargar tipos de contrato:', err);
    }
  }, []);

  const fetchActividadesRiesgo = useCallback(async () => {
    try {
      const response = await axios.get('actividades_riesgo_profesional');
      setActividadesRiesgo(response.data);
    } catch (err) {
      console.error('Error al cargar actividades de riesgo:', err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        fetchTiposContrato(),
        fetchActividadesRiesgo()
      ]).finally(() => {
        setLoading(false);
        setError('');
      });
    }
  }, [open, fetchTiposContrato, fetchActividadesRiesgo]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!contrato?.id) {
      setError('No se encontró el contrato');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const dataToSend: any = {
        objetoContrato: formData.objetoContrato,
        observacion: formData.observacion,
        perfilProfesional: formData.perfilProfesional,
        fechaContratacion: formData.fechaContratacion,
        idtipoContrato: formData.idtipoContrato ? Number(formData.idtipoContrato) : contrato.idtipoContrato,
        valorTotalContrato: contrato.valorTotalContrato,
        salario_id: contrato.salario?.id,
        periodoPago: contrato.periodoPago
      };

      if (formData.fechaFinalContrato) {
        dataToSend.fechaFinalContrato = formData.fechaFinalContrato;
      }

      if (formData.salario) {
        // El backend espera 'sueldo' para actualizar el valor del salario
        dataToSend.sueldo = Number(formData.salario);
      }

      if (formData.otrosi) {
        dataToSend.otrosi = formData.otrosi;
      }

      if (formData.idActividadRiesgo) {
        dataToSend.idActividadRiesgo = Number(formData.idActividadRiesgo);
      }

      await axios.post(`update_contrato/${contrato.id}`, dataToSend);

      enqueueSnackbar('Datos del contrato actualizados correctamente', { variant: 'success' });
      onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar el contrato';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const isTipoContratoIndefinido = formData.idtipoContrato === '6';

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4 max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Editar Datos del Contrato</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-4 px-0 py-4">
          {error && (
            <div className="px-4">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {loading ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-gray-500">Cargando datos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Contrato</label>
                <select
                  value={formData.idtipoContrato}
                  onChange={(e) => handleInputChange('idtipoContrato', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {tiposContrato.map((tipo) => (
                    <option key={tipo.id} value={String(tipo.id)}>
                      {tipo.nombreTipoContrato || tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Inicio</label>
                <input
                  type="date"
                  value={formData.fechaContratacion}
                  onChange={(e) => handleInputChange('fechaContratacion', e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de Finalización</label>
                <input
                  type="date"
                  value={formData.fechaFinalContrato}
                  onChange={(e) => handleInputChange('fechaFinalContrato', e.target.value)}
                  className="input w-full"
                  disabled={isTipoContratoIndefinido}
                />
                {isTipoContratoIndefinido && (
                  <p className="text-xs text-gray-500 mt-1">No aplica para contratos indefinidos</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Salario</label>
                <input
                  type="number"
                  value={formData.salario}
                  onChange={(e) => handleInputChange('salario', e.target.value)}
                  className="input w-full"
                  placeholder="Ej: 1500000"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Actividad de Riesgo</label>
                <select
                  value={formData.idActividadRiesgo}
                  onChange={(e) => handleInputChange('idActividadRiesgo', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {actividadesRiesgo.map((actividad) => (
                    <option key={actividad.id} value={String(actividad.id)}>
                      {actividad.nombre || actividad.descripcion || `${actividad.codigo} - ${actividad.clase}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Objeto del Contrato</label>
                <textarea
                  value={formData.objetoContrato}
                  onChange={(e) => handleInputChange('objetoContrato', e.target.value)}
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Observaciones</label>
                <textarea
                  value={formData.observacion}
                  onChange={(e) => handleInputChange('observacion', e.target.value)}
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Perfil Profesional</label>
                <textarea
                  value={formData.perfilProfesional}
                  onChange={(e) => handleInputChange('perfilProfesional', e.target.value)}
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Otrosí</label>
                <input
                  type="text"
                  value={formData.otrosi}
                  onChange={(e) => handleInputChange('otrosi', e.target.value)}
                  className="input w-full"
                  placeholder="Ej: N, S"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose} disabled={saving || loading}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving || loading}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalUpdateContract };
