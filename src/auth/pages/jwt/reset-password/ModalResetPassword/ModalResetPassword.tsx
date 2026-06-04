import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { KeenIcon } from '@/components';

const VITE_APP_API_URL = import.meta.env.VITE_APP_API_URL;


interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  identification?: string;
  isApprentice?: boolean;
  onSuccess?: () => void;
}

const ResetPasswordModal = ({ isOpen, onClose, userEmail, identification, isApprentice, onSuccess }: ResetPasswordModalProps) => {
  const { enqueueSnackbar } = useSnackbar();


  const [currentStep, setCurrentStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [emailForReset, setEmailForReset] = useState<string>(userEmail);
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState({ password: '', confirmPassword: '' });

  const [verifiedToken, setVerifiedToken] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (userEmail) {
      // Si el email es solo números, probablemente es la identificación y no el correo de la persona
      const isOnlyDigits = /^\d+$/.test(userEmail);

      if (isApprentice && isOnlyDigits) {
        setEmailForReset('');
      } else {
        setEmailForReset(userEmail);
      }
    }
  }, [userEmail, isApprentice]);

  useEffect(() => {
    if (countdown > 0 && currentStep === 'otp') {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, currentStep]);

  const handleClose = () => {
    setCurrentStep('email');
    setOtpCode(['', '', '', '', '', '']);
    setNewPassword({ password: '', confirmPassword: '' });
    setVerifiedToken('');
    setCountdown(60);
    onClose();
  };


  const handleSendOtp = async () => {
    if (!emailForReset || !emailForReset.includes('@')) {
      enqueueSnackbar('Por favor ingresa un email válido', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${VITE_APP_API_URL}password/send-otp`, {
        email: emailForReset.trim().toLowerCase()
      });

      enqueueSnackbar('Código enviado correctamente', { variant: 'success' });
      setCurrentStep('otp');
      setCountdown(60);

    } catch (error: any) {
      if (error.response?.status === 404) {
        enqueueSnackbar('No encontramos una cuenta con ese email', { variant: 'error' });
      } else if (error.response?.data?.message) {
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Error al enviar el código. Por favor intenta nuevamente.', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };


  const verifyCode = async (code: string) => {
    if (code.length !== 6) {
      enqueueSnackbar('Por favor ingresa el código completo de 6 dígitos', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${VITE_APP_API_URL}password/verify-otp`, {
        email: emailForReset.trim().toLowerCase(),
        otp: code,
        identificacion: identification
      });

      let token = '';
      if (response.data?.token) {
        token = response.data.token;
      } else if (response.data?.data?.token) {
        token = response.data.data.token;
      } else if (response.data?.reset_token) {
        token = response.data.reset_token;
      } else {
        token = code;
      }

      setVerifiedToken(token);
      enqueueSnackbar('Código verificado correctamente', { variant: 'success' });
      setCurrentStep('newPassword');

    } catch (error: any) {
      if (error.response?.data?.message) {
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Error al verificar el código', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtpCode = [...otpCode];
    newOtpCode[index] = value.slice(0, 1);
    setOtpCode(newOtpCode);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    if (newOtpCode.every(digit => digit.length === 1)) {
      setTimeout(() => verifyCode(newOtpCode.join('')), 300);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newOtpCode = [...otpCode];
    for (let i = 0; i < 6; i++) {
      newOtpCode[i] = pastedData[i] || '';
    }
    setOtpCode(newOtpCode);

    const nextActiveIndex = Math.min(pastedData.length, 5);
    const nextInput = document.getElementById(`otp-input-${nextActiveIndex}`);
    if (nextInput) nextInput.focus();

    if (pastedData.length === 6) {
      setTimeout(() => verifyCode(pastedData), 300);
    }
  };


  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = () => {
    verifyCode(otpCode.join(''));
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;

    setLoading(true);
    try {
      await axios.post(`${VITE_APP_API_URL}password/send-otp`, {
        email: emailForReset.trim().toLowerCase()
      });
      enqueueSnackbar('Código reenviado. Revisa tu correo.', { variant: 'success' });
      setCountdown(60);
      setOtpCode(['', '', '', '', '', '']);
    } catch (error: any) {
      enqueueSnackbar('Error al reenviar el código', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Cambiar contraseña
  const handleChangePassword = async () => {
    if (newPassword.password !== newPassword.confirmPassword) {
      enqueueSnackbar('Las contraseñas no coinciden', { variant: 'error' });
      return;
    }

    if (newPassword.password.length < 8) {
      enqueueSnackbar('La contraseña debe tener al menos 8 caracteres', { variant: 'error' });
      return;
    }

    // Validar que tenemos un token
    if (!verifiedToken) {
      enqueueSnackbar('Error de verificación. Por favor intenta nuevamente.', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${VITE_APP_API_URL}password/reset`, {
        email: emailForReset.trim().toLowerCase(),
        password: newPassword.password,
        password_confirmation: newPassword.confirmPassword,
        token: verifiedToken,
        identificacion: identification
      });

      enqueueSnackbar(response.data?.message || '¡Contraseña cambiada exitosamente!', { variant: 'success' });
      if (onSuccess) onSuccess();
      handleClose();

    } catch (error: any) {
      if (error.response?.status === 422) {
        // Errores de validación
        const errors = error.response.data.errors;
        if (errors?.token) {
          enqueueSnackbar('Token inválido o expirado. Por favor solicita un nuevo código.', { variant: 'error' });
          setCurrentStep('email');
        } else if (errors?.email) {
          enqueueSnackbar('Email inválido', { variant: 'error' });
        } else if (errors?.password) {
          enqueueSnackbar(errors.password[0], { variant: 'error' });
        } else {
          enqueueSnackbar('Error de validación', { variant: 'error' });
        }
      } else if (error.response?.data?.message) {
        enqueueSnackbar(error.response.data.message, { variant: 'error' });
      } else {
        enqueueSnackbar('Error al cambiar la contraseña', { variant: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Modal principal de email
  const renderEmailStep = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recuperar Contraseña</h2>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <KeenIcon icon="x" className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Ingresa tu correo para recibir un código de verificación
      </p>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Correo electrónico</label>
        <input
          type="email"
          value={emailForReset}
          onChange={(e) => setEmailForReset(e.target.value)}
          placeholder="correo@ejemplo.com"
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleClose}
          className="flex-1 btn btn-secondary"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          onClick={handleSendOtp}
          disabled={loading || !emailForReset}
          className="flex-1 btn btn-primary"
        >
          {loading ? 'Enviando...' : 'Enviar Código'}
        </button>
      </div>
    </>
  );

  // Modal de verificación OTP
  const renderOtpStep = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Verificar Código</h2>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <KeenIcon icon="x" className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        Ingresa el código de 6 dígitos enviado a:
      </p>
      <p className="text-sm font-medium text-gray-800 mb-6">{emailForReset}</p>

      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <input
            key={index}
            id={`otp-input-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={otpCode[index]}
            onChange={(e) => handleOtpChange(index, e.target.value)}
            onKeyDown={(e) => handleOtpKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 outline-none"
          />
        ))}
      </div>

      <div className="text-center mb-6">
        <button
          onClick={handleResendOtp}
          disabled={countdown > 0 || loading}
          className="text-sm text-gray-600 hover:text-orange-500 disabled:text-gray-400"
        >
          {loading ? 'Enviando...' : countdown > 0 ? `Reenviar en ${countdown}s` : 'Reenviar código'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStep('email')}
          className="flex-1 btn btn-secondary"
          disabled={loading}
        >
          Volver
        </button>
        <button
          onClick={handleVerifyOtp}
          disabled={loading || otpCode.some(digit => !digit)}
          className="flex-1 btn btn-primary"
        >
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </div>
    </>
  );

  // Modal de nueva contraseña
  const renderNewPasswordStep = () => (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Nueva Contraseña</h2>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <KeenIcon icon="x" className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Nueva Contraseña</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword.password}
              onChange={(e) => setNewPassword({ ...newPassword, password: e.target.value })}
              placeholder="Mínimo 8 caracteres"
              data-no-uppercase
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              <KeenIcon icon={showPassword ? "eye-slash" : "eye"} className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirmar Contraseña</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={newPassword.confirmPassword}
              onChange={(e) => setNewPassword({ ...newPassword, confirmPassword: e.target.value })}
              placeholder="Repite tu contraseña"
              data-no-uppercase
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              <KeenIcon icon={showConfirmPassword ? "eye-slash" : "eye"} className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStep('otp')}
          className="flex-1 btn btn-secondary"
          disabled={loading}
        >
          Volver
        </button>
        <button
          onClick={handleChangePassword}
          disabled={loading || !newPassword.password || !newPassword.confirmPassword}
          className="flex-1 btn btn-primary"
        >
          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </button>
      </div>
    </>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleClose} />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">
          <div className="p-6">
            {currentStep === 'email' && renderEmailStep()}
            {currentStep === 'otp' && renderOtpStep()}
            {currentStep === 'newPassword' && renderNewPasswordStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export { ResetPasswordModal };