import { useState, useEffect } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import { Modal } from './Modal';
import { Campo } from './Campo';

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

interface ModalCrearEditarProps {
  open: boolean;
  onClose: () => void;
  hermano: Hermano | null;
  onSuccess: () => void;
  notif: (msg: string, tipo?: 'ok' | 'err') => void;
}

const FORMAS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'];

const FORM_VACIO = {
  nombre: '',
  celularContacto: '',
  edad: 0,
  nombreContactoF: '',
  celularContactoF: '',
  pago: 0,
  saldo: 0,
  formaPago: 'Efectivo',
  email: '',
  celularEmergencia: '',
  parentesco: '',
  observacion: ''
};

interface SectionProps {
  icon: string;
  title: string;
  children: React.ReactNode;
}

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  'user': { bg: 'bg-orange-500', text: 'text-white' },
  'people': { bg: 'bg-violet-500', text: 'text-white' },
  'dollar': { bg: 'bg-emerald-500', text: 'text-white' },
  'message-text-2': { bg: 'bg-info', text: 'text-white' },
};

const Section: React.FC<SectionProps> = ({ icon, title, children }) => {
  const colors = SECTION_COLORS[icon] || { bg: 'bg-orange-500', text: 'text-white' };
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 shadow-sm transform -rotate-2`}>
          <KeenIcon icon={icon} className="text-sm" />
        </div>
        <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-500 dark:text-gray-400">
          {title}
        </h4>
        <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0 sm:pl-11">
        {children}
      </div>
    </div>
  );
};

export const ModalCrearEditar: React.FC<ModalCrearEditarProps> = ({
  open,
  onClose,
  hermano,
  onSuccess,
  notif
}) => {
  const [form, setForm] = useState<any>(FORM_VACIO);
  const [saving, setSaving] = useState(false);
  const esEdicion = !!hermano;

  useEffect(() => {
    if (open) {
      if (hermano) {
        const { id, qr_token, ...rest } = hermano;
        setForm(rest);
      } else {
        setForm(FORM_VACIO);
      }
    }
  }, [open, hermano]);

  const guardar = async () => {
    if (!form.nombre?.trim()) {
      notif('El nombre es obligatorio', 'err');
      return;
    }
    try {
      setSaving(true);
      if (!esEdicion) {
        await axios.post('/invitado', form);
        notif('Invitado creado correctamente');
      } else if (esEdicion && hermano) {
        await axios.put(`/invitado/${hermano.id}`, form);
        notif('Invitado actualizado');
      }
      onClose();
      onSuccess();
    } catch {
      notif('Error al guardar', 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={esEdicion ? 'Editar invitado' : 'Nuevo invitado'}
      subtitle={esEdicion ? `Editando: ${hermano?.nombre}` : 'Completa la información del invitado'}
      icon={esEdicion ? 'notepad-edit' : 'add-item'}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-5 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={saving}
            className="group/btn relative flex items-center gap-2 px-6 h-11 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl bg-orange-500 hover:bg-orange-600 text-white transition-all duration-300 disabled:opacity-60 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-95"
          >
            <span className="flex items-center gap-2">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <KeenIcon icon={esEdicion ? 'check' : 'plus'} className="text-sm" />
              )}
              <span>{saving ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear invitado'}</span>
            </span>
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-7">
        {/* Personal Info */}
        <Section icon="user" title="Información personal">
          <Campo
            label="Nombre completo"
            name="nombre"
            colSpan
            form={form}
            setForm={setForm}
            icon="user"
            placeholder="Nombre y apellido del invitado"
            required
          />
          <Campo
            label="Edad"
            name="edad"
            type="number"
            form={form}
            setForm={setForm}
            icon="calendar"
            placeholder="Ej: 25"
          />
          <Campo
            label="Email"
            name="email"
            type="email"
            form={form}
            setForm={setForm}
            icon="sms"
            placeholder="correo@ejemplo.com"
          />
          <Campo
            label="Celular contacto"
            name="celularContacto"
            type="number"
            form={form}
            setForm={setForm}
            icon="phone"
            placeholder="3001234567"
          />
          <Campo
            label="Celular emergencia"
            type="number"
            name="celularEmergencia"
            form={form}
            setForm={setForm}
            icon="call"
            placeholder="3009876543"
          />
        </Section>

        {/* Family Contact */}
        <Section icon="people" title="Contacto familiar">
          <Campo
            label="Nombre contacto familiar"
            name="nombreContactoF"
            form={form}
            setForm={setForm}
            icon="user-tick"
            placeholder="Nombre del familiar"
          />
          <Campo
            label="Celular contacto familiar"
            name="celularContactoF"
            type="number"
            form={form}
            setForm={setForm}
            icon="phone"
            placeholder="3005551234"
          />
          <Campo
            label="Parentesco"
            name="parentesco"
            form={form}
            setForm={setForm}
            icon="abstract-21"
            placeholder="Ej: Padre, Madre, Hermano"
          />
        </Section>

        {/* Payment Info */}
        <Section icon="dollar" title="Información de pago">
          <Campo
            label="Pago ($)"
            name="pago"
            type="number"
            form={form}
            setForm={setForm}
            icon="dollar"
            placeholder="0"
            hint="Monto total pagado"
          />
          <Campo
            label="Saldo ($)"
            name="saldo"
            type="number"
            form={form}
            setForm={setForm}
            icon="notification-status"
            placeholder="0"
            hint="Monto pendiente por pagar"
          />
          <Campo
            label="Forma de pago"
            name="formaPago"
            options={FORMAS_PAGO}
            form={form}
            setForm={setForm}
            icon="wallet"
          />
        </Section>

        {/* Notes */}
        <Section icon="message-text-2" title="Observaciones">
          <Campo
            label="Notas adicionales"
            name="observacion"
            colSpan
            form={form}
            setForm={setForm}
            placeholder="Información adicional, alergias, restricciones, etc."
            textarea
          />
        </Section>
      </div>
    </Modal>
  );
};
