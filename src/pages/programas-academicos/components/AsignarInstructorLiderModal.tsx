import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';

interface Instructor {
  id: number;
  persona: {
    id: number;
    nombre1: string;
    nombre2?: string;
    apellido1: string;
    apellido2?: string;
    identificacion: string;
  };
  nivelEducativo?: {
    id: number;
    nombre: string;
  };
  areasConocimiento?: Array<{
    id: number;
    nombreAreaConocimiento: string;
  }>;
}

interface AsignarInstructorLiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  fichaId: number;
  programaNombre?: string;
  onSuccess: () => void;
}

export const AsignarInstructorLiderModal: React.FC<AsignarInstructorLiderModalProps> = ({
  isOpen,
  onClose,
  fichaId,
  programaNombre,
  onSuccess
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [instructores, setInstructores] = useState<Instructor[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [programaInfo, setProgramaInfo] = useState<{ id: number; nombre: string } | null>(null);

  useEffect(() => {
    if (isOpen && fichaId) {
      loadInstructores();
    } else {
      setInstructores([]);
      setSelectedInstructor(null);
      setProgramaInfo(null);
    }
  }, [isOpen, fichaId]);

  const loadInstructores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`fichas/${fichaId}/instructores-disponibles`);
      if (response.data?.status === 'success') {
        setInstructores(response.data.data || []);
        setProgramaInfo(response.data.programa || null);
      } else {
        setInstructores([]);
      }
    } catch (error: any) {
      console.error('Error al cargar instructores:', error);
      // No mostrar errores técnicos al usuario, solo loguear en consola
      const errorMessage = error?.response?.data?.message || '';
      // Solo mostrar mensaje si no es un error técnico (rutas de archivos, etc)
      if (errorMessage && !errorMessage.includes('File does not exist') && !errorMessage.includes('\\') && !errorMessage.includes('/')) {
        enqueueSnackbar('Error al cargar instructores disponibles', { variant: 'error' });
      }
      setInstructores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAsignar = async () => {
    if (!selectedInstructor) {
      enqueueSnackbar('Por favor seleccione un instructor', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`fichas/${fichaId}/asignar-instructor-lider`, {
        idInstructorLider: selectedInstructor
      });

      enqueueSnackbar('Instructor líder asignado correctamente', { variant: 'success' });
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error al asignar instructor:', error);
      const errorMessage = error?.response?.data?.message || '';
      // No mostrar errores técnicos al usuario
      if (errorMessage && !errorMessage.includes('File does not exist') && !errorMessage.includes('\\') && !errorMessage.includes('/')) {
        enqueueSnackbar('Error al asignar instructor líder', { variant: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const getNombreCompleto = (instructor: Instructor): string => {
    const { persona } = instructor;
    const nombres = [persona.nombre1, persona.nombre2].filter(Boolean).join(' ');
    const apellidos = [persona.apellido1, persona.apellido2].filter(Boolean).join(' ');
    return `${nombres} ${apellidos}`.trim();
  };

  const getIniciales = (instructor: Instructor): string => {
    const { persona } = instructor;
    const inicial1 = persona.nombre1?.charAt(0).toUpperCase() || '';
    const inicial2 = persona.apellido1?.charAt(0).toUpperCase() || '';
    return `${inicial1}${inicial2}`;
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <ModalContent className="max-w-3xl">
        <ModalHeader>
          <ModalTitle>Seleccionar Líder de Ficha</ModalTitle>
          <button
            className="btn btn-sm btn-icon btn-light btn-clear shrink-0"
            onClick={onClose}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6">
          {programaInfo && (
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                Ficha {fichaId} - {programaInfo.nombre}
              </p>
            </div>
          )}

          {programaNombre && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <KeenIcon icon="information-2" className="text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-800">
                Instructores disponibles para el programa {programaNombre}
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando instructores...</p>
            </div>
          ) : instructores.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No hay instructores disponibles para este programa
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {instructores.map((instructor) => {
                const isSelected = selectedInstructor === instructor.id;
                return (
                  <label
                    key={instructor.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-primary'
                        : 'bg-white border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold text-sm">
                        {getIniciales(instructor)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {getNombreCompleto(instructor)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ID: {instructor.persona.identificacion}
                        </p>
                        {instructor.nivelEducativo && (
                          <p className="text-xs text-gray-600 mt-1">
                            Nivel: {instructor.nivelEducativo.nombre}
                          </p>
                        )}
                        {instructor.areasConocimiento && instructor.areasConocimiento.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {instructor.areasConocimiento.slice(0, 3).map((area) => (
                              <span
                                key={area.id}
                                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                              >
                                {area.nombreAreaConocimiento}
                              </span>
                            ))}
                            {instructor.areasConocimiento.length > 3 && (
                              <span className="px-2 py-0.5 text-xs text-gray-500">
                                +{instructor.areasConocimiento.length - 3} más
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="instructor"
                        checked={isSelected}
                        onChange={() => setSelectedInstructor(instructor.id)}
                        className="w-5 h-5 text-primary border-gray-300 focus:ring-primary"
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              className="btn btn-sm btn-light"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleAsignar}
              disabled={!selectedInstructor || saving || instructores.length === 0}
            >
              {saving ? 'Asignando...' : 'Confirmar Asignación'}
              {!saving && <KeenIcon icon="check" className="ml-2" />}
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
