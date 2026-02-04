import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FormularioProgramaProps, CatalogosData } from '../types';

export const FormularioPrograma = ({
  isOpen,
  onClose,
  onAddProgram,
  onUpdateProgram,
  programToEdit 
}: FormularioProgramaProps) => {
  
  const [catalogos, setCatalogos] = useState<CatalogosData>({
    niveles: [],
    tipos: [],
    estados: []
  });

  const [formData, setFormData] = useState({
    name: '',
    codigo: '',
    formacion: '',
    nivel: '',
    status: '',
    description: ''
  });

  const [documento, setDocumento] = useState<File | null>(null);
  const [documentoError, setDocumentoError] = useState('');

  useEffect(() => {
    if (isOpen) {
      cargarRecursos();
      if (programToEdit) {
        setFormData({
          name: programToEdit.name || '',
          codigo: programToEdit.codigo || '',
          formacion: programToEdit.idTipoFormacion?.toString() || '', 
          nivel: programToEdit.idNivelEducativo?.toString() || '',
          status: programToEdit.idEstadoPrograma?.toString() || '',
          description: programToEdit.description || ''
        });
      } else {
        setFormData({ name: '', codigo: '', formacion: '', nivel: '', status: '', description: '' });
      }
      setDocumento(null);
      setDocumentoError('');
    }
  }, [isOpen, programToEdit]);

  const cargarRecursos = async () => {
    try {
      const response = await axios.get('/programas_recursos_crear');
      if (response.data.status === 'success') {
        setCatalogos({
          niveles: response.data.data.niveles_educativos,
          tipos: response.data.data.tipos_formacion,
          estados: response.data.data.estados_programa
        });
      }
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  if (!isOpen) return null;

  const validateDocumento = (file: File | null): boolean => {
    if (!file) return true;
    if (file.type !== 'application/pdf') {
      setDocumentoError('Solo se permiten archivos PDF');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocumentoError('El archivo no puede superar los 5MB');
      return false;
    }
    setDocumentoError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.codigo || !formData.nivel || !formData.formacion || !formData.status) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }
    if (!validateDocumento(documento)) return;

    const basePayload = {
      nombrePrograma: formData.name.toUpperCase(),
      codigoPrograma: formData.codigo.toUpperCase(),
      idNivelEducativo: formData.nivel,
      idTipoFormacion: formData.formacion,
      idEstadoPrograma: formData.status,
      descripcionPrograma: formData.description
    };

    try {
      let response;
      if (documento) {
        const formDataToSend = new FormData();
        Object.entries(basePayload).forEach(([key, value]) => {
          formDataToSend.append(key, value as string);
        });
        formDataToSend.append('documento', documento);

        if (programToEdit) {
          formDataToSend.append('_method', 'PUT');
          response = await axios.post(`/programas_actualizar/${programToEdit.id}`, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (response.data.status === 'success' && onUpdateProgram) {
            onUpdateProgram(response.data.data);
          }
        } else {
          response = await axios.post('/programas_guardar', formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (response.data.status === 'success') {
            onAddProgram(response.data.data);
          }
        }
      } else {
        if (programToEdit) {
          response = await axios.put(`/programas_actualizar/${programToEdit.id}`, basePayload);
          if (response.data.status === 'success' && onUpdateProgram) {
            onUpdateProgram(response.data.data);
          }
        } else {
          response = await axios.post('/programas_guardar', basePayload);
          if (response.data.status === 'success') {
            onAddProgram(response.data.data);
          }
        }
      }
      onClose();
    } catch (error: any) {
      console.error("Error en la operación:", error.response?.data || error.message);
      alert("Error: " + (error.response?.data?.message || "Servidor no disponible"));
    }
  };


  const selectClass = "w-full border-gray-300 select bg-gray-light-100 dark:bg-coal-300 dark:border-coal-100 text-2sm focus:border-blue-500 focus:ring-blue-500 accent-blue-600 outline-none";

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-coal-black/40 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto overflow-x-hidden animate-in fade-in duration-300">
      <div className="w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden bg-white border border-gray-200 dark:bg-coal-600 rounded-xl shadow-modal dark:border-coal-100 my-4 sm:my-0">
        
        {/* Header Dinámico */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-7.5 sm:py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-light-100 dark:bg-coal-200 flex-shrink-0">
          <h2 className="font-semibold tracking-wider text-gray-900 uppercase text-sm sm:text-md dark:text-gray-dark-900 truncate min-w-0">
            {programToEdit ? 'Actualizar Programa' : 'Crear Programa'}
          </h2>
          <button onClick={onClose} className="flex items-center justify-center flex-shrink-0 w-8 h-8 transition-all border rounded-lg shadow-sm bg-danger/10 text-danger border-danger/20 hover:bg-danger hover:text-white">
            <i className="text-lg ki-filled ki-cross"></i>
          </button>
        </div>

        <form className="p-4 sm:p-7.5 space-y-4 sm:space-y-5 overflow-y-auto flex-1 min-h-0">
          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 uppercase text-2xs dark:text-gray-dark-700">Nombre del Programa</label>
            <textarea
              rows={2}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border-gray-300 outline-none textarea bg-gray-light-100 dark:bg-coal-300 dark:border-coal-100 focus:border-blue-500 text-2sm"
              placeholder="Ingrese el nombre completo"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 uppercase text-2xs dark:text-gray-dark-700">Código</label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full border-gray-300 outline-none input bg-gray-light-100 dark:bg-coal-300 dark:border-coal-100 focus:border-blue-500 text-2sm"
              placeholder="Ingrese Código"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700 uppercase text-2xs dark:text-gray-dark-700">Tipo Formación</label>
              <select
                value={formData.formacion}
                onChange={(e) => setFormData({ ...formData, formacion: e.target.value })}
                className={selectClass}
              >
                <option value="">Seleccionar Tipo</option>
                {catalogos.tipos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-bold text-gray-700 uppercase text-2xs dark:text-gray-dark-700">Nivel Educativo</label>
              <select
                value={formData.nivel}
                onChange={(e) => setFormData({ ...formData, nivel: e.target.value })}
                className={selectClass}
              >
                <option value="">Seleccionar Nivel</option>
                {catalogos.niveles.map((n) => (
                  <option key={n.id} value={n.id}>{n.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 uppercase text-2xs dark:text-gray-dark-700">Estado Programa</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className={selectClass}
            >
              <option value="">Seleccionar Estado</option>
              {catalogos.estados.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-bold text-gray-700 uppercase text-2xs dark:text-gray-dark-700">Descripción</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border-gray-300 outline-none textarea bg-gray-light-100 dark:bg-coal-300 dark:border-coal-100 focus:border-blue-500 text-2sm"
              placeholder="Descripción breve del programa"
            />
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-bold text-gray-700 uppercase text-2xs dark:text-gray-dark-700">
              Documento del programa <span className="text-gray-500 font-normal">(PDF)</span>
            </p>
            <label
              htmlFor="documento-programa"
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-coal-200 focus-within:border-blue-500"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span>📄</span>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                  {documento ? documento.name : 'Seleccionar archivo PDF'}
                </span>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white whitespace-nowrap self-start sm:self-center">Examinar</span>
              <input
                id="documento-programa"
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  if (file && !validateDocumento(file)) {
                    setDocumento(null);
                    e.target.value = '';
                    return;
                  }
                  setDocumento(file);
                  setDocumentoError('');
                }}
              />
            </label>
            <p className="text-xs text-gray-500">Solo archivos PDF · Máx 5MB</p>
            {documentoError && <p className="text-red-500 text-xs">{documentoError}</p>}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-center gap-2 sm:gap-3 pt-4 pb-2 sm:pb-0">
            <button type="button" onClick={onClose} className="w-full sm:w-auto px-6 sm:px-10 py-2.5 font-bold tracking-widest uppercase btn btn-danger shadow-danger text-2xs">
              Cancelar
            </button>
            <button type="button" onClick={handleSubmit} className="w-full sm:w-auto px-6 sm:px-10 py-2.5 font-bold tracking-widest uppercase btn btn-primary shadow-primary text-2xs">
              {programToEdit ? 'Actualizar' : 'Aceptar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioPrograma;