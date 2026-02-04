import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLayout } from '@/providers';

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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
        <div className="flex flex-col gap-6 px-6 py-10 sm:px-10">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-4xl text-green-600">✓</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 text-center mb-2">
              ¡Contraseña restablecida!
            </h3>
            <div className="text-sm text-center text-gray-600 mb-6">
              <p className="mb-3">
                Tu contraseña ha sido cambiada exitosamente.
              </p>
              <p>
                Ahora puedes iniciar sesión con tu nueva contraseña.
              </p>
            </div>
          </div>
          
          <Link
            to={
              currentLayout?.name === 'auth-branded'
                ? '/auth/login'
                : '/auth/classic/login'
            }
            className="h-12 rounded-xl text-sm font-medium text-white bg-orange-500 hover:bg-orange-700 transition flex items-center justify-center focus:outline-none focus:ring-4 focus:ring-orange-500/30"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export { ResetPasswordCheckEmail };