import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { ContratoInterface } from './model/ContratoInterface';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  contrato?: ContratoInterface;
  onClose: () => void;
  onSave?: () => void;
}
const ModalExtensionContract = ({ open, onClose, contrato, onSave }: ModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const [loading, setLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState({
    fechaFinalContrato: '',
    fechaContratacion: '',
    observacion: '',
    valorTotalContrato: '',
    objetoContrato: '',
    periodoPago: '',
    sueldo: '',
    idPersona: '',
    salario_id: '',
    idtipoContrato: '',
    rol: ''
  });

  useEffect(() => {
    if (contrato && roles) {
      setFormData((prev) => ({
        ...prev,
        fechaContratacion: contrato.fechaFinalContrato || '',
        sueldo: contrato?.transacciones?.[0]?.pago?.[0]?.valor || '',
        valorTotalContrato: contrato.valorTotalContrato || '',
        periodoPago: contrato.periodoPago || '',
        objetoContrato: contrato.objetoContrato || '',
        observacion: contrato.observacion || '',
        idtipoContrato: contrato.tipoContrato?.nombreTipoContrato || '',
        rol: contrato.salario?.rol.id || ''
      }));

      if (contrato?.fechaContratacion && contrato?.fechaFinalContrato) {
        calcularValorTotalContrato(
          contrato?.transacciones?.[0]?.pago?.[0]?.valor || 0,
          contrato.fechaContratacion,
          contrato.fechaFinalContrato
        );
      }
    }
  }, [contrato, roles]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'sueldo') {
      const newSueldo = parseFloat(value);
      setFormData((prev) => {
        const updatedFormData = { ...prev, sueldo: newSueldo.toString() };

        calcularValorTotalContrato(
          newSueldo,
          updatedFormData.fechaContratacion,
          updatedFormData.fechaFinalContrato
        );
        return updatedFormData;
      });
    } else if (name === 'rol') {
      const selectedRole = roles.find((rol) => rol.id === parseInt(value));
      if (selectedRole) {
        const salario = selectedRole.salario.valor;
        setFormData((prev) => ({
          ...prev,
          sueldo: salario.toString()
        }));
        calcularValorTotalContrato(
          salario,
          formData.fechaContratacion,
          formData.fechaFinalContrato
        );
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const calcularValorTotalContrato = (
    salario: number,
    fechaContratacion: string,
    fechaFinalContrato: string
  ) => {
    if (fechaContratacion && fechaFinalContrato) {
      const start = new Date(fechaContratacion);
      const end = new Date(fechaFinalContrato);

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffMonths = Math.ceil(diffTime / (1000 * 3600 * 24 * 30));
      const valorTotal = salario * diffMonths;

      setFormData((prev) => ({
        ...prev,
        valorTotalContrato: valorTotal.toString()
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!formData.fechaFinalContrato) {
      enqueueSnackbar('La fecha final del nuevo contrato no puede estar vacia', {
        variant: 'solid',
        state: 'danger'
      });
      return;
    }

    if (!formData.rol) {
      enqueueSnackbar('El cargo no puede estar vacío.', {
        variant: 'solid',
        state: 'danger'
      });
      return;
    }

    if (!formData.periodoPago) {
      enqueueSnackbar('El periodo de pago no puede estar vacío.', {
        variant: 'solid',
        state: 'danger'
      });
      return;
    }
    if (isNaN(parseFloat(formData.sueldo)) || parseFloat(formData.sueldo) <= 0) {
      enqueueSnackbar('El sueldo debe ser un número superior a 0.', {
        variant: 'solid',
        state: 'danger'
      });
      return;
    }

    if (
      isNaN(parseFloat(formData.valorTotalContrato)) ||
      parseFloat(formData.valorTotalContrato) < 0
    ) {
      enqueueSnackbar('El valor total del contrato debe ser un número superior o igual a 0.', {
        variant: 'solid',
        state: 'danger'
      });
      return;
    }

    if (!formData.objetoContrato || formData.objetoContrato.trim() === '') {
      enqueueSnackbar('El objeto del contrato no puede estar vacío.', {
        variant: 'solid',
        state: 'danger'
      });
      return;
    }

    if (!file) {
      enqueueSnackbar('El archivo de extensión del contrato no puede estar vacío.', {
        variant: 'solid',
        state: 'danger'
      });
      return;
    }

    const data = new FormData();
    if (contrato?.id) {
      data.append('idContrato', contrato.id + '');
    }

    if (file) {
      data.append('rutaArchivoContratoFile', file);
    }

    if (contrato?.fechaFinalContrato) {
      data.append('fechaContratacion', contrato.fechaFinalContrato + '');
    }

    data.append('fechaFinalContrato', formData.fechaFinalContrato);

    if (contrato?.idtipoContrato) {
      data.append('idtipoContrato', contrato.idtipoContrato + '');
    }

    data.append('rol', formData.rol);
    data.append('observacion', formData.observacion);
    data.append('valorTotalContrato', formData.valorTotalContrato);
    data.append('objetoContrato', formData.objetoContrato);
    data.append('periodoPago', formData.periodoPago);
    data.append('sueldo', formData.sueldo);
    if (contrato?.idpersona) {
      data.append('idpersona', contrato.idpersona + '');
    }

    if (contrato?.salario?.id) {
      data.append('salario_id', contrato.salario.id + '');
    }

    try {
      await axios.post('extender_contrato', data);
      enqueueSnackbar('El contrato fue renovado con éxito.', {
        variant: 'success',
      });
      if (onSave) onSave();
      onClose();
    } catch (error) {
      enqueueSnackbar('Error al realizar la extensión', {
        variant: 'solid',
        state: 'danger'
      });
      console.error('Error al guardar:', error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get('contrato-roles');
      setRoles(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>Extender Contrato</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <form className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="fechaContratacion">
                Fecha de Inicio del Nuevo Contrato
              </label>
              <input
                id="fechaContratacion"
                type="date"
                className="input"
                name="fechaContratacion"
                disabled
                value={formData.fechaContratacion}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="fechaFinalContrato">
                Fecha Final del Nuevo Contrato
              </label>
              <input
                id="fechaFinalContrato"
                type="date"
                className="input"
                name="fechaFinalContrato"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="idtipoContrato">
                Tipo de Contrato
              </label>
              <input
                id="idtipoContrato"
                type="text"
                className="input"
                name="idtipoContrato"
                value={formData.idtipoContrato}
                disabled
                placeholder="Tipo de Contrato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Cargo </label>
              <div className="flex items-center">
                <select
                  name="rol"
                  id="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  className="input w-4/4 mr-2"
                >
                  <option value="">Seleccione una Opción</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>
                      {rol.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="sueldo">
                Sueldo
              </label>
              <input
                id="sueldo"
                type="text"
                name="sueldo"
                className="input"
                value={formData.sueldo}
                onChange={handleChange}
                placeholder="Sueldo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="valorTotalContrato">
                Valor Total del Contrato
              </label>
              <input
                id="valorTotalContrato"
                type="text"
                className="input"
                name="valorTotalContrato"
                value={formData.valorTotalContrato}
                onChange={handleChange}
                placeholder="Valor Total"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="periodoPago">
                Periodo de Pago
              </label>

              <select
                name="periodoPago"
                value={formData.periodoPago}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccione una Opción</option>

                <option value="15">QUINCENAL</option>
                <option value="30">MENSUAL</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="objetoContrato">
                Objeto del Contrato
              </label>
              <textarea
                id="objetoContrato"
                className="textarea"
                name="objetoContrato"
                rows={4}
                value={formData.objetoContrato}
                onChange={handleChange}
                placeholder="Objeto del Contrato"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="observacion">
                Observación
              </label>
              <textarea
                id="observacion"
                className="textarea"
                name="observacion"
                rows={4}
                value={formData.observacion}
                onChange={handleChange}
                placeholder="Observación"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" htmlFor="rutaArchivoContratoFile">
                Acta de extensión de contrato
              </label>
              <input
                id="rutaArchivoContratoFile"
                type="file"
                className="file-input"
                name="rutaArchivoContratoFile"
                onChange={handleFileChange}
              />
            </div>
          </form>

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

export { ModalExtensionContract };
