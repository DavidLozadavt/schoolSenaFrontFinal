import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalPersonaAux = ({ open, onClose, data, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();

  const [identificacion, setIdentificacion] = useState(data?.identificacion || "");
  const [nombre1, setNombre1] = useState(data?.nombre1 || "");
  const [apellido1, setApellido1] = useState(data?.apellido1 || "");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (open) {
      setIdentificacion(data?.identificacion || "");
      setNombre1(data?.nombre1 || "");
      setApellido1(data?.apellido1 || "");
      setErrors({});
    }
  }, [open, data]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!identificacion.trim()) {
      newErrors.identificacion = "La identificación es requerida.";
    } else if (!/^[0-9]+$/.test(identificacion)) {
      newErrors.identificacion = "Solo se permiten números.";
    }

    if (!nombre1.trim()) {
      newErrors.nombre1 = "El primer nombre es requerido.";
    }

    if (!apellido1.trim()) {
      newErrors.apellido1 = "El primer apellido es requerido.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const payload = {
      identificacion: identificacion.trim(),
      nombre1: nombre1.trim(),
      apellido1: apellido1.trim(),
    };

    try {
      if (data) {
        await axios.put(`persona_auxiliar/${data.id}`, payload);
        enqueueSnackbar("Persona actualizada con éxito.", { variant: "success" });
      } else {
        await axios.post("store_persona_auxiliar", payload);
        enqueueSnackbar("Persona creada con éxito.", { variant: "success" });
      }

      if (onSave) onSave();
      onClose();
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        enqueueSnackbar("La identificación ya existe.", { variant: "warning" });
      } else {
        enqueueSnackbar("Error al guardar los datos.", {
          variant: "error",
        });
      }
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[500px] top-[15%] p-4">
        <ModalHeader>
          <ModalTitle>{data ? "Editar Persona Auxiliar" : "Nueva Persona Auxiliar"}</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={onClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-5">
          {/* Identificación */}
          <div>
            <label htmlFor="identificacion" className="block text-sm mb-2 font-medium">
              Identificación
            </label>
            <input
              id="identificacion"
              type="text"
              className={`input p-2 border ${
                errors.identificacion ? "border-red-500" : "border-gray-300"
              } rounded-md w-full`}
              placeholder="Ingrese la identificación"
              value={identificacion}
              onChange={(e) => setIdentificacion(e.target.value)}
            />
            {errors.identificacion && (
              <p className="text-red-500 text-sm mt-1">{errors.identificacion}</p>
            )}
          </div>

          {/* Nombre1 */}
          <div>
            <label htmlFor="nombre1" className="block text-sm mb-2 font-medium">
              Primer Nombre
            </label>
            <input
              id="nombre1"
              type="text"
              className={`input p-2 border ${
                errors.nombre1 ? "border-red-500" : "border-gray-300"
              } rounded-md w-full`}
              placeholder="Ingrese el primer nombre"
              value={nombre1}
              onChange={(e) => setNombre1(e.target.value)}
            />
            {errors.nombre1 && (
              <p className="text-red-500 text-sm mt-1">{errors.nombre1}</p>
            )}
          </div>

          {/* Apellido1 */}
          <div>
            <label htmlFor="apellido1" className="block text-sm mb-2 font-medium">
              Primer Apellido
            </label>
            <input
              id="apellido1"
              type="text"
              className={`input p-2 border ${
                errors.apellido1 ? "border-red-500" : "border-gray-300"
              } rounded-md w-full`}
              placeholder="Ingrese el primer apellido"
              value={apellido1}
              onChange={(e) => setApellido1(e.target.value)}
            />
            {errors.apellido1 && (
              <p className="text-red-500 text-sm mt-1">{errors.apellido1}</p>
            )}
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

export { ModalPersonaAux };