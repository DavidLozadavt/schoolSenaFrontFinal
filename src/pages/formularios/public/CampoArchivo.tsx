import React, { useState } from 'react';
import { Camera, Eye, File, FileText, Trash2, Upload, User, X } from 'lucide-react';

export interface ArchivoSubido {
  name: string;
  url: string;
}

/**
 * Si la pregunta pide la foto de la persona ("Foto", "Foto de perfil",
 * "Selfie"...). Misma regla con la que el backend busca la foto para la
 * escarapela (EscarapelaService::ES_FOTO).
 */
export const esPreguntaDeFoto = (titulo: string): boolean => {
  const limpio = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  return ['foto', 'selfie', 'retrato', 'imagen de perfil', 'avatar'].some((palabra) => limpio.includes(palabra));
};

const esImagen = (url: string): boolean => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);

interface Props {
  titulo: string;
  archivos: ArchivoSubido[];
  subiendo: boolean;
  /** Color del tema del formulario */
  color: string;
  onSubir: (archivos: FileList) => void;
  onQuitar: (indice: number) => void;
  /** Abre la imagen en grande */
  onVer: (url: string) => void;
}

/** Arrastrar y soltar sobre la zona de carga; `sobre` marca que hay un archivo encima. */
const useSoltar = (onSubir: (archivos: FileList) => void, activo: boolean) => {
  const [sobre, setSobre] = useState(false);

  return {
    sobre,
    eventos: {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault();
        if (activo) setSobre(true);
      },
      onDragLeave: () => setSobre(false),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setSobre(false);
        if (activo && e.dataTransfer.files.length) onSubir(e.dataTransfer.files);
      },
    },
  };
};

const Girando: React.FC<{ color: string; clase?: string }> = ({ color, clase = 'w-5 h-5' }) => (
  <div className={`${clase} border-2 border-t-transparent rounded-full animate-spin`} style={{ borderColor: color, borderTopColor: 'transparent' }} />
);

/** Pregunta de foto: una sola imagen, mostrada como avatar. */
const CampoFoto: React.FC<Props> = ({ archivos, subiendo, color, onSubir, onQuitar, onVer }) => {
  const { sobre, eventos } = useSoltar(onSubir, !subiendo);
  const foto = archivos.find((a) => esImagen(a.url));
  const indice = foto ? archivos.indexOf(foto) : -1;

  return (
    <div
      {...eventos}
      className="mt-2 w-full max-w-md flex flex-col min-[420px]:flex-row items-center gap-5 p-5 rounded-3xl border bg-neutral-50/70 dark:bg-neutral-800/30 transition-colors"
      style={{ borderColor: sobre ? color : `${color}30`, backgroundColor: sobre ? `${color}0d` : undefined }}
    >
      <label className="relative shrink-0 w-28 h-28 cursor-pointer group" title={foto ? 'Cambiar foto' : 'Subir foto'}>
        <input
          type="file"
          className="hidden"
          accept="image/jpeg,image/png"
          disabled={subiendo}
          onChange={(e) => {
            if (e.target.files?.length) onSubir(e.target.files);
            e.target.value = '';
          }}
        />
        <div
          className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-white dark:bg-neutral-900 shadow-lg transition-transform group-hover:scale-[1.03]"
          style={{ border: `3px solid ${color}`, boxShadow: `0 10px 25px -8px ${color}66` }}
        >
          {foto ? (
            <img src={foto.url} alt="Tu foto" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12" style={{ color: `${color}66` }} />
          )}
          {subiendo && (
            <div className="absolute inset-0 rounded-full bg-white/75 dark:bg-neutral-900/75 flex items-center justify-center">
              <Girando color={color} clase="w-7 h-7" />
            </div>
          )}
        </div>
        <span
          className="absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center text-white border-[3px] border-white dark:border-neutral-900 shadow-md"
          style={{ backgroundColor: color }}
        >
          <Camera className="w-4 h-4" />
        </span>
      </label>

      <div className="flex flex-col gap-2.5 min-w-0 text-center min-[420px]:text-left">
        <div>
          <p className="text-sm font-black text-neutral-800 dark:text-white">{subiendo ? 'Subiendo foto…' : foto ? 'Foto lista' : 'Sube tu foto'}</p>
          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium leading-snug mt-1">
            {foto ? 'Así se verá. Puedes cambiarla si no te convence.' : 'De frente y con buena luz. JPG o PNG, máximo 20 MB.'}
          </p>
        </div>
        {foto && !subiendo && (
          <div className="flex flex-wrap justify-center min-[420px]:justify-start gap-2">
            <button
              type="button"
              onClick={() => onVer(foto.url)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Ver
            </button>
            <button
              type="button"
              onClick={() => onQuitar(indice)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Quitar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/** Pregunta de archivos en general: varios documentos o imágenes. */
const CampoArchivos: React.FC<Props> = ({ archivos, subiendo, color, onSubir, onQuitar, onVer }) => {
  const { sobre, eventos } = useSoltar(onSubir, !subiendo);

  return (
    <div className="mt-2 w-full max-w-md flex flex-col gap-4">
      {archivos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {archivos.map((archivo, idx) => {
            const imagen = esImagen(archivo.url);
            const word = /\.(doc|docx)$/i.test(archivo.url);

            return (
              <div key={idx} className="group relative rounded-2xl overflow-hidden bg-white dark:bg-neutral-800/40 border border-neutral-200 dark:border-white/5 shadow-sm">
                {imagen ? (
                  <button type="button" onClick={() => onVer(archivo.url)} className="block w-full aspect-[4/3] bg-neutral-100 dark:bg-neutral-800" title="Ver imagen">
                    <img src={archivo.url} alt={archivo.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  </button>
                ) : (
                  <a
                    href={archivo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full aspect-[4/3] items-center justify-center bg-neutral-50 dark:bg-neutral-800"
                    title="Abrir archivo"
                  >
                    {word ? <FileText className="w-10 h-10 text-blue-500" /> : <File className="w-10 h-10 text-rose-500" />}
                  </a>
                )}
                <p className="px-3 py-2 text-[11px] font-bold text-neutral-700 dark:text-neutral-200 truncate" title={archivo.name}>
                  {archivo.name}
                </p>
                <button
                  type="button"
                  onClick={() => onQuitar(idx)}
                  title="Quitar"
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/55 hover:bg-rose-500 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <label
        {...eventos}
        className="flex flex-col items-center justify-center gap-1 p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-colors bg-neutral-50/60 dark:bg-neutral-800/20"
        style={{ borderColor: sobre ? color : `${color}45`, backgroundColor: sobre ? `${color}0d` : undefined }}
      >
        <input
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,image/*"
          multiple
          disabled={subiendo}
          onChange={(e) => {
            if (e.target.files?.length) onSubir(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-1" style={{ backgroundColor: `${color}15`, color }}>
          {subiendo ? <Girando color={color} /> : <Upload className="w-5 h-5" />}
        </div>
        <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
          {subiendo ? 'Subiendo…' : archivos.length ? 'Agregar más archivos' : 'Arrastra tus archivos o haz clic para elegirlos'}
        </span>
        <span className="text-[9px] text-neutral-400 font-medium uppercase tracking-widest">PDF, Word o imagen · Máx 20 MB</span>
      </label>
    </div>
  );
};

/** Pregunta "Subir archivo" del formulario público. */
export const CampoArchivo: React.FC<Props> = (props) =>
  esPreguntaDeFoto(props.titulo) ? <CampoFoto {...props} /> : <CampoArchivos {...props} />;
