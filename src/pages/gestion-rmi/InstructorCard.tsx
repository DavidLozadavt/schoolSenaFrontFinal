import axios from 'axios';
import React, { useState } from 'react';
import { Instructor } from './interfaceInstructor';

const InstructorCard: React.FC<{ instructor: Instructor }> = ({ instructor }) => {
  const { persona } = instructor;
  const fullName =
    `${persona.nombre1} ${persona.nombre2 ?? ''} ${persona.apellido1} ${persona.apellido2 ?? ''}`.trim();

  const totalHoras = instructor.horarios?.reduce((acc, h) => acc + h.duracionHoras, 0) ?? 0;

  const semaforoHoras =
    totalHoras < 145
      ? 'text-red-600 dark:text-red-400'
      : totalHoras < 160
        ? 'text-yellow-600 dark:text-yellow-400'
        : totalHoras === 160
          ? 'text-green-600 dark:text-green-400'
          : totalHoras <= 169
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400';

  const estadoBadge = {
    label: 'Pendiente',
    classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  };

  // ── Estado del desplegable RMI ──
  const [showRmi, setShowRmi] = useState(false);
  const [fichas, setFichas] = useState<any[]>([]);
  const [loadingRmi, setLoadingRmi] = useState(false);

  const handleVerRmi = () => {
    if (showRmi) {
      setShowRmi(false);
      return;
    }
    if (fichas.length > 0) {
      setShowRmi(true);
      return;
    }
    setLoadingRmi(true);
    axios
      .get('instructores/fichas', { params: { idContrato: instructor.idContrato } })
      .then((r) => {
        setFichas(r.data);
        setShowRmi(true);
      })
      .finally(() => setLoadingRmi(false));
  };

  return (
    <div className="bg-white dark:bg-coal-500 rounded-xl border border-gray-200 dark:border-coal-300 shadow-sm overflow-hidden">
      {/* Card principal */}
      <div className="px-5 py-4 flex items-start gap-4">
        <img
          src={persona.rutaFoto}
          title={`${persona.nombre1} ${persona.apellido1}`}
          alt={fullName}
          className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 dark:border-coal-300 shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white text-sm uppercase tracking-wide">
                {fullName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{persona.perfil}</p>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${estadoBadge.classes}`}
            >
              {estadoBadge.label}
            </span>
          </div>

          <div className="mt-2 space-y-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Número de horas:{' '}
              <span className="font-bold text-sm text-gray-700 dark:text-gray-300">160 h</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Horas ejecutadas:{' '}
              <span className={`font-bold text-sm ${semaforoHoras}`}>{totalHoras.toFixed(1)}h</span>
            </p>
          </div>

          {/* Acciones */}
          <div className="mt-3 w-1/3 flex gap-2">
            <button
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-yellow-50 hover:bg-yellow-100 font-semibold text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/10 rounded-lg transition-all"
              title="Ver Horario"
            >
              <i className="ki-outline ki-calendar text-base" />
            </button>
            <button
              onClick={handleVerRmi}
              disabled={loadingRmi}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all disabled:opacity-50"
              title="Ver RMI"
            >
              {loadingRmi ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i
                  className={`ki-outline ${showRmi ? 'ki-arrow-up' : 'ki-book-square'} text-base`}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Desplegable RMI */}
      {showRmi && (
        <div className="border-t border-gray-100 dark:border-coal-300 bg-gray-50 dark:bg-coal-600 px-5 py-4">
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-3">
            Fichas asignadas
          </h3>

          {fichas.length === 0 ? (
            <p className="text-xs text-gray-400">No hay fichas asignadas</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-coal-300">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-cyan-400 text-white">
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                      No. FICHA
                    </th>
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                      PROGRAMA DE FORMACIÓN
                    </th>
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                      COMPETENCIA
                    </th>
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                      RESULTADO APRENDIZAJE
                    </th>
                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">HORAS</th>
                    <th className="px-3 py-2 text-center font-semibold whitespace-nowrap">
                      HORARIO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fichas.map((ficha: any) =>
                    ficha.resultados.map((r: any, rIdx: number) => (
                      <tr
                        key={r.idHorario}
                        className="border-t border-gray-200 dark:border-coal-300 bg-yellow-50 dark:bg-yellow-900/10 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition-colors"
                      >
                        {/* No. Ficha - solo en la primera fila del grupo */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={ficha.resultados.length}
                            className="px-3 py-2 font-bold text-gray-800 dark:text-white align-top border-r border-gray-200 dark:border-coal-300 whitespace-nowrap"
                          >
                            {ficha.codigoFicha}
                          </td>
                        )}
                        {/* Programa - solo en la primera fila del grupo */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={ficha.resultados.length}
                            className="px-3 py-2 font-semibold text-cyan-700 dark:text-cyan-400 align-top border-r border-gray-200 dark:border-coal-300"
                          >
                            {ficha.programaFormacion}
                          </td>
                        )}
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-coal-300">
                          {r.competencia ?? (
                            <span className="text-gray-400 italic">Sin competencia</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-coal-300">
                          {r.resultadoAprendizaje ?? (
                            <span className="text-gray-400 italic">Sin RAP</span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-semibold text-primary-600 dark:text-primary-400 whitespace-nowrap">
                          {r.duracionHoras}h
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            className="inline-flex items-center justify-center gap-1 px-2 py-1 text-xs bg-yellow-50 hover:bg-yellow-100 font-semibold text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/10 rounded-lg transition-all"
                            title="Ver horario"
                          >
                            <i className="ki-outline ki-calendar text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Acciones */}
              <div className="mt-3 w-2/3 flex gap-2 m-1">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
                  title="Descargar Excel"
                >
                  <i className="ki-outline ki-file-down text-base" />
                  Exportar Excel
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 font-semibold text-blue-700 dark:text-blue-400 dark:bg-blue-500/10 rounded-lg transition-all"
                  title="Imprimir reporte"
                >
                  <i className="ki-outline ki-printer text-base" />
                  Imprimir reporte
                </button>
                <button
                  onClick={handleVerRmi}
                  disabled={loadingRmi}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all disabled:opacity-50"
                  title="Cerrar"
                >
                  <i className="ki-outline ki-cross text-base" />
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorCard;
