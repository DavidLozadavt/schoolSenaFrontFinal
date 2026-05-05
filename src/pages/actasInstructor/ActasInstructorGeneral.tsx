import { AuthContext } from '@/auth/providers/JWTProvider';
import axios from 'axios';
import React, { useContext, useEffect, useState } from 'react';
import { Acta } from './types';
import ActaCard from './components/ActaCard';
import ActaDetailModal from './components/ActaDetailModal';
import ActaCreateModal from './components/ActaCreateModal';
import ActaAsistenciasModal from './components/ActaAsistenciasModal';
import ActaAprobarModal from './components/ActaAprobarModal';

const ActasInstructorGeneral = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error('AuthContext debe usarse dentro de AuthProvider');

  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(false);
  const [actasAsistente, setActasAsistente] = useState<Acta[]>([]);
  const [loadingAsistente, setLoadingAsistente] = useState(false);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [activeTab, setActiveTab] = useState<'creadas' | 'asistente'>('creadas');

  // Estados para creación/edición
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actaToEdit, setActaToEdit] = useState<Acta | null>(null);
  
  // Estado para modal de asistencias
  const [isAsistenciasModalOpen, setIsAsistenciasModalOpen] = useState(false);
  const [actaForAsistencias, setActaForAsistencias] = useState<Acta | null>(null);

  // Estado para modal de aprobar asistencia
  const [isAprobarModalOpen, setIsAprobarModalOpen] = useState(false);
  const [actaForAprobar, setActaForAprobar] = useState<Acta | null>(null);

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

  const loadActasAsistente = async () => {
    if (!idContrato) return;
    setLoadingAsistente(true);
    try {
      const res = await axios.get(`actas/asistente/${idContrato}`);
      setActasAsistente(res.data);
    } catch (error) {
      console.error('Error al cargar actas como asistente:', error);
    } finally {
      setLoadingAsistente(false);
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
      const res = await axios.get('ciudades-departamento');
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

  const handleOpenAsistencias = (acta: Acta) => {
    setActaForAsistencias(acta);
    setIsAsistenciasModalOpen(true);
  };

  const handleOpenAprobar = (acta: Acta) => {
    setActaForAprobar(acta);
    setIsAprobarModalOpen(true);
  };

  const handleOpenCreate = () => {
    setActaToEdit(null);
    setIsCreateModalOpen(true);
  };

  useEffect(() => {
    loadActas();
    loadActasAsistente();
    loadFichas();
    loadCiudades();
  }, [idContrato]);

  return (
    <div className="p-5 w-full">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Actas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestión de actas y asistencias
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

      <div className="flex border-b border-gray-200 dark:border-coal-300 mb-6">
        <button
          onClick={() => setActiveTab('creadas')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'creadas'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Mis Actas (Creadas)
        </button>
        <button
          onClick={() => setActiveTab('asistente')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'asistente'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Actas por Aprobar (Asistente)
        </button>
      </div>

      {activeTab === 'creadas' && (
        loading ? (
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
                onAsistencias={handleOpenAsistencias}
              />
            ))}
          </div>
        )
      )}

      {activeTab === 'asistente' && (
        loadingAsistente ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : actasAsistente.length === 0 ? (
          <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
            No eres asistente en ninguna acta actualmente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actasAsistente.map((acta) => (
              <ActaCard
                key={acta.id}
                acta={acta}
                onClick={setSelectedActa}
                onDownloadPDF={handleDownloadPDF}
                onAprobar={handleOpenAprobar}
              />
            ))}
          </div>
        )
      )}

      {/* Modal Detalles Acta */}
      <ActaDetailModal
        acta={selectedActa}
        onClose={() => setSelectedActa(null)}
      />

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

      {/* Modal Asistencias */}
      <ActaAsistenciasModal
        isOpen={isAsistenciasModalOpen}
        onClose={() => {
          setIsAsistenciasModalOpen(false);
          setActaForAsistencias(null);
        }}
        acta={actaForAsistencias}
        onSuccess={loadActas}
      />

      {/* Modal Aprobar */}
      <ActaAprobarModal
        isOpen={isAprobarModalOpen}
        onClose={() => {
          setIsAprobarModalOpen(false);
          setActaForAprobar(null);
        }}
        acta={actaForAprobar}
        idContrato={idContrato}
        onSuccess={loadActasAsistente}
      />
    </div>
  );
};

export default ActasInstructorGeneral;
