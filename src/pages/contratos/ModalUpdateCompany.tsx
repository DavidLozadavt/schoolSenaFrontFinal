import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Toast from '../programas-academicos/components/Toast';
import { AuthContext } from '@/auth/providers/JWTProvider';

interface ModalUpdateCompanyProps {
  open: boolean;
  onClose: () => void;
  empresa: any;
  contratoId?: string | number;
  area?: any;
  areas?: any[];
  contrato?: any;
  onSave: () => void;
}

const ModalUpdateCompany = ({ open, onClose, empresa, contratoId, area, areas = [], contrato, onSave }: ModalUpdateCompanyProps) => {
  const [saving, setSaving] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loadingAreas, setLoadingAreas] = useState<boolean>(false);
  const [loadingCentros, setLoadingCentros] = useState<boolean>(false);
  const [centrosFormacion, setCentrosFormacion] = useState<any[]>([]);
  const { enqueueSnackbar } = useSnackbar();
  const authContext = useContext(AuthContext);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState({
    razonSocial: '',
    nit: '',
    digitoVerificacion: '',
    idArea: '',
    idCentroFormacion: ''
  });

  const [areasList, setAreas] = useState<any[]>(areas);

  useEffect(() => {
    if (!open && !showToast) {
      setToastMessage('');
    }
  }, [open, showToast]);

  useEffect(() => {
    if (open) {
      if (empresa) {
        setFormData({
          razonSocial: empresa.razonSocial || '',
          nit: empresa.nit || '',
          digitoVerificacion: empresa.digitoVerificacion || '',
          idArea: area?.id ? String(area.id) : '',
          idCentroFormacion: contrato?.persona?.usuario?.idCentroFormacion ? String(contrato.persona.usuario.idCentroFormacion) : ''
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

      // Cargar centros de formación
      fetchCentrosFormacion();
    }
  }, [open, empresa, area, contrato]);

  // Efecto para actualizar idCentroFormacion después de cargar los centros
  useEffect(() => {
    if (centrosFormacion.length > 0 && contrato?.persona?.usuario?.idCentroFormacion) {
      const idCentroFormacionValue = String(contrato.persona.usuario.idCentroFormacion);
      const centroExiste = centrosFormacion.find((c: any) => String(c.id) === idCentroFormacionValue);
      
      if (centroExiste && formData.idCentroFormacion !== idCentroFormacionValue) {
        setFormData(prev => ({
          ...prev,
          idCentroFormacion: idCentroFormacionValue
        }));
      }
    }
  }, [centrosFormacion, contrato]);

  const fetchAreas = async () => {
    setLoadingAreas(true);
    try {
      // Intentar primero con 'areas' (filtrado por empresa)
      let response = await axios.get('areas');
      console.log('Áreas recibidas (filtradas por empresa):', response.data);
      
      // Si no hay áreas filtradas por empresa, intentar con all_areas
      if (!Array.isArray(response.data) || response.data.length === 0) {
        console.log('No hay áreas filtradas por empresa, intentando con all_areas...');
        try {
          response = await axios.get('all_areas');
          console.log('Áreas recibidas (todas):', response.data);
        } catch (error2) {
          console.warn('Error al cargar all_areas:', error2);
        }
      }
      
      if (Array.isArray(response.data) && response.data.length > 0) {
        setAreas(response.data);
      } else {
        setAreas([]);
        console.warn('No se encontraron áreas disponibles');
      }
    } catch (error: any) {
      console.error('Error al cargar áreas:', error);
      // Si falla 'areas', intentar con 'all_areas' como último recurso
      try {
        const response = await axios.get('all_areas');
        if (Array.isArray(response.data) && response.data.length > 0) {
          setAreas(response.data);
          console.log('Áreas cargadas desde all_areas:', response.data);
        } else {
          setAreas([]);
        }
      } catch (error2: any) {
        console.error('Error al cargar all_areas:', error2);
        enqueueSnackbar('Error al cargar las áreas.', { variant: 'error' });
        setAreas([]);
      }
    } finally {
      setLoadingAreas(false);
    }
  };

  const fetchCentrosFormacion = async () => {
    setLoadingCentros(true);
    try {
      const res = await axios.get(`centrosFormacion/regional-contratacion/${authContext?.empresa?.id}`);
      const centrosCargados = res.data.data || [];
      setCentrosFormacion(centrosCargados);
      
      // Asegurar que el idCentroFormacion se establezca después de cargar los centros
      if (contrato?.persona?.usuario?.idCentroFormacion && centrosCargados.length > 0) {
        const idCentroFormacionValue = String(contrato.persona.usuario.idCentroFormacion);
        const centroExiste = centrosCargados.find((c: any) => String(c.id) === idCentroFormacionValue);
        
        if (centroExiste) {
          setFormData(prev => ({
            ...prev,
            idCentroFormacion: idCentroFormacionValue
          }));
        }
      }
    } catch (error) {
      console.error('Error al cargar centros de formación:', error);
      enqueueSnackbar('Error al cargar los centros de formación.', { variant: 'error' });
    } finally {
      setLoadingCentros(false);
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
      const centroActual = contrato?.persona?.usuario?.idCentroFormacion ? String(contrato.persona.usuario.idCentroFormacion) : '';
      
      const updates: any = {};
      if (formData.idArea && contratoId && formData.idArea !== areaActual) {
        updates.idArea = Number(formData.idArea);
      }
      if (formData.idCentroFormacion && contratoId && formData.idCentroFormacion !== centroActual) {
        updates.idCentroFormacion = Number(formData.idCentroFormacion);
      }

      if (Object.keys(updates).length > 0) {
        try {
          await axios.post(`update_contrato/${contratoId}`, updates);
        } catch (error) {
          console.error('Error al actualizar el contrato:', error);
          enqueueSnackbar('Error al actualizar el contrato.', { variant: 'error' });
          setSaving(false);
          return;
        }
      }
      
      setToastMessage('Empresa actualizada con éxito.');
      setShowToast(true);
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
    <>
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
            <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-600 mb-1">
              Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="razonSocial"
              value={formData.razonSocial}
              onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
              className="input w-full"
              placeholder="Ej: Servicio Nacional de Aprendizaje"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4">
            <div>
              <label htmlFor="nit" className="block text-sm font-medium text-gray-600 mb-1">
                NIT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nit"
                value={formData.nit}
                onChange={(e) => setFormData({ ...formData, nit: e.target.value })}
                className="input w-full"
                placeholder="Ej: 891500194"
              />
            </div>
            <div>
              <label htmlFor="digitoVerificacion" className="block text-sm font-medium text-gray-600 mb-1">
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
                className="input w-full"
                placeholder="Ej: 9"
                min="1"
                max="9"
              />
            </div>
          </div>

          <div className="px-4">
            <label htmlFor="idArea" className="block text-sm font-medium text-gray-600 mb-1">
              Área
            </label>
            <select
              id="idArea"
              value={formData.idArea}
              onChange={(e) => setFormData({ ...formData, idArea: e.target.value })}
              className="select w-full"
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
            <label htmlFor="idCentroFormacion" className="block text-sm font-medium text-gray-600 mb-1">
              Centro de formación
            </label>
            <select
              id="idCentroFormacion"
              value={formData.idCentroFormacion}
              onChange={(e) => setFormData({ ...formData, idCentroFormacion: e.target.value })}
              className="select w-full"
              disabled={loadingCentros}
            >
              <option value="">Seleccione un centro de formación</option>
              {centrosFormacion.map((centro) => (
                <option key={centro.id} value={String(centro.id)}>
                  {centro.nombre}, {centro.empresa?.razonSocial}, {centro.ciudad?.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="px-4">
            <label htmlFor="logoFile" className="block text-sm font-medium text-gray-600 mb-1">
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

    <Toast
      message={toastMessage}
      isOpen={showToast}
      onClose={() => setShowToast(false)}
    />
    </>
  );
};

export { ModalUpdateCompany };
