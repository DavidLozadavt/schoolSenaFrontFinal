import React, { useState, useRef } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import { seguimientoAspirantesService, ImportResult } from '@/services/seguimientoAspirantesService';

interface ModalImportarAspirantesProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalImportarAspirantes = ({ open, onClose, onSuccess }: ModalImportarAspirantesProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      
      if (extension !== 'xlsx') {
        enqueueSnackbar('Solo se permiten archivos Excel con formato .xlsx', { variant: 'error' });
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setFile(selectedFile);
      setResult(null); // Reset previous results
    }
  };

  const handleUpload = async () => {
    if (!file) {
      enqueueSnackbar('Por favor seleccione un archivo .xlsx para importar.', { variant: 'warning' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const importResponse = await seguimientoAspirantesService.importarAspirantes(file);
      setResult(importResponse);
      
      if (importResponse.errored === 0) {
        enqueueSnackbar('Todos los aspirantes fueron importados correctamente.', { variant: 'success' });
        onSuccess();
        handleClose();
      } else if (importResponse.imported > 0) {
        enqueueSnackbar(`Se importaron ${importResponse.imported} aspirantes. Hubo ${importResponse.errored} registros con error.`, { variant: 'warning' });
        onSuccess();
      } else {
        enqueueSnackbar('No se pudo importar ningún registro. Por favor revise el listado de errores.', { variant: 'error' });
      }
    } catch (error: any) {
      const apiError = error?.response?.data?.error || error?.message || 'Error desconocido';
      enqueueSnackbar(`Error en la importación: ${apiError}`, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[700px] top-[10%] p-4">
        <ModalHeader>
          <ModalTitle>Importar Aspirantes desde Excel</ModalTitle>
          <button 
            className="btn btn-sm btn-icon btn-light btn-clear" 
            onClick={handleClose} 
            disabled={loading}
          >
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="grid gap-5 px-0 py-5">
          <div className="flex flex-col gap-3 px-4">
            <p className="text-sm text-gray-600">
              Seleccione un archivo de Excel (<strong>.xlsx</strong>) que contenga la información de los aspirantes.
              El archivo debe incluir las siguientes columnas: 
              <span className="text-gray-900 font-medium"> Nombres, Apellidos, Celular, Correo, Centro de formación, Programa, Ficha, Fecha</span>.
            </p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                onChange={handleFileChange}
                disabled={loading}
              />
              <KeenIcon icon="file-sheet" className="text-4xl text-gray-400 mb-2" />
              <span className="text-sm font-semibold text-gray-700">
                {file ? file.name : 'Arrastre o haga clic para seleccionar archivo Excel'}
              </span>
              <span className="text-xs text-gray-500 mt-1">Solo archivos .xlsx</span>
            </div>

            {file && (
              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded p-2.5 mt-2">
                <div className="flex items-center gap-2">
                  <KeenIcon icon="document" className="text-blue-600 text-lg" />
                  <span className="text-sm text-blue-900 font-medium">{file.name}</span>
                  <span className="text-xs text-blue-700">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button 
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }} 
                  className="btn btn-xs btn-icon btn-clear text-gray-500 hover:text-red-600"
                  disabled={loading}
                >
                  <KeenIcon icon="trash" />
                </button>
              </div>
            )}
          </div>

          {result && (
            <div className="flex flex-col gap-4 border-t border-gray-200 pt-4 px-4">
              <h4 className="text-md font-semibold text-gray-900">Resumen de la Importación</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                  <span className="block text-2xl font-bold text-green-700">{result.imported}</span>
                  <span className="text-xs text-green-800 font-semibold uppercase">Importados con éxito</span>
                </div>
                <div className="bg-red-50 border border-red-200 rounded p-3 text-center">
                  <span className="block text-2xl font-bold text-red-700">{result.errored}</span>
                  <span className="text-xs text-red-800 font-semibold uppercase">Registros con error</span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-gray-900">Errores encontrados en el archivo:</span>
                  <div className="max-h-[220px] overflow-y-auto border border-gray-300 rounded p-2 bg-gray-50 flex flex-col gap-2">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="text-xs text-red-700 border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <strong className="block text-gray-900">Fila {err.fila} - {err.aspirante}:</strong>
                        <ul className="list-disc pl-4 mt-0.5">
                          {err.detalles.map((d, dIdx) => (
                            <li key={dIdx}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4 px-4 border-t border-gray-200 pt-4">
            <button 
              className="btn btn-sm btn-secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              {result ? 'Cerrar' : 'Cancelar'}
            </button>
            {!result && (
              <button 
                className="btn btn-sm btn-primary" 
                onClick={handleUpload}
                disabled={loading || !file}
              >
                {loading ? 'Procesando...' : 'Comenzar Importación'}
              </button>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalImportarAspirantes };
