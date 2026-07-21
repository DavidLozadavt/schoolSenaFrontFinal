import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Pencil, 
  Trash2, 
  Eye, 
  Calendar, 
  Clock, 
  Lock, 
  Globe, 
  Copy, 
  Check, 
  QrCode, 
  Save, 
  AlertCircle, 
  Users, 
  Sparkles, 
  MessageSquare, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';

interface FormConfigModalProps {
  open: boolean;
  onClose: () => void;
  formId: number | null;
  onFormUpdated?: () => void;
}

export const FormConfigModal: React.FC<FormConfigModalProps> = ({ 
  open, 
  onClose, 
  formId, 
  onFormUpdated 
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const [form, setForm] = useState<any>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estado, setEstado] = useState<'publicado' | 'borrador' | 'pausado'>('borrador');
  const [colorTema, setColorTema] = useState('#6366f1');
  const [requiereAutenticacion, setRequiereAutenticacion] = useState(false);
  const [permiteMultiplesRespuestas, setPermiteMultiplesRespuestas] = useState(true);

  // Vigencia y Expiración
  const [usarVigencia, setUsarVigencia] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  // Límite de respuestas y mensaje personalizado
  const [usarLimiteRespuestas, setUsarLimiteRespuestas] = useState(false);
  const [limiteRespuestas, setLimiteRespuestas] = useState<number | ''>('');
  const [mensajeCierre, setMensajeCierre] = useState('');

  useEffect(() => {
    if (open && formId) {
      fetchFormData();
    }
  }, [open, formId]);

  const formatForInput = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const str = String(dateStr).trim();
    if (str.includes('Z') || str.includes('+')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    return str.replace(' ', 'T').slice(0, 16);
  };

  const formatForServer = (inputVal?: string | null) => {
    if (!inputVal) return null;
    return inputVal.replace('T', ' ') + ':00';
  };

  const fetchFormData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`formularios/${formId}`);
      const data = response.data;
      setForm(data);
      setTitulo(data.titulo || '');
      setDescripcion(data.descripcion || '');
      setEstado(data.estado || 'borrador');
      setColorTema(data.colorTema || '#6366f1');
      setRequiereAutenticacion(!!data.requiereAutenticacion);
      setPermiteMultiplesRespuestas(data.permiteMultiplesRespuestas !== false);

      // Dates formatting
      const initDate = formatForInput(data.fechaInicio);
      const limitDate = formatForInput(data.fechaLimite);
      setFechaInicio(initDate);
      setFechaLimite(limitDate);
      setUsarVigencia(!!initDate || !!limitDate);

      if (data.limiteRespuestas !== null && data.limiteRespuestas !== undefined && Number(data.limiteRespuestas) > 0) {
        setUsarLimiteRespuestas(true);
        setLimiteRespuestas(Number(data.limiteRespuestas));
      } else {
        setUsarLimiteRespuestas(false);
        setLimiteRespuestas('');
      }

      setMensajeCierre(data.mensajeCierre || '');
    } catch (err) {
      console.error('Error al cargar la configuración del formulario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formId) return;
    setSaving(true);
    try {
      const payload: any = {
        titulo,
        descripcion,
        estado,
        colorTema,
        requiereAutenticacion,
        permiteMultiplesRespuestas,
        fechaInicio: usarVigencia ? formatForServer(fechaInicio) : null,
        fechaLimite: usarVigencia ? formatForServer(fechaLimite) : null,
        limiteRespuestas: usarLimiteRespuestas && limiteRespuestas ? Number(limiteRespuestas) : null,
        mensajeCierre: mensajeCierre.trim() || null,
      };

      await axios.put(`formularios/${formId}`, payload);
      if (onFormUpdated) onFormUpdated();
      onClose();
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      alert('Hubo un problema al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!formId) return;
    if (!window.confirm('¿Estás seguro de que deseas eliminar permanentemente este formulario y todas sus respuestas?')) return;

    try {
      await axios.delete(`formularios/${formId}`);
      if (onFormUpdated) onFormUpdated();
      onClose();
    } catch (err) {
      console.error('Error al eliminar el formulario:', err);
      alert('Error al eliminar el formulario');
    }
  };

  const publicUrl = `${window.location.origin}/formulario-publico/${formId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in custom-scrollbar overflow-y-auto">
      <div 
        className="bg-white dark:bg-neutral-900 w-full max-w-3xl rounded-[2.5rem] border border-neutral-100 dark:border-white/10 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]"
        style={{ borderTop: `10px solid ${colorTema}` }}
      >
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between gap-4 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md"
              style={{ backgroundColor: colorTema }}
            >
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Configuración del Formulario</span>
              <h2 className="text-lg font-black uppercase tracking-tight text-neutral-800 dark:text-white truncate">
                {titulo || 'Formulario sin título'}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <div className="w-8 h-8 rounded-full border-4 border-t-indigo-600 border-neutral-200 animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest">Cargando configuración...</span>
          </div>
        ) : (
          <div className="p-6 md:p-8 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
            
            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => { onClose(); navigate(`/formularios/builder/${formId}`); }}
                className="p-4 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-3 font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                <Pencil className="w-5 h-5" />
                <div className="flex flex-col text-left">
                  <span>Editar Preguntas</span>
                  <span className="text-[9px] text-blue-500/80 font-semibold">Abrir en el Builder</span>
                </div>
              </button>

              <button 
                onClick={() => window.open(publicUrl, '_blank')}
                className="p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-3 font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                <Eye className="w-5 h-5" />
                <div className="flex flex-col text-left">
                  <span>Ver Vista Pública</span>
                  <span className="text-[9px] text-emerald-500/80 font-semibold">Abrir enlace público</span>
                </div>
              </button>

              <button 
                onClick={handleDelete}
                className="p-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-3 font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              >
                <Trash2 className="w-5 h-5" />
                <div className="flex flex-col text-left">
                  <span>Eliminar Formulario</span>
                  <span className="text-[9px] text-rose-500/80 font-semibold">Borrar de forma permanente</span>
                </div>
              </button>
            </div>

            {/* Public Link & QR Code Box */}
            <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Enlace Público Oficial</span>
                  <span className="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200 truncate max-w-sm">
                    {publicUrl}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={copyUrl}
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copiado' : 'Copiar URL'}</span>
                </button>

                <button 
                  onClick={() => setShowQrModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 transition-all hover:scale-105"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Código QR</span>
                </button>
              </div>
            </div>

            {/* General Settings */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-500" /> Estado y Apariencia
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* State selector */}
                <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm">
                  <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white">Estado del Formulario</label>
                  <select 
                    value={estado} 
                    onChange={(e) => setEstado(e.target.value as any)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white outline-none cursor-pointer"
                  >
                    <option value="publicado">🟢 Publicado (Abierto al público)</option>
                    <option value="borrador">🟠 Borrador (Solo vista previa)</option>
                    <option value="pausado">🔴 Pausado (Cerrado manualmente)</option>
                  </select>
                </div>

                {/* Color theme */}
                <div className="flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm">
                  <div className="flex flex-col">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white">Color de Marca/Tema</label>
                    <span className="text-[10px] text-neutral-400 font-semibold">Color de la barra e íconos</span>
                  </div>
                  <input 
                    type="color"
                    value={colorTema}
                    onChange={(e) => setColorTema(e.target.value)}
                    className="w-10 h-10 p-0 border-0 rounded-xl cursor-pointer overflow-hidden shadow-sm shrink-0"
                  />
                </div>
              </div>
            </div>

            {/* Time Control & Expiration */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Control de Tiempo y Expiración del Enlace
                </h3>
                
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Activar Vigencia</span>
                  <input 
                    type="checkbox"
                    checked={usarVigencia}
                    onChange={(e) => setUsarVigencia(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 relative ${usarVigencia ? 'bg-orange-500' : 'bg-neutral-300 dark:bg-neutral-700'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200 ${usarVigencia ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </label>
              </div>

              {usarVigencia && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-3xl bg-orange-500/[0.03] border border-orange-500/20 animate-fade-in">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-orange-500" /> Fecha y Hora de Apertura
                    </label>
                    <input 
                      type="datetime-local" 
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl text-xs font-bold text-neutral-800 dark:text-white outline-none"
                    />
                    <span className="text-[9px] text-neutral-400 font-semibold">Antes de esta fecha, el formulario estará cerrado.</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-500" /> Fecha y Hora de Expiración (Límite)
                    </label>
                    <input 
                      type="datetime-local" 
                      value={fechaLimite}
                      onChange={(e) => setFechaLimite(e.target.value)}
                      className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl text-xs font-bold text-neutral-800 dark:text-white outline-none"
                    />
                    <span className="text-[9px] text-neutral-400 font-semibold">Después de esta fecha, se mostrará la pantalla de expirado.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Restrictions (Max Responses & Custom Message) */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Límite de Cupos y Mensaje Personalizado
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Max responses limit */}
                <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-blue-500" /> Límite de Respuestas (Cupos)
                    </label>
                    <input 
                      type="checkbox"
                      checked={usarLimiteRespuestas}
                      onChange={(e) => setUsarLimiteRespuestas(e.target.checked)}
                      className="checkbox checkbox-xs"
                    />
                  </div>

                  {usarLimiteRespuestas && (
                    <input 
                      type="number" 
                      placeholder="Ejemplo: 50"
                      value={limiteRespuestas}
                      onChange={(e) => setLimiteRespuestas(e.target.value ? Number(e.target.value) : '')}
                      className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl text-xs font-bold text-neutral-800 dark:text-white outline-none"
                    />
                  )}
                  <span className="text-[9px] text-neutral-400 font-semibold">
                    Cierra automáticamente al alcanzar el límite de participantes.
                  </span>
                </div>

                {/* Multiple submissions toggle */}
                <div className="flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white">Múltiples Respuestas</label>
                    <p className="text-[10px] text-neutral-400 font-semibold mt-1">Permite a un mismo usuario responder varias veces.</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setPermiteMultiplesRespuestas(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${permiteMultiplesRespuestas ? 'bg-emerald-500 text-white shadow-sm' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}
                    >
                      Sí
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPermiteMultiplesRespuestas(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${!permiteMultiplesRespuestas ? 'bg-rose-500 text-white shadow-sm' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}
                    >
                      No (1 respuesta)
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Closure Message */}
              <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 shadow-sm">
                <label className="text-xs font-black uppercase tracking-wider text-neutral-800 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" /> Mensaje Personalizado de Cierre / Expiración
                </label>
                <textarea 
                  rows={2}
                  placeholder="Ejemplo: Gracias por tu interés. Las inscripciones finalizaron el 21 de Julio. ¡Te esperamos en el próximo evento!"
                  value={mensajeCierre}
                  onChange={(e) => setMensajeCierre(e.target.value)}
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 rounded-xl text-xs font-semibold text-neutral-800 dark:text-white outline-none"
                />
                <span className="text-[9px] text-neutral-400 font-semibold">Este mensaje se mostrará al usuario en caso de que el enlace haya expirado o cerrado.</span>
              </div>
            </div>

          </div>
        )}

        {/* Modal Footer */}
        <div className="p-6 border-t border-neutral-100 dark:border-white/5 flex items-center justify-end gap-3 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/20">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-black uppercase tracking-wider transition-all"
          >
            Cancelar
          </button>

          <button 
            onClick={handleSave}
            disabled={saving || loading}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Guardar Configuración</span>
          </button>
        </div>
      </div>

      {/* QR Code Lightbox Modal */}
      {showQrModal && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setShowQrModal(false)}
        >
          <div 
            className="bg-white dark:bg-neutral-900 p-8 rounded-[2.5rem] border border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Código QR del Formulario</span>
              <h3 className="text-base font-black uppercase tracking-tight text-neutral-800 dark:text-white">{titulo}</h3>
            </div>

            <div className="p-4 bg-white rounded-3xl border-2 border-dashed border-neutral-200 shadow-inner">
              <img src={qrCodeUrl} alt="Código QR del Formulario" className="w-56 h-56 object-contain" />
            </div>

            <p className="text-[10px] text-neutral-400 font-semibold">
              Escanea para abrir el formulario en un dispositivo móvil.
            </p>

            <div className="flex items-center gap-3 w-full">
              <a 
                href={qrCodeUrl}
                download="codigo_qr_formulario.png"
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-black text-xs uppercase tracking-wider hover:bg-indigo-700 transition-colors shadow-md text-center"
              >
                Descargar QR
              </a>
              <button 
                onClick={() => setShowQrModal(false)}
                className="px-5 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-black text-xs uppercase tracking-wider hover:bg-neutral-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
