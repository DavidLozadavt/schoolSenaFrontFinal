import { KeenIcon } from '@/components';
import { Modal } from './Modal';

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
      footer={
        <>
          <button
            onClick={() => onVerQr(hermano)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors"
          >
            <KeenIcon icon="scan-barcode" className="text-base" />
            Ver QR
          </button>
          <button
            onClick={() => onEditar(hermano)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
          >
            <KeenIcon icon="notepad-edit" className="text-base" />
            Editar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(
          [
            ['Nombre', hermano.nombre],
            ['Edad', hermano.edad ? `${hermano.edad} años` : '—'],
            ['Email', hermano.email],
            ['Celular', hermano.celularContacto],
            ['Emergencia', hermano.celularEmergencia],
            ['Contacto familiar', hermano.nombreContactoF],
            ['Cel. familiar', hermano.celularContactoF],
            ['Parentesco', hermano.parentesco],
            ['Pago', `$${(hermano.pago ?? 0).toLocaleString()}`],
            ['Saldo', `$${(hermano.saldo ?? 0).toLocaleString()}`],
            ['Forma pago', hermano.formaPago],
            ['QR Token', hermano.qr_token ?? '—'],
            ['Observación', hermano.observacion]
          ] as [string, string | number][]
        ).map(([label, val]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              {label}
            </span>
            <span className="text-sm text-gray-800 dark:text-gray-200 break-all">
              {val || '—'}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
};
