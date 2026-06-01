import { KeenIcon } from '@/components';
import { Modal } from './Modal';
import clsx from 'clsx';

interface Hermano {
  id: number;
  nombre: string;
  celularContacto: string;
  edad: number;
  nombreContactoF: string;
  celularContactoF: string;
  pago: number;
  saldo: number;
  formaPago: string;
  email: string;
  celularEmergencia: string;
  parentesco: string;
  observacion: string;
  qr_token: string | null;
}

interface ModalVerDetalleProps {
  open: boolean;
  onClose: () => void;
  hermano: Hermano | null;
  onVerQr: (h: Hermano) => void;
  onEditar: (h: Hermano) => void;
}

interface InfoRowProps {
  icon: string;
  label: string;
  value: string | number | null | undefined;
  highlight?: boolean;
  danger?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ icon, label, value, highlight, danger }) => (
  <div className="flex items-start gap-3 py-3">
    <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-zinc-800/80 flex items-center justify-center shrink-0 mt-0.5 border border-gray-100 dark:border-zinc-700/50">
      <KeenIcon icon={icon} className="text-gray-400 text-sm" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-gray-400 mb-0.5">
        {label}
      </p>
      <p
        className={clsx(
          'text-sm font-bold break-all leading-snug',
          danger ? 'text-rose-500' :
          highlight ? 'text-emerald-600 dark:text-emerald-400' :
          'text-neutral-800 dark:text-gray-200'
        )}
      >
        {value || '—'}
      </p>
    </div>
  </div>
);

export const ModalVerDetalle: React.FC<ModalVerDetalleProps> = ({
  open,
  onClose,
  hermano,
  onVerQr,
  onEditar
}) => {
  if (!hermano) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del invitado"
      subtitle={hermano.nombre}
      icon="user"
      footer={
        <>
          <button
            onClick={() => onVerQr(hermano)}
            className="flex items-center gap-2 px-5 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl bg-violet-600 hover:bg-violet-700 text-white transition-all duration-300 shadow-lg shadow-violet-600/25 hover:scale-[1.02] active:scale-95"
          >
            <KeenIcon icon="scan-barcode" className="text-base" />
            <span>Ver QR</span>
          </button>
          <button
            onClick={() => onEditar(hermano)}
            className="flex items-center gap-2 px-5 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300 shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-95"
          >
            <KeenIcon icon="notepad-edit" className="text-base" />
            <span>Editar</span>
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        {/* Avatar Header */}
        <div className="flex items-center gap-4 mb-4 pb-5 border-b border-gray-100 dark:border-zinc-800/60">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white flex items-center justify-center text-lg font-black uppercase shrink-0 shadow-lg shadow-orange-500/20 transform -rotate-3">
            {hermano.nombre?.charAt(0) ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg text-neutral-800 dark:text-white truncate uppercase tracking-wide">{hermano.nombre}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {hermano.qr_token ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-[0.15em]">
                  <KeenIcon icon="check" className="text-[8px]" /> QR Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-400 text-[8px] font-black uppercase tracking-[0.15em]">
                  Sin QR
                </span>
              )}
              {(hermano.saldo ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-[0.15em]">
                  Saldo pendiente
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <InfoRow icon="user" label="Nombre" value={hermano.nombre} />
          <InfoRow icon="calendar" label="Edad" value={hermano.edad ? `${hermano.edad} años` : null} />
          <InfoRow icon="sms" label="Email" value={hermano.email} />
          <InfoRow icon="phone" label="Celular" value={hermano.celularContacto} />
          <InfoRow icon="call" label="Emergencia" value={hermano.celularEmergencia} />
          <InfoRow icon="user-tick" label="Contacto familiar" value={hermano.nombreContactoF} />
          <InfoRow icon="phone" label="Cel. familiar" value={hermano.celularContactoF} />
          <InfoRow icon="abstract-21" label="Parentesco" value={hermano.parentesco} />
          <InfoRow
            icon="dollar"
            label="Pago"
            value={`$${(hermano.pago ?? 0).toLocaleString()}`}
            highlight
          />
          <InfoRow
            icon="notification-status"
            label="Saldo"
            value={`$${(hermano.saldo ?? 0).toLocaleString()}`}
            danger={(hermano.saldo ?? 0) > 0}
          />
          <InfoRow icon="wallet" label="Forma pago" value={hermano.formaPago} />
          <InfoRow icon="scan-barcode" label="QR Token" value={hermano.qr_token ? `${hermano.qr_token.slice(0, 8)}…` : null} />
        </div>

        {hermano.observacion && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
            <InfoRow icon="message-text-2" label="Observación" value={hermano.observacion} />
          </div>
        )}
      </div>
    </Modal>
  );
};
