import { useState, useEffect } from 'react';
import axios from 'axios';
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
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors disabled:opacity-60"
          >
            {saving && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Guardar
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Campo label="Nombre completo" name="nombre" colSpan form={form} setForm={setForm} />
        <Campo label="Edad" name="edad" type="number" form={form} setForm={setForm} />
        <Campo label="Email" name="email" type="email" form={form} setForm={setForm} />
        <Campo
          label="Celular contacto"
          name="celularContacto"
          type="number"
          form={form}
          setForm={setForm}
        />
        <Campo
          label="Celular emergencia"
          type="number"
          name="celularEmergencia"
          form={form}
          setForm={setForm}
        />
        <Campo
          label="Nombre contacto familiar"
          name="nombreContactoF"
          form={form}
          setForm={setForm}
        />
        <Campo
          label="Celular contacto familiar"
          name="celularContactoF"
          type="number"
          form={form}
          setForm={setForm}
        />
        <Campo label="Parentesco" name="parentesco" form={form} setForm={setForm} />
        <Campo label="Pago ($)" name="pago" type="number" form={form} setForm={setForm} />
        <Campo label="Saldo ($)" name="saldo" type="number" form={form} setForm={setForm} />
        <Campo
          label="Forma de pago"
          name="formaPago"
          options={FORMAS_PAGO}
          form={form}
          setForm={setForm}
        />
        <Campo label="Observación" name="observacion" colSpan form={form} setForm={setForm} />
      </div>
    </Modal>
  );
};
