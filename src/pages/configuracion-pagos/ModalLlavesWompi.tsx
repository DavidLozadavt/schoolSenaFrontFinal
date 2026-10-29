import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import Spinner from '@/components/loaders/Spinner';

interface ModalLlavesWompiProps {
  open: boolean;
  onClose: () => void;
}

type Ambiente = 'test' | 'prod';
type CampoSecreto = 'privateKey' | 'integritySecret' | 'eventsSecret';

interface PasarelaPago {
  configurada: boolean;
  environment: Ambiente;
  publicKey: string | null;
  privateKeyFinal: string | null;
  integritySecretFinal: string | null;
  eventsSecretFinal: string | null;
  habilitarPSE: boolean;
  habilitarTarjetas: boolean;
  activo: boolean;
  completa: boolean;
  webhookUrl: string;
}

const SECRETOS: { campo: CampoSecreto; label: string; prefijo: (a: Ambiente) => string }[] = [
  { campo: 'privateKey', label: 'Llave privada', prefijo: (a) => `prv_${a}_` },
  { campo: 'integritySecret', label: 'Secreto de integridad', prefijo: (a) => `${a}_integrity_` },
  { campo: 'eventsSecret', label: 'Secreto de eventos', prefijo: (a) => `${a}_events_` }
];

const SECRETOS_VACIOS: Record<CampoSecreto, string> = {
  privateKey: '',
  integritySecret: '',
  eventsSecret: ''
};

// Las llaves distinguen mayúsculas: todos los campos llevan data-no-uppercase para que
// el conversor global de formularios (utils/formUppercase) no las altere.
const ModalLlavesWompi = ({ open, onClose }: ModalLlavesWompiProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [pasarela, setPasarela] = useState<PasarelaPago | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [ambiente, setAmbiente] = useState<Ambiente>('test');
  const [publicKey, setPublicKey] = useState('');
  const [secretos, setSecretos] = useState<Record<CampoSecreto, string>>(SECRETOS_VACIOS);
  const [verSecretos, setVerSecretos] = useState(false);
  const [habilitarPSE, setHabilitarPSE] = useState(true);
  const [habilitarTarjetas, setHabilitarTarjetas] = useState(true);
  const [activo, setActivo] = useState(true);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [resultadoPrueba, setResultadoPrueba] = useState<{ ok: boolean; texto: string } | null>(null);

  const aplicarDatos = (datos: PasarelaPago) => {
    setPasarela(datos);
    setAmbiente(datos.environment);
    setPublicKey(datos.publicKey ?? '');
    setSecretos(SECRETOS_VACIOS);
    setHabilitarPSE(datos.habilitarPSE);
    setHabilitarTarjetas(datos.habilitarTarjetas);
    setActivo(datos.activo);
  };

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrores({});
    setResultadoPrueba(null);
    try {
      const res = await axios.get<PasarelaPago>('pasarela-pago');
      aplicarDatos(res.data);
    } catch (err: any) {
      enqueueSnackbar(err.response?.data?.message ?? 'No se pudieron cargar las llaves de Wompi.', {
        variant: 'error'
      });
      onClose();
    } finally {
      setCargando(false);
    }
  }, [enqueueSnackbar, onClose]);

  useEffect(() => {
    if (open) cargar();
  }, [open, cargar]);

  const erroresDeRespuesta = (err: any): Record<string, string> => {
    const lista = err.response?.data?.errors as Record<string, string[]> | undefined;
    if (!lista) return {};
    return Object.fromEntries(Object.entries(lista).map(([campo, msgs]) => [campo, msgs[0]]));
  };

  const handleGuardar = async () => {
    setGuardando(true);
    setErrores({});
    try {
      const res = await axios.put('pasarela-pago', {
        environment: ambiente,
        publicKey: publicKey.trim(),
        ...secretos,
        habilitarPSE,
        habilitarTarjetas,
        activo
      });
      aplicarDatos(res.data.pasarela);
      enqueueSnackbar('Llaves de Wompi guardadas.', { variant: 'success' });
      onClose();
    } catch (err: any) {
      setErrores(erroresDeRespuesta(err));
      enqueueSnackbar(
        err.response?.status === 422
          ? 'Revise los campos marcados.'
          : (err.response?.data?.message ?? 'No se pudieron guardar las llaves.'),
        { variant: 'error' }
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleProbar = async () => {
    setProbando(true);
    setResultadoPrueba(null);
    try {
      const res = await axios.post('pasarela-pago/probar', {
        publicKey: publicKey.trim(),
        privateKey: secretos.privateKey.trim()
      });
      setResultadoPrueba({ ok: true, texto: res.data.message });
    } catch (err: any) {
      setResultadoPrueba({
        ok: false,
        texto: err.response?.data?.message ?? 'No se pudieron probar las llaves.'
      });
    } finally {
      setProbando(false);
    }
  };

  const copiarWebhook = async () => {
    if (!pasarela?.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(pasarela.webhookUrl);
      enqueueSnackbar('URL del webhook copiada.', { variant: 'success' });
    } catch {
      enqueueSnackbar('No se pudo copiar. Selecciónela y cópiela manualmente.', { variant: 'warning' });
    }
  };

  const finalGuardado = (campo: CampoSecreto) =>
    pasarela?.[`${campo}Final` as 'privateKeyFinal' | 'integritySecretFinal' | 'eventsSecretFinal'];

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[640px] top-[5%] max-h-[90vh] overflow-y-auto p-4">
        <ModalHeader>
          <ModalTitle>Llaves de Wompi</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        {cargando && <Spinner />}
        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="mx-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800/40 dark:text-gray-300">
            Con estas llaves los aspirantes pagan en línea (PSE o tarjeta) y el dinero llega a la cuenta
            Wompi de su institución. Las encuentra en el panel de Wompi, en{' '}
            <strong>Desarrolladores → Llaves del API y Secretos para integración técnica</strong>.
          </div>

          <div className="flex items-center justify-between gap-3 mx-4">
            <span className="text-sm font-medium text-gray-700">Estado</span>
            {pasarela?.completa && pasarela.activo ? (
              <span className="badge badge-sm badge-success badge-outline">Pago en línea activo</span>
            ) : (
              <span className="badge badge-sm badge-warning badge-outline">Pago en línea inactivo</span>
            )}
          </div>

          <div className="flex flex-col gap-1 mx-4">
            <label htmlFor="wompiAmbiente" className="text-sm font-medium text-gray-700">
              Ambiente
            </label>
            <select
              id="wompiAmbiente"
              className="select"
              value={ambiente}
              onChange={(e) => {
                setAmbiente(e.target.value as Ambiente);
                setResultadoPrueba(null);
              }}
            >
              <option value="test">Pruebas (sandbox)</option>
              <option value="prod">Producción (cobros reales)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 mx-4">
            <label htmlFor="wompiPublicKey" className="text-sm font-medium text-gray-700">
              Llave pública
            </label>
            <input
              id="wompiPublicKey"
              data-no-uppercase
              className="input"
              placeholder={`pub_${ambiente}_...`}
              value={publicKey}
              autoComplete="off"
              onChange={(e) => {
                setPublicKey(e.target.value);
                setResultadoPrueba(null);
              }}
            />
            {errores.publicKey && <p className="text-xs text-red-600">{errores.publicKey}</p>}
          </div>

          {SECRETOS.map(({ campo, label, prefijo }) => {
            const guardado = finalGuardado(campo);
            return (
              <div key={campo} className="flex flex-col gap-1 mx-4">
                <label htmlFor={`wompi-${campo}`} className="text-sm font-medium text-gray-700">
                  {label}
                </label>
                <div className="input">
                  <input
                    id={`wompi-${campo}`}
                    data-no-uppercase
                    type={verSecretos ? 'text' : 'password'}
                    placeholder={guardado ? `Guardada (termina en ${guardado}). Vacío = conservarla` : `${prefijo(ambiente)}...`}
                    value={secretos[campo]}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setSecretos((prev) => ({ ...prev, [campo]: e.target.value }));
                      setResultadoPrueba(null);
                    }}
                  />
                  <button
                    type="button"
                    className="flex shrink-0 items-center px-1 text-gray-500 hover:text-gray-700"
                    title={verSecretos ? 'Ocultar' : 'Mostrar'}
                    onClick={() => setVerSecretos((v) => !v)}
                  >
                    <KeenIcon icon={verSecretos ? 'eye-slash' : 'eye'} />
                  </button>
                </div>
                {errores[campo] && <p className="text-xs text-red-600">{errores[campo]}</p>}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-x-7 gap-y-3 mx-4">
            <label className="switch switch-sm">
              <input type="checkbox" checked={habilitarPSE} onChange={(e) => setHabilitarPSE(e.target.checked)} />
              <span className="switch-label">PSE</span>
            </label>
            <label className="switch switch-sm">
              <input
                type="checkbox"
                checked={habilitarTarjetas}
                onChange={(e) => setHabilitarTarjetas(e.target.checked)}
              />
              <span className="switch-label">Tarjeta débito/crédito</span>
            </label>
            <label className="switch switch-sm">
              <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
              <span className="switch-label">Pago en línea activo</span>
            </label>
          </div>

          {pasarela?.webhookUrl && (
            <div className="flex flex-col gap-1 mx-4">
              <label htmlFor="wompiWebhook" className="text-sm font-medium text-gray-700">
                URL de eventos (webhook)
              </label>
              <div className="input">
                <input id="wompiWebhook" data-no-uppercase readOnly value={pasarela.webhookUrl} />
                <button type="button" className="flex shrink-0 items-center px-1 text-gray-500 hover:text-gray-700" title="Copiar" onClick={copiarWebhook}>
                  <KeenIcon icon="copy" />
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Péguela en Wompi, en Desarrolladores → URL de eventos, para que los pagos se confirmen solos.
              </p>
            </div>
          )}

          {resultadoPrueba && (
            <div
              className={`mx-4 rounded-lg border px-3 py-2 text-xs ${
                resultadoPrueba.ok
                  ? 'border-green-200 bg-green-50 text-green-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {resultadoPrueba.texto}
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3 px-4 mt-2">
            <button className="btn btn-sm btn-light" onClick={handleProbar} disabled={probando || cargando}>
              <KeenIcon icon="shield-tick" />
              {probando ? 'Probando…' : 'Probar llaves'}
            </button>
            <div className="flex gap-3">
              <button className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleGuardar} disabled={guardando || cargando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalLlavesWompi };
