import React, { useImperativeHandle, forwardRef } from 'react';
import { useContrato } from './hooks/useContrato';
import { useActividades } from './hooks/useActividades';
import {
  ContratoHeader,
  ActividadesButton,
  ContratoSupervisor
} from './components';
import {
  ActividadesModal,
  HelpModal,
  MissingFieldsModal
} from './modals';
import { ContratoGeneralInstructorRef } from './types';
import { ACTIVIDADES_MINIMAS } from './constants';

const ContratoGeneralInstructor = forwardRef<ContratoGeneralInstructorRef, {}>((props, ref) => {
  const {
    contrato,
    loading,
    editing,
    saving,
    ciudades,
    ciudadSearch,
    form,
    setForm,
    setCiudadSearch,
    handleEdit,
    handleCancel,
    handleSave,
    ciudadesFiltradas,
    ciudadSeleccionadaLabel
  } = useContrato();

  const {
    actividades,
    loadingActividades,
    showActividadesModal,
    showHelpModal,
    editingActividad,
    savingActividad,
    totalActividades,
    openForm,
    actividadForm,
    baseActividadIds,
    setShowActividadesModal,
    setShowHelpModal,
    setOpenForm,
    setActividadForm,
    handleOpenActividades,
    handleCloseActividadesModal,
    handleEditActividad,
    handleCancelActividadEdit,
    handleSaveActividad,
    handleDeleteActividad,
    handleRegistrarBase
  } = useActividades(contrato?.id ?? null);

  const [showMissingFieldsModal, setShowMissingFieldsModal] = React.useState(false);
  const [missingFields, setMissingFields] = React.useState<string[]>([]);

  // Validación del formulario
  useImperativeHandle(ref, () => ({
    validate: () => {
      const errors: string[] = [];

      if (!form.supervisorContrato.trim()) {
        errors.push('El nombre del supervisor es obligatorio');
      }
      if (!form.cargoSupervisor.trim()) {
        errors.push('El cargo del supervisor es obligatorio');
      }
      if (!form.objetoContrato.trim()) {
        errors.push('El objeto del contrato es obligatorio');
      }
      if (!form.formaDePago) {
        errors.push('La forma de pago es obligatoria');
      }
      if (!form.descripcionFormaPago.trim()) {
        errors.push('La descripción de la forma de pago es obligatoria');
      }
      if (!form.siif) {
        errors.push('El SIIF es obligatorio');
      }
      if (!form.ciudadExpedicionId) {
        errors.push('La ciudad de expedición del documento es obligatoria');
      }
      if (!totalActividades || totalActividades < ACTIVIDADES_MINIMAS) {
        errors.push(
          `Se requieren mínimo ${ACTIVIDADES_MINIMAS} actividades. Actualmente tiene ${totalActividades || 0}`
        );
      }

      if (errors.length > 0) {
        setMissingFields(errors);
        setShowMissingFieldsModal(true);
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!contrato) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No se encontró un contrato activo.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden">
        {/* ── Banner centro de formación ── */}
        <ContratoHeader contrato={contrato} />

        {/* ── Botón de Actividades ── */}
        <ActividadesButton
          totalActividades={totalActividades}
          onOpenActividades={handleOpenActividades}
        />

        {/* ── Sección supervisor y detalles ── */}
        <ContratoSupervisor
          contrato={contrato}
          editing={editing}
          saving={saving}
          form={form}
          ciudades={ciudades}
          ciudadSearch={ciudadSearch}
          ciudadesFiltradas={ciudadesFiltradas}
          ciudadSeleccionadaLabel={ciudadSeleccionadaLabel}
          onEdit={handleEdit}
          onCancel={handleCancel}
          onSave={handleSave}
          onFormChange={setForm}
          onCiudadSearchChange={setCiudadSearch}
        />
      </div>

      {/* ── Modales ── */}
      <MissingFieldsModal
        isOpen={showMissingFieldsModal}
        missingFields={missingFields}
        onClose={() => setShowMissingFieldsModal(false)}
      />

      <ActividadesModal
        isOpen={showActividadesModal}
        contrato={contrato}
        actividades={actividades}
        loadingActividades={loadingActividades}
        showHelpModal={showHelpModal}
        openForm={openForm}
        actividadForm={actividadForm}
        editingActividad={editingActividad}
        savingActividad={savingActividad}
        baseActividadIds={baseActividadIds}
        onClose={handleCloseActividadesModal}
        onEditActividad={handleEditActividad}
        onDeleteActividad={handleDeleteActividad}
        onSaveActividad={handleSaveActividad}
        onCancelActividadEdit={handleCancelActividadEdit}
        onFormChange={setActividadForm}
        onToggleForm={setOpenForm}
        onShowHelpModal={() => setShowHelpModal(true)}
      />

      <HelpModal
        isOpen={showHelpModal}
        loading={savingActividad}
        onClose={() => setShowHelpModal(false)}
        onGenerateActividades={async () => {
          await handleRegistrarBase();
          setShowHelpModal(false);
        }}
      />
    </div>
  );
});

ContratoGeneralInstructor.displayName = 'ContratoGeneralInstructor';

export default ContratoGeneralInstructor;
