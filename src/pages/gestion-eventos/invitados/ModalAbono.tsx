import { useState, useEffect } from 'react';
import clsx from 'clsx';
import axios from 'axios';
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

interface ModalAbonoProps {
  open: boolean;
  onClose: () => void;
  hermano: Hermano | null;
  onSuccess: () => void;
  notif: (msg: string, tipo?: 'ok' | 'err') => void;
}

const FORMAS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'];

export const ModalAbono: React.FC<ModalAbonoProps> = ({
  open,
  onClose,
  hermano,
  onSuccess,
  notif
}) => {
  const [formAbono, setFormAbono] = useState({ monto: 0, formaPago: 'Efectivo' });
  const [abonando, setAbonando] = useState(false);

  const formato = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  });

  useEffect(() => {
    if (open) {
      setFormAbono({ monto: 0, formaPago: 'Efectivo' });
    }
  }, [open]);

  if (!hermano) return null;

  const hacerAbono = async () => {
    if (formAbono.monto <= 0) {
      notif('Ingresa un monto válido', 'err');
      return;
    }
    try {
      setAbonando(true);
      await axios.post(`/invitado/abonar/${hermano.id}`, formAbono);
      notif(`Abono de $${formAbono.monto.toLocaleString()} registrado`);
      onClose();
      onSuccess();
    } catch {
      notif('Error al registrar el abono', 'err');
    } finally {
      setAbonando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Registrar abono — ${hermano.nombre}`}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={hacerAbono}
            disabled={abonando}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
          >
            {abonando && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Confirmar abono
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Resumen del saldo actual */}
        <div className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-zinc-800">
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Pago total
            </div>
            <div className="text-lg font-bold text-gray-800 dark:text-white">
              ${(hermano.pago ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="w-px bg-gray-200 dark:bg-zinc-700" />
          <div className="flex-1 text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Saldo pendiente
            </div>
            <div
              className={clsx(
                'text-lg font-bold',
                (hermano.saldo ?? 0) > 0 ? 'text-red-500' : 'text-emerald-600'
              )}
            >
              ${(hermano.saldo ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Monto a abonar ($)
            </label>
            <input
              type="text"
              value={formAbono.monto === 0 ? '' : formato.format(formAbono.monto)}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                const numero = value === '' ? 0 : Number(value);
                const saldoMax = hermano.saldo ?? 0;

                setFormAbono((p) => ({
                  ...p,
                  monto: Math.min(numero, saldoMax)
                }));
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none"
            />

            {formAbono.monto >= (hermano.saldo ?? 0) && (hermano.saldo ?? 0) > 0 && (
              <span className="text-xs text-amber-500">
                Máximo: ${(hermano.saldo ?? 0).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Forma de pago
            </label>
            <select
              value={formAbono.formaPago}
              onChange={(e) => setFormAbono((p) => ({ ...p, formaPago: e.target.value }))}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none"
            >
              {FORMAS_PAGO.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
};
