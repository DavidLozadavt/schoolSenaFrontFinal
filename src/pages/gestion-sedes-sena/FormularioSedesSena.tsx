import axios from 'axios';
import { useFormik } from 'formik';
import React, { useEffect, useState } from 'react';
import * as Yup from 'yup';
import Select from 'react-select';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>>;
}
interface Persona {
  nombre1: string;
  apellido1: string;
  identificacion: string;
}

interface Responsable {
  id: number;
  persona: Persona;
}

interface Ciudades {
  id: number;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
}
interface FormValues {
  nombre: string;
  jefeInmediato: string;
  descripcion: string;
  ciudad: { value: number; label: string } | null;
  empresa: { value: number; label: string } | null;
  direccion: string;
  email: string;
  telefono: string;
  celular: string;
  responsable: { value: number; label: string } | null;
  imagen: File | null;
}

const validationSchema = Yup.object({
  nombre: Yup.string().required('El nombre es obligatorio'),
  ciudad: Yup.object().nullable().required('La ciudad es obligatoria'),
  responsable: Yup.object().nullable().required('El responsable es obligatorio')
});

const FormularioSedesSena: React.FC<Props> = ({ isModalOpen, setIsModalOpen, setEvento }) => {
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

  const formik = useFormik<FormValues>({
    initialValues: {
      nombre: '',
      jefeInmediato: '',
      descripcion: '',
      ciudad: null,
      empresa: null,
      direccion: '',
      email: '',
      telefono: '',
      celular: '',
      responsable: null,
      imagen: null
    },

    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const formData = new FormData();

        formData.append('nombre', values.nombre);
        formData.append('jefeInmediato', values.jefeInmediato);
        formData.append('descripcion', values.descripcion);
        formData.append('direccion', values.direccion);
        formData.append('email', values.email);
        formData.append('telefono', values.telefono);
        formData.append('celular', values.celular);

        if (values.ciudad) {
          formData.append('idCiudad', String(values.ciudad.value));
        }
        if (values.responsable) {
          formData.append('idResponsable', String(values.responsable.value));
        }

        if (values.empresa) {
          formData.append('idEmpresa', String(values.empresa.value));
        }

        if (values.imagen) {
          formData.append('imagen', values.imagen);
        }

        await axios.post('sedesSena', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        alert('Sede creada correctamente');
        setEvento((prev) => !prev);
        setIsModalOpen(false);
      } catch (error) {
        alert('Error al registrar');
      } finally {
        setSubmitting(false);
      }
    }
  });
  if (!isModalOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header fijo */}
        <h2 className="text-lg font-semibold text-gray-900 px-6 py-4 border-b">Crear sede</h2>

        {/* Form con scroll */}
        <form onSubmit={formik.handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ciudad */}
            <div>
              <label className="text-sm font-medium text-gray-700">Ciudad</label>
              <Select
                options={options}
                placeholder="Selecciona la ciudad..."
                isClearable
                value={formik.values.ciudad}
                onChange={(value) => formik.setFieldValue('ciudad', value)}
              />
            </div>

            {/* Regional */}
            <div>
              <label className="text-sm font-medium text-gray-700">Regional</label>
              <Select
                options={options2}
                placeholder="Selecciona la regional..."
                isClearable
                value={formik.values.empresa}
                onChange={(value) => formik.setFieldValue('empresa', value)}
              />
            </div>

            {/* Responsable de la Sede */}
            <div>
              <label className="text-sm font-medium text-gray-700">Responsable de la sede</label>
              <Select
                options={options3}
                placeholder="Selecciona el responsable..."
                isClearable
                value={formik.values.responsable}
                onChange={(value) => formik.setFieldValue('responsable', value)}
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
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none
            focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
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
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm
                 hover:bg-blue-700 transition disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioSedesSena;
