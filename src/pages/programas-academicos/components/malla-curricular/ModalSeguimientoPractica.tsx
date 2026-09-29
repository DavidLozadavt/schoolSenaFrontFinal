import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, X, CheckCircle, XCircle, Search, FileText } from 'lucide-react';
import { ModalGestionSeguimiento } from './ModalGestionSeguimiento';

interface ModalSeguimientoPracticaProps {
  isOpen: boolean;
  onClose: () => void;
  idFicha: number;
}

interface AprendizSeguimiento {
  idPersona: number;
  idContrato?: number;
  idcontrato?: number;
  nombreCompleto: string;
  identificacion?: string;
}

export const ModalSeguimientoPractica: React.FC<ModalSeguimientoPracticaProps> = ({
  isOpen,
  onClose,
  idFicha
}) => {
  const [aprendices, setAprendices] = useState<any[]>([]);
  const [selectedAprendiz, setSelectedAprendiz] = useState<AprendizSeguimiento | null>(null);
  const [isGestionOpen, setIsGestionOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [buscar, setBuscar] = useState('');

  useEffect(() => {
    if (isOpen && idFicha) {
      cargarAprendices();
    }
  }, [isOpen, idFicha]);

  const cargarAprendices = async () => {
    setLoading(true);
    try {
      // Using an endpoint to fetch the apprentices of a specific ficha.
      // If `instructor-lider/ficha/{idFicha}/aprendices` is only for leader,
      // it might need an admin equivalent. We'll use this for now as it's the one we found.
      const response = await axios.get(`instructor-lider/ficha/${idFicha}/aprendices`);
      setAprendices(response.data || []);
    } catch (error) {
      console.error('Error al cargar aprendices', error);
      setAprendices([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAprendices = aprendices.filter(
    (a: any) =>
      (a.nombreCompleto || '').toLowerCase().includes(buscar.toLowerCase()) ||
      (a.identificacion || '').toLowerCase().includes(buscar.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden">
        <div className="relative w-full max-w-4xl bg-white dark:bg-coal-500 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-coal-400">
            <div>
              <h3 className="text-md font-black uppercase text-gray-800 dark:text-white tracking-widest flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Seguimiento Etapa Práctica
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Verifica qué aprendices están listos para la etapa práctica y realiza su
                seguimiento.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 transition-all border border-gray-300 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:scale-105"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-coal-600">
            <div className="mb-4 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar por nombre o identificación..."
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-400 focus:outline-none focus:border-primary text-sm uppercase transition-all"
              />
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredAprendices.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-gray-600">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 uppercase font-bold text-sm">
                  No se encontraron aprendices
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAprendices.map((aprendiz) => (
                  <div
                    key={aprendiz.idMatricula || aprendiz.idPersona}
                    className="bg-white dark:bg-coal-500 p-4 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-300">
                        {aprendiz.rutaFoto ? (
                          <img
                            src={aprendiz.rutaFoto}
                            alt={aprendiz.nombreCompleto}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            <Users size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4
                          className="text-xs font-bold text-gray-800 dark:text-white uppercase line-clamp-1"
                          title={aprendiz.nombreCompleto}
                        >
                          {aprendiz.nombreCompleto}
                        </h4>
                        <p className="text-[10px] text-gray-500 uppercase">
                          {aprendiz.identificacion}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md ${aprendiz.estadoMatricula === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {aprendiz.estadoMatricula}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedAprendiz(aprendiz as AprendizSeguimiento);
                          setIsGestionOpen(true);
                        }}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all group"
                        title="Registrar Seguimiento"
                      >
                        <FileText size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-white dark:bg-coal-400">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
      <ModalGestionSeguimiento
        key={selectedAprendiz?.idPersona ?? 'closed'}
        isOpen={isGestionOpen}
        onClose={() => setIsGestionOpen(false)}
        aprendiz={selectedAprendiz}
      />
    </>
  );
};
