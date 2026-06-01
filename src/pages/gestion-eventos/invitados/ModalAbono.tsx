import { useState, useEffect } from 'react';
import clsx from 'clsx';
import axios from 'axios';
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

  const saldoRestante = Math.max(0, (hermano.saldo ?? 0) - formAbono.monto);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar abono"
      subtitle={hermano.nombre}
      icon="dollar"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-5 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={hacerAbono}
            disabled={abonando || formAbono.monto <= 0}
            className="flex items-center gap-2 px-6 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-300 disabled:opacity-60 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95"
          >
            <span className="flex items-center gap-2">
              {abonando ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeenIcon icon="check" className="text-sm" />
              )}
              <span>{abonando ? 'Procesando…' : 'Confirmar abono'}</span>
            </span>
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Balance summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3.5 rounded-2xl bg-gray-50/80 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-700/50">
            <div className="text-[9px] text-gray-400 uppercase tracking-[0.15em] font-black mb-1.5">
              Pagado
            </div>
            <div className="text-lg font-black text-neutral-800 dark:text-white italic leading-none">
              ${(hermano.pago ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center p-3.5 rounded-2xl bg-rose-50/80 dark:bg-rose-900/10 border border-rose-100/80 dark:border-rose-900/20">
            <div className="text-[9px] text-rose-400 uppercase tracking-[0.15em] font-black mb-1.5">
              Saldo actual
            </div>
            <div className={clsx(
              'text-lg font-black italic leading-none',
              (hermano.saldo ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'
            )}>
              ${(hermano.saldo ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="text-center p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-900/10 border border-emerald-100/80 dark:border-emerald-900/20">
            <div className="text-[9px] text-emerald-500 uppercase tracking-[0.15em] font-black mb-1.5">
              Restará
            </div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 italic leading-none">
              ${saldoRestante.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Monto a abonar ($)
              <span className="text-red-400 text-xs">*</span>
            </label>
            <div className="relative">
              <KeenIcon
                icon="dollar"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
              />
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
                placeholder="$0"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 placeholder:text-gray-300"
              />
            </div>
            {formAbono.monto >= (hermano.saldo ?? 0) && (hermano.saldo ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-500">
                <KeenIcon icon="information-2" className="text-[10px]" />
                Máximo: ${(hermano.saldo ?? 0).toLocaleString()}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Forma de pago
            </label>
            <div className="relative">
              <KeenIcon
                icon="wallet"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
              />
              <select
                value={formAbono.formaPago}
                onChange={(e) => setFormAbono((p) => ({ ...p, formaPago: e.target.value }))}
                className="w-full pl-10 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 appearance-none cursor-pointer"
              >
                {FORMAS_PAGO.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <KeenIcon
                icon="down"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Quick amounts */}
        {(hermano.saldo ?? 0) > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Montos rápidos</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: '25%', value: Math.round((hermano.saldo ?? 0) * 0.25) },
                { label: '50%', value: Math.round((hermano.saldo ?? 0) * 0.5) },
                { label: '75%', value: Math.round((hermano.saldo ?? 0) * 0.75) },
                { label: '100%', value: hermano.saldo ?? 0 },
              ].filter(q => q.value > 0).map((q) => (
                <button
                  key={q.label}
                  onClick={() => setFormAbono((p) => ({ ...p, monto: q.value }))}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                    formAbono.monto === q.value
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700'
                  )}
                >
                  {q.label} · ${q.value.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
