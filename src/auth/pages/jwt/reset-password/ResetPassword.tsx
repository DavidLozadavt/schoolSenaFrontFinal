import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import axios from 'axios';

import { useLayout } from '@/providers';

const VITE_APP_API_URL = import.meta.env.VITE_APP_API_URL;

const initialValues = {
  email: ''
};

const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email('Formato de email inválido')
    .min(3, 'Mínimo 3 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .required('El email es requerido')
});

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState<boolean | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const { currentLayout } = useLayout();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      setHasErrors(undefined);
      setSuccessMessage('');
      
      try {
        const response = await axios.post(`${VITE_APP_API_URL}password/send-otp`, {
          email: values.email
        });

        
        setSuccessMessage(response.data.message || 'Si el correo existe, recibirás un código de verificación');
        setHasErrors(false);
        setLoading(false);

        sessionStorage.setItem('resetEmail', values.email);
        
      } catch (error: any) {
        setHasErrors(true);
        setLoading(false);
        setSubmitting(false);
        
        if (error.response?.status === 404) {
          setStatus('No encontramos una cuenta con ese email');
        } else if (error.response?.data?.message) {
          setStatus(error.response.data.message);
        } else {
          setStatus('Error al enviar el código. Por favor intenta nuevamente.');
        }
      }
    }
  });

      const handleGoToVerify = () => {
      const email = formik.values.email;
      if (email && formik.isValid) {
        sessionStorage.setItem('resetEmail', email);
        navigate(
          currentLayout?.name === 'auth-branded'
            ? '/auth/reset-password/verify-otp'
            : '/auth/classic/reset-password/verify-otp',
          {
            state: { email }
          }
        );
      }
    };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200"
        style={{ border: '1px solid #e5e7eb' }}
      >
        <form
          className="flex flex-col gap-6 px-6 py-10 sm:px-10"
          noValidate
          onSubmit={formik.handleSubmit}
        >
          <div className="text-center flex flex-col items-center gap-2">
            <img
              src="https://admin.virtualt.org/default/logoweb.png"
              alt="Logo"
              className="h-14 object-contain"
            />
            <h3 className="text-2xl font-semibold text-gray-900">Recuperar contraseña</h3>
            <p className="text-sm text-gray-500">
              Ingresa tu correo para recibir un código de verificación
            </p>
          </div>

          {hasErrors === true && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium">
                {formik.status || 'Lo sentimos, hubo un error al enviar el código.'}
              </p>
            </div>
          )}

          {hasErrors === false && successMessage && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-medium mb-3">
                {successMessage}
              </p>

            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              autoComplete="off"
              {...formik.getFieldProps('email')}
              className={clsx(
                'w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-all',
                'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20',
                'hover:border-gray-400',
                {
                  'border-red-500 focus:ring-red-500/20':
                    formik.touched.email && formik.errors.email
                }
              )}
            />
            {formik.touched.email && formik.errors.email && (
              <span className="text-xs text-red-500">
                {formik.errors.email}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={clsx(
              'mt-2 h-12 rounded-xl text-sm font-medium text-white transition-all',
              'bg-orange-500 hover:bg-orange-700',
              'focus:outline-none focus:ring-4 focus:ring-orange-500/30',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {loading ? 'Enviando código...' : 'Enviar código'}
          </button>

          {hasErrors === false && (
            <button
              type="button"
              onClick={handleGoToVerify}
              className="h-12 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all"
            >
              Ya tengo el código →
            </button>
          )}

          <div className="flex items-center justify-center pt-4 border-t border-gray-200">
            <Link
              to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
              className="text-xs text-gray-600 hover:text-orange-500 font-medium transition"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export { ResetPassword };