import { useEffect, useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Tercero } from '../../models/TerceroInterface';
import { TipoDocumentoInterface } from '@/pages/contratacion/model/TipoDocumentoInterface';

interface ModalTerceroTicketProps {
  open: boolean;
  onClose: () => void;
  onTerceroCreado: (tercero: Tercero) => void;
  esEmpresa?: boolean;
}

const ModalTerceroTicket = ({ open, onClose, onTerceroCreado, esEmpresa = false }: ModalTerceroTicketProps) => {
  const { enqueueSnackbar } = useSnackbar();
  
  const [tipoIdentificaciones, setTipoIdentificacion] = useState<TipoDocumentoInterface[]>([]);
  const [nuevoTercero, setNuevoTercero] = useState<Tercero>({
    id: 0,
    nombre: '',
    nit: '',
    identificacion: '',
    email: '',
    direccion: '',
    telefono: '',
    digitoVerficacion: '',
    responsableIva: 0,
    retenciones: 0,
    idtipoIdentificacion: 0
  });

  useEffect(() => {
    if (open) {
      cargarTipoIdentificaciones();
    } else {
      resetearFormulario();
    }
  }, [open]);

  const cargarTipoIdentificaciones = async () => {
    try {
      const response = await axios.get('/tipo_identificaciones');
      const tipos = response.data;

      setTipoIdentificacion(tipos);

      // Si es empresa, preseleccionar NIT, sino CC
      if (esEmpresa) {
        const tipoNIT = tipos.find((t: any) => t.codigo === 'NIT');
        if (tipoNIT) {
          setNuevoTercero((prev) => ({
            ...prev,
            idtipoIdentificacion: tipoNIT.id
          }));
        }
      } else {
        const tipoCC = tipos.find((t: any) => t.codigo === 'CC');
        if (tipoCC) {
          setNuevoTercero((prev) => ({
            ...prev,
            idtipoIdentificacion: tipoCC.id
          }));
        }
      }
    } catch (error) {
      enqueueSnackbar('Error al cargar tipos de identificación.', { variant: 'error' });
    }
  };

  const resetearFormulario = () => {
    setNuevoTercero({
      id: 0,
      nombre: '',
      nit: '',
      identificacion: '',
      email: '',
      direccion: '',
      telefono: '',
      digitoVerficacion: '',
      responsableIva: 0,
      retenciones: 0,
      idtipoIdentificacion: 0
    });
  };

  const crearNuevoTercero = async () => {
    // Validaciones
    if (!nuevoTercero.identificacion.trim()) {
      enqueueSnackbar(esEmpresa ? 'El NIT es obligatorio.' : 'El documento es obligatorio.', { variant: 'warning' });
      return;
    }

    if (!nuevoTercero.nombre.trim()) {
      enqueueSnackbar(esEmpresa ? 'La razón social es obligatoria.' : 'El nombre es obligatorio.', { variant: 'warning' });
      return;
    }

    if (!nuevoTercero.idtipoIdentificacion) {
      enqueueSnackbar('Debes seleccionar un tipo de identificación.', { variant: 'warning' });
      return;
    }

    try {
      const datosParaBackend = {
        nombre: nuevoTercero.nombre,
        nit: nuevoTercero.identificacion,
        email: nuevoTercero.email,
        direccion: nuevoTercero.direccion,
        telefono: nuevoTercero.telefono,
        digitoVerficacion: nuevoTercero.digitoVerficacion,
        responsableIva: nuevoTercero.responsableIva,
        retenciones: nuevoTercero.retenciones,
        tipoIdentificacion: nuevoTercero.idtipoIdentificacion || null
      };

      const response = await axios.post('terceros', datosParaBackend);

      enqueueSnackbar(esEmpresa ? 'Empresa creada con éxito.' : 'Cliente creado con éxito.', { variant: 'success' });
      
      // Notificar al componente padre
      onTerceroCreado(response.data);
      
      // Cerrar modal
      onClose();
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al crear el cliente.';
      enqueueSnackbar(mensaje, { variant: 'error' });
    }
  };

  const handleClose = () => {
    resetearFormulario();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader className="tp-5 flex justify-between items-center">
          <ModalTitle className="text-lg font-semibold flex items-center gap-2">
            <KeenIcon icon={esEmpresa ? "office-bag" : "user-plus"} className="w-5 h-5" />
            {esEmpresa ? 'Nueva Empresa' : 'Nuevo Cliente'}
          </ModalTitle>
          <button
            className="p-2 rounded-full transition-colors hover:bg-gray-100"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="w-5 h-5" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-4">
          {/* Tipo de Identificación */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Tipo de Identificación *
            </label>
            <select
              value={nuevoTercero.idtipoIdentificacion || ''}
              onChange={(e) =>
                setNuevoTercero({
                  ...nuevoTercero,
                  idtipoIdentificacion: Number(e.target.value)
                })
              }
              className="input w-full p-2 border border-gray-300 rounded-md focus:ring-2"
            >
              <option value="">Seleccione una opción</option>
              {tipoIdentificaciones.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.codigo} - {tipo.detalle}
                </option>
              ))}
            </select>
          </div>

          {/* Ayudas contextuales */}
          {(() => {
            const tipoSeleccionado = tipoIdentificaciones.find(
              (t) => t.id === nuevoTercero.idtipoIdentificacion
            );

            if (tipoSeleccionado?.codigo === 'TI') {
              return (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                  <strong>💡 Ayuda:</strong> La <em>Tarjeta de Identidad</em> es usada por menores
                  de edad. Por favor, asegúrate de ingresar los datos correctos del{' '}
                  <strong>acudiente o representante legal</strong>.
                </div>
              );
            }

            if (tipoSeleccionado?.codigo === 'CE') {
              return (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-sm text-amber-800">
                  <strong>💡 Ayuda:</strong> La <em>Cédula de Extranjería</em> corresponde a
                  ciudadanos extranjeros. Verifica que el número del documento y el país de origen
                  estén correctamente registrados.
                </div>
              );
            }

            return null;
          })()}

          {/* Documento */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {esEmpresa ? 'NIT *' : 'Número de Documento *'}
            </label>
            <input
              type="text"
              placeholder={esEmpresa ? "Ej. 900123456-7" : "Ej. 1234567890"}
              value={nuevoTercero.identificacion}
              onChange={(e) =>
                setNuevoTercero({ ...nuevoTercero, identificacion: e.target.value })
              }
              className="input w-full p-2 border border-gray-300 rounded-md focus:ring-2"
            />
          </div>

          {/* Nombre completo */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              {esEmpresa ? 'Razón Social *' : 'Nombre Completo *'}
            </label>
            <input
              type="text"
              placeholder={esEmpresa ? "Ej. Transportes ABC S.A.S." : "Ej. Juan Pérez García"}
              value={nuevoTercero.nombre}
              onChange={(e) => setNuevoTercero({ ...nuevoTercero, nombre: e.target.value })}
              className="input w-full p-2 border border-gray-300 rounded-md focus:ring-2"
            />
          </div>

          {/* Correo electrónico */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="cliente@correo.com"
              value={nuevoTercero.email}
              onChange={(e) => setNuevoTercero({ ...nuevoTercero, email: e.target.value })}
              className="input w-full p-2 border border-gray-300 rounded-md focus:ring-2"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Teléfono</label>
            <input
              type="text"
              placeholder="Ej. 3001234567"
              value={nuevoTercero.telefono}
              onChange={(e) => setNuevoTercero({ ...nuevoTercero, telefono: e.target.value })}
              className="input w-full p-2 border border-gray-300 rounded-md focus:ring-2"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Dirección</label>
            <input
              type="text"
              placeholder="Ej. Calle 123 #45-67"
              value={nuevoTercero.direccion}
              onChange={(e) => setNuevoTercero({ ...nuevoTercero, direccion: e.target.value })}
              className="input w-full p-2 border border-gray-300 rounded-md focus:ring-2"
            />
          </div>

          {/* Nota de campos obligatorios */}
          <p className="text-xs text-gray-500 italic">* Campos obligatorios</p>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={crearNuevoTercero}
              className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <KeenIcon icon="check" className="w-4 h-4" />
              {esEmpresa ? 'Guardar Empresa' : 'Guardar Cliente'}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalTerceroTicket;