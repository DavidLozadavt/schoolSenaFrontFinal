import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useRef, useState } from 'react';

interface DetalleRmi {
  idDetalleRmi: number;
  estadoDetalle: string;
  archivoPago: string | null;
  archivoPagoUrl: string | null;
  fechaInicial: string;
  fechaFinal: string | null;
}

interface Periodo {
  periodo: string;
  idRmi: number;
  estadoRmi: string;
  horasAsignadas: number;
  detalles: DetalleRmi[];
}

interface ContratoRmi {
  idContrato: number;
  fechaContratacion: string;
  fechaFinal: string | null;
  periodos: Periodo[];
}

const PagoGeneralInstructor: React.FC = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [anioGestion, setAnioGestion] = useState<number>(0);
  const [aniosContrato, setAniosContrato] = useState<number[]>([]);
  const [dataRmi, setDataRmi] = useState<ContratoRmi[]>([]);
  const [loadingRmi, setLoadingRmi] = useState(false);
  const [uploadingRmi, setUploadingRmi] = useState<number | null>(null);

  // Merge PDFs
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [merging, setMerging] = useState(false);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      const res = await axios.get('get_years_contract_person', {
        params: { idPerson: authContext.persona.id }
      });
      setAniosContrato(res.data);
    };
    loadData();
  }, [authContext]);

  useEffect(() => {
    if (!anioGestion) return;
    const loadRmi = async () => {
      setLoadingRmi(true);
      try {
        const res = await axios.get('get_data_rmi_configuration_by_year', {
          params: { year: anioGestion, idPerson: authContext.persona.id }
        });
        setDataRmi(res.data);
      } catch {
        setDataRmi([]);
      } finally {
        setLoadingRmi(false);
      }
    };
    loadRmi();
  }, [anioGestion]);

  const recargarDatos = async () => {
    const res = await axios.get('get_data_rmi_configuration_by_year', {
      params: { year: anioGestion, idPerson: authContext.persona.id }
    });
    setDataRmi(res.data);
  };

  const handleUploadArchivoPeriodo = async (idRmi: number, file: File) => {
    setUploadingRmi(idRmi);
    try {
      const formData = new FormData();
      formData.append('archivoPago', file);
      formData.append('idRmi', String(idRmi));
      await axios.post('detalle_rmi/archivo_pago_periodo', formData);
      await recargarDatos();
    } catch {
    } finally {
      setUploadingRmi(null);
    }
  };

  const handleAddPdfFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPdfFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemovePdf = (index: number) => {
    setPdfFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMergePdfs = async () => {
    if (pdfFiles.length < 2) return;
    setMerging(true);
    try {
      const formData = new FormData();
      pdfFiles.forEach((file) => formData.append('pdfs[]', file));

      const res = await axios.post('merge_pdfs', formData, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'documento_unido.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
    } finally {
      setMerging(false);
    }
  };

  // Obtener un detalleRmi representativo del periodo (el primero aceptado)
  const getArchivoPeriodo = (periodo: Periodo) => {
    const aceptado = periodo.detalles.find((d) => d.estadoDetalle === 'ACEPTADO');
    return aceptado ?? null;
  };

  return (
    <div className="p-5 w-full space-y-6">
      {/* ── Sección 1: Comprobante de pago por periodo ── */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          Comprobante de pago por periodo
        </h3>

        <div className="mb-4">
          <select
            value={anioGestion}
            onChange={(e) => setAnioGestion(Number(e.target.value))}
            className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0} disabled>
              Seleccione un año
            </option>
            {aniosContrato.map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>

        {loadingRmi ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !anioGestion ? (
          <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 p-8 text-center text-gray-400 text-sm">
            Seleccione un año para ver los periodos
          </div>
        ) : dataRmi.length === 0 ? (
          <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 p-8 text-center text-gray-400 text-sm">
            No hay datos para el año {anioGestion}
          </div>
        ) : (
          dataRmi.map((contrato) => (
            <div
              key={contrato.idContrato}
              className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 mb-4 overflow-hidden"
            >
              <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Contrato #{contrato.idContrato}
                </p>
                <p className="text-xs text-gray-400">
                  {contrato.fechaContratacion} — {contrato.fechaFinal ?? 'Vigente'}
                </p>
              </div>

              <div className="p-4 space-y-2">
                {contrato.periodos.map((periodo) => {
                  const detalle = getArchivoPeriodo(periodo);
                  const isUploading = uploadingRmi === periodo.idRmi;

                  return (
                    <div
                      key={periodo.periodo}
                      className="flex items-center justify-between bg-gray-50 dark:bg-coal-400 rounded-lg px-4 py-3"
                    >
                      {/* Info del periodo */}
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                            Periodo: {periodo.periodo}
                          </p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              periodo.estadoRmi === 'ACEPTADO'
                                ? 'bg-green-100 text-green-700'
                                : periodo.estadoRmi === 'RECHAZADO'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {periodo.estadoRmi}
                          </span>
                        </div>
                      </div>

                      {/* Archivo de pago - solo si periodo ACEPTADO */}
                      {periodo.estadoRmi === 'ACEPTADO' && (
                        <div className="flex items-center gap-2">
                          {detalle?.archivoPagoUrl ? (
                            <a
                              href={detalle.archivoPagoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <i className="ki-outline ki-document text-sm" /> Ver comprobante
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">Sin comprobante</span>
                          )}

                          <label
                            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all ${
                              isUploading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                            }`}
                          >
                            <i className="ki-outline ki-cloud-add text-sm" />
                            {isUploading
                              ? 'Subiendo...'
                              : detalle?.archivoPagoUrl
                                ? 'Cambiar'
                                : 'Subir'}
                            <input
                              type="file"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadArchivoPeriodo(periodo.idRmi, file);
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Sección 2: Unir PDFs ── */}
      <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Unir PDFs</p>
          <p className="text-xs text-gray-400">
            Agrega los PDFs que deseas unir en el orden deseado
          </p>
        </div>

        <div className="p-4 space-y-3">
          {/* Lista de PDFs agregados */}
          {pdfFiles.length > 0 && (
            <div className="space-y-2">
              {pdfFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 dark:bg-coal-400 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <i className="ki-outline ki-document text-red-500 text-sm" />
                    <span className="text-xs text-gray-700 dark:text-gray-200 truncate max-w-[250px]">
                      {file.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemovePdf(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <i className="ki-outline ki-cross text-sm" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botones */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-gray-50 hover:bg-gray-100 dark:bg-coal-400 dark:hover:bg-coal-300 text-gray-700 dark:text-gray-200 rounded-lg cursor-pointer border border-gray-200 dark:border-coal-300 transition-all">
              <i className="ki-outline ki-plus text-sm" /> Agregar PDF
              <input
                type="file"
                accept="application/pdf"
                multiple
                className="hidden"
                ref={mergeInputRef}
                onChange={handleAddPdfFiles}
              />
            </label>

            {pdfFiles.length > 1 && (
              <button
                onClick={handleMergePdfs}
                disabled={merging}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
              >
                <i className="ki-outline ki-document text-sm" />
                {merging ? 'Uniendo...' : `Unir ${pdfFiles.length} PDFs`}
              </button>
            )}

            {pdfFiles.length > 0 && (
              <button
                onClick={() => setPdfFiles([])}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-2"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {pdfFiles.length < 2 && pdfFiles.length > 0 && (
            <p className="text-xs text-yellow-600">Agrega al menos 2 PDFs para unirlos</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PagoGeneralInstructor;
