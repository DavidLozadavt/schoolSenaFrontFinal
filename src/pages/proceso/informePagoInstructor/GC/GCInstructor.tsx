import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, {
  useContext,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle
} from 'react';
import { enqueueSnackbar } from 'notistack';
import { Modal, ModalBody, ModalContent, ModalHeader, ModalTitle } from '@/components/modal';

interface DocumentoGC {
  id: number;
  idGC: number;
  estado: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
  observacion: string | null;
  nombreDocumento: string | null;
  urlDocumentoUrl: string;
}

interface GC {
  id: number;
  idContrato: number;
  idRmi: number;
  estado: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO';
  observacion: string | null;
}

interface Periodo {
  periodo: string;
  idRmi: number;
  estadoRmi: string;
  estadoInforme: string;
  gc: GC | null;
}

interface ContratoRmi {
  idContrato: number;
  periodos: Periodo[];
}

interface GCInstructorRef {
  validate: () => { isValid: boolean; errors: string[] };
}

const GCInstructor = forwardRef<GCInstructorRef>((_, ref) => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [anioGestion, setAnioGestion] = useState<number>(new Date().getFullYear());
  const [aniosContrato, setAniosContrato] = useState<number[]>([]);
  const [dataRmi, setDataRmi] = useState<ContratoRmi[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Modal para documentos
  const [docsModal, setDocsModal] = useState<{ gc: GC; periodo: string } | null>(null);
  const [documentos, setDocumentos] = useState<DocumentoGC[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const periodoActual = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const loadData = async () => {
    if (!anioGestion) return;
    setLoading(true);
    try {
      const res = await axios.get('get_data_rmi_configuration_by_year', {
        params: {
          year: anioGestion,
          idPerson: authContext.persona.id
        }
      });
      setDataRmi(res.data);
    } catch {
      setDataRmi([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await axios.get('get_years_contract_person', {
          params: { idPerson: authContext.persona.id }
        });
        setAniosContrato(res.data);
      } catch (e) {
        console.error(e);
      }
    };
    loadInitial();
  }, [authContext]);

  useEffect(() => {
    loadData();
  }, [anioGestion]);

  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        setValidationError(null);

        // Buscar el periodo actual en todos los contratos
        let currentPeriodData: Periodo | null = null;
        for (const contrato of dataRmi) {
          const p = contrato.periodos.find((p) => p.periodo === periodoActual);
          if (p) {
            currentPeriodData = p;
            break;
          }
        }

        // Si no hay periodo actual registrado aún, permitimos pasar (tal vez está en un mes sin contrato)
        if (!currentPeriodData) {
          return { isValid: true, errors: [] };
        }

        // 1. El informe debe estar ACEPTADO
        if (currentPeriodData.estadoInforme !== 'ACEPTADO') {
          setValidationError(
            `El informe del periodo actual (${periodoActual}) debe estar ACEPTADO antes de proceder con la gestión de coordinación.`
          );
          return { isValid: false, errors: ['Informe no aceptado'] };
        }

        // 2. Debe existir un registro de GC
        if (!currentPeriodData.gc) {
          setValidationError('Debe iniciar el proceso de GC para el periodo actual.');
          return { isValid: false, errors: ['GC no iniciado'] };
        }

        // 3. El estado del GC debe ser ACEPTADO
        if (currentPeriodData.gc.estado !== 'ACEPTADO') {
          setValidationError(
            `El proceso de GC del periodo actual (${periodoActual}) está en estado: ${currentPeriodData.gc.estado}. Debe estar ACEPTADO para continuar al siguiente paso.`
          );
          return { isValid: false, errors: ['GC no aceptado'] };
        }

        return { isValid: true, errors: [] };
      }
    }),
    [dataRmi, periodoActual]
  );

  const handleCrearGC = async (idContrato: number, idRmi: number) => {
    try {
      setLoading(true);
      await axios.post('gc/crear', { idContrato, idRmi });
      enqueueSnackbar('Proceso de GC iniciado', { variant: 'success' });
      await loadData();
    } catch {
      enqueueSnackbar('Error al iniciar proceso de GC', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerDocumentos = async (gc: GC, periodo: string) => {
    setDocsModal({ gc, periodo });
    setLoadingDocs(true);
    try {
      const res = await axios.get(`gc/documentos/${gc.id}`);
      setDocumentos(res.data);
    } catch {
      enqueueSnackbar('Error al cargar documentos', { variant: 'error' });
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !docsModal) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('archivo', file);
        formData.append('idGC', String(docsModal.gc.id));
        formData.append('nombreDocumento', file.name);

        await axios.post('gc/documento/subir', formData);
      }

      enqueueSnackbar(`${files.length} documento(s) subido(s) con éxito`, { variant: 'success' });

      // Recargar documentos
      const res = await axios.get(`gc/documentos/${docsModal.gc.id}`);
      setDocumentos(res.data);
      await loadData(); // Para actualizar estado del GC en la lista principal
    } catch {
      enqueueSnackbar('Error al subir uno o más documentos', { variant: 'error' });
    } finally {
      setUploading(false);
      // Limpiar el input para permitir volver a subir los mismos archivos si se desea
      e.target.value = '';
    }
  };

  const handleEliminarDocumento = async (id: number) => {
    try {
      await axios.delete(`gc/documento/eliminar/${id}`);
      enqueueSnackbar('Documento eliminado', { variant: 'success' });
      setDocumentos((prev) => prev.filter((d) => d.id !== id));
      await loadData();
    } catch {
      enqueueSnackbar('Error al eliminar documento', { variant: 'error' });
    }
  };

  const handleDescargarZip = async (idGC: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`gc/descargar-zip/${idGC}`, {
        responseType: 'blob'
      });

      // Leer el nombre del archivo desde el header
      const contentDisposition = res.headers['content-disposition'];
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '').trim()
        : 'GC_Documentos.zip';

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // liberar memoria
      enqueueSnackbar('ZIP descargado con éxito', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al descargar el archivo ZIP', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 w-full">
      <div className="mb-4">
        <select
          value={anioGestion}
          onChange={(e) => setAnioGestion(Number(e.target.value))}
          className="text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-coal-300 bg-white dark:bg-coal-400 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={0} disabled>
            Seleccione un año
          </option>
          {aniosContrato.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {loading && !docsModal ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : dataRmi.length === 0 ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
          No hay datos para el año seleccionado
        </div>
      ) : (
        dataRmi.map((contrato) => (
          <div
            key={contrato.idContrato}
            className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 mb-4 overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-gray-100 dark:border-coal-300 bg-gray-50/50 dark:bg-coal-500/50">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Contrato #{contrato.idContrato}
              </p>
            </div>
            <div className="p-4 space-y-3">
              {contrato.periodos
                .filter((p) => p.periodo <= periodoActual)
                .sort((a, b) => b.periodo.localeCompare(a.periodo))
                .map((periodo) => (
                  <div
                    key={periodo.periodo}
                    className="border border-gray-100 dark:border-coal-300 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Periodo: {periodo.periodo}
                      </span>
                      {periodo.gc ? (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            periodo.gc.estado === 'ACEPTADO'
                              ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                              : periodo.gc.estado === 'RECHAZADO'
                                ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400'
                          }`}
                        >
                          GC: {periodo.gc.estado}
                        </span>
                      ) : (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-coal-400 dark:text-gray-400">
                          GC: NO INICIADO
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {periodo.estadoInforme === 'ACEPTADO' ? (
                        <>
                          {!periodo.gc ? (
                            <button
                              onClick={() => handleCrearGC(contrato.idContrato, periodo.idRmi)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 font-medium text-white rounded-lg transition-all shadow-sm"
                            >
                              <i className="ki-outline ki-plus text-sm" /> Iniciar GC
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerDocumentos(periodo.gc!, periodo.periodo)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 font-medium text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                            >
                              <i className="ki-outline ki-file-up text-sm" /> Gestionar Documentos
                            </button>
                          )}
                          {periodo.gc && periodo.gc.estado === 'ACEPTADO' && (
                            <button
                              onClick={() => handleDescargarZip(periodo.gc!.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 font-medium text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
                              title="Descargar todos los documentos en un .zip"
                            >
                              <i className="ki-outline ki-cloud-download text-sm" /> Descargar ZIP
                            </button>
                          )}
                        </>
                      ) : (
                        <p className="text-[10px] text-gray-400 italic">
                          * El informe del RMI debe estar ACEPTADO para iniciar el GC
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))
      )}

      {/* Modal de Documentos */}
      {docsModal && (
        <Modal
          open={true}
          onClose={() => setDocsModal(null)}
          className="mx-4 sm:mx-auto max-w-2xl w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full shadow-2xl">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center">
              <div>
                <ModalTitle>Documentos GC — {docsModal.periodo}</ModalTitle>
                <p className="text-xs text-gray-400 mt-1">
                  Estado actual:{' '}
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {docsModal.gc.estado}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setDocsModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-5 space-y-6">
              {/* Upload Area */}
              {docsModal.gc.estado !== 'ACEPTADO' && (
                <div className="relative">
                  <label className="flex flex-col items-center justify-center gap-3 px-3 py-8 border-2 border-dashed border-gray-200 dark:border-coal-300 rounded-2xl cursor-pointer hover:bg-gray-50 dark:hover:bg-coal-400 transition-all group">
                    <div
                      className={`w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center transition-transform group-hover:scale-110`}
                    >
                      <i
                        className={`ki-outline ${uploading ? 'ki-arrows-circle animate-spin' : 'ki-cloud-add'} text-2xl text-blue-600 dark:text-blue-400`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {uploading ? 'Subiendo archivo...' : 'Haga clic para subir documento'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Formatos admitidos: PDF, JPG, PNG
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleUploadFiles}
                      disabled={uploading}
                      accept=".pdf,.jpg,.jpeg,.png"
                      multiple
                    />
                  </label>
                </div>
              )}

              {/* List of documents */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest px-1">
                  Documentos Subidos
                </h4>
                {loadingDocs ? (
                  <div className="flex justify-center py-10">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : documentos.length === 0 ? (
                  <div className="text-center py-10 bg-gray-50/50 dark:bg-coal-400/20 rounded-xl border border-dashed border-gray-100 dark:border-coal-300">
                    <i className="ki-outline ki-file-slash text-3xl text-gray-300 dark:text-coal-200 mb-2" />
                    <p className="text-sm text-gray-400 italic">
                      Aún no se han cargado documentos para este periodo.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {documentos.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 border border-gray-100 dark:border-coal-300 rounded-xl bg-white dark:bg-coal-500 hover:shadow-md transition-shadow group"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                              doc.estado === 'ACEPTADO'
                                ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                : doc.estado === 'RECHAZADO'
                                  ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                  : 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                            }`}
                          >
                            <i className="ki-outline ki-document text-xl" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                              {doc.nombreDocumento || `Documento #${doc.id}`}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${
                                  doc.estado === 'ACEPTADO'
                                    ? 'text-green-600'
                                    : doc.estado === 'RECHAZADO'
                                      ? 'text-red-600'
                                      : 'text-blue-600'
                                }`}
                              >
                                {doc.estado}
                              </span>
                              {doc.observacion && (
                                <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-coal-400 px-1.5 py-0.5 rounded">
                                  Obs: {doc.observacion}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={doc.urlDocumentoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                            title="Ver documento"
                          >
                            <i className="ki-outline ki-eye text-lg" />
                          </a>
                          {doc.estado !== 'ACEPTADO' && (
                            <button
                              onClick={() => handleEliminarDocumento(doc.id)}
                              className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                              title="Eliminar documento"
                            >
                              <i className="ki-outline ki-trash text-lg" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {/* Modal de Validación */}
      {validationError && (
        <Modal
          open={!!validationError}
          onClose={() => setValidationError(null)}
          className="mx-4 sm:mx-auto max-w-md w-full"
        >
          <ModalContent className="bg-white dark:bg-coal-500 rounded-xl w-full shadow-2xl overflow-hidden">
            <ModalHeader className="border-b border-gray-100 dark:border-coal-300 px-5 py-4 flex justify-between items-center bg-red-50/50 dark:bg-red-500/5">
              <ModalTitle className="text-red-700 dark:text-red-400">
                Validación Requerida
              </ModalTitle>
              <button
                onClick={() => setValidationError(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <i className="ki-outline ki-cross text-lg" />
              </button>
            </ModalHeader>
            <ModalBody className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <i className="ki-outline ki-information text-red-600 dark:text-red-400 text-2xl" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-2">
                    Paso bloqueado
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {validationError}
                  </p>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setValidationError(null)}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Entendido
                </button>
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
});

GCInstructor.displayName = 'GCInstructor';

export default GCInstructor;
