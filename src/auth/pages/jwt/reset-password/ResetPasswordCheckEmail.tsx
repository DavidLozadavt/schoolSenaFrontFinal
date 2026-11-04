import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLayout } from '@/providers';
import clsx from 'clsx';
import {
  AuthBrandLogo,
  authCardClass,
  authCardStyle,
  authPageShellClass,
  authPrimaryButtonClass
} from '../authVisual';

const ResetPasswordCheckEmail = () => {
  const { currentLayout } = useLayout();
  const [email, setEmail] = useState<string>('');

  useEffect(() => {
    sessionStorage.removeItem('resetEmail');
    sessionStorage.removeItem('resetToken');

    const storedEmail = sessionStorage.getItem('resetEmail') || '';
    setEmail(storedEmail);
  }, []);

  return (
    <div className={authPageShellClass}>
      <div className={authCardClass} style={authCardStyle}>
        <div className="flex flex-col gap-6 px-6 py-10 sm:px-10">
          <div className="flex flex-col items-center gap-3">
            <AuthBrandLogo />
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-[#1e6fd9]"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 text-center">
              ¡Contraseña restablecida!
            </h3>
            <div className="text-sm text-center text-gray-600">
              <p className="mb-3">Tu contraseña ha sido cambiada exitosamente.</p>
              <p>Ahora puedes iniciar sesión con tu nueva contraseña.</p>
              {email ? <p className="mt-2 text-xs text-gray-400">{email}</p> : null}
            </div>
          </div>

          <Link
            to={currentLayout?.name === 'auth-branded' ? '/auth/login' : '/auth/classic/login'}
            className={clsx(authPrimaryButtonClass, 'flex items-center justify-center')}
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ResetPasswordCheckEmail };
