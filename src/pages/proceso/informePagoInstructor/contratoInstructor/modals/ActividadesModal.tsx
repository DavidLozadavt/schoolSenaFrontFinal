import React, { useRef } from 'react';
import { Contrato, ActividadFormData } from '../types';
import { ActividadesForm } from './ActividadesForm';
import { ActividadesList } from './ActividadesList';

interface ActividadesModalProps {
  isOpen: boolean;
  contrato: Contrato | null;
  actividades: any[];
  loadingActividades: boolean;
  showHelpModal: boolean;
  openForm: boolean;
  actividadForm: ActividadFormData;
  editingActividad: any | null;
  savingActividad: boolean;
  baseActividadIds: number[];
  onClose: () => void;
  onEditActividad: (actividad: any) => void;
  onDeleteActividad: (id: number) => void;
  onSaveActividad: () => void;
  onCancelActividadEdit: () => void;
  onFormChange: (data: ActividadFormData) => void;
  onToggleForm: (open: boolean) => void;
  onShowHelpModal: () => void;
}

export const ActividadesModal: React.FC<ActividadesModalProps> = ({
  isOpen,
  contrato,
  actividades,
  loadingActividades,
  openForm,
  actividadForm,
  editingActividad,
  savingActividad,
  baseActividadIds,
  onClose,
  onEditActividad,
  onDeleteActividad,
  onSaveActividad,
  onCancelActividadEdit,
  onFormChange,
  onToggleForm,
  onShowHelpModal
}) => {
  const formRef = useRef<HTMLDivElement>(null);

  const handleEditActividad = (actividad: any) => {
    onEditActividad(actividad);
    onToggleForm(true); // Abre el formulario
    // Hace scroll hacia el formulario después de actualizar el DOM
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  if (!isOpen || !contrato) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-coal-500 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-coal-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center">
              <i className="ki-outline ki-clipboard text-blue-600 dark:text-blue-400 text-lg" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Actividades del Contrato
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Contrato #{contrato.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-coal-400 flex items-center justify-center transition-colors"
          >
            <i className="ki-outline ki-cross text-gray-500 dark:text-gray-400 text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={formRef}>
            <ActividadesForm
              isOpen={openForm}
              isEditing={editingActividad !== null}
              loading={savingActividad}
              formData={actividadForm}
              onFormChange={onFormChange}
              onToggle={onToggleForm}
              onSave={onSaveActividad}
              onCancel={editingActividad ? onCancelActividadEdit : undefined}
            />
          </div>

          <ActividadesList
            actividades={actividades}
            loading={loadingActividades}
            baseActividadIds={baseActividadIds}
            onEdit={handleEditActividad}
            onDelete={onDeleteActividad}
            onShowHelp={onShowHelpModal}
          />
        </div>
      </div>
    </div>
  );
};
