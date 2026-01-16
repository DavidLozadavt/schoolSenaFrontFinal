import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { NumericFormat } from 'react-number-format';
import { useSnackbar } from 'notistack';
import { TipoIncapacidadInterface } from '@/pages/tipo-incapacidades/models/TipoIncapacidadInterface';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave: () => void;
}
const ModalExtenderSolicitudIncapacidadLicenciaAdmin = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [fechaInicial, setFechaInicial] = useState('');
  const [fechaFinal, setFechaFinal] = useState('');
  const [tipo, setTipo] = useState('');
  const [numeroDias, setNumeroDias] = useState('');
  const [comentario, setComentario] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [tipoIncapacidades, setTipoIncapacidades] = useState<TipoIncapacidadInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [tipoParto, setTipoMaternidad] = useState('');

  const [errors, setErrors] = useState({
    fechaInicial: '',
    fechaFinal: '',
    tipo: '',
    numeroDias: '',
    comentario: '',
    imagen: '',
    tipoParto: ''
  });


  const isMaternidad = (() => {
    const selectedTipo = tipoIncapacidades.find((item) => item.id === parseInt(tipo));
    if (!selectedTipo) return false;
    return selectedTipo.tipoIncapacidad.toLowerCase().startsWith('maternidad');
  })();

  useEffect(() => {
    if (!isMaternidad) {
      setTipoMaternidad('');
      setErrors((prev) => ({ ...prev, tipoParto: '' }));
    }
  }, [isMaternidad]);

  
  useEffect(() => {
    if (data) {
      setFechaInicial(data?.fechaFinal || ''); 
      setFechaFinal('');
      setTipo('');
      setNumeroDias('');
      setComentario('');
      setTipoMaternidad('');
      setImagen(null);
      setErrors({
        fechaInicial: '',
        fechaFinal: '',
        tipo: '',
        numeroDias: '',
        comentario: '',
        imagen: '',
        tipoParto: ''
      });
    }
  }, [data]);

  // Calcular número de días automáticamente
  useEffect(() => {
    if (fechaInicial && fechaFinal) {
      const inicio = new Date(fechaInicial).getTime();
      const fin = new Date(fechaFinal).getTime();

      if (fin >= inicio) {
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNumeroDias(diffDays.toString());
        setErrors((prev) => ({ ...prev, fechaFinal: '' }));
      } else {
        setNumeroDias('');
        setErrors((prev) => ({
          ...prev,
          fechaFinal: 'La fecha final no puede ser menor que la inicial.'
        }));
      }
    }
  }, [fechaInicial, fechaFinal]);

  const handleFileChange = (e: any) => {
    const file = e.target.files[0];
    if (file) setImagen(file);
  };

 

 const [config, setConfig] = useState<any>(null);
  const [disableFechaFinal, setDisableFechaFinal] = useState(false);
  const fetchConfiguracionNomina = async () => {
    setLoading(true);
    try {
      const response = await axios.get('configurations_incapacidades');
      setConfig(response.data);
    } catch (error) {
      setError('Error al cargar ');
    } finally {
      setLoading(false);
    }
  };


    const sumarDias = (fecha: string, dias: number): string => {
      const f = new Date(fecha);
      f.setDate(f.getDate() + dias + 1);
      const año = f.getFullYear();
      const mes = String(f.getMonth() + 1).padStart(2, '0');
      const dia = String(f.getDate()).padStart(2, '0');
      return `${año}-${mes}-${dia}`;
    };
  
    useEffect(() => {
      if (!config || !fechaInicial || !tipo) return;
  
      let dias = 0;
      let desactivarFechaFinal = false;
  
      const selectedTipo = tipoIncapacidades.find((item) => item.id === parseInt(tipo));
      if (!selectedTipo) return;
  
      const nombreTipo = selectedTipo.tipoIncapacidad?.toUpperCase() || '';
      const esMaternidad = nombreTipo.startsWith('MATERNIDAD');
  
      if (esMaternidad && tipoParto) {
        switch (tipoParto) {
          case 'NORMAL':
            dias = config.diasMaternidadNormal || 0;
            desactivarFechaFinal = true;
            break;
          case 'MULTIPLE':
            dias = config.diasMaternidadMultiple || 0;
            desactivarFechaFinal = true;
            break;
          case 'PREMATURO':
            dias = config.diasMaternidadPrematura || 0;
            desactivarFechaFinal = true;
            break;
          case 'CASO_ESPECIAL':
            dias = config.diasMaternidadCasoEspecial || 0; 
            desactivarFechaFinal = true;
            break;
          default:
            dias = 0;
            desactivarFechaFinal = false;
        }
      } else {
     
        switch (nombreTipo) {
          case 'LUTO_COMPAÑERO':
            dias = config.diasLutoComp || 0;
            desactivarFechaFinal = true;
            break;

             case 'PATERNIDAD':
            dias = config.diasPaternidad || 0;
            desactivarFechaFinal = true;
            break;
      
   
          case 'LUTO':
            dias = config.diasLutoFamiliar || 0;
            desactivarFechaFinal = true;
            break;
          default:
            dias = 0;
            desactivarFechaFinal = false;
        }
      }
  
      if (dias > 0) {
        const nuevaFechaFinal = sumarDias(fechaInicial, dias);
        setFechaFinal(nuevaFechaFinal);
        setNumeroDias(dias.toString());
        setDisableFechaFinal(desactivarFechaFinal);
      } else {
        setNumeroDias('');
        setDisableFechaFinal(false);
      }
    }, [tipo, fechaInicial, config, tipoParto, tipoIncapacidades]);
  

  const validate = () => {
    const newErrors = {
      fechaInicial: fechaInicial ? '' : 'La fecha inicial es requerida.',
      fechaFinal: fechaFinal ? errors.fechaFinal || '' : 'La fecha final es requerida.',
      tipo: tipo ? '' : 'El tipo es requerido.',
      numeroDias: numeroDias ? '' : 'El número de días debe ser válido.',
      comentario: comentario.trim() ? '' : 'El comentario es requerido.',
      imagen: '',
      tipoParto: isMaternidad && !tipoParto ? 'Debe seleccionar el tipo de maternidad.' : ''
    };

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === '');
  };

  const handleSave = async () => {
    if (!validate()) return;

    const formData = new FormData();
    formData.append('fechaInicial', fechaInicial);
    formData.append('fechaFinal', fechaFinal);
    formData.append('idTipoIncapacidad', tipo);
    formData.append('comentario', comentario);
     formData.append('estado', 'ACEPTADO');
    formData.append('idContrato', data.contrato.id || '');
    formData.append('idSolicitudPrincipal', data.id || '');
    if (isMaternidad) formData.append('tipoParto', tipoParto);
    if (imagen) formData.append('soporte', imagen);

    try {
      await axios.post('extender_incapacidad_persona_by_trabajador', formData);
      enqueueSnackbar('Incapacidad extendida con éxito.', { variant: 'success' });
      onSave();
      onClose();
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Error al guardar los datos.';
      enqueueSnackbar(backendMessage, { variant: 'error' });
    }
  };

  const fetchTipoIncapacidades = async () => {
    setLoading(true);
    try {
      const response = await axios.get('tipos_incapacidades');
      setTipoIncapacidades(response.data);
    } catch (error) {
      setError('Error al cargar los tipos de incapacidades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTipoIncapacidades();
    fetchConfiguracionNomina();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Extender Incapacidad o Licencia</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-3 px-0 py-5">
  

   <div>
            <label htmlFor="tipo" className="block mb-1 text-sm font-medium">
              Tipo Incapacidad
            </label>
            <select
              id="tipo"
              className={`input p-2 border ${errors.tipo ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                if (errors.tipo) setErrors((prev) => ({ ...prev, tipo: '' }));
              }}
            >
              <option value="">Seleccione un tipo</option>
              {tipoIncapacidades.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.tipoIncapacidad}
                </option>
              ))}
            </select>
            {errors.tipo && <p className="text-red-500 text-sm mt-1">{errors.tipo}</p>}
          </div>


          {isMaternidad && (
            <div className="mt-3">
              <label htmlFor="tipoParto" className="block mb-1 text-sm font-medium">
                Tipo de Maternidad
              </label>
              <select
                id="tipoParto"
                className={`input p-2 border ${errors.tipoParto ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
                value={tipoParto}
                onChange={(e) => {
                  setTipoMaternidad(e.target.value);
                  if (errors.tipoParto) setErrors((prev) => ({ ...prev, tipoParto: '' }));
                }}
              >
                <option value="">Seleccione una opción</option>
                <option value="NINGUNO">NINGUNO</option>
                <option value="NORMAL">NORMAL</option>
                <option value="MULTIPLE">MÚLTIPLE</option>
                <option value="PREMATURO">PREMATURO</option>
                <option value="CASO_ESPECIAL">CASO ESPECIAL</option>
              </select>
              {errors.tipoParto && <p className="text-red-500 text-sm mt-1">{errors.tipoParto}</p>}
            </div>
          )}

          <div>
            <label htmlFor="fechaInicial" className="block mb-1 text-sm font-medium">
              Fecha Inicial (automática)
            </label>
            <input
              type="date"
              id="fechaInicial"
              disabled
              className="input p-2 border border-gray-300 rounded-md w-full bg-gray-100 cursor-not-allowed"
              value={fechaInicial}
              readOnly
            />
          </div>

  
          <div>
            <label htmlFor="fechaFinal" className="block mb-1 text-sm font-medium">
              Nueva Fecha Final
            </label>
            <input
              type="date"
              id="fechaFinal"
              className={`input p-2 border ${errors.fechaFinal ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              value={fechaFinal}
                 disabled={disableFechaFinal}
              onChange={(e) => {
                setFechaFinal(e.target.value);
                if (errors.fechaFinal) setErrors((prev) => ({ ...prev, fechaFinal: '' }));
              }}
            />
            {errors.fechaFinal && <p className="text-red-500 text-sm mt-1">{errors.fechaFinal}</p>}
          </div>


       

          <div>
            <label htmlFor="numeroDias" className="block mb-1 text-sm font-medium">
              Número de Días
            </label>
            <input
              disabled
              type="text"
              id="numeroDias"
              className="input p-2 border border-gray-300 rounded-md w-full bg-gray-100 cursor-not-allowed"
              value={numeroDias}
            />
          </div>

          <div>
            <label htmlFor="comentario" className="block mb-1 text-sm font-medium">
              Comentario
            </label>
            <textarea
              id="comentario"
              className={`textarea p-2 border ${errors.comentario ? 'border-red-500' : 'border-gray-300'} rounded-md w-full`}
              placeholder="Escribe un comentario"
              rows={3}
              value={comentario}
              onChange={(e) => {
                setComentario(e.target.value);
                if (errors.comentario) setErrors((prev) => ({ ...prev, comentario: '' }));
              }}
            />
            {errors.comentario && <p className="text-red-500 text-sm mt-1">{errors.comentario}</p>}
          </div>

          <div>
            <label htmlFor="imagen" className="block mb-1 text-sm font-medium">
              Archivo (opcional)
            </label>
            <input
              type="file"
              id="imagen"
              className="file-input p-2 border border-gray-300 rounded-md w-full"
              onChange={(e) => handleFileChange(e)}
            />
          </div>

          {/* Botones */}
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

export { ModalExtenderSolicitudIncapacidadLicenciaAdmin };
