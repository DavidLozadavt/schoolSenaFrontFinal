import clsx from 'clsx';
import { toAbsoluteUrl } from '@/utils';

/** Identidad visual compartida con Login (azul institucional School). */
export const AUTH_LOGO_LIGHT = toAbsoluteUrl('/media/app/logoweb.png');
export const AUTH_LOGO_DARK = toAbsoluteUrl('/media/app/logoweb-dark.png');

export const authPageShellClass =
  'min-h-screen w-full flex items-center justify-center px-4';

export const authCardClass =
  'w-full max-w-md rounded-2xl shadow-xl border border-gray-200';

export const authCardStyle = { border: '1px solid #e5e7eb' } as const;

export const authFormClass = 'flex flex-col gap-6 px-6 py-10 sm:px-10';

export const authInputClass = (hasError?: boolean) =>
  clsx(
    'w-full rounded-xl border px-4 py-3 text-sm dark:border-coal-100 bg-white dark:bg-coal-400 outline-none transition-all',
    'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/25',
    'hover:border-gray-400',
    {
      'border-red-500 focus:border-red-500 focus:ring-red-500/20': hasError
    }
  );

export const authPrimaryButtonClass = clsx(
  'h-12 rounded-xl text-sm font-medium text-white transition-all shadow-sm',
  'bg-[#1e6fd9] hover:bg-[#155ebf] active:bg-[#1256b0]',
  'focus:outline-none focus:ring-4 focus:ring-[#1e6fd9]/35',
  'disabled:opacity-60 disabled:cursor-not-allowed'
);

export const authLinkClass =
  'text-xs text-gray-600 hover:text-[#1e6fd9] font-medium transition-colors';

export const authOtpInputClass = (filled?: boolean) =>
  clsx(
    'w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl outline-none transition-all',
    'focus:border-blue-600 focus:ring-4 focus:ring-blue-500/25',
    filled
      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500'
      : 'border-gray-300 hover:border-gray-400 dark:border-coal-100'
  );

export const AuthBrandLogo = ({ pulse = false }: { pulse?: boolean }) => (
  <div className={clsx('text-center flex flex-col items-center', pulse && 'animate-pulse')}>
    <img
      src={AUTH_LOGO_LIGHT}
      alt="School"
      className="h-20 sm:h-24 w-auto max-w-[min(100%,360px)] object-contain dark:hidden"
    />
    <img
      src={AUTH_LOGO_DARK}
      alt="School"
      className="hidden h-20 sm:h-24 w-auto max-w-[min(100%,360px)] object-contain dark:block"
    />
  </div>
);
