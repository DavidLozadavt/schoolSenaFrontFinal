import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Toast from '../programas-academicos/components/Toast';
import { ContratoInterface } from './model/ContratoInterface';

interface ModalUpdateBankDataProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoInterface;
  onSave: () => void;
}

const tiposCuentaBancaria = ['CUENTA DE AHORROS', 'CUENTA CORRIENTE'];

const ModalUpdateBankData = ({ open, onClose, contrato, onSave }: ModalUpdateBankDataProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [bancos, setBancos] = useState<any[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    idBanco: '',
    tipoCuentaBancaria: '',
    numeroCuentaBancaria: ''
  });

  const fetchBancos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('bancos');
      setBancos(response.data);
    } catch (err) {
      console.error('Error al cargar bancos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open && !showToast) {
      setToastMessage('');
    }
  }, [open, showToast]);

  useEffect(() => {
    if (open) {
      fetchBancos();
      if (contrato) {
        setFormData({
          idBanco: contrato.banco?.id?.toString() || '',
          tipoCuentaBancaria: contrato.tipoCuentaBancaria || '',
          numeroCuentaBancaria: contrato.numeroCuentaBancaria || ''
        });
      }
      setError('');
    }
  }, [open, contrato, fetchBancos]);

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

      await axios.post(`update_contrato/${contrato.id}`, {
        fechaContratacion: contrato.fechaContratacion,
        fechaFinalContrato: contrato.fechaFinalContrato,
        idtipoContrato: contrato.idtipoContrato,
        valorTotalContrato: contrato.valorTotalContrato,
        salario_id: contrato.salario?.id,
        periodoPago: contrato.periodoPago,
        objetoContrato: contrato.objetoContrato,
        observacion: contrato.observacion,
        perfilProfesional: contrato.perfilProfesional,
        idPension: contrato.pension?.id,
        idArl: contrato.arl?.id,
        idSalud: contrato.salud?.id,
        idCajaCompensacion: contrato.cajaCompensacion?.id,
        idCesantias: contrato.cesantias?.id,
        idArea: contrato.area?.id,
        idBanco: formData.idBanco ? Number(formData.idBanco) : null,
        tipoCuentaBancaria: formData.tipoCuentaBancaria,
        numeroCuentaBancaria: formData.numeroCuentaBancaria
      });

      setToastMessage('Datos bancarios actualizados correctamente');
      setShowToast(true);
      onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar los datos bancarios';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Editar Datos Bancarios</ModalTitle>
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

          <div className="space-y-3 px-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Banco</label>
              {loading ? (
                <p className="text-sm text-gray-500">Cargando bancos...</p>
              ) : (
                <select
                  value={formData.idBanco}
                  onChange={(e) => handleInputChange('idBanco', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione un banco</option>
                  {bancos.map((banco) => (
                    <option key={banco.id} value={banco.id}>
                      {banco.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de Cuenta</label>
              <select
                value={formData.tipoCuentaBancaria}
                onChange={(e) => handleInputChange('tipoCuentaBancaria', e.target.value)}
                className="select w-full"
              >
                <option value="">Seleccione el tipo de cuenta</option>
                {tiposCuentaBancaria.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Número de Cuenta</label>
              <input
                type="text"
                value={formData.numeroCuentaBancaria}
                onChange={(e) => handleInputChange('numeroCuentaBancaria', e.target.value)}
                className="input w-full"
                placeholder="Ingrese el número de cuenta"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button className="btn btn-sm btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>

    <Toast
      message={toastMessage}
      isOpen={showToast}
      onClose={() => setShowToast(false)}
    />
    </>
  );
};

export { ModalUpdateBankData };
