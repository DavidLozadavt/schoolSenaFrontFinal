import { type MouseEvent, useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as Yup from 'yup';
import { useFormik } from 'formik';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '../../../../src/firebase/firebaseConfig';
import { token } from 'stylis';

const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email('Wrong email format')
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Email is required'),
  password: Yup.string()
    .min(3, 'Minimum 3 symbols')
    .max(50, 'Maximum 50 symbols')
    .required('Password is required'),
  remember: Yup.boolean()
});

const initialValues = {
  email: '',
  password: '',
  remember: false
};

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [deviceToken, setDeviceToken] = useState<string>('');
  const from = location.state?.from?.pathname || '/';
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
    useEffect(() => {
      requestPermission();
  
      onMessage(messaging, (payload) => {
      
      });
    }, [requestPermission]);



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

        navigate('/');
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
  <div
    className="card max-w-[380px] w-full rounded-2xl border border-gray-200 bg-white shadow-md"
    style={{ border: '1px solid #e5e7eb' }} // no se elimina, solo se suaviza
  >
    <form
      className="card-body flex flex-col gap-6 p-10"
      onSubmit={formik.handleSubmit}
      noValidate
    >
      <div className="text-center mb-3">
        <h3 className="text-xl font-semibold text-gray-900 leading-tight">
          Iniciar sesión
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Ingresa tus credenciales para continuar
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Correo electrónico
        </label>
        <label className="relative">
          <input
            placeholder="correo@ejemplo.com"
            autoComplete="off"
            {...formik.getFieldProps('email')}
            className={clsx(
              'w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition',
              'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20',
              {
                'border-red-500 focus:ring-red-500/20':
                  formik.touched.email && formik.errors.email
              }
            )}
          />
        </label>
        {formik.touched.email && formik.errors.email && (
          <span role="alert" className="text-red-500 text-xs">
            {formik.errors.email}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <label className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            autoComplete="off"
            {...formik.getFieldProps('password')}
            className={clsx(
              'w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition',
              'focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20',
              {
                'border-red-500 focus:ring-red-500/20':
                  formik.touched.password && formik.errors.password
              }
            )}
          />
          <button
            className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
            onClick={togglePassword}
          >
            <KeenIcon icon="eye" className={clsx({ hidden: showPassword })} />
            <KeenIcon icon="eye-slash" className={clsx({ hidden: !showPassword })} />
          </button>
        </label>
        {formik.touched.password && formik.errors.password && (
          <span role="alert" className="text-red-500 text-xs">
            {formik.errors.password}
          </span>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || formik.isSubmitting}
        className={clsx(
          'mt-2 flex h-11 items-center justify-center rounded-lg text-sm font-medium text-white',
          'bg-orange-500 hover:bg-orange-700 transition disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {loading ? 'Por favor espera…' : 'Iniciar sesión'}
      </button>

      {formik.status && (
        <div className="text-red-500 text-xs text-center mt-2" role="alert">
          {formik.status}
        </div>
      )}
    </form>
  </div>
);

};

export { Login };
