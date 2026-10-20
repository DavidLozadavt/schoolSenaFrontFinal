import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FileSpreadsheet, UploadCloud, Download, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { esSoloNumeros, type FormData } from '../builder/formBuilderTypes';
import { NUMBER_TYPE_LABEL, QUESTION_TYPE_LABELS, downloadExcelTemplate, parseExcelToForm } from '../builder/excelFormParser';

interface ExcelImportModalProps {
  open: boolean;
  onClose: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsedForm, setParsedForm] = useState<FormData | null>(null);

  useEffect(() => {
    if (!open) {
      setParsing(false);
      setError(null);
      setFileName('');
      setParsedForm(null);
    }
  }, [open]);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setError('Formato no válido. Sube un archivo Excel (.xlsx, .xls) o CSV.');
      return;
    }

    setParsing(true);
    setError(null);
    try {
      setParsedForm(await parseExcelToForm(file));
      setFileName(file.name);
    } catch (err: any) {
      console.error('Error leyendo el Excel:', err);
      setParsedForm(null);
      setError(err?.message || 'No se pudo leer el archivo.');
    } finally {
      setParsing(false);
    }
  };

  const handleCreate = () => {
    if (!parsedForm) return;
    navigate('/formularios/builder', { state: { importedForm: parsedForm } });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-[2.5rem] border border-neutral-100 dark:border-white/10 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh] border-t-[10px] border-t-emerald-500">
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-neutral-100 dark:border-white/5 flex items-center justify-between gap-4 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md bg-emerald-500">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Importar Formulario</span>
              <h2 className="text-lg font-black uppercase tracking-tight text-neutral-800 dark:text-white truncate">
                Cargar desde Excel
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
        <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {!parsedForm ? (
            <>
              <label
                className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-neutral-300 dark:border-white/10 rounded-3xl cursor-pointer hover:border-emerald-500 hover:bg-emerald-500/[0.03] transition-all text-center"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleFile(e.dataTransfer.files?.[0]);
                }}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  disabled={parsing}
                  onChange={(e) => {
                    handleFile(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                  {parsing ? (
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>
                <span className="text-sm font-black uppercase tracking-tight text-neutral-800 dark:text-white">
                  {parsing ? 'Leyendo archivo...' : 'Selecciona o arrastra tu archivo'}
                </span>
                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Excel (.xlsx, .xls) o CSV</span>
              </label>

              {error && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="p-5 rounded-3xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-white/5 flex flex-col gap-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Formatos que reconoce</h3>
                <ul className="flex flex-col gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed list-disc pl-4">
                  <li>
                    <b className="text-neutral-700 dark:text-neutral-200">Una fila por campo:</b> columnas Campo, Tipo, Obligatorio, Opciones y Descripción (el de la plantilla).
                  </li>
                  <li>
                    <b className="text-neutral-700 dark:text-neutral-200">Encabezados como campos:</b> cada columna de la primera fila se convierte en una pregunta.
                  </li>
                  <li>
                    <b className="text-neutral-700 dark:text-neutral-200">Lista simple:</b> un campo por fila en una sola columna.
                  </li>
                  <li>
                    Opciones entre paréntesis, ej. <i>Cargo (coordinador, rector, docente)</i>, y un <b>*</b> al final para marcarlo obligatorio.
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="mt-1 w-fit px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-white/10 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar plantilla</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Título del Formulario</label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-250 dark:border-neutral-800 px-5 py-3.5 text-sm font-black text-neutral-800 dark:text-white rounded-2xl outline-none focus:border-emerald-500 transition-all"
                  value={parsedForm.titulo}
                  onChange={(e) => setParsedForm({ ...parsedForm, titulo: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {`${parsedForm.preguntas.length} ${parsedForm.preguntas.length === 1 ? 'campo detectado' : 'campos detectados'} en ${fileName}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setParsedForm(null)}
                  className="text-neutral-400 hover:text-emerald-600 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Cambiar archivo</span>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {parsedForm.preguntas.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-white/5 flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs font-bold text-neutral-800 dark:text-white">
                        {`${idx + 1}. ${q.titulo}`}
                        {q.esObligatoria && <span className="text-rose-500 ml-1">*</span>}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shrink-0">
                        {esSoloNumeros(q) ? NUMBER_TYPE_LABEL : QUESTION_TYPE_LABELS[q.tipo]}
                      </span>
                    </div>
                    {q.opciones.length > 0 && (
                      <span className="text-[10px] text-neutral-400 font-semibold">{q.opciones.map((o) => o.texto).join(' · ')}</span>
                    )}
                  </div>
                ))}
              </div>

              <span className="text-[10px] text-neutral-400 font-semibold">
                Podrás ajustar tipos, opciones y campos obligatorios en el editor antes de guardar.
              </span>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-neutral-100 dark:border-white/5 flex items-center justify-end gap-3 shrink-0 bg-neutral-50/50 dark:bg-neutral-800/20">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-black uppercase tracking-wider transition-all"
          >
            Cancelar
          </button>

          <button
            onClick={handleCreate}
            disabled={!parsedForm}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            <span>Abrir en el editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
