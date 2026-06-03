import { useState } from 'react';
import { MenuSub } from '@/components/menu';

interface IDropdownJitsiSalasProps {
  menuTtemRef: any;
}

const normalizarCodigo = (codigo: string) =>
  codigo
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '');

const roomNameFromCodigo = (codigo: string) => `meet-${normalizarCodigo(codigo).replace(/-/g, '')}`;

const DropdownJitsiSalas = ({ menuTtemRef }: IDropdownJitsiSalasProps) => {
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');

  const handleClose = () => {
    if (menuTtemRef.current) {
      menuTtemRef.current.hide();
    }
  };

  const abrirSalaConCodigo = () => {
    const codigoNormalizado = normalizarCodigo(codigo);

    if (!codigoNormalizado) {
      setError('Escribe un código para entrar.');
      return;
    }

    setError('');
    handleClose();

    const room = roomNameFromCodigo(codigoNormalizado);
    const url = `/videoconferencias/standalone?room=${encodeURIComponent(room)}&codigo=${encodeURIComponent(codigoNormalizado)}`;
    const width = 1100;
    const height = 750;
    const left = window.screen.width ? (window.screen.width - width) / 2 : 100;
    const top = window.screen.height ? (window.screen.height - height) / 2 : 100;
    const features = `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`;

    window.open(url, `jitsi_room_${codigoNormalizado.replace(/[^A-Z0-9]/g, '')}`, features);
  };

  return (
    <MenuSub
      rootClassName="w-full max-w-[280px]"
      className="relative overflow-hidden rounded-xl border border-white/10 bg-[#111] p-3 shadow-2xl"
    >
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
        Unirse con código
      </div>
      <div className="my-2 h-px " />

      <div className="space-y-3">
        <div className="rounded-xl border  p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Código de acceso
          </label>
          <input
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.toUpperCase());
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                abrirSalaConCodigo();
              }
            }}
            placeholder="XXXX-XXXX-XXX"
            maxLength={14}
            className="w-full rounded-lg border border-white/10 px-3 py-2 font-mono text-sm tracking-wider text-white placeholder:text-gray-500 outline-none transition focus:border-primary/60"
          />
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>

        <button
          type="button"
          onClick={abrirSalaConCodigo}
          className="flex w-full items-center gap-3 rounded-lg bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 text-left"
        >
          <span className="text-lg">➜</span>
          <div className="flex-1">
            <div className="font-semibold text-white/90">Entrar a la reunión</div>
            <div className="text-xs text-white/70">Solo con el código compartido</div>
          </div>
        </button>
      </div>
    </MenuSub>
  );
};

export { DropdownJitsiSalas };
