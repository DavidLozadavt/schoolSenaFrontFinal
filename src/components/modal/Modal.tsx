import { forwardRef } from 'react';
import { Modal as MuiModal, ModalProps as BaseModalProps } from '@mui/base/Modal';
import { ModalBackdrop } from './ModalBackdrop';
import clsx from 'clsx';

interface IModalProps extends Omit<BaseModalProps, 'children'> {
  zIndex?: number;
  className?: string; // For content-specific Tailwind styles
  /** Permite cerrar al hacer clic en el overlay. Por defecto false (evita perder formularios). */
  closeOnBackdropClick?: boolean;
  /** Permite cerrar con la tecla Escape. Por defecto false. */
  closeOnEscapeKeyDown?: boolean;
  children?: React.ReactNode;
}

// Forwarding ref to ensure this component can hold a ref
const Modal = forwardRef<HTMLDivElement, IModalProps>(
  (
    {
      open,
      onClose,
      children,
      className,
      zIndex = 100,
      closeOnBackdropClick = false,
      closeOnEscapeKeyDown = false,
      ...props
    },
    ref
  ) => {
    if (!open) return null;

    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: zIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && closeOnBackdropClick) {
            onClose?.(e as any, 'backdropClick');
          }
        }}
        className={clsx('modal-root', className)}
      >
        {children}
      </div>
    );
  }
);

export { Modal };
