import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import { Download, Loader2 } from 'lucide-react';
import { EscarapelaCard, type EscarapelaDatos } from './EscarapelaCard';

export type FormatoEscarapela = 'pdf' | 'png';

/**
 * La foto del inscrito se sirve desde la API, en otro origen, y html2canvas no
 * pinta imágenes ajenas: se baja antes y se deja dentro de la tarjeta, ya
 * reducida al tamaño en que se ve. Si falla, la escarapela sale sin foto.
 */
const conFotoEmbebida = async (datos: EscarapelaDatos): Promise<EscarapelaDatos> => {
  if (!datos.fotoUrl || datos.fotoUrl.startsWith('data:')) return datos;

  try {
    const respuesta = await fetch(datos.fotoUrl);
    if (!respuesta.ok) throw new Error(`Foto ${respuesta.status}`);

    const foto = await createImageBitmap(await respuesta.blob());
    const escala = Math.min(1, 480 / Math.max(foto.width, foto.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(foto.width * escala);
    lienzo.height = Math.round(foto.height * escala);
    lienzo.getContext('2d')!.drawImage(foto, 0, 0, lienzo.width, lienzo.height);

    return { ...datos, fotoUrl: lienzo.toDataURL('image/jpeg', 0.88) };
  } catch (error) {
    console.error('No se pudo cargar la foto de la escarapela:', error);
    return { ...datos, fotoUrl: null };
  }
};

/** Dibuja la tarjeta fuera de la pantalla y la captura como imagen. */
const capturar = async (original: EscarapelaDatos, escala: number): Promise<HTMLCanvasElement> => {
  const datos = await conFotoEmbebida(original);
  const contenedor = document.createElement('div');
  contenedor.style.cssText = 'position:fixed;left:-10000px;top:0;';
  document.body.appendChild(contenedor);
  const raiz = createRoot(contenedor);

  // Tailwind pone `img { display: block }` y html2canvas mide la línea base del
  // texto con una imagen: sin esto todo el texto sale corrido hacia abajo.
  const estilo = document.createElement('style');
  estilo.textContent = 'img { display: inline-block !important; }';
  document.head.appendChild(estilo);

  try {
    flushSync(() => raiz.render(<EscarapelaCard datos={datos} plana />));
    // El QR se pinta en un efecto, justo después del render
    await new Promise((listo) => setTimeout(listo, 60));

    return await html2canvas(contenedor.firstElementChild as HTMLElement, { scale: escala, useCORS: true, backgroundColor: '#ffffff' });
  } finally {
    estilo.remove();
    raiz.unmount();
    contenedor.remove();
  }
};

/** Nombre de archivo a partir de un texto libre ("Fiesta de Halloween" → "fiesta-de-halloween"). */
export const nombreArchivo = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'escarapela';

/**
 * Descarga las escarapelas con el diseño del formulario. En PDF van todas en
 * un archivo de 10 x 14 cm, una por página; en PNG se descarga solo la primera.
 */
export const descargarEscarapelas = async (
  escarapelas: EscarapelaDatos[],
  formato: FormatoEscarapela,
  nombre: string,
  alAvanzar?: (hechas: number, total: number) => void
): Promise<void> => {
  if (formato === 'png') {
    const lienzo = await capturar(escarapelas[0], 3);
    const blob = await new Promise<Blob | null>((listo) => lienzo.toBlob(listo, 'image/png'));
    if (!blob) throw new Error('No se pudo generar la imagen');
    saveAs(blob, `${nombre}.png`);
    return;
  }

  const pdf = new jsPDF({ unit: 'mm', format: [100, 140] });
  // Con muchas, menos resolución por página para no agotar la memoria del navegador
  const escala = escarapelas.length > 1 ? 2 : 3;

  for (let i = 0; i < escarapelas.length; i++) {
    const lienzo = await capturar(escarapelas[i], escala);
    if (i > 0) pdf.addPage([100, 140]);
    pdf.addImage(lienzo.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 100, 140);
    alAvanzar?.(i + 1, escarapelas.length);
  }

  pdf.save(`${nombre}.pdf`);
};

/** Botones "PDF" e "Imagen" con los que el inscrito descarga su escarapela. */
export const DescargarEscarapela: React.FC<{ datos: EscarapelaDatos }> = ({ datos }) => {
  const [generando, setGenerando] = useState<FormatoEscarapela | null>(null);
  const [error, setError] = useState(false);

  const descargar = async (formato: FormatoEscarapela) => {
    setGenerando(formato);
    setError(false);
    try {
      await descargarEscarapelas([datos], formato, `escarapela-${nombreArchivo(datos.evento.nombre)}`);
    } catch (err) {
      console.error('No se pudo descargar la escarapela:', err);
      setError(true);
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap justify-center gap-2">
        {([['pdf', 'Descargar PDF'], ['png', 'Descargar imagen']] as [FormatoEscarapela, string][]).map(([formato, texto]) => (
          <button
            key={formato}
            type="button"
            onClick={() => descargar(formato)}
            disabled={generando !== null}
            className="text-white font-black uppercase tracking-widest text-[10px] py-3.5 px-5 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            style={{ backgroundColor: datos.color }}
          >
            {generando === formato ? <Loader2 className="w-4 h-4 shrink-0 animate-spin" /> : <Download className="w-4 h-4 shrink-0" />}
            <span>{texto}</span>
          </button>
        ))}
      </div>
      {error && <p className="text-[11px] font-semibold text-rose-500">No se pudo generar el archivo. Inténtalo de nuevo.</p>}
    </div>
  );
};
