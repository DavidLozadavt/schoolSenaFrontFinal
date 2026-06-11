import React, { useState } from 'react';
import { Save, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface FormNuevoTrimestreProps {
  trimestre: any;
  guardando: boolean;
  onActualizarFechaFin: (fecha: string) => void;
  onActualizarFechaInicio: (fecha: string) => void;
  onActualizarNumeroGrado: (numero: number) => void;
  onGuardar: () => void;
  onCancelar: () => void;
  trimestres: any[];
  nivel?: string;
}

export const FormNuevoTrimestre: React.FC<FormNuevoTrimestreProps> = ({
  onCancelar,
}) => {
  const [periodos, setPeriodos] = useState([
    { id: 1, nombre: 'Periodo 1', fechaInicio: '', fechaFin: '', porcentaje: 33.33 },
    { id: 2, nombre: 'Periodo 2', fechaInicio: '', fechaFin: '', porcentaje: 33.33 },
    { id: 3, nombre: 'Periodo 3', fechaInicio: '', fechaFin: '', porcentaje: 33.33 },
  ]);

  const totalPorcentaje = Number(periodos.reduce((acc, curr) => acc + (Number(curr.porcentaje) || 0), 0).toFixed(2));
  // Aceptamos 100 y 99.99 como válidos para permitir 33.33% en todos
  const esValido = totalPorcentaje === 100 || totalPorcentaje === 99.99;

  const handlePeriodoChange = (id: number, field: string, value: string | number) => {
    setPeriodos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-6xl bg-white dark:bg-coal-500 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* HEADER */}
        <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
          <div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-3">
              Configuración de periodos
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Configura las fechas y porcentajes. El total debe ser 100%.
            </p>
          </div>
          <button
            onClick={onCancelar}
            className="flex items-center justify-center w-10 h-10 transition-all border border-gray-200 dark:border-gray-600 rounded-full hover:bg-danger hover:text-white hover:border-danger hover:scale-105"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto px-6 bg-gray-50/50 dark:bg-coal-500/30">
          
          {/* AVISO DE PORCENTAJE */}
          <div className={`p-4 rounded-xl flex items-center gap-4 transition-colors duration-300 ${esValido ? 'bg-success/5 border-success/20 text-success' : 'bg-warning/5 border-warning/30 text-warning-active'}`}>
            <div className={`p-2 rounded-full ${esValido ? 'bg-success/20' : 'bg-warning/20'}`}>
              {esValido ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg flex items-center gap-2">
                Total acumulado: {Math.round(totalPorcentaje)}%
                {esValido && <span className="text-sm font-normal opacity-80">(Correcto)</span>}
              </p>
              {!esValido && (
                <p className="text-sm opacity-90 mt-1 font-medium">
                  {totalPorcentaje > 100 
                    ? `Te has pasado por ${(totalPorcentaje - 100).toFixed(2)}%. Ajusta los valores para que el total sea exactamente 100%.`
                    : `Falta un ${(100 - totalPorcentaje).toFixed(2)}% para completar el 100%.`}
                </p>
              )}
            </div>
          </div>

          {/* CARDS DE PERIODOS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {periodos.map((periodo) => (
              <div key={periodo.id} className="bg-white dark:bg-coal-400 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-black">
                      {periodo.id}
                    </span>
                    {periodo.nombre}
                  </h4>
                  <div className="text-2xl font-black text-gray-400 dark:text-gray-600 select-none">
                    {periodo.porcentaje}%
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={periodo.fechaInicio}
                      onChange={(e) => handlePeriodoChange(periodo.id, 'fechaInicio', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-coal-500/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={periodo.fechaFin}
                      onChange={(e) => handlePeriodoChange(periodo.id, 'fechaFin', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-coal-500/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all dark:text-gray-200"
                    />
                  </div>
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                      Porcentaje Asignado
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={periodo.porcentaje}
                        onChange={(e) => handlePeriodoChange(periodo.id, 'porcentaje', e.target.value)}
                        className={`w-full px-3 py-2.5 pr-8 text-sm rounded-lg border bg-white dark:bg-coal-500/50 focus:ring-2 outline-none transition-all dark:text-gray-200 font-bold ${
                          esValido 
                            ? 'border-gray-200 dark:border-gray-600 focus:ring-primary/20 focus:border-primary' 
                            : 'border-warning/50 focus:ring-warning/20 focus:border-warning'
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-white dark:bg-coal-500 rounded-b-2xl">
          <button
            type="button"
            onClick={onCancelar}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-bold text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!esValido}
            className="px-6 py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-active transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-primary/20"
          >
            <Save size={18} /> 
            {esValido ? 'Guardar' : 'Ajusta el 100%'}
          </button>
        </div>
      </div>
    </div>
  );
};