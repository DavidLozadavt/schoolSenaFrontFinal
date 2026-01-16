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
        // MODO CREACIÓN: Limpiamos el formulario
        setFormData({ name: '', codigo: '', formacion: '', nivel: '', status: '', description: '' });
      }
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.codigo || !formData.nivel || !formData.formacion || !formData.status) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    const payload = {
      nombrePrograma: formData.name.toUpperCase(),
      codigoPrograma: formData.codigo.toUpperCase(),
      idNivelEducativo: formData.nivel,
      idTipoFormacion: formData.formacion,
      idEstadoPrograma: formData.status,
      descripcionPrograma: formData.description
    };

    try {
      let response;
      if (programToEdit) {
        // MODO ACTUALIZAR (PUT)
        response = await axios.put(`/programas_actualizar/${programToEdit.id}`, payload);
        if (response.data.status === 'success' && onUpdateProgram) {
          onUpdateProgram(response.data.data);
        }
      } else {
        // MODO CREAR (POST)
        response = await axios.post('/programas_guardar', payload);
        if (response.data.status === 'success') {
          onAddProgram(response.data.data);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-coal-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-lg overflow-hidden bg-white border border-gray-200 dark:bg-coal-600 rounded-xl shadow-modal dark:border-coal-100">
        
        {/* Header Dinámico */}
        <div className="flex items-center justify-between px-7.5 py-4 border-b border-gray-200 dark:border-coal-100 bg-gray-light-100 dark:bg-coal-200">
          <h2 className="font-semibold tracking-wider text-gray-900 uppercase text-md dark:text-gray-dark-900">
            {programToEdit ? 'Actualizar Programa' : 'Crear Programa'}
          </h2>
           <button onClick={onClose} className="flex items-center justify-center w-8 h-8 transition-all border rounded-lg shadow-sm bg-danger/10 text-danger border-danger/20 hover:bg-danger hover:text-white">
            <i className="text-lg ki-filled ki-cross"></i>
          </button>
          
        </div>

        <form className="p-7.5 space-y-5">
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

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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

          <div className="flex items-center justify-center gap-3 pt-4">
            <button type="button" onClick={handleSubmit} className="px-10 font-bold tracking-widest uppercase btn btn-primary shadow-primary text-2xs">
              {programToEdit ? 'Actualizar' : 'Aceptar'}
            </button>
            <button type="button" onClick={onClose} className="px-10 font-bold tracking-widest uppercase btn btn-danger shadow-danger text-2xs">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioPrograma;