import React from 'react';

const CFGeneral: React.FC = () => {
  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          CF - Centro de Formación
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gestión y seguimiento de centros de formación</p>
      </div>

      <div className="bg-white dark:bg-coal-500 rounded-xl shadow-sm border border-gray-200 dark:border-coal-300 p-10 text-center text-gray-400 dark:text-gray-500 text-sm">
        Contenido de CF - En desarrollo
      </div>
    </div>
  );
};

export default CFGeneral;
