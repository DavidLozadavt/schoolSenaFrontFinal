import { type MouseEvent, useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../../../../src/firebase/firebaseConfig';
import {
  AuthBrandLogo,
  authCardClass,
  authCardStyle,
  authFormClass,
  authInputClass,
  authLinkClass,
  authPageShellClass,
  authPrimaryButtonClass
} from './authVisual';

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

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login, roles, activacion } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [deviceToken, setDeviceToken] = useState<string>('');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { VITE_APP_VAPID_KEY } = import.meta.env;




  const requestPermission = useCallback(async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VITE_APP_VAPID_KEY });
      setDeviceToken(token);
    } else if (permission === 'denied') {
      alert('Has denegado las notificaciones.');
    }
  }, [VITE_APP_VAPID_KEY]);

  useEffect(() => {
    requestPermission();

    onMessage(messaging, (payload) => {
      console.log('Mensaje recibido: ', payload);
    });
  }, [requestPermission]);

  // Redirect after login once roles and activacion are loaded
  useEffect(() => {
    if (!shouldRedirect) return;
    // Wait until roles have been populated from the server
    if (roles.length === 0) return;
    
    // We only depend on activacion now for the redirect logic
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


      try {
        if (!login) {
          throw new Error('JWTProvider is required for this form.');
        }

        await login(values.email, values.password, deviceToken);

        if (values.remember) {
          localStorage.setItem('email', values.email);
        } else {
          localStorage.removeItem('email');
        }

        setShouldRedirect(true);
      } catch {
        setStatus('Los datos de inicio de sesión son incorrectos.');
        setSubmitting(false);
      }
      setLoading(false);
    }
  });

  const togglePassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowPassword(!showPassword);
  };

  return (
    <div className={authPageShellClass}>
      <div className={authCardClass} style={authCardStyle}>
        <form
          className={authFormClass}
          onSubmit={formik.handleSubmit}
          noValidate
        >
          <div className="text-center flex flex-col items-center gap-3">
            <AuthBrandLogo pulse={loading} />
            <h3 className="text-2xl font-semibold text-gray-900">
              Iniciar sesión
            </h3>
            <p className="text-sm text-gray-500">
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Correo electrónico o número de documento
            </label>
            <input
              placeholder="correo@ejemplo.com o número de documento"
              autoComplete="off"
              type="text"
              {...formik.getFieldProps('email')}
              data-preserve-case
              data-no-uppercase
              className={authInputClass(!!(formik.touched.email && formik.errors.email))}
            />
            {formik.touched.email && formik.errors.email && (
              <span className="text-xs text-red-500">
                {formik.errors.email}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="off"
                {...formik.getFieldProps('password')}
                data-no-uppercase
                className={clsx(
                  authInputClass(!!(formik.touched.password && formik.errors.password)),
                  'pr-12'
                )}
              />
              <button
                onClick={togglePassword}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
              >
                <KeenIcon icon="eye" className={clsx({ hidden: showPassword })} />
                <KeenIcon icon="eye-slash" className={clsx({ hidden: !showPassword })} />
              </button>
            </div>
            {formik.touched.password && formik.errors.password && (
              <span className="text-xs text-red-500">
                {formik.errors.password}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || formik.isSubmitting}
            className={clsx(authPrimaryButtonClass, 'mt-2')}
          >
            {loading ? 'Por favor espera…' : 'Iniciar sesión'}
          </button>

          {formik.status && (
            <div className="text-center text-xs text-red-500">
              {formik.status}
            </div>
          )}

          <div className="flex items-center justify-center">
            <Link
              to="/auth/classic/reset-password"
              className={authLinkClass}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );


};

export { Login };

