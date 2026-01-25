import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalUpdateCompanyProps {
  open: boolean;
  onClose: () => void;
  empresa: any;
  contratoId?: string | number;
  area?: any;
  areas?: any[];
  onSave: () => void;
}

const ModalUpdateCompany = ({ open, onClose, empresa, contratoId, area, areas = [], onSave }: ModalUpdateCompanyProps) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loadingAreas, setLoadingAreas] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  const [formData, setFormData] = useState({
    razonSocial: '',
    nit: '',
    digitoVerificacion: '',
    idArea: ''
  });

  const [areasList, setAreas] = useState<any[]>(areas);

  useEffect(() => {
    if (open) {
      if (empresa) {
        setFormData({
          razonSocial: empresa.razonSocial || '',
          nit: empresa.nit || '',
          digitoVerificacion: empresa.digitoVerificacion || '',
          idArea: area?.id ? String(area.id) : ''
        });
        setLogoFile(null);
        setLogoPreview(empresa.rutaLogoUrl || null);
      }
      
      // Cargar áreas si no se proporcionaron
      if (areas.length === 0) {
        fetchAreas();
      } else {
        // Si ya hay áreas proporcionadas, usarlas
        setAreas(areas);
      }
    }
  }, [open, empresa, area]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      const response = await axios.get('areas');
      setAreas(response.data || []);
    } catch (error) {
      console.error('Error al cargar áreas:', error);
      enqueueSnackbar('Error al cargar las áreas.', { variant: 'error' });
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!formData.razonSocial || !formData.nit) {
      enqueueSnackbar('La razón social y el NIT son obligatorios.', { variant: 'error' });
      return;
    }

    // Validar que el dígito de verificación sea un número entre 1 y 9
    if (formData.digitoVerificacion && (isNaN(Number(formData.digitoVerificacion)) || Number(formData.digitoVerificacion) < 1 || Number(formData.digitoVerificacion) > 9)) {
      enqueueSnackbar('El dígito de verificación debe ser un número entre 1 y 9.', { variant: 'error' });
      return;
    }

    setSaving(true);
    try {
      const data = new FormData();
      data.append('razonSocial', formData.razonSocial);
      data.append('nit', formData.nit);
      if (formData.digitoVerificacion) {
        data.append('digitoVerificacion', String(Number(formData.digitoVerificacion)));
      }
      if (logoFile) {
        data.append('rutaLogoFile', logoFile);
      }

      await axios.post('company_update', data);
      
      // Si hay cambio de área y hay contratoId, actualizar el contrato
      const areaActual = area?.id ? String(area.id) : '';
      if (formData.idArea && contratoId && formData.idArea !== areaActual) {
        try {
          await axios.post(`update_contrato/${contratoId}`, {
            idArea: Number(formData.idArea)
          });
        } catch (error) {
          console.error('Error al actualizar el área del contrato:', error);
          enqueueSnackbar('Error al actualizar el área del contrato.', { variant: 'error' });
          setSaving(false);
          return;
        }
      }
      
      enqueueSnackbar('Empresa actualizada con éxito.', { variant: 'success' });
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Error al actualizar la empresa:', error);
      const errorMessage = error.response?.data?.error || 'Error al actualizar la empresa.';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4 max-h-[85vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Editar Empresa</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={onClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-4 px-0 py-4">
          <div className="px-4">
            <label htmlFor="razonSocial" className="block text-sm font-medium mb-2">
              Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="razonSocial"
              value={formData.razonSocial}
              onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
              className="form-control w-full"
              placeholder="Ej: Servicio Nacional de Aprendizaje"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 px-4">
            <div>
              <label htmlFor="nit" className="block text-sm font-medium mb-2">
                NIT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nit"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                className="form-control w-full"
                placeholder="Ej: 891500194"
              />
            </div>
            <div>
              <label htmlFor="digitoVerificacion" className="block text-sm font-medium mb-2">
                Dígito de Verificación
              </label>
              <input
                type="number"
                id="digitoVerificacion"
                value={formData.digitoVerificacion}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (Number(value) >= 1 && Number(value) <= 9)) {
                    setFormData({ ...formData, digitoVerificacion: value });
                  }
                }}
                className="form-control w-full"
                placeholder="Ej: 9"
                min="1"
                max="9"
              />
            </div>
          </div>

          <div className="px-4">
            <label htmlFor="idArea" className="block text-sm font-medium mb-2">
              Área
            </label>
            <select
              id="idArea"
              value={formData.idArea}
              onChange={(e) => setFormData({ ...formData, idArea: e.target.value })}
              className="form-select w-full"
              disabled={loadingAreas}
            >
              <option value="">Seleccione un área</option>
              {areasList.length > 0 ? areasList.map((areaItem) => (
                <option key={areaItem.id} value={String(areaItem.id)}>
                  {areaItem.nombre}
                </option>
              )) : null}
            </select>
          </div>

          <div className="px-4">
            <label htmlFor="logoFile" className="block text-sm font-medium mb-2">
              Logo de la Empresa
            </label>
            <div className="flex items-center gap-4">
              {logoPreview && (
                <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <input
                type="file"
                id="logoFile"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Formatos aceptados: JPG, PNG, GIF</p>
          </div>

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
  );
};

export { ModalUpdateCompany };
