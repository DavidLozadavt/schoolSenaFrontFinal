import { useEffect, useRef } from 'react';
import { KeenIcon } from '@/components';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-3xl'
};

const ICON_COLORS: Record<string, { bg: string; text: string; shadow: string }> = {
  'add-item': { bg: 'bg-orange-500', text: 'text-white', shadow: 'shadow-orange-500/25' },
  'notepad-edit': { bg: 'bg-blue-500', text: 'text-white', shadow: 'shadow-blue-500/25' },
  'dollar': { bg: 'bg-emerald-500', text: 'text-white', shadow: 'shadow-emerald-500/25' },
  'user': { bg: 'bg-violet-500', text: 'text-white', shadow: 'shadow-violet-500/25' },
  'scan-barcode': { bg: 'bg-violet-600', text: 'text-white', shadow: 'shadow-violet-600/25' },
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  icon,
  iconColor,
  children,
  footer,
  size = 'md'
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const iconTheme = icon ? ICON_COLORS[icon] || { bg: 'bg-orange-500', text: 'text-white', shadow: 'shadow-orange-500/25' } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[6vh] sm:pt-[10vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[6px] animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={dialogRef}
        className={`relative bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full ${SIZE_MAP[size]} max-h-[85vh] flex flex-col animate-[slideUp_0.25s_cubic-bezier(0.16,1,0.3,1)] border border-neutral-100 dark:border-white/5 overflow-hidden`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.03)'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3.5 px-7 py-5 border-b border-gray-100 dark:border-zinc-800/60 bg-gray-50/30 dark:bg-zinc-950/20">
          {icon && iconTheme && (
            <div className={`w-11 h-11 rounded-2xl ${iconTheme.bg} ${iconTheme.text} flex items-center justify-center shrink-0 shadow-lg ${iconTheme.shadow} transform -rotate-3`}>
              <KeenIcon icon={icon} className="text-lg" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-neutral-800 dark:text-white leading-tight truncate uppercase tracking-wide">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider truncate">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100/80 dark:bg-zinc-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-gray-400 hover:text-rose-500 transition-all duration-200 hover:rotate-90 shrink-0"
          >
            <KeenIcon icon="cross" className="text-sm" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 scrollbar-thin">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-gray-100 dark:border-zinc-800/60 bg-gray-50/30 dark:bg-zinc-950/20">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};
