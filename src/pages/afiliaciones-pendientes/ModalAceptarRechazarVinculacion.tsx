import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useConfirm } from '@/hooks';

interface ModalProps {
  open: boolean;
  afiliacion?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalAceptarRechazarVinculacion = ({ open, onClose, afiliacion, onSave }: ModalProps) => {
  const [observacion, setObservacion] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<{ observacion?: string; file?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setObservacion('');
      setFile(null);
      setErrors({});
    }
  }, [open]);

  const validateFields = () => {
    const newErrors: { observacion?: string; file?: string } = {};
    let firstErrorField: string | null = null;

    if (!observacion.trim()) {
      newErrors.observacion = 'La observación es requerida.';
      if (!firstErrorField) firstErrorField = 'observacion';
    }

    setErrors(newErrors);

    if (firstErrorField) {
      document.getElementById(firstErrorField)?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (estado: "ACTIVO" | "RECHAZADO") => {
    if (!validateFields()) return;

    try {
      setLoading(true);
      const data = new FormData();

      data.append("idVinculacion", afiliacion.id + "");
      data.append("estado", estado);
      data.append("observacion", observacion);

      if (file) {
        data.append("rutaArchivoFile", file);
      }

      await axios.post(`change_status_afiliacion_pendiente`, data);

      setObservacion("");
      setFile(null);
      setErrors({});

      if (onSave) {
        onSave();
      }
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrors((prev) => ({ ...prev, file: "" }));
    }
  };

  const handleObservacionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setObservacion(e.target.value);
    setErrors((prev) => ({ ...prev, observacion: "" }));
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[600px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Aceptar o Rechazar Vinculación</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-5 px-0 py-5">
          <div>
            <label htmlFor="observacion" className="block text-sm font-medium mb-2">
              Observación
            </label>
            <textarea
              id="observacion"
              value={observacion}
              onChange={handleObservacionChange}
              className={`textarea ${errors.observacion ? "border-red-500" : ""}`}
              rows={4}
              placeholder="Escribe una observación..."
            ></textarea>
            {errors.observacion && <p className="text-red-500 text-sm mt-1">{errors.observacion}</p>}
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2">
              Adjuntar Archivo (Opcional) <span className="text-gray-500">(Formatos permitidos: PDF, PNG, JPG, JPEG)</span>
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className={`file-input ${errors.file ? "border-red-500" : ""}`}
            />
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file}</p>}
          </div>

          <div className="flex justify-end gap-3 mt-4 px-4">
           
           <button className="btn btn-sm btn-secondary" onClick={onClose}>Cancelar</button>

           
            <button
              className="btn btn-sm btn-danger"
              disabled={loading}
              onClick={() => handleSave("RECHAZADO")}
            >
              Rechazar
            </button>
            <button
              className="btn btn-sm btn-primary"
              disabled={loading}
              onClick={() => handleSave("ACTIVO")}
            >
              Aceptar
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};


export { ModalAceptarRechazarVinculacion };
