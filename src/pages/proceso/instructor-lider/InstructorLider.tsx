import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Ficha, Aprendiz } from './types';
import FichasGrid from './components/FichasGrid';
import AprendicesView from './components/AprendicesView';

const InstructorLider: React.FC = () => {
  const [fichas, setFichas] = useState<Ficha[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<Ficha | null>(null);
  const [aprendices, setAprendices] = useState<Aprendiz[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAprendices, setLoadingAprendices] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const loadFichas = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`instructor-lider`);
        setFichas(res.data);
      } catch (error) {
        console.error('Error loading fichas:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFichas();
  }, []);

  const loadAprendices = async (ficha: Ficha) => {
    try {
      setSelectedFicha(ficha);
      setLoadingAprendices(true);
      const res = await axios.get(`instructor-lider/ficha/${ficha.id}/aprendices`);
      setAprendices(res.data);
    } catch (error) {
      console.error('Error loading aprendices:', error);
    } finally {
      setLoadingAprendices(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 animate-pulse font-medium">Cargando información...</p>
      </div>
    );
  }

  if (selectedFicha) {
    return (
      <AprendicesView
        selectedFicha={selectedFicha}
        aprendices={aprendices}
        loadingAprendices={loadingAprendices}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onBack={() => setSelectedFicha(null)}
        reloadAprendices={() => loadAprendices(selectedFicha)}
      />
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Novedades de los aprendices</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Gestiona tus fichas asignadas y realiza seguimiento a tus aprendices.</p>
      </div>

      <FichasGrid fichas={fichas} onSelect={loadAprendices} />
    </div>
  );
};

export default InstructorLider;
