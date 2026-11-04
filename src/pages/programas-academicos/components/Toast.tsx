import React, { useEffect, useRef } from 'react';
import { ToastProps } from '../types'; 

export const Toast = ({ message, isOpen, onClose, type = 'success' }: ToastProps) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onCloseRef.current(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const title =
    type === 'success' ? '¡Éxito!' : type === 'error' ? 'Error' : 'Advertencia';

  const ringClass =
    type === 'success'
      ? 'border-success-clarity shadow-success'
      : type === 'error'
        ? 'border-danger-clarity shadow-danger'
        : 'border-warning-clarity shadow-warning';

  const iconWrapClass =
    type === 'success'
      ? 'bg-success-light text-success'
      : type === 'error'
        ? 'bg-danger-light text-danger'
        : 'bg-warning-light text-warning';

  const iconClass =
    type === 'success'
      ? 'ki-filled ki-check-circle'
      : type === 'error'
        ? 'ki-filled ki-cross-circle'
        : 'ki-filled ki-information-2';

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-smooth-bounce">
      <div className={["flex items-center gap-3 px-6 py-3 bg-white border dark:bg-coal-600 rounded-xl", ringClass].join(' ')}>
        <div className={["flex items-center justify-center w-8 h-8 rounded-lg", iconWrapClass].join(' ')}>
          <i className={["text-xl", iconClass].join(' ')}></i>
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-gray-900 uppercase text-2sm dark:text-gray-dark-900">
            {title}
          </span>
          <span className="font-medium text-gray-600 text-2xs dark:text-gray-dark-600">
            {message}
          </span>
        </div>
        <button onClick={onClose} className="ml-4 text-gray-400 transition-colors hover:text-gray-600">
          <i className="text-sm ki-outline ki-cross"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;