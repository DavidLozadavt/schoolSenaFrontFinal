import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { Acta } from '../types';

interface ActaCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  idContrato: number | undefined;
  availableFichas: any[];
  ciudades: any[];
  onSuccess: () => void;
  actaToEdit?: Acta | null;
}

const ActaCreateModal: React.FC<ActaCreateModalProps> = ({
  isOpen,
  onClose,
  idContrato,
  availableFichas,
  ciudades,
  onSuccess,
  actaToEdit = null
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ciudadSearch, setCiudadSearch] = useState('');
  const [ciudadSeleccionadaLabel, setCiudadSeleccionadaLabel] = useState<string | null>(null);
  const [isCiudadFocused, setIsCiudadFocused] = useState(false);
  const [fichaSearch, setFichaSearch] = useState('');
  const [isFichaFocused, setIsFichaFocused] = useState(false);
  const [errors, setErrors] = useState<{ idCiudad?: string; lugar?: string }>({});

  const getInitialFormState = () => ({
    nombre: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '07:00',
    horaFin: '12:00',
    tipoActa: 'NORMAL',
    observacion: '',
    lugar: '',
    direccion: '',
    idCiudad: '',
    idFicha: '',
    agenda: [{ punto: '' }],
    objetivos: [{ objetivo: '' }],
    conclusiones: [{ conclusion: '' }],
    compromisos: [{ actividad: '', fecha: new Date().toISOString().split('T')[0], responsable: '' }]
  });

  const [formData, setFormData] = useState(getInitialFormState());

  const filteredCiudades = ciudades.filter(
    (c) =>
      c.descripcion.toLowerCase().includes(ciudadSearch.toLowerCase()) ||
      (c.departamento &&
        c.departamento.descripcion.toLowerCase().includes(ciudadSearch.toLowerCase()))
  );

  const handleFichaSearchChange = (search: string) => {
    setFichaSearch(search);
  };

  const filteredFichas = availableFichas.filter(
    (f) =>
      f.codigoFicha.toLowerCase().includes(fichaSearch.toLowerCase()) ||
      f.programaFormacion.toLowerCase().includes(fichaSearch.toLowerCase())
  );

  const selectedFicha = availableFichas.find((f) => f.idFicha.toString() === formData.idFicha);
  const fichaSeleccionadaLabel = selectedFicha
    ? `${selectedFicha.codigoFicha} - ${selectedFicha.programaFormacion}`
    : null;

  useEffect(() => {
    if (isOpen) {
      if (actaToEdit) {
        const fechaFormateada = actaToEdit.fecha
          ? actaToEdit.fecha.split('T')[0]
          : new Date().toISOString().split('T')[0];
        setFormData({
          nombre: actaToEdit.nombre || '',
          fecha: fechaFormateada,
          horaInicio: actaToEdit.horaInicio ? actaToEdit.horaInicio.substring(0, 5) : '07:00',
          horaFin: actaToEdit.horaFin ? actaToEdit.horaFin.substring(0, 5) : '12:00',
          tipoActa: actaToEdit.tipoActa || 'NORMAL',
          observacion: actaToEdit.observacion || '',
          lugar: actaToEdit.lugar || '',
          direccion: actaToEdit.direccion || '',
          idCiudad: actaToEdit.idCiudad?.toString() || '',
          idFicha: actaToEdit.idFicha?.toString() || '',
          agenda:
            actaToEdit.agenda && actaToEdit.agenda.length > 0
              ? actaToEdit.agenda.map((a) => ({ punto: a.punto }))
              : [{ punto: '' }],
          objetivos:
            actaToEdit.objetivos && actaToEdit.objetivos.length > 0
              ? actaToEdit.objetivos.map((o) => ({ objetivo: o.objetivo }))
              : [{ objetivo: '' }],
          conclusiones:
            actaToEdit.conclusiones && actaToEdit.conclusiones.length > 0
              ? actaToEdit.conclusiones.map((c) => ({ conclusion: c.conclusion }))
              : [{ conclusion: '' }],
          compromisos:
            actaToEdit.compromisos && actaToEdit.compromisos.length > 0
              ? actaToEdit.compromisos.map((c) => ({
                  actividad: c.actividad,
                  fecha: c.fecha ? c.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
                  responsable: c.responsable
                }))
              : [{ actividad: '', fecha: new Date().toISOString().split('T')[0], responsable: '' }]
        });
        // Set the selected city label when editing
        if (actaToEdit.idCiudad) {
          const ciudadEncontrada = ciudades.find((c) => c.id === actaToEdit.idCiudad);
          if (ciudadEncontrada) {
            setCiudadSeleccionadaLabel(
              `${ciudadEncontrada.descripcion}, ${ciudadEncontrada.departamento?.descripcion || ''}`
            );
          }
        }
      } else {
        setFormData(getInitialFormState());
        setCiudadSeleccionadaLabel(null);
      }
      setCiudadSearch('');
      setIsCiudadFocused(false);
      setFichaSearch('');
      setIsFichaFocused(false);
    } else {
      // Clean up when modal closes
      setCiudadSearch('');
      setIsCiudadFocused(false);
      setFichaSearch('');
      setIsFichaFocused(false);
    }
  }, [isOpen, actaToEdit, ciudades]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Agenda handlers
  const handleAgendaChange = (index: number, value: string) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index].punto = value;
    setFormData((prev) => ({ ...prev, agenda: newAgenda }));
  };

  const addAgendaItem = () => {
    setFormData((prev) => ({ ...prev, agenda: [...prev.agenda, { punto: '' }] }));
  };

  const removeAgendaItem = (index: number) => {
    if (formData.agenda.length > 1) {
      const newAgenda = formData.agenda.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, agenda: newAgenda }));
    }
  };

  // Objetivos handlers
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.objetivos];
    newObjectives[index].objetivo = value;
    setFormData((prev) => ({ ...prev, objetivos: newObjectives }));
  };

  const addObjectiveItem = () => {
    setFormData((prev) => ({ ...prev, objetivos: [...prev.objetivos, { objetivo: '' }] }));
  };

  const removeObjectiveItem = (index: number) => {
    if (formData.objetivos.length > 1) {
      const newObjectives = formData.objetivos.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, objetivos: newObjectives }));
    }
  };

  // Conclusiones handlers
  const handleConclusionChange = (index: number, value: string) => {
    const newConclusions = [...formData.conclusiones];
    newConclusions[index].conclusion = value;
    setFormData((prev) => ({ ...prev, conclusiones: newConclusions }));
  };

  const addConclusionItem = () => {
    setFormData((prev) => ({ ...prev, conclusiones: [...prev.conclusiones, { conclusion: '' }] }));
  };

  const removeConclusionItem = (index: number) => {
    if (formData.conclusiones.length > 1) {
      const newConclusions = formData.conclusiones.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, conclusiones: newConclusions }));
    }
  };

  // Compromisos handlers
  const handleCompromisoChange = (index: number, field: string, value: string) => {
    const newCompromisos = [...formData.compromisos];
    (newCompromisos[index] as any)[field] = value;
    setFormData((prev) => ({ ...prev, compromisos: newCompromisos }));
  };

  const addCompromisoItem = () => {
    setFormData((prev) => ({
      ...prev,
      compromisos: [
        ...prev.compromisos,
        { actividad: '', fecha: new Date().toISOString().split('T')[0], responsable: '' }
      ]
    }));
  };

  const removeCompromisoItem = (index: number) => {
    if (formData.compromisos.length > 1) {
      const newCompromisos = formData.compromisos.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, compromisos: newCompromisos }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idContrato) return;

    // Validaciones
    const newErrors: { idCiudad?: string; lugar?: string } = {};
    if (!formData.lugar.trim()) {
      newErrors.lugar = "El campo 'Lugar' es obligatorio.";
    }
    if (!formData.idCiudad) {
      newErrors.idCiudad = "El campo 'Ciudad' es obligatorio.";
    }

    setErrors(newErrors);

    // Si hay errores, no enviar el formulario
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        idContrato,
        idCiudad: parseInt(formData.idCiudad),
        idFicha: parseInt(formData.idFicha),
        agenda: formData.agenda.filter((i) => i.punto.trim() !== ''),
        objetivos: formData.objetivos.filter((i) => i.objetivo.trim() !== ''),
        conclusiones: formData.conclusiones.filter((i) => i.conclusion.trim() !== ''),
        compromisos: formData.compromisos.filter((i) => i.actividad.trim() !== '')
      };

      if (actaToEdit) {
        await axios.put(`actas/${actaToEdit.id}`, payload);
      } else {
        await axios.post('actas', payload);
      }

      onSuccess();
      onClose();
      // Reset form handled by useEffect on next open
    } catch (error) {
      console.error('Error al guardar acta:', error);
      alert('Error al guardar el acta. Por favor, intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isEdit = !!actaToEdit;
  const isLocked =
    actaToEdit?.asistencias &&
    actaToEdit.asistencias.length > 0 &&
    actaToEdit.asistencias.every((a) => a.aprueba === 'SI');

  return (
    <Modal open={true} onClose={onClose} className="mx-4 sm:mx-auto max-w-2xl w-full">
      <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full overflow-hidden shadow-2xl border-none">
        <ModalHeader className="bg-gray-50 dark:bg-coal-400/50 border-b border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl ${isLocked ? 'bg-green-100 dark:bg-green-500/10' : isEdit ? 'bg-blue-100 dark:bg-blue-500/10' : 'bg-blue-100 dark:bg-blue-500/10'} flex items-center justify-center`}
            >
              <i
                className={`ki-outline ${isLocked ? 'ki-lock' : isEdit ? 'ki-notepad-edit' : 'ki-plus'} ${isLocked ? 'text-green-600 dark:text-green-400' : isEdit ? 'text-blue-600 dark:text-blue-400' : 'text-blue-600 dark:text-blue-400'} text-xl`}
              />
            </div>
            <div>
              <ModalTitle className="text-lg font-bold text-gray-800 dark:text-white">
                {isLocked ? 'Acta Finalizada (Lectura)' : isEdit ? 'Editar Acta' : 'Nueva Acta'}
              </ModalTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLocked
                  ? 'Esta acta ha sido aceptada por todos los asistentes y no puede ser modificada.'
                  : isEdit
                    ? 'Modifique los datos del acta seleccionada'
                    : 'Registre una nueva acta en el sistema'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-coal-300 transition-colors"
          >
            <i className="ki-outline ki-cross text-lg" />
          </button>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <ModalBody className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {isLocked && (
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <i className="ki-outline ki-warning text-amber-600 dark:text-amber-400 text-lg mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    Acta Bloqueada
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80">
                    No se pueden realizar cambios porque todos los asistentes ya han
                    firmado/aprobado esta acta.
                  </p>
                </div>
              </div>
            )}

            <fieldset disabled={isLocked} className="space-y-6">
              {/* Datos Básicos */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-coal-300 pb-2">
                  <i className="ki-outline ki-information-2 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Datos Básicos
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Nombre del Acta
                  </label>
                  <input
                    name="nombre"
                    type="text"
                    required
                    placeholder="Ej: Acta de Seguimiento Etapa Productiva"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    value={formData.nombre}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Fecha
                    </label>
                    <input
                      name="fecha"
                      type="date"
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.fecha}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Tipo de Acta
                    </label>
                    <select
                      name="tipoActa"
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.tipoActa}
                      onChange={handleInputChange}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="EQUIPO EJECUTOR">Equipo Ejecutor</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Hora Inicio
                    </label>
                    <input
                      name="horaInicio"
                      type="time"
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.horaInicio}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Hora Fin
                    </label>
                    <input
                      name="horaFin"
                      type="time"
                      required
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.horaFin}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Ubicación y Ficha */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-coal-300 pb-2">
                  <i className="ki-outline ki-geolocation text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Ubicación y Ficha
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Ficha
                    </label>
                    <div className="relative">
                      <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={isFichaFocused ? fichaSearch : fichaSeleccionadaLabel || ''}
                        onFocus={() => !isLocked && setIsFichaFocused(true)}
                        onBlur={() => {
                          // Delay to allow clicking on dropdown options
                          setTimeout(() => setIsFichaFocused(false), 200);
                        }}
                        onChange={(e) => handleFichaSearchChange(e.target.value)}
                        placeholder={fichaSeleccionadaLabel || 'Buscar por código o programa...'}
                        className="w-full text-sm pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />

                      {/* Dropdown de fichas */}
                      {isFichaFocused && !isLocked && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          {(fichaSearch.trim() === '' ? availableFichas : filteredFichas).map(
                            (ficha) => (
                              <button
                                key={ficha.idFicha}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, idFicha: ficha.idFicha.toString() });
                                  setFichaSearch('');
                                  setIsFichaFocused(false);
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/20 border-b border-gray-100 dark:border-coal-300 last:border-b-0 text-sm text-gray-700 dark:text-gray-200 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{ficha.codigoFicha}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {ficha.programaFormacion}
                                  </span>
                                </div>
                              </button>
                            )
                          )}
                          {fichaSearch.trim() !== '' && filteredFichas.length === 0 && (
                            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                              No se encontraron resultados
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Ciudad
                    </label>
                    <div className="relative">
                      <i className="ki-outline ki-magnifier absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={isCiudadFocused ? ciudadSearch : ciudadSeleccionadaLabel || ''}
                        onFocus={() => !isLocked && setIsCiudadFocused(true)}
                        onBlur={() => {
                          // Delay to allow clicking on dropdown options
                          setTimeout(() => setIsCiudadFocused(false), 200);
                        }}
                        onChange={(e) => setCiudadSearch(e.target.value)}
                        placeholder={ciudadSeleccionadaLabel || 'Buscar ciudad o departamento...'}
                        className={`w-full text-sm pl-9 pr-3 py-2 rounded-lg border ${
                          errors.idCiudad
                            ? 'border-red-500'
                            : 'border-gray-200 dark:border-coal-300'
                        } bg-white dark:bg-coal-400 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      />

                      {/* Dropdown de ciudades filtradas */}
                      {isCiudadFocused && !isLocked && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                          {(ciudadSearch.trim() === '' ? ciudades : filteredCiudades)
                            .slice(0, 50)
                            .map((ciudad) => (
                              <button
                                key={ciudad.id}
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, idCiudad: ciudad.id.toString() });
                                  setCiudadSeleccionadaLabel(
                                    `${ciudad.descripcion}, ${ciudad.departamento?.descripcion || ''}`
                                  );
                                  setCiudadSearch('');
                                  setIsCiudadFocused(false);
                                  setErrors((prev) => ({ ...prev, idCiudad: undefined }));
                                }}
                                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-500/20 border-b border-gray-100 dark:border-coal-300 last:border-b-0 text-sm text-gray-700 dark:text-gray-200 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{ciudad.descripcion}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {ciudad.departamento?.descripcion || ''}
                                  </span>
                                </div>
                              </button>
                            ))}
                          {ciudadSearch.trim() !== '' && filteredCiudades.length === 0 && (
                            <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                              No se encontraron resultados
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mensaje de error */}
                    {errors.idCiudad && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <i className="ki-outline ki-warning text-xs" />
                        {errors.idCiudad}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Lugar (Ambiente/Virtual)
                    </label>
                    <input
                      name="lugar"
                      required
                      type="text"
                      placeholder="Ej: Ambiente 302"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.lugar}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                      Dirección
                    </label>
                    <input
                      name="direccion"
                      required
                      type="text"
                      placeholder="Ej: Calle 52 # 13-65"
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                      value={formData.direccion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Agenda */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-coal-300 pb-2">
                  <div className="flex items-center gap-2">
                    <i className="ki-outline ki-list text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Agenda / Puntos a tratar
                    </h3>
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={addAgendaItem}
                      className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <i className="ki-outline ki-plus text-sm" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {formData.agenda.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Punto ${index + 1}`}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={item.punto}
                        onChange={(e) => handleAgendaChange(index, e.target.value)}
                      />
                      {formData.agenda.length > 1 && !isLocked && (
                        <button
                          type="button"
                          onClick={() => removeAgendaItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <i className="ki-outline ki-trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-coal-300 pb-2">
                  <div className="flex items-center gap-2">
                    <i className="ki-outline ki-target text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Objetivos
                    </h3>
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={addObjectiveItem}
                      className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <i className="ki-outline ki-plus text-sm" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {formData.objetivos.map((obj, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Objetivo ${index + 1}`}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                        value={obj.objetivo}
                        onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      />
                      {formData.objetivos.length > 1 && !isLocked && (
                        <button
                          type="button"
                          onClick={() => removeObjectiveItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <i className="ki-outline ki-trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusiones */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-coal-300 pb-2">
                  <div className="flex items-center gap-2">
                    <i className="ki-outline ki-check-square text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Conclusiones
                    </h3>
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={addConclusionItem}
                      className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <i className="ki-outline ki-plus text-sm" />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {formData.conclusiones.map((concl, index) => (
                    <div key={index} className="flex gap-2">
                      <textarea
                        placeholder={`Conclusión ${index + 1}`}
                        rows={2}
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                        value={concl.conclusion}
                        onChange={(e) => handleConclusionChange(index, e.target.value)}
                      />
                      {formData.conclusiones.length > 1 && !isLocked && (
                        <button
                          type="button"
                          onClick={() => removeConclusionItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        >
                          <i className="ki-outline ki-trash" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Compromisos */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-coal-300 pb-2">
                  <div className="flex items-center gap-2">
                    <i className="ki-outline ki-calendar-tick text-blue-500" />
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                      Compromisos
                    </h3>
                  </div>
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={addCompromisoItem}
                      className="p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <i className="ki-outline ki-plus text-sm" />
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {formData.compromisos.map((comp, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-coal-400/50 rounded-xl border border-gray-100 dark:border-coal-300 space-y-3 relative group"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">
                            Actividad / Desicisión
                          </label>
                          <input
                            type="text"
                            placeholder="Qué se debe hacer..."
                            className="w-full px-3 py-1.5 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={comp.actividad}
                            onChange={(e) =>
                              handleCompromisoChange(index, 'actividad', e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">
                            Responsable
                          </label>
                          <input
                            type="text"
                            placeholder="Responsable"
                            className="w-full px-3 py-1.5 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={comp.responsable}
                            onChange={(e) =>
                              handleCompromisoChange(index, 'responsable', e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          Fecha Entrega
                        </label>
                        <input
                          type="date"
                          className="w-full px-3 py-1.5 bg-white dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                          value={comp.fecha}
                          onChange={(e) => handleCompromisoChange(index, 'fecha', e.target.value)}
                        />
                      </div>
                      {formData.compromisos.length > 1 && !isLocked && (
                        <button
                          type="button"
                          onClick={() => removeCompromisoItem(index)}
                          className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-coal-300 text-red-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-50 transition-colors border border-gray-100 dark:border-coal-200"
                        >
                          <i className="ki-outline ki-trash text-sm" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Observación General */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-coal-300 pb-2">
                  <i className="ki-outline ki-message-text-2 text-blue-500" />
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Observaciones Generales
                  </h3>
                </div>
                <textarea
                  name="observacion"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-coal-400 border border-gray-200 dark:border-coal-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none"
                  placeholder="Escriba los detalles generales del acta..."
                  value={formData.observacion}
                  onChange={handleInputChange}
                />
              </div>
            </fieldset>
          </ModalBody>
          <ModalHeader className="border-t border-gray-100 dark:border-coal-300 px-6 py-4 flex justify-end gap-3 bg-gray-50 dark:bg-coal-400/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              {isLocked ? 'Cerrar' : 'Cancelar'}
            </button>
            {!isLocked && (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-8 py-2.5 ${isEdit ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'} text-white text-xs font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <i className="ki-outline ki-loading animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className={`ki-outline ${isEdit ? 'ki-check-circle' : 'ki-plus-circle'}`} />
                    {isEdit ? 'Guardar Cambios' : 'Crear Acta'}
                  </>
                )}
              </button>
            )}
          </ModalHeader>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default ActaCreateModal;
