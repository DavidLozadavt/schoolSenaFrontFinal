import React, { useEffect } from 'react';
import { ToastProps } from '../types'; 

export const Toast = ({ message, isOpen, onClose }: ToastProps) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-smooth-bounce">
      <div className="flex items-center gap-3 px-6 py-3 bg-white border dark:bg-coal-600 border-success-clarity rounded-xl shadow-success">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success-light text-success">
          <i className="text-xl ki-filled ki-check-circle"></i>
        </div>
        <div className="flex flex-col">
          <span className="font-bold tracking-tight text-gray-900 uppercase text-2sm dark:text-gray-dark-900">
            ¡Éxito!
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