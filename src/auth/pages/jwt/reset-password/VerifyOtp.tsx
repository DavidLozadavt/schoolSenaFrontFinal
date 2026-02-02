import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import clsx from 'clsx';
import { useLayout } from '@/providers';

const VITE_APP_API_URL = import.meta.env.VITE_APP_API_URL;

// 1. Definir interfaz para los valores
interface VerifyOtpFormValues {
  digit1: string;
  digit2: string;
  digit3: string;
  digit4: string;
  digit5: string;
  digit6: string;
}

const VerifyOtp = () => {
  const [loading, setLoading] = useState(false);
  const [hasErrors, setHasErrors] = useState<boolean | undefined>(undefined);
  const [countdown, setCountdown] = useState(60); 
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { currentLayout } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = sessionStorage.getItem('resetEmail') || 
                (location.state as any)?.email || '';

  useEffect(() => {
    if (!email) {
      navigate(
        currentLayout?.name === 'auth-branded'
          ? '/auth/reset-password'
          : '/auth/classic/reset-password'
      );
    }
  }, [email, navigate, currentLayout]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (inputRefs.current[0]) setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  // 2. Tipar useFormik con la interfaz
  const formik = useFormik<VerifyOtpFormValues>({
    initialValues: { 
      digit1: '', 
      digit2: '', 
      digit3: '', 
      digit4: '', 
      digit5: '', 
      digit6: '' 
    },
    validationSchema: Yup.object({
      digit1: Yup.string().required('').length(1, ''),
      digit2: Yup.string().required('').length(1, ''),
      digit3: Yup.string().required('').length(1, ''),
      digit4: Yup.string().required('').length(1, ''),
      digit5: Yup.string().required('').length(1, ''),
      digit6: Yup.string().required('').length(1, '')
    }),
    onSubmit: async (values, { setStatus }) => {
      setLoading(true);
      setHasErrors(undefined);
      setSuccessMessage('');

      const otpCode = `${values.digit1}${values.digit2}${values.digit3}${values.digit4}${values.digit5}${values.digit6}`;

      try {
        const response = await axios.post(`${VITE_APP_API_URL}password/verify-otp`, {
          email,
          otp: otpCode
        }, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        });

        const token = response.data?.token || otpCode;
        sessionStorage.setItem('resetToken', token);
        
        if (response.data?.reset_token) {
          sessionStorage.setItem('resetToken', response.data.reset_token);
        }

        navigate(
          currentLayout?.name === 'auth-branded'
            ? '/auth/reset-password/change'
            : '/auth/classic/reset-password/change'
        );

      } catch (error: any) {
        setHasErrors(true);
        setLoading(false);

        if (error.response?.data?.message) {
          setStatus(`${error.response.data.message}`);
        } else if (error.response?.data?.error) {
          setStatus(`${error.response.data.error}`);
        } else {
          setStatus('Error al verificar el código');
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const digitFields: (keyof VerifyOtpFormValues)[] = ['digit1', 'digit2', 'digit3', 'digit4', 'digit5', 'digit6'];
    const fieldName = digitFields[index];
    formik.setFieldValue(fieldName, value.slice(0, 1));

    if (value && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
    }

    // 3. Ahora funciona porque formik.values está tipado
    const allDigitsFilled = digitFields.every((field, i) => 
      i === index ? value.length === 1 : formik.values[field].length === 1
    );
    
    if (allDigitsFilled) {
      setTimeout(() => formik.submitForm(), 300);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const digitFields: (keyof VerifyOtpFormValues)[] = ['digit1', 'digit2', 'digit3', 'digit4', 'digit5', 'digit6'];
    const fieldName = digitFields[index];
    
    if (e.key === 'Backspace' && !formik.values[fieldName] && index > 0) {
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 10);
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      setTimeout(() => inputRefs.current[index - 1]?.focus(), 10);
    }
    if (e.key === 'ArrowRight' && index < 5) {
      setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resendLoading) return;

    setResendLoading(true);
    setHasErrors(undefined);
    setSuccessMessage('');

    try {
      await axios.post(`${VITE_APP_API_URL}password/send-otp`, { email }, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      });

      setSuccessMessage('Código reenviado. Revisa tu correo.');
      setCountdown(60);
    } catch (error: any) {
      setHasErrors(true);
      if (error.response?.data?.message) formik.setStatus(`${error.response.data.message}`);
      else formik.setStatus('Error al reenviar el código');
    } finally {
      setResendLoading(false);
    }
  };

  const isOtpComplete = (Object.keys(formik.values) as (keyof VerifyOtpFormValues)[])
    .every(field => formik.values[field].length === 1);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200 p-8">
        <div className="text-center mb-6">
          <img src="https://admin.virtualt.org/default/logoweb.png" alt="Logo" className="h-12 mx-auto mb-4"/>
          <h3 className="text-2xl font-semibold text-gray-900">Verificar código</h3>
          <p className="text-sm text-gray-500 mt-2">Ingresa el código de 6 dígitos enviado a</p>
          <p className="text-sm font-medium text-gray-800 mt-1 break-all">{email}</p>
          <p className="text-xs text-gray-400 mt-2">El código expira en 10 minutos</p>
        </div>

        {hasErrors && formik.status && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700 font-medium">{formik.status}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-sm text-green-700 font-medium">{successMessage}</p>
          </div>
        )}

        <form onSubmit={formik.handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2, 3, 4, 5].map(index => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={formik.values[`digit${index + 1}` as keyof VerifyOtpFormValues] as string}
                onChange={e => handleDigitChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onFocus={e => e.target.select()}
                className={clsx(
                  'w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl',
                  'focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none transition-all',
                  formik.values[`digit${index + 1}` as keyof VerifyOtpFormValues] 
                    ? 'border-orange-300 bg-orange-50' 
                    : 'border-gray-300 hover:border-gray-400'
                )}
                autoComplete="off"
                spellCheck="false"
              />
            ))}
          </div>

          <button 
            type="submit" 
            disabled={loading || !isOtpComplete}
            className={clsx(
              'w-full h-12 rounded-xl text-sm font-medium text-white transition-all',
              'bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-500/30',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500 mb-3">¿No recibiste el código?</p>
          <button 
            type="button" 
            onClick={handleResendOtp} 
            disabled={countdown > 0 || resendLoading}
            className={clsx(
              'text-sm font-medium px-4 py-2 rounded-lg transition-all',
              countdown > 0 || resendLoading 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
            )}
          >
            {resendLoading ? 'Enviando...' : countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <Link 
            to={currentLayout?.name === 'auth-branded' ? '/auth/reset-password' : '/auth/classic/reset-password'}
            className="text-xs text-gray-600 hover:text-orange-500 font-medium"
          >
            ← Volver a ingresar email
          </Link>
        </div>
      </div>
    </div>
  );
};

export { VerifyOtp };