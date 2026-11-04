import React, { useEffect, useState } from "react";
import axios from "axios";
import { CompromisosModal } from "../modal-compromiso/CompromisoModal";
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface Persona {
  nombre1?: string;
  apellido1?: string;
}

interface Contrato {
  persona?: Persona;
}

interface AnotacionDiciplinariaModel {
  id?: number;
  observacion?: string;
  fecha?: string;
  gradoAnotacion: string;
  DocUrl?: string;
  contrato?: Contrato;
}

interface Props {
  open: boolean;
  onClose: () => void;
  idMatricula: number;
}

const AnotacionesDiciplinariasModal: React.FC<Props> = ({
  open,
  onClose,
  idMatricula,
}) => {
  const [anotaciones, setAnotaciones] = useState<
    AnotacionDiciplinariaModel[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Estados para el formulario de creación
  const [showForm, setShowForm] = useState(false);
  const [nuevaObservacion, setNuevaObservacion] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split("T")[0]);
  const [nuevoGradoAnotacion, setNuevoGradoAnotacion] = useState("Leve");
  const [nuevoDocumento, setNuevoDocumento] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para modales secundarios
  const [selectedAnotacionId, setSelectedAnotacionId] = useState<number | null>(null);
  const [showCompromisos, setShowCompromisos] = useState(false);

  const API_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    if (open) {
      cargarAnotaciones();
    }
  }, [open]);

  const cargarAnotaciones = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}anotaciones_by_matricula/${idMatricula}`
      );
      setAnotaciones(response.data);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error al cargar anotaciones");
    } finally {
      setLoading(false);
    }
  };

  const crearAnotacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaObservacion.trim()) {
      alert("La observación es obligatoria");
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("observacion", nuevaObservacion);
      formData.append("fecha", nuevaFecha);
      formData.append("gradoAnotacion", nuevoGradoAnotacion);
      if (nuevoDocumento) {
        formData.append("urlDocumentoFile", nuevoDocumento);
      }

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}anotacionesdisciplinarias/${idMatricula}/matricula`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Recargar la tabla con los datos completos desde el backend
      await cargarAnotaciones();

      // Limpiar formulario y cerrar panel
      setNuevaObservacion("");
      setNuevaFecha(new Date().toISOString().split("T")[0]);
      setNuevoGradoAnotacion("Leve");
      setNuevoDocumento(null);
      setShowForm(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Error al crear anotación");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verDocumento = (id: number) => {
    const view = anotaciones.find((a) => a.id === id);
    if (view?.DocUrl) {
      window.open(view.DocUrl, "_blank");
    }
  };

  if (!open) return null;

  return (
    <>
      <Modal open={true} onClose={onClose}>
        <ModalContent className="max-w-[1100px] top-[5%] p-4">
          <ModalHeader>
            <ModalTitle>Anotaciones disciplinarias</ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody className="grid gap-3 px-0 py-5">

            {showForm ? (
              <div className="border border-gray-200 rounded-lg shadow-sm mb-6">
                <div className="bg-light px-4 py-3 border-b border-gray-200 rounded-t-lg">
                  <h3 className="text-sm font-semibold tracking-wide text-primary">Nueva Anotación Disciplinaria</h3>
                </div>
                <form onSubmit={crearAnotacion} className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Observación</label>
                    <textarea
                      required
                      value={nuevaObservacion}
                      onChange={(e) => setNuevaObservacion(e.target.value)}
                      className="textarea w-full"
                      rows={3}
                      placeholder="Detalles de la anotación..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={nuevaFecha}
                        onChange={(e) => setNuevaFecha(e.target.value)}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gravedad</label>
                      <select
                        value={nuevoGradoAnotacion}
                        onChange={(e) => setNuevoGradoAnotacion(e.target.value)}
                        className="select"
                      >
                        <option value="Leve">LEVE</option>
                        <option value="Grave">MODERADA</option>
                        <option value="Gravísima">GRAVE</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Documento (opcional)</label>
                    <input
                      type="file"
                      onChange={(e) => setNuevoDocumento(e.target.files?.[0] || null)}
                      className="file-input"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="btn btn-secondary btn-sm"
                      disabled={isSubmitting}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`btn btn-sm ${isSubmitting ? 'btn-secondary disabled:opacity-50' : 'btn-primary'}`}
                    >
                      {isSubmitting ? 'Guardando...' : 'Guardar Anotación'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setShowForm(true)}
                  className="btn btn-sm btn-primary"
                >
                  + Nueva Anotación
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10"><span className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></span></div>
            ) : (
              <div className="card min-w-full">
                <div className="card-header h-12 flex items-center px-5 border-b">
                  <p className="text-sm font-semibold">Listado de Anotaciones</p>
                </div>
                <div className="card-table overflow-x-auto min-h-[200px]">
                  <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                    <thead>
                      <tr>
                        <th className="p-2 border text-left min-w-[200px]">Descripción</th>
                        <th className="p-2 border text-left">Fecha</th>
                        <th className="p-2 border text-left">Nombre</th>
                        <th className="p-2 border text-left">Apellido</th>
                        <th className="p-2 border text-left">Gravedad</th>
                        <th className="p-2 border text-center">Acciones</th>
                      </tr>
                    </thead>

                    <tbody>
                      {anotaciones.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-2 border whitespace-normal break-words">{item.observacion}</td>
                          <td className="p-2 border whitespace-nowrap">{item.fecha}</td>
                          <td className="p-2 border whitespace-nowrap">
                            {item.contrato?.persona?.nombre1 ?? "No asignado"}
                          </td>
                          <td className="p-2 border whitespace-nowrap">
                            {item.contrato?.persona?.apellido1 ?? "No asignado"}
                          </td>
                          <td className="p-2 border whitespace-nowrap">{item.gradoAnotacion}</td>
                          <td className="p-2 border text-center whitespace-nowrap space-x-2">
                            <div className="flex items-center justify-center gap-2">
                              {/* Botón Compromisos (Icono de apretón de manos / acuerdo) */}
                              <button
                                onClick={() => {
                                  setSelectedAnotacionId(item.id!);
                                  setShowCompromisos(true);
                                }}
                                className="btn btn-sm btn-icon btn-light btn-active-light-primary"
                                title="Ver Compromisos"
                              >
                                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              {/* Botón Documento (Icono de archivo) */}
                              <button
                                onClick={() => verDocumento(item.id!)}
                                className="btn btn-sm btn-icon btn-light btn-active-light-success"
                                title="Ver Documento"
                                disabled={!item.DocUrl}
                              >
                                <svg className={`w-5 h-5 ${item.DocUrl ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {anotaciones.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500 bg-gray-50/50">El estudiante no tiene anotaciones registradas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Botones inferiores */}
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="btn btn-sm btn-secondary"
              >
                Cerrar Ventana
              </button>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modales Secundarios */}
      {showCompromisos && selectedAnotacionId && (
        <CompromisosModal
          idAnotacion={selectedAnotacionId}
          onClose={() => {
            setShowCompromisos(false);
            setSelectedAnotacionId(null);
          }}
        />
      )}
    </>
  );
};

export default AnotacionesDiciplinariasModal;
