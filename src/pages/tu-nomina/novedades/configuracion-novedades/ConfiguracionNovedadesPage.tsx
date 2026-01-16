import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Container } from '@/components/container';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useLayout } from '@/providers';

import { Scrollspy } from '@/components/scrollspy/Scrollspy';
import clsx from 'clsx';
import { useResponsive, useScrollPosition } from '@/hooks';

import axios from 'axios';
import { useSnackbar } from 'notistack';
import { NumericFormat } from 'react-number-format';

export interface FormDataInterface {
  id: string;
  diasMaternidadNormal: string | null;
  diasMaternidadMultiple: string | null;
  diasMaternidadPrematura: string | null;
  diasPaternidad: string | null;
  diasNinez: string | null;
  diasLutoFamiliar: string | null;
  diasLutoComp: string | null;
  diasCalamidad: string | null;
  diasElectoral: string | null;
  diasEnfermedadGral: string | null;
  diasEnfermedadProf: string | null;
  diasElectoralJurado: string | null;
  diasAccidenteLab: string | null;
  created_at?: string;
  updated_at?: string;
}
const ConfiguracionNovedadesPage = () => {
  const { currentLayout } = useLayout();
  const { enqueueSnackbar } = useSnackbar();

  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const parentRef = useRef<HTMLElement | Document>(document);
  const scrollPosition = useScrollPosition({ targetRef: parentRef });

  useEffect(() => {
    const scrollableElement = document.getElementById('scrollable_content');
    if (scrollableElement) parentRef.current = scrollableElement;
  }, []);

  const [formData, setFormData] = useState<FormDataInterface>({
    id: '',
    diasMaternidadNormal: '',
    diasMaternidadMultiple: '',
    diasMaternidadPrematura: '',
    diasPaternidad: '',
    diasNinez: '',
    diasLutoFamiliar: '',
    diasLutoComp: '',
    diasCalamidad: '',
    diasElectoral: '',
    diasEnfermedadGral: '',
    diasEnfermedadProf: '',
    diasAccidenteLab: '',
    diasElectoralJurado: '',
    created_at: '',
    updated_at: ''
  });

  const fetchData = useCallback(async () => {
    try {
      const response = await axios.get('configurations_incapacidades');
      setConfig(response.data);
      setFormData((prevState) => ({
        ...prevState,
        ...response.data
      }));
    } catch (error) {
      enqueueSnackbar('Error al cargar los datos.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const validateForm = (): string | null => {
    const newErrors: Record<string, string> = {};
    const fields = [
      'diasMaternidadNormal',
      'diasMaternidadMultiple',
      'diasMaternidadPrematura',
      'diasPaternidad',
      'diasNinez',
      'diasLutoFamiliar',
      'diasLutoComp',
      'diasCalamidad',
      'diasElectoral',
      'diasEnfermedadGral',
      'diasEnfermedadProf',
      'diasElectoralJurado',
      'diasAccidenteLab'
    ];

    let firstErrorField: string | null = null;

    fields.forEach((field) => {
      const rawValue = formData[field as keyof FormDataInterface];

      if (rawValue === '' || rawValue === null || rawValue === undefined) {
        newErrors[field] = 'Campo obligatorio';
        if (!firstErrorField) firstErrorField = field;
        return;
      }

      const value = Number(rawValue);

      if (isNaN(value)) {
        newErrors[field] = 'Debe ser un número válido';
        if (!firstErrorField) firstErrorField = field;
      }
    });

    setErrors(newErrors);
    return firstErrorField;
  };

  const handleSave = async () => {
    const firstErrorField = validateForm();
    if (firstErrorField) {
      enqueueSnackbar('Por favor complete todos los campos correctamente antes de guardar.', {
        variant: 'error'
      });

      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
      return;
    }

    const formPayload = {
      diasMaternidadNormal: Number(formData.diasMaternidadNormal),
      diasMaternidadMultiple: Number(formData.diasMaternidadMultiple),
      diasMaternidadPrematura: Number(formData.diasMaternidadPrematura),
      diasPaternidad: Number(formData.diasPaternidad),
      diasNinez: Number(formData.diasNinez),
      diasLutoFamiliar: Number(formData.diasLutoFamiliar),
      diasLutoComp: Number(formData.diasLutoComp),
      diasCalamidad: Number(formData.diasCalamidad),
      diasElectoral: Number(formData.diasElectoral),
      diasEnfermedadGral: Number(formData.diasEnfermedadGral),
      diasEnfermedadProf: Number(formData.diasEnfermedadProf),
      diasAccidenteLab: Number(formData.diasAccidenteLab),
      diasElectoralJurado: Number(formData.diasElectoralJurado)
    };

    try {
      if (formData.id) {
        await axios.put(`configurations_incapacidades/${formData.id}`, formPayload);
        enqueueSnackbar('Configuración actualizada con éxito.', { variant: 'success' });
      } else {
        await axios.post('configurations_incapacidades', formPayload);
        enqueueSnackbar('Configuración guardada con éxito.', { variant: 'success' });
      }
      fetchData();
    } catch (error) {
      enqueueSnackbar('Error al guardar los datos.', { variant: 'error' });
    }
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value
    }));

    let errorMsg = '';
    if (value === '') {
      errorMsg = 'Campo obligatorio';
    } else if (isNaN(Number(value))) {
      errorMsg = 'Debe ser un número válido';
    }

    setErrors((prev) => ({
      ...prev,
      [fieldId]: errorMsg
    }));
  };

  const formFields = [
    { id: 'diasMaternidadNormal', label: 'Días Maternidad Normal' },
    { id: 'diasMaternidadMultiple', label: 'Días Maternidad Múltiple' },
    { id: 'diasMaternidadPrematura', label: 'Días Maternidad Prematura' },
    { id: 'diasPaternidad', label: 'Días Paternidad' },
    { id: 'diasNinez', label: 'Días Licencia por Niñez' },
    { id: 'diasLutoFamiliar', label: 'Días Luto Familiar' },
    { id: 'diasLutoComp', label: 'Días Luto Compañero(a)' },
    { id: 'diasCalamidad', label: 'Días Calamidad Doméstica' },
    { id: 'diasElectoral', label: 'Días Permiso Electoral' },
    { id: 'diasEnfermedadGral', label: 'Días Enfermedad General' },
    { id: 'diasEnfermedadProf', label: 'Días Enfermedad Profesional' },
    { id: 'diasAccidenteLab', label: 'Días Accidente Laboral' },
    { id: 'diasElectoralJurado', label: 'Días Permiso Electoral Jurado'}
  ];

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Configuración valores incapacidad</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        <div className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <div className="flex flex-col items-stretch grow gap-5 lg:gap-7.5">
              <div className="card pb-2.5">
                <div className="card-header">
                  <h3 className="card-title">
                    Configuración de Días por Tipo de Incapacidad o Licencia
                  </h3>
                </div>

                <div className="card-body grid gap-5">
                  {formFields.map((field) => (
                    <div className="w-full" key={field.id}>
                      <div className="flex items-baseline flex-wrap lg:flex-nowrap gap-2.5">
                        <label
                          htmlFor={field.id}
                          className="form-label flex items-center gap-1 max-w-64"
                        >
                          {field.label}
                          <span className="text-red-500">*</span>
                        </label>

                        <input
                          id={field.id}
                          name={field.id}
                          type="number"
                          className={`input ${errors[field.id] ? 'border-red-500' : ''}`}
                          placeholder="Ingrese los días"
                          min="0"
                          value={formData[field.id as keyof FormDataInterface] || ''}
                          onChange={(e) => handleInputChange(field.id, e.target.value)}
                        />
                      </div>

                      {errors[field.id] && (
                        <div className="text-red-500 text-sm mt-2 ml-[16.5rem]">
                          {errors[field.id]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Confirmar</h3>
                </div>
                <div className="card-body">
                  <p className="text-sm text-gray-700 mb-4">
                    <span className="text-red-500">*</span> Campos obligatorios. Por favor verifique
                    los valores antes de guardar. Todos los campos son obligatorios
                  </p>

                  <div className="flex justify-end gap-2.5 mt-2">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={Object.keys(errors).some((key) => errors[key])}
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </Fragment>
  );
};

export { ConfiguracionNovedadesPage };