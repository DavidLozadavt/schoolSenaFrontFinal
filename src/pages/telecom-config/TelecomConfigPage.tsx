import { useLayout } from '@/providers';
import { Fragment, useEffect, useState, FormEvent } from 'react';
import axios from 'axios';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { Container } from '@/components/container';
import { telecomConfigService, TelecomConfig } from '@/services/telecomConfigService';

interface FormularioOption {
  id: number;
  titulo: string;
}

/**
 * Configuración WhatsApp Meta — formulario simplificado.
 * Solo se editan y envían 3 campos: accessToken, phoneNumberId, verifyToken.
 * Los demás campos de TelecomConfig siguen existiendo en el modelo/BD (no se tocan).
 */
const TelecomConfigPage = () => {
  const { currentLayout } = useLayout();
  const [accessToken, setAccessToken] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [configId, setConfigId] = useState<number | null>(null);
  const [idFormularioInscripcion, setIdFormularioInscripcion] = useState<string>('');
  const [formularios, setFormularios] = useState<FormularioOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const [activa, formulariosRes] = await Promise.all([
        telecomConfigService.activa(),
        axios.get('formularios').catch(() => ({ data: [] })),
      ]);
      if (activa && activa.id) {
        // accessToken viene oculto desde el backend por seguridad (se deja vacío)
        setPhoneNumberId(activa.phoneNumberId ?? '');
        setVerifyToken(activa.verifyToken ?? '');
        setConfigId(activa.id);
        setIdFormularioInscripcion(activa.idFormularioInscripcion ? String(activa.idFormularioInscripcion) : '');
      }
      setFormularios(formulariosRes.data ?? []);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Construir payload solo con los campos con valor (sin vacíos ni null).
    const payload: TelecomConfig = {};
    if (accessToken.trim() !== '') payload.accessToken = accessToken.trim();
    if (phoneNumberId.trim() !== '') payload.phoneNumberId = phoneNumberId.trim();
    if (verifyToken.trim() !== '') payload.verifyToken = verifyToken.trim();
    payload.idFormularioInscripcion = idFormularioInscripcion ? Number(idFormularioInscripcion) : null;

    try {
      if (configId) {
        const res = await telecomConfigService.update(configId, payload);
        setConfigId(res.config.id ?? configId);
      } else {
        const res = await telecomConfigService.create(payload);
        setConfigId(res.config.id ?? null);
      }
      setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
      setAccessToken('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.response?.data?.error ?? 'Error al guardar la configuración.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <Toolbar>
            <ToolbarHeading>
              <ToolbarPageTitle />
              <ToolbarDescription>Configuración WhatsApp Meta</ToolbarDescription>
            </ToolbarHeading>
          </Toolbar>
        </Container>
      )}

      <Container>
        {loading ? (
          <div className="card p-5">Cargando…</div>
        ) : (
          <form onSubmit={handleSubmit} className="card max-w-[560px]" data-no-uppercase>
            <div className="card-header">
              <h3 className="card-title">Configuración WhatsApp Meta</h3>
            </div>
            <div className="card-body grid gap-4">
              <div className="flex flex-col gap-1">
                <label className="form-label font-medium">Access Token</label>
                <input
                  type="password"
                  className="input"
                  placeholder={configId ? '•••• (dejar vacío para no cambiar)' : 'EAAG...'}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="form-label font-medium">Phone Number ID</label>
                <input
                  type="text"
                  className="input"
                  placeholder="123456789012345"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="form-label font-medium">Verify Token</label>
                <input
                  type="text"
                  className="input"
                  placeholder="school_sena_verify_2026"
                  value={verifyToken}
                  onChange={(e) => setVerifyToken(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="form-label font-medium">Formulario de inscripción de aspirantes</label>
                <select
                  className="select"
                  value={idFormularioInscripcion}
                  onChange={(e) => setIdFormularioInscripcion(e.target.value)}
                >
                  <option value="">Sin asignar</option>
                  {formularios.map((f) => (
                    <option key={f.id} value={f.id}>{f.titulo}</option>
                  ))}
                </select>
                <span className="text-2xs text-gray-500">
                  Formulario que deben diligenciar los aspirantes que responden "Sí" por WhatsApp.
                </span>
              </div>
            </div>
            <div className="card-footer flex items-center gap-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              {message && (
                <span className={message.type === 'success' ? 'text-success' : 'text-danger'}>
                  {message.text}
                </span>
              )}
            </div>
          </form>
        )}
      </Container>
    </Fragment>
  );
};

export { TelecomConfigPage };
