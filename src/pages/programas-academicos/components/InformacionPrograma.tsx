import React, { useState } from 'react';
import { Program } from '../types';
import SeccionAperturaDetalle from './SeccionAperturaDetalle';

interface InformacionProgramaProps {
  isOpen: boolean;
  onClose: () => void;
  program: Program | null;
}

const InformacionPrograma = ({ isOpen, onClose, program }: InformacionProgramaProps) => {
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  if (!isOpen || !program) return null;

  const descriptionText = program.description || 'SIN DESCRIPCIÓN';
  const isLongDescription = descriptionText.length > 100;

  const CardContainer = ({ children, label, isDescription = false }: { children: React.ReactNode; label: string, isDescription?: boolean }) => (
    <div className={`flex flex-col transition-all duration-300 border rounded-xl bg-gray-200 dark:bg-black/20 border-gray-300 dark:border-white/5 shadow-sm p-3 ${isDescription && isDescExpanded ? 'h-auto min-h-[85px]' : 'h-[85px]'}`}>
      <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-auto">{label}</span>
      <div className={`flex flex-col justify-center ${isDescription && isDescExpanded ? 'mt-1' : 'overflow-hidden'}`}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-coal-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl overflow-hidden bg-gray-100 border border-gray-200 shadow-2xl dark:bg-coal-600 rounded-2xl dark:border-white/5">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-blue-100 border-b border-gray-200 dark:bg-gray-100 dark:border-white/5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-black tracking-tighter text-gray-900 uppercase dark:text-white">Ficha de Información</h2>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Parámetros del Programa</p>
          </div>
          <button onClick={onClose} className="flex items-center justify-center w-8 h-8 transition-all border rounded-lg shadow-sm bg-danger/10 text-danger border-danger/20 hover:bg-danger hover:text-white">
            <i className="text-lg ki-filled ki-cross"></i>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 p-6 bg-gray-50/30 dark:bg-transparent gap-4 max-h-[75vh] overflow-y-auto">
          
          {/* FILA 1: Datos Técnicos Superiores */}
          <CardContainer label="Nombre Programa">
            <span className="text-[11px] font-black uppercase truncate text-primary">{program.name}</span>
          </CardContainer>
          
          <CardContainer label="Código Programa">
            <span className="text-[11px] font-black text-gray-700 uppercase dark:text-white">{program.codigo}</span>
          </CardContainer>

          <CardContainer label="Nivel Educativo">
            <span className="text-[11px] font-black text-gray-700 uppercase dark:text-white">{program.nivel}</span>
          </CardContainer>

          {/* FILA 2: Estados y Formación */}
          <CardContainer label="Apertura Programa">
            <span className={`text-[11px] font-black uppercase ${program.status === 'ACTIVO' ? 'text-success' : 'text-danger'}`}>
              {program.status === 'ACTIVO' ? 'HABILITADO' : 'SUSPENDIDO'}
            </span>
          </CardContainer>

          <CardContainer label="Estado Programa">
            <div className="flex items-center gap-2">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-blue-500/40"></span>
                <span className="relative inline-flex w-2 h-2 bg-blue-500 rounded-full"></span>
              </span>
              <span className="text-[11px] font-black text-gray-700 uppercase dark:text-white">
                {program.estado?.nombre || 'SIN ESTADO'}
              </span>
            </div>
          </CardContainer>

          <CardContainer label="Tipo de Formación">
            <span className="text-[11px] font-black text-gray-700 uppercase dark:text-white">{program.formacion}</span>
          </CardContainer>


          {/* 1. Descripción Programa */}
          <div className="md:col-span-3">
            <CardContainer label="Descripción Programa" isDescription>
              <p className={`text-[11px] font-bold text-gray-700 uppercase dark:text-white leading-tight ${isDescExpanded ? '' : 'line-clamp-2'}`}>
                {descriptionText}
              </p>
              {isLongDescription && (
                <button onClick={() => setIsDescExpanded(!isDescExpanded)} className="mt-1 text-[9px] font-black text-primary uppercase hover:underline w-fit">
                  {isDescExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </CardContainer>
          </div>

          {/* 2. Procesos */}
          <div className="md:col-span-3 flex flex-col h-[85px] p-3 border border-dashed rounded-xl bg-gray-200 dark:bg-white/5 border-gray-400 dark:border-white/10 shadow-sm">
            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-auto">Procesos</span>
            <button className="flex items-center justify-between w-full px-4 py-2 text-[9px] font-black text-gray-700 uppercase transition-all bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-coal-500 dark:border-white/10 dark:text-white hover:bg-primary hover:text-white hover:border-primary active:scale-95 group">
              Ver más
              <i className="transition-transform ki-filled ki-right text-[12px] group-hover:translate-x-1"></i>
            </button>
          </div>

          {/* 3. Información de Apertura */}
          <div className="md:col-span-3">
             <SeccionAperturaDetalle programId={program.id} />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-100/50 dark:bg-black/20 dark:border-white/5">
          <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-coal-500">
            <i className="text-xs text-primary ki-outline ki-fingerprint"></i>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-widest">ID: {program.id}</span>
          </div>
          <button onClick={onClose} className="flex items-center gap-2 px-8 py-2 font-black text-white uppercase transition-all bg-primary hover:bg-primary-active rounded-xl shadow-lg text-[10px] tracking-widest active:scale-95">
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};

export default InformacionPrograma;