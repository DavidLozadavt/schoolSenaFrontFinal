import axios from 'axios';
import { useFormik } from 'formik';
import React, { useContext, useEffect, useState } from 'react';
import * as Yup from 'yup';
import Select from 'react-select';
import { AuthContext } from '@/auth/providers/JWTProvider';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: (isModalOpen: boolean) => void;
  setEvento: React.Dispatch<React.SetStateAction<boolean>> ;
}

interface TipoInfraestructura {
  id: number;
  nombre: string;
}

interface Sedes {
  id: number;
  nombre: string;
}

interface FormValues {
  nombreInfraestructura: string;
  capacidad: number;
  idSede: number | null;
  idTipoInfraestructura: number | null;
}

const validationSchema = Yup.object({
  nombreInfraestructura: Yup.string().required('El nombre es obligatorio'),
  capacidad: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser un número entero')
    .positive('Debe ser mayor que 0')
    .max(99, 'Debe ser menor que 100')
    .required('La capacidad es obligatoria'),

  idSede: Yup.number().typeError('Debe seleccionar la sede').required('La sede es obligatoria'),
  idTipoInfraestructura: Yup.number()
    .typeError('Debe seleccionar el tipo de ambiente')
    .required('El ambiente es obligatorio')
});

const FormularioInfraestructura: React.FC<Props> = ({ isModalOpen, setIsModalOpen, setEvento }) => {
  const authContext = useContext(AuthContext);

  const [tipoInfraestructura, setTipoInfraestructura] = useState<TipoInfraestructura[]>([]);
  const [sedes, setSedes] = useState<Sedes[]>([]);

  const formik = useFormik<FormValues>({
    initialValues: {
      nombreInfraestructura: '',
      capacidad:1,
      idSede: null,
      idTipoInfraestructura: null
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await axios.post('infraestructuras', values);
        setEvento((prev) => !prev);
        setIsModalOpen(false);
      } catch (error) {
        console.error(error);
      }
    }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [infraRes, sedesRes] = await Promise.all([
          axios.get('infraestructuras/tipos'),
          axios.get(`sedes/regional/${authContext?.empresa?.id}`)
        ]);

        setTipoInfraestructura(infraRes.data.data);
        setSedes(sedesRes.data.data);
      } catch (error) {
        console.error(error);
      }
    };

    if (authContext?.empresa?.id) {
      loadData();
    }
  }, [authContext?.empresa?.id]);

  if (!isModalOpen) return null;

  const optionsInfra = tipoInfraestructura.map((val) => ({
    value: val.id,
    label: val.nombre
  }));

  const optionsSedes = sedes.map((val) => ({
    value: val.id,
    label: val.nombre
  }));

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear Ambiente</h2>

        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4">
          {/* Sede */}
          <div>
            <label className="text-sm font-medium text-gray-700">Sede</label>
            <Select
              options={optionsSedes}
              isClearable
              placeholder="Seleccione la sede"
              value={optionsSedes.find((option) => option.value === formik.values.idSede) || null}
              onChange={(option) => formik.setFieldValue('idSede', option ? option.value : null)}
            />
            {formik.touched.idSede && formik.errors.idSede && (
              <p className="text-xs text-red-500">{formik.errors.idSede}</p>
            )}
          </div>
          {/* Tipo de ambiente */}
          <div>
            <label className="text-sm font-medium text-gray-700">Tipo de ambiente</label>
            <Select
              options={optionsInfra}
              isClearable
              placeholder="Seleccione el tipo"
              value={
                optionsInfra.find(
                  (option) => option.value === formik.values.idTipoInfraestructura
                ) || null
              }
              onChange={(option) =>
                formik.setFieldValue('idTipoInfraestructura', option ? option.value : null)
              }
            />
            {formik.touched.idTipoInfraestructura && formik.errors.idTipoInfraestructura && (
              <p className="text-xs text-red-500">{formik.errors.idTipoInfraestructura}</p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <label className="text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              {...formik.getFieldProps('nombreInfraestructura')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.nombreInfraestructura && formik.errors.nombreInfraestructura && (
              <p className="text-xs text-red-500">{formik.errors.nombreInfraestructura}</p>
            )}
          </div>

          {/* Capacidad */}
          <div>
            <label className="text-sm font-medium text-gray-700">Capacidad</label>
            <input
              type="number"
              min={1}
              max={99}
              {...formik.getFieldProps('capacidad')}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none
              focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            {formik.touched.capacidad && formik.errors.capacidad && (
              <p className="text-xs text-red-500">{formik.errors.capacidad}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioInfraestructura;
