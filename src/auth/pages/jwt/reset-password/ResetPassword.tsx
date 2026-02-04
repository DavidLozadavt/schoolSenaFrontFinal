import clsx from 'clsx';
import { useFormik } from 'formik';
import { useState, useEffect } from 'react';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [fadeIn, setFadeIn] = useState(false);
  const { currentLayout } = useLayout();
  const navigate = useNavigate();

  // Efecto para animación de entrada del modal
  useEffect(() => {
    if (showSuccessModal || showErrorModal || showNotFoundModal) {
      setTimeout(() => setFadeIn(true), 10);
    } else {
      setFadeIn(false);
    }
  }, [showSuccessModal, showErrorModal, showNotFoundModal]);

  const handleSuccessConfirmation = () => {
    setShowSuccessModal(false);
    setFadeIn(false);
    setTimeout(() => handleGoToVerify(), 150);
  };

  const handleResendEmail = () => {
    setShowSuccessModal(false);
    setFadeIn(false);
    setHasErrors(undefined);
    setSuccessMessage('');
    formik.resetForm();
    formik.setFieldValue('email', '', false);
  };

  const closeModal = (modalType: 'success' | 'error' | 'notfound') => {
    setFadeIn(false);
    setTimeout(() => {
      switch (modalType) {
        case 'success':
          setShowSuccessModal(false);
          break;
        case 'error':
          setShowErrorModal(false);
          break;
        case 'notfound':
          setShowNotFoundModal(false);
          break;
      }
    }, 150);
  };

  const formik = useFormik({
    initialValues,
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values, { setStatus, setSubmitting }) => {
      setLoading(true);
      setHasErrors(undefined);
      setSuccessMessage('');
      setShowSuccessModal(false);
      setShowErrorModal(false);
      setShowNotFoundModal(false);
      setModalMessage('');
      
      try {
        const response = await axios.post(`${VITE_APP_API_URL}password/send-otp`, {
          email: values.email
        });

        setHasErrors(false);
        setSuccessMessage('Código enviado correctamente');
        sessionStorage.setItem('resetEmail', values.email);
        setTimeout(() => {
          setShowSuccessModal(true);
        }, 100);
        
      } catch (error: any) {
        setHasErrors(true);
        setLoading(false);
        setSubmitting(false);
        
        if (error.response?.status === 404) {
          setStatus('No encontramos una cuenta con ese email');
          setTimeout(() => {
            setShowNotFoundModal(true);
          }, 100);
        } else if (error.response?.data?.message) {
          setStatus(error.response.data.message);
          setModalMessage(error.response.data.message);
          setTimeout(() => {
            setShowErrorModal(true);
          }, 100);
        } else {
          setStatus('Error al enviar el código. Por favor intenta nuevamente.');
          setModalMessage('Error al enviar el código. Por favor intenta nuevamente.');
          setTimeout(() => {
            setShowErrorModal(true);
          }, 100);
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
    <>
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

            {hasErrors === true && !showErrorModal && !showNotFoundModal && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-700 font-medium">
                  {formik.status || 'Lo sentimos, hubo un error al enviar el código.'}
                </p>
              </div>
            )}

            {hasErrors === false && successMessage && !showSuccessModal && (
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

      {/* Modal de Éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className={clsx(
              "fixed inset-0 bg-black transition-opacity duration-150 ease-linear",
              fadeIn ? "opacity-50" : "opacity-0"
            )}
            onClick={() => closeModal('success')}
          />
          
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div
              className={clsx(
                "relative transform overflow-hidden rounded-2xl border border-gray-200 bg-[#F0F9FF] text-left shadow-xl transition-all duration-150 ease-linear sm:my-8 sm:w-full sm:max-w-lg",
                fadeIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
              )}
              style={{ background: '#F0F9FF', color: '#1F2937' }}
            >
              <div className="bg-[#F0F9FF] px-6 pb-6 pt-6 sm:p-8">
                <div className="text-left">
                  <div className="flex items-center justify-center mb-4">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-4">
                    ¡Código enviado!
                  </h3>
                  
                  <div className="text-left text-sm">
                    <p className="text-gray-700 mb-3">
                      Si el correo <span className="font-semibold text-orange-600">{formik.values.email}</span> existe en nuestro sistema, recibirás un código de verificación.
                    </p>
                    <p className="text-sm text-gray-600">
                      Revisa tu bandeja de entrada y la carpeta de spam.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#F0F9FF] px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8 gap-3">
                <button
                  type="button"
                  onClick={handleSuccessConfirmation}
                  className="inline-flex w-full justify-center rounded-lg px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors sm:ml-3 sm:w-auto"
                  style={{ backgroundColor: '#F97316' }}
                >
                  Continuar con el código
                </button>
                <button
                  type="button"
                  onClick={handleResendEmail}
                  className="mt-3 inline-flex w-full justify-center rounded-lg px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors sm:mt-0 sm:w-auto"
                >
                  Enviar otro correo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Error */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className={clsx(
              "fixed inset-0 bg-black transition-opacity duration-150 ease-linear",
              fadeIn ? "opacity-50" : "opacity-0"
            )}
            onClick={() => closeModal('error')}
          />
          
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div
              className={clsx(
                "relative transform overflow-hidden rounded-2xl border border-gray-200 bg-[#FEF2F2] text-left shadow-xl transition-all duration-150 ease-linear sm:my-8 sm:w-full sm:max-w-lg",
                fadeIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
              )}
              style={{ background: '#FEF2F2', color: '#1F2937' }}
            >
              <div className="bg-[#FEF2F2] px-6 pb-6 pt-6 sm:p-8">
                <div className="text-left">
                  <div className="flex items-center justify-center mb-4">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-4">
                    ¡Ups! Algo salió mal
                  </h3>
                  
                  <div className="text-left text-sm">
                    <p className="text-gray-700 mb-3">{modalMessage}</p>
                    <p className="text-sm text-gray-600">
                      Por favor, verifica el correo e intenta nuevamente.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#FEF2F2] px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8">
                <button
                  type="button"
                  onClick={() => closeModal('error')}
                  className="inline-flex w-full justify-center rounded-lg px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors sm:ml-3 sm:w-auto"
                  style={{ backgroundColor: '#F97316' }}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de No Encontrado */}
      {showNotFoundModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className={clsx(
              "fixed inset-0 bg-black transition-opacity duration-150 ease-linear",
              fadeIn ? "opacity-50" : "opacity-0"
            )}
            onClick={() => closeModal('notfound')}
          />
          
          <div className="flex min-h-screen items-center justify-center p-4 text-center">
            <div
              className={clsx(
                "relative transform overflow-hidden rounded-2xl border border-gray-200 bg-[#FFFBEB] text-left shadow-xl transition-all duration-150 ease-linear sm:my-8 sm:w-full sm:max-w-lg",
                fadeIn ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
              )}
              style={{ background: '#FFFBEB', color: '#1F2937' }}
            >
              <div className="bg-[#FFFBEB] px-6 pb-6 pt-6 sm:p-8">
                <div className="text-left">
                  <div className="flex items-center justify-center mb-4">
                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-semibold text-gray-900 text-center mb-4">
                    Correo no encontrado
                  </h3>
                  
                  <div className="text-left text-sm">
                    <p className="text-gray-700 mb-3">
                      No encontramos una cuenta asociada a este correo electrónico.
                    </p>
                    <p className="text-sm text-gray-600">
                      Verifica que esté escrito correctamente o regístrate para crear una cuenta.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#FFFBEB] px-6 py-4 sm:flex sm:flex-row-reverse sm:px-8">
                <button
                  type="button"
                  onClick={() => closeModal('notfound')}
                  className="inline-flex w-full justify-center rounded-lg px-6 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors sm:ml-3 sm:w-auto"
                  style={{ backgroundColor: '#F97316' }}
                >
                  Verificar correo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { ResetPassword };