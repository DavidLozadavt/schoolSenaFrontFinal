import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
// ==========================================
// 1. INTERFACES
// ==========================================
export interface CompromisoModel {
  id: number;
  observacion?: string;
  fecha?: string;
  nombrePersona?: string;
  apellidoPersona?: string;
  contrato?: any;
  cumplido?: number;
  DocUrl?: string;
  idAnotacionesDisciplinarias?: number;
}

interface Props {
  idAnotacion: number;
  onClose: () => void;
}

// ==========================================
// 2. CONFIGURACIÓN API
// ==========================================
const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

// ==========================================
// 3. COMPONENTE PRINCIPAL
// ==========================================
export const CompromisosModal: React.FC<Props> = ({ idAnotacion, onClose }) => {
  // ESTADOS Listado
  const [compromisos, setCompromisos] = useState<CompromisoModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // ESTADOS Formulario 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ observacion: '', fecha: '' });
  const [archivo, setArchivo] = useState<File | null>(null);

  // ------------------------------------------
  // LÓGICA DE GET
  // ------------------------------------------
  const fetchCompromisos = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}compromisos_by_anotacion/${idAnotacion}`);
      const data = response.data;
      setCompromisos(data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setAuthError('Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.');
      } else {
        setErrorMsg(error.message || 'Error al obtener compromisos');
      }
    } finally {
      setIsLoading(false);
    }
  }, [idAnotacion]);

  useEffect(() => { fetchCompromisos(); }, [fetchCompromisos]);

  // ------------------------------------------
  // LÓGICA DE UPDATE (CUMPLIDO)
  // ------------------------------------------
  const handleToggleEstado = async (id: number, isCumplido: boolean) => {
    const newStatus = isCumplido ? 0 : 1;
    // UI predictiva primero 
    setCompromisos((prev) => prev.map((c) => (c.id === id ? { ...c, cumplido: newStatus } : c)));

    try {
      const response = await axios.post(`${API_BASE_URL}compromisos/update-cumplido`, {
        itemId: id,
        checkState: !isCumplido
      });

    } catch (error: any) {
      // Reversar en caso error
      setCompromisos((prev) => prev.map((c) => (c.id === id ? { ...c, cumplido: isCumplido ? 1 : 0 } : c)));

      if (error.response?.status === 401) {
        alert('Sesión expirada. Por favor, recarga la página.');
      } else {
        alert('Error en el servidor al intentar actualizar el estado.');
      }
    }
  };

  // ------------------------------------------
  // LÓGICA DE CREACIÓN (POST)
  // ------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setAuthError(null);

    try {
      const reqFormData = new FormData();
      reqFormData.append('observacion', formData.observacion);
      reqFormData.append('fecha', formData.fecha);
      reqFormData.append('idAnotacionesDisciplinarias', idAnotacion.toString());
      if (archivo) reqFormData.append('urlDocumentoFile', archivo);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}compromisos`, reqFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Recargar la tabla con los datos completos desde el backend
      await fetchCompromisos();

      // Reset form
      setFormData({ observacion: '', fecha: '' });
      setArchivo(null);

    } catch (error: any) {
      if (error.response?.status === 401) {
        setAuthError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setErrorMsg(error.message || 'Error al crear compromiso.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerDocumento = (docUrl?: string) => {
    if (docUrl) window.open(docUrl, '_blank');
  };

  // Función para reintentar con token fresco
  const handleRetry = () => {
    // Podrías implementar una lógica para refrescar el token aquí
    fetchCompromisos();
  };

  return (
    <Modal open={true} onClose={onClose}>
      <ModalContent className="max-w-[1000px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>🤝 Acuerdos de Compromiso</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        {/* Mensajes de error */}
        {authError && (
          <div className="bg-red-100 text-red-700 p-3 mx-6 mt-4 text-sm rounded flex items-center justify-between">
            <span>{authError}</span>
            <button
              onClick={handleRetry}
              className="px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 text-xs font-semibold"
            >
              Reintentar
            </button>
          </div>
        )}

        {errorMsg && !authError && (
          <div className="bg-red-100 text-red-700 p-3 mx-6 mt-4 text-sm rounded">{errorMsg}</div>
        )}

        <ModalBody className="grid gap-3 px-0 py-5">

          {/* 1. SECCIÓN: FORMULARIO */}
          <div className="border border-gray-200 rounded-lg shadow-sm">
            <div className="bg-light px-4 py-3 border-b border-gray-200 rounded-t-lg">
              <h2 className="text-sm font-semibold tracking-wide text-primary">➕ Establecer Nuevo Compromiso</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">Fecha Adquisición</label>
                  <input type="date" required value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                    className="input" />
                </div>

                <div className="col-span-1 lg:col-span-2">
                  <label className="block text-sm font-medium mb-1">Soporte Físico (Opcional)</label>
                  <input type="file" onChange={(e) => setArchivo(e.target.files?.[0] || null)} accept=".pdf,image/*"
                    className="file-input" />
                </div>

                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium mb-1">¿A qué se compromete?</label>
                  <textarea required rows={2} value={formData.observacion} onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                    placeholder="Ej: El estudiante se compromete a entregar todos sus trabajos el viernes..."
                    className="textarea w-full"></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting || !!authError}
                  className={`btn btn-sm ${isSubmitting || authError ? 'btn-secondary cursor-not-allowed' : 'btn-primary'}`}>
                  {isSubmitting ? 'Guardando...' : 'Crear Compromiso'}
                </button>
              </div>
            </form>
          </div>

          {/* 2. SECCIÓN: TABLA */}
          <div className="card min-w-full">
            <div className="card-header h-12 flex items-center px-5 border-b">
              <p className="text-sm font-semibold">📋 Listado de Compromisos</p>
            </div>
            <div className="card-table overflow-x-auto min-h-[200px]">
              {isLoading ? (
                <div className="flex justify-center py-10"><span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></span></div>
              ) : (
                <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border text-left min-w-[250px]">Descripción</th>
                      <th className="p-2 border text-left">Fecha</th>
                      <th className="p-2 border text-center">✓ Estado</th>
                      <th className="p-2 border text-center">Soporte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compromisos.map((item) => {
                      const isCumplido = item.cumplido === 1;
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-2 border text-sm text-gray-800 break-words whitespace-normal">{item.observacion}</td>
                          <td className="p-2 border text-sm text-gray-600 font-medium">{item.fecha}</td>
                          <td className="p-2 border text-center w-[80px]">
                            <input type="checkbox" checked={isCumplido} onChange={() => handleToggleEstado(item.id, isCumplido)}
                              className="checkbox checkbox-primary w-5 h-5 cursor-pointer shadow-sm" title="¿Cumplió el acuerdo?" />
                          </td>
                          <td className="p-2 border text-center w-[100px]">
                            {item.DocUrl ? (
                              <button onClick={() => handleVerDocumento(item.DocUrl)} className="btn btn-sm btn-light">
                                📄 Ver
                              </button>
                            ) : (<span className="text-gray-400 text-xs italic">N/A</span>)}
                          </td>
                        </tr>
                      );
                    })}
                    {compromisos.length === 0 && !isLoading && (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-500 bg-gray-50/50">El estudiante aún no tiene acuerdos trazados.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};