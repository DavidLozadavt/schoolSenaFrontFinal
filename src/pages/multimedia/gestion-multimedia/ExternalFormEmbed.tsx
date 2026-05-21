import React, { useMemo } from 'react';
import { ExternalLink, AlertCircle, FileText } from 'lucide-react';

export type FormProvider = 'google' | 'microsoft' | 'typeform' | 'tally' | 'jotform' | 'other';

interface ExternalFormEmbedProps {
  url: string;
  provider: FormProvider;
  title?: string;
}

// Providers that block iframe embedding via CSP (frame-ancestors 'none')
const NON_EMBEDDABLE_IFRAME: FormProvider[] = ['google', 'other'];

const PROVIDER_LABELS: Record<FormProvider, string> = {
  google: 'Google Forms',
  microsoft: 'Microsoft Forms',
  typeform: 'Typeform',
  tally: 'Tally',
  jotform: 'Jotform',
  other: 'Formulario Externo',
};

const PROVIDER_COLORS: Record<FormProvider, { bg: string; text: string; border: string; shadow: string }> = {
  google: { bg: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20', shadow: 'shadow-purple-500/20' },
  microsoft: { bg: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20', shadow: 'shadow-blue-500/20' },
  typeform: { bg: 'bg-neutral-900 dark:bg-white', text: 'text-neutral-900 dark:text-white', border: 'border-neutral-500/20', shadow: 'shadow-neutral-500/20' },
  tally: { bg: 'bg-neutral-800', text: 'text-neutral-700 dark:text-neutral-300', border: 'border-neutral-500/20', shadow: 'shadow-neutral-500/20' },
  jotform: { bg: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/20', shadow: 'shadow-orange-500/20' },
  other: { bg: 'bg-gray-500', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-500/20', shadow: 'shadow-gray-500/20' },
};

const ExternalFormEmbed: React.FC<ExternalFormEmbedProps> = ({ url, provider, title = 'Formulario de Registro' }) => {
  const embedUrl = useMemo(() => {
    if (!url) return '';

    try {
      switch (provider) {
        case 'microsoft':
          if (url.includes('forms.office.com')) {
            return url.replace('/Pages/ResponsePage.aspx', '/Pages/EmbedPage.aspx');
          }
          return url;

        case 'typeform':
        case 'tally':
        case 'jotform':
          return url;

        default:
          return url;
      }
    } catch (e) {
      console.error('Invalid URL:', url);
      return url;
    }
  }, [url, provider]);

  const canIframeEmbed = !NON_EMBEDDABLE_IFRAME.includes(provider);
  const colors = PROVIDER_COLORS[provider];
  const label = PROVIDER_LABELS[provider];

  if (!url) return null;

  // For Google Forms and other providers that block iframe via CSP:
  // Show a styled redirect card instead of a broken iframe
  if (!canIframeEmbed) {
    return (
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
            <div className={`w-2 h-8 ${colors.bg} rounded-full`} />
            Formulario de Inscripción
          </h3>
        </div>

        <div className={`flex flex-col items-center justify-center p-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-[2.5rem] border ${colors.border} text-center`}>
          <div className={`w-20 h-20 ${colors.bg} bg-opacity-10 rounded-[1.5rem] flex items-center justify-center mb-6`}>
            <FileText className={`w-10 h-10 ${colors.text}`} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${colors.text} mb-3`}>{label}</span>
          <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-3">{title}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-2 leading-relaxed">
            Este formulario se abrirá en una nueva pestaña de tu navegador.
            La plataforma <strong>{label}</strong> no permite la visualización embebida por políticas de seguridad.
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 max-w-sm mb-8 font-semibold">
            Al hacer clic serás redirigido de forma segura al formulario original.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 px-10 py-4 ${colors.bg} text-white rounded-2xl shadow-xl ${colors.shadow} font-black text-xs uppercase tracking-widest transform hover:scale-105 active:scale-95 transition-all`}
          >
            ABRIR FORMULARIO
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  // For providers that support iframe embedding (Microsoft, Typeform, Tally, Jotform)
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
          <div className={`w-2 h-8 ${colors.bg} rounded-full`} />
          Formulario de Inscripción
        </h3>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`text-sm font-bold ${colors.text} hover:opacity-80 flex items-center gap-1 transition-colors`}
        >
          Abrir en pestaña nueva
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="relative w-full aspect-[4/5] sm:aspect-video min-h-[600px] bg-white dark:bg-neutral-900 rounded-[2.5rem] overflow-hidden border border-neutral-100 dark:border-neutral-800 shadow-2xl">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        >
          <div className="flex flex-col items-center justify-center h-full p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Iframe Bloqueado</h4>
            <p className="text-neutral-500">Tu navegador bloqueó el formulario embebido. Por favor usa el botón de arriba.</p>
          </div>
        </iframe>
      </div>
    </div>
  );
};

export default ExternalFormEmbed;
