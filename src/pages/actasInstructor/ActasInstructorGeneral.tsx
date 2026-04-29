import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { Acta } from './types';
import ActaCard from './components/ActaCard';
import ActaDetailModal from './components/ActaDetailModal';
import ActaCreateModal from './components/ActaCreateModal';

const ActasInstructorGeneral = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);

  // Estados para creación/edición
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actaToEdit, setActaToEdit] = useState<Acta | null>(null);
  const [availableFichas, setAvailableFichas] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);

  const idContrato = authContext.persona.contrato[0]?.id;

  const loadActas = async () => {
    if (!idContrato) return;
    setLoading(true);
    try {
      const res = await axios.get(`actas/contrato/${idContrato}`);
      setActas(res.data);
    } catch (error) {
      console.error('Error al cargar actas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFichas = async () => {
    if (!idContrato) return;
    try {
      const res = await axios.get(`instructores/fichas?idContrato=${idContrato}`);
      setAvailableFichas(res.data);
    } catch (error) {
      console.error('Error al cargar fichas:', error);
    }
  };

  const loadCiudades = async () => {
    try {
      const res = await axios.get('ciudades');
      setCiudades(res.data);
    } catch (error) {
      console.error('Error al cargar ciudades:', error);
    }
  };

  const handleDownloadPDF = async (idActa: number) => {
    try {
      const response = await axios.get(`actas/generar-pdf/${idActa}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `acta_instructor_${idActa}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar el PDF:', error);
      alert('Error al descargar el PDF. Por favor, intente de nuevo.');
    }
  };

  const handleEdit = (acta: Acta) => {
    setActaToEdit(acta);
    setIsCreateModalOpen(true);
  };

  const handleOpenCreate = () => {
    setActaToEdit(null);
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    loadActas();
    loadFichas();
    loadCiudades();
  }, [idContrato]);

  return (
    <div className="p-5 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Mis Actas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Listado de actas registradas en mi contrato
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
        >
          <i className="ki-outline ki-plus" />
          Crear Acta
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : actas.length === 0 ? (
        <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
          No hay actas registradas para este contrato.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actas.map((acta) => (
            <ActaCard
              key={acta.id}
              acta={acta}
              onClick={setSelectedActa}
              onDownloadPDF={handleDownloadPDF}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {/* Modal Detalles Acta */}
      <ActaDetailModal
        acta={selectedActa}
        onClose={() => setSelectedActa(null)}
      />

      {/* Modal Crear/Editar Acta */}
      <ActaCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setActaToEdit(null);
        }}
        idContrato={idContrato}
        availableFichas={availableFichas}
        ciudades={ciudades}
        onSuccess={loadActas}
        actaToEdit={actaToEdit}
      />
    </div>
  );
};

export default ActasInstructorGeneral;
