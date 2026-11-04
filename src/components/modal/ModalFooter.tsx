import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

const ModalFooter = ({ children, className }: ModalFooterProps) => {
  return <div className={clsx('modal-footer', className)}>{children}</div>;
};

export { ModalFooter };
