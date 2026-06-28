import { type MouseEvent, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { useAuthContext } from '@/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../../../../src/firebase/firebaseConfig';
import { useLayout } from '@/providers';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(120, 'Máximo 120 caracteres')
    .required('Correo o número de documento es requerido'),
  password: Yup.string()
    .min(3, 'Mínimo 3 caracteres')
    .max(120, 'Máximo 120 caracteres')
    .required('Contraseña es requerida'),
  remember: Yup.boolean()
});

const initialValues = {
  email: '',
  password: '',
  remember: false
};

const logoLightSrc = toAbsoluteUrl('/media/app/logoweb.png');
const logoDarkSrc = toAbsoluteUrl('/media/app/logoweb-dark.png');

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, roles, activacion } = useAuthContext();
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { VITE_APP_VAPID_KEY } = import.meta.env;

  const resolveDeviceToken = useCallback(async (): Promise<string> => {
    if (typeof Notification === 'undefined' || !VITE_APP_VAPID_KEY) {
      return '';
    }
    if (Notification.permission !== 'granted') {
      return '';
    }
    try {
      const token = await getToken(messaging, { vapidKey: VITE_APP_VAPID_KEY });
      return token || '';
    } catch {
      return '';
    }
  }, [VITE_APP_VAPID_KEY]);

  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log('Mensaje recibido: ', payload);
    });
  }, []);

  useEffect(() => {
    if (!shouldRedirect) return;
    if (roles.length === 0) return;

    const isAllowed = activacion?.state_id == 18;
    if (isAllowed) {
      navigate('/perfil');
    } else {
      navigate('/');
    }
  }, [shouldRedirect, roles, activacion, navigate]);

  const formik = useFormik({
    initialValues,
    validationSchema: loginSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      setStatus(undefined);

      try {
        if (!login) {
          throw new Error('JWTProvider is required for this form.');
        }

        const token = await resolveDeviceToken();
        await login(values.email, values.password, token);

        if (values.remember) {
          localStorage.setItem('email', values.email);
        } else {
          localStorage.removeItem('email');
        }

        setShouldRedirect(true);
      } catch {
        setStatus('Los datos de inicio de sesión son incorrectos.');
        setSubmitting(false);
        setLoading(false);
      }
    }
  });

  const togglePassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-xl border border-gray-200"
        style={{ border: '1px solid #e5e7eb' }}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4 px-6 py-16 sm:px-10">
            <div className="animate-pulse">
              <img
                src={logoLightSrc}
                alt="School"
                className="h-20 sm:h-24 w-auto max-w-[min(100%,360px)] object-contain dark:hidden"
              />
              <img
                src={logoDarkSrc}
                alt="School"
                className="hidden h-20 sm:h-24 w-auto max-w-[min(100%,360px)] object-contain dark:block"
              />
            </div>
            <p className="text-sm text-gray-500">Iniciando sesión, por favor espera…</p>
          </div>
        ) : (
          <form
            className="flex flex-col gap-6 px-6 py-10 sm:px-10"
            onSubmit={formik.handleSubmit}
            noValidate
            autoComplete="off"
          >
            <div className="text-center flex flex-col items-center gap-3">
              <div>
                <img
                  src={logoLightSrc}
                  alt="School"
                  className="h-20 sm:h-24 w-auto max-w-[min(100%,360px)] object-contain dark:hidden"
                />
                <img
                  src={logoDarkSrc}
                  alt="School"
                  className="hidden h-20 sm:h-24 w-auto max-w-[min(100%,360px)] object-contain dark:block"
                />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900">Iniciar sesión</h3>
              <p className="text-sm text-gray-500">Ingresa tus credenciales para continuar</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Correo electrónico o número de documento
              </label>
              <input
                placeholder="correo@ejemplo.com o número de documento"
                autoComplete="off"
                name="school-login-identifier"
                type="text"
                {...formik.getFieldProps('email')}
                data-preserve-case
                data-no-uppercase
                className={clsx(
                  'w-full rounded-xl border px-4 py-3 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 outline-none transition-all',
                  'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/25',
                  'hover:border-gray-400',
                  {
                    'border-red-500 focus:border-red-500 focus:ring-red-500/20':
                      formik.touched.email && formik.errors.email
                  }
                )}
              />
              {formik.touched.email && formik.errors.email && (
                <span className="text-xs text-red-500">{formik.errors.email}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  name="school-login-password"
                  {...formik.getFieldProps('password')}
                  data-no-uppercase
                  className={clsx(
                    'w-full rounded-xl border px-4 py-3 pr-12 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 outline-none transition-all',
                    'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/25',
                    'hover:border-gray-400',
                    {
                      'border-red-500 focus:border-red-500 focus:ring-red-500/20':
                        formik.touched.password && formik.errors.password
                    }
                  )}
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
                >
                  <KeenIcon icon="eye" className={clsx({ hidden: showPassword })} />
                  <KeenIcon icon="eye-slash" className={clsx({ hidden: !showPassword })} />
                </button>
              </div>
              {formik.touched.password && formik.errors.password && (
                <span className="text-xs text-red-500">{formik.errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting}
              className={clsx(
                'mt-2 h-12 rounded-xl text-sm font-medium text-white transition-all shadow-sm',
                'bg-[#1e6fd9] hover:bg-[#155ebf] active:bg-[#1256b0]',
                'focus:outline-none focus:ring-4 focus:ring-[#1e6fd9]/35',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              Iniciar sesión
            </button>

            {formik.status && (
              <div className="text-center text-xs text-red-500">{formik.status}</div>
            )}

            <div className="flex items-center justify-center">
              <Link
                to={
                  currentLayout?.name === 'auth-branded'
                    ? '/auth/reset-password'
                    : '/auth/classic/reset-password'
                }
                className="text-xs text-gray-600 hover:text-[#1e6fd9] font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export { Login };
