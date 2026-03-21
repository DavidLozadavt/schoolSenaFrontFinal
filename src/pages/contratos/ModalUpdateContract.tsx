import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Toast from '../programas-academicos/components/Toast';
import { ContratoInterface, resolveFormaPago } from './model/ContratoInterface';

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    objetoContrato: '',
    observacion: '',
    perfilProfesional: '',
    idtipoContrato: '',
    fechaContratacion: '',
    fechaFinalContrato: '',
    idActividadRiesgo: '',
    salario: '',
    otrosi: '',
    horasmes: '',
    periodoPago: '',
    formaPago: '',
    supervisorContrato: '',
    cargoSupervisor: '',
    valorTotalContrato: ''
  });

  const [tiposContrato, setTiposContrato] = useState<any[]>([]);
  const [actividadesRiesgo, setActividadesRiesgo] = useState<any[]>([]);
  /** Valores del enum backend (TypePaymentMethodContract); respaldo si falla el GET */
  const [formasPagoContrato, setFormasPagoContrato] = useState<string[]>([
    'NORMAL',
    'COMISIONES',
    'SALARIO INTEGRAL'
  ]);

  useEffect(() => {
    if (!open && !showToast) {
      setToastMessage('');
    }
  }, [open, showToast]);

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
        otrosi: contrato.otrosi || '',
        horasmes: contrato.horasmes?.toString() || '',
        periodoPago:
          contrato.periodoPago !== undefined && contrato.periodoPago !== null
            ? String(contrato.periodoPago)
            : '',
        formaPago: resolveFormaPago(contrato),
        supervisorContrato: (contrato as any).supervisorContrato || '',
        cargoSupervisor: (contrato as any).cargoSupervisor || '',
        valorTotalContrato: contrato.valorTotalContrato?.toString() || ''
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

  const fetchFormasPagoContrato = useCallback(async () => {
    try {
      const response = await axios.get('contrato-formas-pago');
      const data = response.data;
      const arr: unknown[] = Array.isArray(data)
        ? data
        : data && typeof data === 'object'
          ? Object.values(data as Record<string, unknown>)
          : [];
      if (arr.length > 0) {
        setFormasPagoContrato(arr.map((x) => String(x)));
      }
    } catch (err) {
      console.error('Error al cargar formas de pago:', err);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        fetchTiposContrato(),
        fetchActividadesRiesgo(),
        fetchFormasPagoContrato()
      ]).finally(() => {
        setLoading(false);
        setError('');
      });
    }
  }, [open, fetchTiposContrato, fetchActividadesRiesgo, fetchFormasPagoContrato]);

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
        idtipoContrato: formData.idtipoContrato ? Number(formData.idtipoContrato) : contrato.idtipoContrato
      };

      const sid = contrato.salario?.id;
      if (sid !== undefined && sid !== null && sid !== '') {
        dataToSend.salario_id = sid;
      }

      if (formData.periodoPago !== '' && formData.periodoPago != null) {
        dataToSend.periodoPago = Number(formData.periodoPago);
      }

      if (formData.formaPago !== '' && formData.formaPago != null) {
        dataToSend.formaPago = formData.formaPago;
      }
      if (formData.supervisorContrato) dataToSend.supervisorContrato = formData.supervisorContrato;
      if (formData.cargoSupervisor) dataToSend.cargoSupervisor = formData.cargoSupervisor;

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

      if (formData.horasmes) {
        dataToSend.horasmes = Number(formData.horasmes);
      }

      if (formData.valorTotalContrato) {
        dataToSend.valorTotalContrato = formData.valorTotalContrato;
      }

      await axios.post(`update_contrato/${contrato.id}`, dataToSend);

      setToastMessage('Datos del contrato actualizados correctamente');
      setShowToast(true);
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

  const opcionesFormaPago = useMemo(() => {
    const cur = formData.formaPago?.trim();
    if (cur && !formasPagoContrato.includes(cur)) {
      return [cur, ...formasPagoContrato];
    }
    return formasPagoContrato;
  }, [formData.formaPago, formasPagoContrato]);

  return (
    <>
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[min(100vw-1rem,920px)] top-[3%] p-4 sm:p-6 max-h-[90vh] overflow-y-auto no-scrollbar">
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Horas al mes</label>
                <input
                  type="number"
                  value={formData.horasmes}
                  onChange={(e) => handleInputChange('horasmes', e.target.value)}
                  className="input w-full"
                  placeholder="Ej: 240"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Período de Pago</label>
                <select
                  value={formData.periodoPago}
                  onChange={(e) => handleInputChange('periodoPago', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  <option value="10">SEMANAL</option>
                  <option value="15">QUINCENAL</option>
                  <option value="30">MENSUAL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Forma de pago</label>
                <select
                  value={formData.formaPago}
                  onChange={(e) => handleInputChange('formaPago', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {opcionesFormaPago.map((forma) => (
                    <option key={forma} value={forma}>
                      {forma}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Supervisor del Contrato</label>
                <input
                  type="text"
                  value={formData.supervisorContrato}
                  onChange={(e) => handleInputChange('supervisorContrato', e.target.value)}
                  className="input w-full"
                  placeholder="Nombre supervisor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cargo Supervisor</label>
                <input
                  type="text"
                  value={formData.cargoSupervisor}
                  onChange={(e) => handleInputChange('cargoSupervisor', e.target.value)}
                  className="input w-full"
                  placeholder="Cargo del supervisor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Valor Total del Contrato</label>
                <input
                  type="number"
                  value={formData.valorTotalContrato}
                  onChange={(e) => handleInputChange('valorTotalContrato', e.target.value)}
                  className="input w-full"
                  placeholder="Ej: 5000000"
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

              <div className="md:col-span-2 mt-1 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 min-h-0">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Objeto del Contrato
                    </label>
                    <textarea
                      value={formData.objetoContrato}
                      onChange={(e) => handleInputChange('objetoContrato', e.target.value)}
                      className="input w-full min-h-[72px] max-h-[140px] py-1.5 px-2.5 text-xs leading-snug resize-y rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 focus:ring-2 focus:ring-primary/30"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-h-0">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Observaciones
                    </label>
                    <textarea
                      value={formData.observacion}
                      onChange={(e) => handleInputChange('observacion', e.target.value)}
                      className="input w-full min-h-[72px] max-h-[140px] py-1.5 px-2.5 text-xs leading-snug resize-y rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 focus:ring-2 focus:ring-primary/30"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-h-0">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Perfil Profesional
                    </label>
                    <textarea
                      value={formData.perfilProfesional}
                      onChange={(e) => handleInputChange('perfilProfesional', e.target.value)}
                      className="input w-full min-h-[72px] max-h-[140px] py-1.5 px-2.5 text-xs leading-snug resize-y rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 focus:ring-2 focus:ring-primary/30"
                      rows={3}
                    />
                  </div>

                  <div className="flex flex-col gap-1 min-h-0">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Otrosí</label>
                    <textarea
                      value={formData.otrosi}
                      onChange={(e) => handleInputChange('otrosi', e.target.value)}
                      className="input w-full min-h-[56px] max-h-[120px] py-1.5 px-2.5 text-xs leading-snug resize-y rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-500 focus:ring-2 focus:ring-primary/30"
                      rows={2}
                    />
                  </div>
                </div>
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

    <Toast
      message={toastMessage}
      isOpen={showToast}
      onClose={() => setShowToast(false)}
    />
    </>
  );
};

export { ModalUpdateContract };
