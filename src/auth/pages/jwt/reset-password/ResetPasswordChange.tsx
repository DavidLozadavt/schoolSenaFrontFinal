import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import clsx from 'clsx';
import { KeenIcon } from '@/components';
import { useLayout } from '@/providers';

const VITE_APP_API_URL = import.meta.env.VITE_APP_API_URL;

const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
  
    .min(8, 'Mínimo 8 caracteres')
    .max(50, 'Máximo 50 caracteres')
    .required('La contraseña es requerida'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password')], 'Las contraseñas deben coincidir')
    .required('La confirmación de contraseña es requerida')
});

const ResetPasswordChange = () => {
  const navigate = useNavigate();
  const { currentLayout } = useLayout();
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState<boolean | undefined>(undefined);
  const [validatingToken, setValidatingToken] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const token = sessionStorage.getItem('resetToken');
  const email = sessionStorage.getItem('resetEmail');

  useEffect(() => {
    const validateToken = async () => {
      if (!token || !email) {
        setErrorMessage('Token o email no encontrado. Por favor, solicita un nuevo enlace de recuperación.');
        setHasErrors(true);
        setTimeout(() => {
          navigate(
            currentLayout?.name === 'auth-branded'
              ? '/auth/reset-password'
              : '/auth/classic/reset-password'
          );
        }, 3000);
        return;
      }

      try {

        setValidatingToken(false);
      } catch (error: any) {
        setErrorMessage(error.response?.data?.message || 'Token inválido o expirado');
        setHasErrors(true);
        setTimeout(() => {
          sessionStorage.removeItem('resetToken');
          sessionStorage.removeItem('resetEmail');
          navigate(
            currentLayout?.name === 'auth-branded'
              ? '/auth/reset-password'
              : '/auth/classic/reset-password'
          );
        }, 3000);
      }
    };

    validateToken();
  }, [token, email, navigate, currentLayout]);

  const formik = useFormik({
    initialValues: { password: '', password_confirmation: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading(true);
      setHasErrors(undefined);
      setErrorMessage('');

      try {
        if (!token || !email) {
          throw new Error('Datos de recuperación no encontrados');
        }

        const response = await axios.post(
          `${VITE_APP_API_URL}password/reset`,
          {
            email,
            token,
            password: values.password,
            password_confirmation: values.password_confirmation
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        // Limpiar sessionStorage
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetToken');

        // Redirigir a pantalla de éxito
        navigate(
          currentLayout?.name === 'auth-branded'
            ? '/auth/reset-password/check-email'
            : '/auth/classic/reset-password/check-email',
          {
            state: { 
              message: response.data?.message || 'Contraseña cambiada exitosamente',
              email 
            }
          }
        );

      } catch (error: any) {
        setHasErrors(true);
        setLoading(false);
        setSubmitting(false);

        // Manejar errores específicos del backend
        if (error.response?.data?.error === 'invalid_token') {
          setErrorMessage('Token de recuperación inválido o expirado. Por favor, solicita un nuevo enlace.');
          // Limpiar sessionStorage en caso de token inválido
          sessionStorage.removeItem('resetToken');
          sessionStorage.removeItem('resetEmail');
          
          setTimeout(() => {
            navigate(
              currentLayout?.name === 'auth-branded'
                ? '/auth/reset-password'
                : '/auth/classic/reset-password'
            );
          }, 3000);
        } else if (error.response?.data?.message) {
          setErrorMessage(error.response.data.message);
        } else {
          setErrorMessage('Error al restablecer la contraseña. Por favor, intenta nuevamente.');
        }
      }
    }
  });

  if (validatingToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-10">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500"></div>
            <p className="text-gray-600 text-center">Validando tu enlace de recuperación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasErrors && errorMessage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <KeenIcon icon="x-circle" className="text-red-500 text-2xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Error</h3>
            <p className="text-gray-600 text-center">{errorMessage}</p>
            <button
              onClick={() => navigate(
                currentLayout?.name === 'auth-branded'
                  ? '/auth/reset-password'
                  : '/auth/classic/reset-password'
              )}
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
            >
              Volver a recuperar contraseña
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
        <form onSubmit={formik.handleSubmit} className="flex flex-col gap-6 px-6 py-10 sm:px-10" noValidate>
          <div className="text-center">
            <img src="https://admin.virtualt.org/default/logoweb.png" alt="Logo" className="h-12 object-contain mx-auto mb-4"/>
            <h3 className="text-2xl font-semibold text-gray-900">Restablecer contraseña</h3>
            <p className="text-sm text-gray-500 mt-2">Ingresa tu nueva contraseña</p>
            <p className="text-xs text-gray-400 mt-1">Para: {email}</p>
          </div>

          {hasErrors && errorMessage && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Nueva contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
            <div className="relative">
              <input 
                placeholder="••••••••" 
                type={showPassword ? 'text' : 'password'} 
                {...formik.getFieldProps('password')}
                data-no-uppercase
                className={clsx(
                  'w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-gray-900 outline-none transition-all',
                  'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 hover:border-gray-400',
                  { 'border-red-500 focus:ring-red-500/20': formik.touched.password && formik.errors.password }
                )}
                autoComplete="new-password"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
              >
                <KeenIcon icon={showPassword ? "eye-slash" : "eye"} className="w-5 h-5" />
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="text-xs text-red-500">{formik.errors.password}</span>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
            <div className="relative">
              <input 
                placeholder="••••••••" 
                type={showConfirmPassword ? 'text' : 'password'} 
                {...formik.getFieldProps('password_confirmation')}
                data-no-uppercase
                className={clsx(
                  'w-full rounded-xl border bg-white px-4 py-3 pr-12 text-sm text-gray-900 outline-none transition-all',
                  'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 hover:border-gray-400',
                  { 'border-red-500 focus:ring-red-500/20': formik.touched.password_confirmation && formik.errors.password_confirmation }
                )}
                autoComplete="new-password"
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
              >
                <KeenIcon icon={showConfirmPassword ? "eye-slash" : "eye"} className="w-5 h-5" />
              </button>
            </div>
            {formik.touched.password_confirmation && formik.errors.password_confirmation && (
              <span className="text-xs text-red-500">{formik.errors.password_confirmation}</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading || formik.isSubmitting}
            className={clsx(
              'w-full h-12 rounded-xl text-white font-medium text-sm transition-all',
              'bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Cambiando...
              </div>
            ) : 'Cambiar contraseña'}
          </button>

          <div className="text-center text-sm text-gray-500 mt-4">
            <Link 
              to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
              className="hover:text-orange-500 font-medium"
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export { ResetPasswordChange };