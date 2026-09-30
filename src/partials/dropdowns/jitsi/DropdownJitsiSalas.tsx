import { useState } from 'react';
import axios from 'axios';
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
  const [validating, setValidating] = useState(false);

  const handleClose = () => {
    if (menuTtemRef.current) {
      menuTtemRef.current.hide();
    }
  };

  const abrirSalaConCodigo = async () => {
    const codigoNormalizado = normalizarCodigo(codigo);

    if (!codigoNormalizado) {
      setError('Escribe un código para entrar.');
      return;
    }

    setError('');
    setValidating(true);

    // Validar que la reunión exista y haya iniciado
    try {
      const response = await axios.get('reuniones_temporales');
      const reuniones: any[] = response.data || [];
      const reunion = reuniones.find(
        (r: any) => normalizarCodigo(r.codigo || '') === codigoNormalizado
      );

      if (reunion && reunion.start_at) {
        const inicio = new Date(reunion.start_at).getTime();
        if (inicio > Date.now()) {
          setValidating(false);
          setError(`Esta reunión inicia el ${new Date(reunion.start_at).toLocaleString()}. Aún no puedes ingresar.`);
          return;
        }
      }
    } catch {
      // Si falla la validación, igual permitimos entrar (el servidor validará)
    }

    setValidating(false);
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
      className="relative overflow-hidden rounded-xl border border-muted bg-card p-3 shadow-lg"
    >
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Unirse con código
      </div>
      <div className="my-2 h-px " />

      <div className="space-y-3">
        <div className="rounded-xl border border-muted p-3">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
            disabled={validating}
            className="w-full rounded-lg border border-muted bg-background px-3 py-2 font-mono text-sm tracking-wider text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary/60 disabled:opacity-50"
          />
          {error ? <p className="mt-2 text-danger text-xs ">{error}</p> : null}
        </div>

        <button
          type="button"
          onClick={abrirSalaConCodigo}
          disabled={validating}
          className="flex w-full btn btn-primary text-justify"
        >
          {validating ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <span className="text-lg">➜</span>
          )}
          <div className="flex-1">
            <div className="font-semibold">Entrar a la reunión</div>
            <div className="text-xs">Solo con el código compartido</div>
          </div>
        </button>
      </div>
    </MenuSub>
  );
};

export { DropdownJitsiSalas };
