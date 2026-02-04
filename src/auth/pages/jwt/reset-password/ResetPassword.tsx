import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Yup from 'yup';
import axios from 'axios';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';


import { useLayout } from '@/providers';

const VITE_APP_API_URL = import.meta.env.VITE_APP_API_URL;
const MySwal = withReactContent(Swal);

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

  const showSuccessAlert = (email: string) => {
    MySwal.fire({
      title: <p className="text-2xl font-semibold text-gray-900">¡Código enviado!</p>,
      html: (
        <div className="text-left">
          <p className="text-gray-700 mb-3">
            Si el correo <span className="font-semibold text-orange-600">{email}</span> existe en nuestro sistema, recibirás un código de verificación.
          </p>
          <p className="text-sm text-gray-600">
            Revisa tu bandeja de entrada y la carpeta de spam.
          </p>
        </div>
      ),
      icon: 'success',
      iconColor: '#10B981',
      background: '#F0F9FF',
      color: '#1F2937',
      showConfirmButton: true,
      confirmButtonText: 'Continuar con el código',
      confirmButtonColor: '#F97316',
      showCancelButton: true,
      cancelButtonText: 'Enviar otro correo',
      cancelButtonColor: '#6B7280',
      customClass: {
        popup: 'rounded-2xl border border-gray-200',
        title: 'mb-4',
        confirmButton: 'px-6 py-2 rounded-lg font-medium',
        cancelButton: 'px-6 py-2 rounded-lg font-medium'
      },
      buttonsStyling: false,
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        handleGoToVerify();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        // Cuando el usuario hace clic en "Enviar otro correo"
        setHasErrors(undefined);
        setSuccessMessage('');
        formik.resetForm();
        formik.setFieldValue('email', '', false);
      }
    });
  };

  const showErrorAlert = (message: string) => {
    MySwal.fire({
      title: <p className="text-2xl font-semibold text-gray-900">¡Ups! Algo salió mal</p>,
      html: (
        <div className="text-left">
          <p className="text-gray-700 mb-3">{message}</p>
          <p className="text-sm text-gray-600">
            Por favor, verifica el correo e intenta nuevamente.
          </p>
        </div>
      ),
      icon: 'error',
      iconColor: '#EF4444',
      background: '#FEF2F2',
      color: '#1F2937',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#F97316',
      customClass: {
        popup: 'rounded-2xl border border-gray-200',
        title: 'mb-4',
        confirmButton: 'px-6 py-2 rounded-lg font-medium'
      },
      buttonsStyling: false
    });
  };

  const showNotFoundAlert = () => {
    MySwal.fire({
      title: <p className="text-2xl font-semibold text-gray-900">Correo no encontrado</p>,
      html: (
        <div className="text-left">
          <p className="text-gray-700 mb-3">
            No encontramos una cuenta asociada a este correo electrónico.
          </p>
          <p className="text-sm text-gray-600">
            Verifica que esté escrito correctamente o regístrate para crear una cuenta.
          </p>
        </div>
      ),
      icon: 'warning',
      iconColor: '#F59E0B',
      background: '#FFFBEB',
      color: '#1F2937',
      confirmButtonText: 'Verificar correo',
      confirmButtonColor: '#F97316',
      customClass: {
        popup: 'rounded-2xl border border-gray-200',
        title: 'mb-4',
        confirmButton: 'px-6 py-2 rounded-lg font-medium'
      },
      buttonsStyling: false
    });
  };

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

        setHasErrors(false);
        setSuccessMessage('Código enviado correctamente');
        sessionStorage.setItem('resetEmail', values.email);
        
        // Mostrar SweetAlert de éxito
        showSuccessAlert(values.email);
        
      } catch (error: any) {
        setHasErrors(true);
        setLoading(false);
        setSubmitting(false);
        
        if (error.response?.status === 404) {
          setStatus('No encontramos una cuenta con ese email');
          showNotFoundAlert();
        } else if (error.response?.data?.message) {
          setStatus(error.response.data.message);
          showErrorAlert(error.response.data.message);
        } else {
          setStatus('Error al enviar el código. Por favor intenta nuevamente.');
          showErrorAlert('Error al enviar el código. Por favor intenta nuevamente.');
        }
      } finally {
        setLoading(false);
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
              <button
                type="button"
                onClick={handleGoToVerify}
                className="w-full h-12 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all flex items-center justify-center gap-2 mt-2"
              >
                Ya tengo el código
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                </svg>
              </button>
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
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando código...
              </span>
            ) : 'Enviar código'}
          </button>
          
          <div className="flex items-center justify-center pt-4 border-t border-gray-200">
            <Link
              to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
              className="text-xs text-gray-600 hover:text-orange-500 font-medium transition flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export { ResetPassword };