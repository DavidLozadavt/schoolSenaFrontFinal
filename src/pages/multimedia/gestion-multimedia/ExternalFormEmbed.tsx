import React, { useMemo } from 'react';
import { ExternalLink, AlertCircle, Loader2 } from 'lucide-react';

export type FormProvider = 'google' | 'microsoft' | 'typeform' | 'tally' | 'jotform' | 'other';

interface ExternalFormEmbedProps {
  url: string;
  provider: FormProvider;
  title?: string;
}

const ExternalFormEmbed: React.FC<ExternalFormEmbedProps> = ({ url, provider, title = 'Formulario de Registro' }) => {
  const embedUrl = useMemo(() => {
    if (!url) return '';

    try {
      const uri = new URL(url);

      switch (provider) {
        case 'google':
          // Transform viewform to viewform?embedded=true
          if (url.includes('docs.google.com/forms')) {
            return url.includes('embedded=true') ? url : `${url}${url.includes('?') ? '&' : '?'}embedded=true`;
          }
          return url;

        case 'microsoft':
          // Transform view.aspx to embed.aspx
          if (url.includes('forms.office.com')) {
            return url.replace('/Pages/ResponsePage.aspx', '/Pages/EmbedPage.aspx');
          }
          return url;

        case 'typeform':
          // Typeform URLs are usually embeddable as is, but we can ensure they are clean
          return url;

        case 'tally':
          // Tally URLs work directly
          return url;

        case 'jotform':
          // Jotform embed usually needs a specific format or works with direct link in some cases
          return url;

        default:
          return url;
      }
    } catch (e) {
      console.error('Invalid URL:', url);
      return url;
    }
  }, [url, provider]);

  const canEmbed = useMemo(() => {
    const embeddableProviders: FormProvider[] = ['google', 'microsoft', 'typeform', 'tally', 'jotform'];
    return embeddableProviders.includes(provider);
  }, [provider]);

  if (!url) return null;

  if (!canEmbed) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-[2.5rem] border border-dashed border-neutral-200 dark:border-neutral-700 text-center">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
          <ExternalLink className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">Registro Externo</h3>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mb-8">
          Este evento utiliza una plataforma externa para el registro. Haz clic abajo para completar tu inscripción.
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary px-10 py-4 rounded-2xl shadow-xl shadow-blue-500/20 font-black tracking-wide transform active:scale-95 transition-all"
        >
          COMPLETAR REGISTRO
          <ExternalLink className="ml-2 w-5 h-5" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
          <div className="w-2 h-8 bg-orange-500 rounded-full" />
          Formulario de Inscripción
        </h3>
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors"
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
