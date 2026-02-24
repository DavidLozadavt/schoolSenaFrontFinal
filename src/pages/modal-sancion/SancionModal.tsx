import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import axios from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

// ==========================================
// 1. INTERFACES
// ==========================================
export interface SancionModel {
  id: number;
  observacion?: string;
  fechaInicial?: string;
  fechaFinal?: string;
  nombrePersona?: string;
  apellidoPersona?: string;
  contrato?: any;
  gradoSancion?: string;
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
export const SancionEstudianteModal: React.FC<Props> = ({ idAnotacion, onClose }) => {
  // ESTADOS (Tabla)
  const [sanciones, setSanciones] = useState<SancionModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ESTADOS (Formulario Creación)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    observacion: '',
    fechaInicial: '',
    fechaFinal: '',
    gradoSancion: 'Amonestación verbal',
  });
  const [archivo, setArchivo] = useState<File | null>(null);

  // ------------------------------------------
  // LÓGICA DE TABLA (GET)
  // ------------------------------------------
  const fetchSanciones = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await axios.get(`${API_BASE_URL}sanciones_by_anotacion/${idAnotacion}`);
      const data: SancionModel[] = response.data;
      setSanciones(data);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrorMsg('Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.');
      } else {
        setErrorMsg(error.message || 'Error al obtener el historial de sanciones');
      }
    } finally {
      setIsLoading(false);
    }
  }, [idAnotacion]);

  useEffect(() => {
    fetchSanciones();
  }, [fetchSanciones]);

  // ------------------------------------------
  // LÓGICA DE FORMULARIO (POST CREAR)
  // ------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const reqFormData = new FormData();
      reqFormData.append('observacion', formData.observacion);
      reqFormData.append('fechaInicial', formData.fechaInicial);
      reqFormData.append('fechaFinal', formData.fechaFinal);
      reqFormData.append('gradoSancion', formData.gradoSancion);
      reqFormData.append('idAnotacionesDisciplinarias', idAnotacion.toString());
      if (archivo) reqFormData.append('urlDocumentoFile', archivo);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}sanciones`, reqFormData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Recargar la tabla con los datos completos desde el backend
      await fetchSanciones();

      // Limpiar formulario
      setFormData({ observacion: '', fechaInicial: '', fechaFinal: '', gradoSancion: 'Amonestación verbal' });
      setArchivo(null);

    } catch (error: any) {
      if (error.response?.status === 401) {
        setErrorMsg('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setErrorMsg(error.message || 'Error al guardar la sanción.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerDocumento = (docUrl?: string) => {
    if (docUrl) {
      window.open(docUrl, '_blank');
    } else {
      alert('Sin documento adjunto');
    }
  };

  // ------------------------------------------
  // RENDER (UI Tailwind)
  // ------------------------------------------
  return (
    <Modal open={true} onClose={onClose}>
      <ModalContent className="max-w-[1000px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>⚖️ Gestión de Sanciones Disciplinarias</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        {errorMsg && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mx-6 mt-4 text-sm rounded">
            {errorMsg}
          </div>
        )}

        {/* === ZONA SCROLLABLE === */}
        <ModalBody className="grid gap-3 px-0 py-5">

          {/* 1. SECCIÓN: FORMULARIO DE CREACIÓN INCRUSTADO */}
          <div className="border border-gray-200 rounded-lg shadow-sm">
            <div className="bg-light px-4 py-3 border-b border-gray-200 rounded-t-lg">
              <h2 className="text-sm font-semibold tracking-wide text-primary">➕ Registrar Nueva Sanción</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Fechas */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">Fecha Inicial</label>
                  <input type="date" name="fechaInicial" required value={formData.fechaInicial} onChange={handleInputChange}
                    className="input" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">Fecha Final</label>
                  <input type="date" name="fechaFinal" required value={formData.fechaFinal} onChange={handleInputChange}
                    className="input" />
                </div>
                {/* Gravedad */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">Gravedad</label>
                  <select name="gradoSancion" value={formData.gradoSancion} onChange={handleInputChange}
                    className="select">
                    <option value="Amonestación verbal">Amonestación verbal</option>
                    <option value="Amonestación escrita">Amonestación escrita</option>
                    <option value="Suspensión temporal">Suspensión temporal</option>
                    <option value="Cancelación de matrícula">Cancelación de matrícula</option>
                  </select>
                </div>
                {/* Documento */}
                <div className="col-span-1">
                  <label className="block text-sm font-medium mb-1">Adjunto (PDF/IMG)</label>
                  <input type="file" onChange={handleFileChange} accept=".pdf,image/*"
                    className="file-input" />
                </div>

                {/* Observación (Abarca toda la fila en mobile y md) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium mb-1">Descripción / Observación</label>
                  <textarea name="observacion" required rows={2} value={formData.observacion} onChange={handleInputChange}
                    placeholder="Detalle de la sanción interpuesta..."
                    className="textarea w-full"></textarea>
                </div>
              </div>

              {/* Botón Envío de Formulario */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting}
                  className={`btn btn-sm ${isSubmitting ? 'btn-secondary cursor-not-allowed' : 'btn-primary'}`}>
                  {isSubmitting ? 'Guardando...' : 'Guardar Sanción'}
                </button>
              </div>
            </form>
          </div>

          {/* 2. SECCIÓN: TABLA (LISTADO) */}
          <div className="card min-w-full">
            <div className="card-header h-12 flex items-center px-5 border-b">
              <p className="text-sm font-semibold">📋 Historial de Sanciones Vinculadas</p>
            </div>

            <div className="card-table overflow-x-auto min-h-[200px]">
              {isLoading ? (
                <div className="flex justify-center py-10"><span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></span></div>
              ) : (
                <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 border text-left min-w-[250px]">Descripción</th>
                      <th className="p-2 border text-left min-w-[120px]">Período</th>
                      <th className="p-2 border text-left min-w-[150px]">Gravedad</th>
                      <th className="p-2 border text-center">Adjunto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanciones.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-2 border text-sm text-gray-800 break-words whitespace-normal">{item.observacion}</td>
                        <td className="p-2 border text-sm text-gray-600">
                          De: <b>{item.fechaInicial}</b><br />A: <b>{item.fechaFinal || '-'}</b>
                        </td>
                        <td className="p-2 border text-sm">
                          <span className={`px-2 py-1 text-[11px] font-bold rounded-full 
                            ${(item.gradoSancion === 'Suspensión temporal' || item.gradoSancion === 'Cancelación de matrícula')
                              ? 'bg-red-100 text-red-700'
                              : item.gradoSancion === 'Amonestación escrita'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'}`}>
                            {item.gradoSancion || 'Amonestación verbal'}
                          </span>
                        </td>
                        <td className="p-2 border text-center w-[100px]">
                          <button onClick={() => handleVerDocumento(item.DocUrl)} className="btn btn-sm btn-light btn-icon" title="Ver Documento">
                            {/* Icono de Lupa/Ojo */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sanciones.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-500 bg-gray-50/50">Sin sanciones registradas.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {/* Fin cuerpo scrollable */}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
