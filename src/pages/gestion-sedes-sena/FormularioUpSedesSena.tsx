import axios from 'axios';
import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import Select from 'react-select';

interface Props {
  idSede: string;
  setIdSede: (idRegional: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Persona {
  nombre1: string;
  apellido1: string;
  identificacion: string;
}

interface Ciudades {
  id: number;
  descripcion: string;
}
interface Empresa {
  id: number;
  razonSocial: string;
}

interface Responsable {
  id: number;
  persona: Persona;
}

interface FormValues {
  nombre: string;
  jefeInmediato: string;
  descripcion: string;
  direccion: string;
  email: string;
  telefono: string;
  celular: string;
  idCiudad: number;
  idEmpresa: number;
  idResponsable: number;
}

const validationSchema = Yup.object({
  nombre: Yup.string(),
  jefeInmediato: Yup.string(),
  descripcion: Yup.string(),
  direccion: Yup.string(),
  email: Yup.string().email('Email inválido'),
  telefono: Yup.number(),
  celular: Yup.number(),
  idCiudad: Yup.number().typeError('Debe seleccionar una ciudad'),
  idEmpresa: Yup.number().typeError('Debe seleccionar una regional'),
  idResponsable: Yup.number().typeError('Debe seleccionar una responsable')
});

const FormularioUpSedesSena: React.FC<Props> = ({
  idSede,
  setIdSede,
  isModalOpen,
  setIsModalOpen,
  setEvento
}) => {
  const formik = useFormik<FormValues>({
    enableReinitialize: true,
    initialValues: {
      nombre: '',
      jefeInmediato: '',
      descripcion: '',
      direccion: '',
      email: '',
      telefono: '',
      celular: '',
      idEmpresa: null as any,
      idCiudad: null as any,
      idResponsable: null as any
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Enviar solo campos modificados
        const payload = Object.fromEntries(
          Object.entries(values).filter(([_, value]) => value !== '' && value !== 0)
        );

        await axios.patch(`sedesSena/${idSede}`, payload);

        alert('Sede actualizada correctamente');
        setEvento((prev) => !prev);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Error al actualizar la sede');
      } finally {
        setSubmitting(false);
        setIsModalOpen(false);
        setIdSede('');
      }
    }
  });

  useEffect(() => {
    if (!idSede) return;

    const loadRegional = async () => {
      try {
        const res = await axios.get(`sedesSena/${idSede}`);
        formik.setValues(res.data.data);
      } catch (error) {
        alert('Error al cargar la sede');
      }
    };

    loadRegional();
  }, [idSede]);

  const [ciudades, setCiudades] = useState<Ciudades[]>([]);
  const [regionales, setRegionales] = useState<Empresa[]>([]);
  const [responsable, setResponsable] = useState<Responsable[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [ciudadesRes, regionalesRes, usuariosRes] = await Promise.all([
          axios.get('ciudades'),
          axios.get('regional'),
          axios.get('sedesSena/users')
        ]);
        setCiudades(ciudadesRes.data);
        setRegionales(regionalesRes.data);
        setResponsable(usuariosRes.data);
      } catch (error) {}
    };

    loadData();
  }, []);

  const options = ciudades.map((val) => ({
    value: val.id,
    label: val.descripcion
  }));
  const options2 = regionales.map((val) => ({
    value: val.id,
    label: val.razonSocial
  }));
  const options3 = responsable.map((val) => ({
    value: val.id,
    label: `${val.persona.nombre1}  ${val.persona.apellido1} ${val.persona.identificacion}`
  }));

  if (!isModalOpen) return null;

  return (
    <div>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Botón cerrar */}
          <button
            type="button"
            onClick={() => {
              setIsModalOpen(false);
              setIdSede('');
              formik.resetForm();
            }}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>

          <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Editar sede</h2>

          <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ciudad */}
              <div>
                <label className="text-sm font-medium text-gray-700">Ciudad</label>

                <Select
                  options={options}
                  isClearable
                  placeholder="Seleccione una ciudad"
                  value={options.find((option) => option.value === formik.values.idCiudad) || null}
                  onChange={(option) => {
                    formik.setFieldValue('idCiudad', option ? option.value : null);
                  }}
                />
              </div>

              {/* Regional */}
              <div>
                <label className="text-sm font-medium text-gray-700">Regional</label>
                <Select
                  options={options2}
                  placeholder="Selecciona la regional..."
                  isClearable
                  value={
                    options2.find((option) => option.value === formik.values.idEmpresa) || null
                  }
                  onChange={(option) => {
                    formik.setFieldValue('idCiudad', option ? option.value : null);
                  }}
                />
              </div>

              {/* Responsable de la Sede */}
              <div>
                <label className="text-sm font-medium text-gray-700">Responsable de la sede</label>
                <Select
                  options={options3}
                  placeholder="Selecciona el responsable..."
                  isClearable
                  value={
                    options3.find((option) => option.value === formik.values.idResponsable) || null
                  }
                  onChange={(option) => {
                    formik.setFieldValue('idCiudad', option ? option.value : null);
                  }}
                />
              </div>

              {/* Imagen */}
              {/**
             * 
             <div>
               <label className="text-sm font-medium text-gray-700">Imagen</label>
               <input
                 type="file"
                 accept="image/*"
                 onChange={(e) => formik.setFieldValue('imagen', e.currentTarget.files?.[0] || null)}
                 className="w-full text-sm"
               />
             </div>
             * 
             */}

              {/* Nombre ocupa 2 columnas */}
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nombre de la sede</label>
                <input
                  type="text"
                  {...formik.getFieldProps('nombre')}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none
                  ${
                    formik.touched.nombre && formik.errors.nombre
                      ? 'border-red-500'
                      : 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                  }
                `}
                />

                {formik.touched.nombre && formik.errors.nombre && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.nombre}</p>
                )}
              </div>

              {/* Jefe inmediato */}
              <div>
                <label className="text-sm font-medium text-gray-700">Jefe inmediato</label>
                <input
                  type="text"
                  {...formik.getFieldProps('jefeInmediato')}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {formik.touched.jefeInmediato && formik.errors.jefeInmediato && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.jefeInmediato}</p>
                )}
              </div>

              {/* Dirección */}
              <div>
                <label className="text-sm font-medium text-gray-700">Dirección</label>
                <input
                  type="text"
                  {...formik.getFieldProps('direccion')}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {formik.touched.direccion && formik.errors.direccion && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.direccion}</p>
                )}
              </div>
              {/* Descripcion */}
              <div>
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <input
                  type="text"
                  {...formik.getFieldProps('descripcion')}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {formik.touched.descripcion && formik.errors.descripcion && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.descripcion}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-700">Correo</label>
                <input
                  type="email"
                  {...formik.getFieldProps('email')}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-sm font-medium text-gray-700">Teléfono</label>
                <input
                  type="text"
                  {...formik.getFieldProps('telefono')}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {formik.touched.telefono && formik.errors.telefono && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.telefono}</p>
                )}
              </div>

              {/* Celular */}
              <div>
                <label className="text-sm font-medium text-gray-700">Celular</label>
                <input
                  type="text"
                  {...formik.getFieldProps('celular')}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                {formik.touched.celular && formik.errors.celular && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.celular}</p>
                )}
              </div>
            </div>

            {/* Footer fijo */}
            <div className="flex justify-end gap-2 mt-6 border-t pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>

              <button
              type="submit"
              disabled={formik.isSubmitting}
              className={`px-4 py-2 rounded-lg text-sm text-white transition
              ${formik.isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {formik.isSubmitting ? 'Actualizando...' : 'Actualizar'}
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormularioUpSedesSena;
