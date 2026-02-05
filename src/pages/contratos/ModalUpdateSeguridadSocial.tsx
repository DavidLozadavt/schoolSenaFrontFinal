import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Toast from '../programas-academicos/components/Toast';
import { ContratoInterface } from './model/ContratoInterface';

interface ModalUpdateSeguridadSocialProps {
  open: boolean;
  onClose: () => void;
  contrato: ContratoInterface;
  onSave: () => void;
}

const ModalUpdateSeguridadSocial = ({ open, onClose, contrato, onSave }: ModalUpdateSeguridadSocialProps) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    idPension: '',
    idSalud: '',
    idArl: '',
    idCajaCompensacion: '',
    idCesantias: ''
  });

  const [pensiones, setPensiones] = useState<any[]>([]);
  const [eps, setEps] = useState<any[]>([]);
  const [arl, setArl] = useState<any[]>([]);
  const [cajaCompensacion, setCajaCompensacion] = useState<any[]>([]);
  const [cesantias, setCesantias] = useState<any[]>([]);

  useEffect(() => {
    if (open && contrato) {
      setFormData({
        idPension: contrato.pension?.id?.toString() || '',
        idSalud: contrato.salud?.id?.toString() || '',
        idArl: contrato.arl?.id?.toString() || '',
        idCajaCompensacion: contrato.cajaCompensacion?.id?.toString() || '',
        idCesantias: contrato.cesantias?.id?.toString() || ''
      });
    }
  }, [open, contrato]);

  const fetchPensiones = useCallback(async () => {
    try {
      const response = await axios.get('entidades/pensiones');
      setPensiones(response.data);
    } catch (err) {
      console.error('Error al cargar pensiones:', err);
    }
  }, []);

  const fetchEps = useCallback(async () => {
    try {
      const response = await axios.get('entidades/eps');
      setEps(response.data);
    } catch (err) {
      console.error('Error al cargar EPS:', err);
    }
  }, []);

  const fetchArl = useCallback(async () => {
    try {
      const response = await axios.get('entidades/arl');
      setArl(response.data);
    } catch (err) {
      console.error('Error al cargar ARL:', err);
    }
  }, []);

  const fetchCajaCompensacion = useCallback(async () => {
    try {
      const response = await axios.get('entidades/caja_compensacion');
      setCajaCompensacion(response.data);
    } catch (err) {
      console.error('Error al cargar caja de compensación:', err);
    }
  }, []);

  const fetchCesantias = useCallback(async () => {
    try {
      const response = await axios.get('entidades/cesantias');
      setCesantias(response.data);
    } catch (err) {
      console.error('Error al cargar cesantías:', err);
    }
  }, []);

  useEffect(() => {
    if (!open && !showToast) {
      setToastMessage('');
    }
  }, [open, showToast]);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        fetchPensiones(),
        fetchEps(),
        fetchArl(),
        fetchCajaCompensacion(),
        fetchCesantias()
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [open, fetchPensiones, fetchEps, fetchArl, fetchCajaCompensacion, fetchCesantias]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!contrato?.id) return;

    setSaving(true);
    setError('');

    try {
      const dataToSend: any = {};

      if (formData.idPension) {
        dataToSend.idPension = Number(formData.idPension);
      }

      if (formData.idSalud) {
        dataToSend.idSalud = Number(formData.idSalud);
      }

      if (formData.idArl) {
        dataToSend.idArl = Number(formData.idArl);
      }

      if (formData.idCajaCompensacion) {
        dataToSend.idCajaCompensacion = Number(formData.idCajaCompensacion);
      }

      if (formData.idCesantias) {
        dataToSend.idCesantias = Number(formData.idCesantias);
      }

      await axios.post(`update_contrato/${contrato.id}`, dataToSend);

      setToastMessage('Datos de Seguridad Social actualizados correctamente');
      setShowToast(true);
      onSave();
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error al actualizar los datos';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4 max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Editar Seguridad Social</ModalTitle>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">EPS</label>
                <select
                  value={formData.idSalud}
                  onChange={(e) => handleInputChange('idSalud', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {eps.map((epsItem) => (
                    <option key={epsItem.id} value={String(epsItem.id)}>
                      {epsItem.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">AFP (Fondo de Pensiones)</label>
                <select
                  value={formData.idPension}
                  onChange={(e) => handleInputChange('idPension', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {pensiones.map((pension) => (
                    <option key={pension.id} value={String(pension.id)}>
                      {pension.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ARL (Riesgos Laborales)</label>
                <select
                  value={formData.idArl}
                  onChange={(e) => handleInputChange('idArl', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {arl.map((arlItem) => (
                    <option key={arlItem.id} value={String(arlItem.id)}>
                      {arlItem.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Caja de Compensación</label>
                <select
                  value={formData.idCajaCompensacion}
                  onChange={(e) => handleInputChange('idCajaCompensacion', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {cajaCompensacion.map((caja) => (
                    <option key={caja.id} value={String(caja.id)}>
                      {caja.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Cesantías</label>
                <select
                  value={formData.idCesantias}
                  onChange={(e) => handleInputChange('idCesantias', e.target.value)}
                  className="select w-full"
                >
                  <option value="">Seleccione</option>
                  {cesantias.map((cesantia) => (
                    <option key={cesantia.id} value={String(cesantia.id)}>
                      {cesantia.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 px-4">
            <button
              className="btn btn-sm btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
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

export { ModalUpdateSeguridadSocial };
