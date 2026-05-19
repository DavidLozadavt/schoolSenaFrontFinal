import { forwardRef } from 'react';
import { Modal as MuiModal, ModalProps as BaseModalProps } from '@mui/base/Modal';
import { ModalBackdrop } from '@/components';
import clsx from 'clsx';

interface IModalProps extends BaseModalProps {
  zIndex?: number;
  className?: string; // For content-specific Tailwind styles
  /** Permite cerrar al hacer clic en el overlay. Por defecto false (evita perder formularios). */
  closeOnBackdropClick?: boolean;
  /** Permite cerrar con la tecla Escape. Por defecto false. */
  closeOnEscapeKeyDown?: boolean;
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
    const handleClose: BaseModalProps['onClose'] = (event, reason) => {
      if (!onClose) return;
      if (reason === 'backdropClick' && !closeOnBackdropClick) return;
      if (reason === 'escapeKeyDown' && !closeOnEscapeKeyDown) return;
      onClose(event, reason);
    };

    return (
      <MuiModal
        ref={ref}
        open={open}
        onClose={handleClose}
        disableEscapeKeyDown={!closeOnEscapeKeyDown}
        style={{
          zIndex: `${zIndex}`,
          opacity: open ? 1 : 0,
          display: open ? 'block' : 'none'
        }}
        className={clsx('modal', className)}
        {...props} // Spread any additional props
        slots={{ backdrop: ModalBackdrop }} // Assign custom backdrop
      >
        {children}
      </MuiModal>
    );
  }
);

export { Modal };
