import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { Instructor } from './interfaceInstructor';
import HorarioMensual from './HorarioMensual';
import RmiModal from './RmiModal';
import ModalRechazarRmi from './ModalRechazarRmi';

interface InstructorCardProps {
  instructor: Instructor;
  periodo?: string;
  onEstadoChange?: (idActivation: number, nuevoEstado: string, motivoRechazo?: string) => void;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ instructor, periodo, onEstadoChange }) => {
  
  const { persona, emailUsuario } = instructor;
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

  // ── Estado del modal RMI ──
  const [rmiModalOpen, setRmiModalOpen] = useState(false);
  const [fichas, setFichas] = useState<any[]>([]);
  const [loadingRmi, setLoadingRmi] = useState(false);
  const [rechazarModalOpen, setRechazarModalOpen] = useState(false);
  const [instructorState, setInstructorState] = useState<Instructor>(instructor);

  const getEstadoBadge = () => {
    const estado = instructorState.estado || 'PENDIENTE';
    if (estado === 'ACEPTADO') {
      return {
        label: 'Aceptado',
        classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      };
    }
    if (estado === 'RECHAZADO') {
      return {
        label: 'Rechazado',
        classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      };
    }
    return {
      label: 'Pendiente',
      classes: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
  };

  const estadoBadge = getEstadoBadge();

  // Calendario instructor:
  const [horarioMensualOpen, setHorarioMensualOpen] = useState(false);

  // Actualizar estado local cuando cambia el instructor
  useEffect(() => {
    setInstructorState(instructor);
  }, [instructor]);

  const handleVerHorario = async (r: any, idFicha: number) => {
    // Esta función será manejada por el modal RMI
  };

  // Resetea fichas cuando cambia el periodo para forzar nuevo fetch
  useEffect(() => {
    setFichas([]);
    setRmiModalOpen(false);
  }, [periodo]);

  const handleVerRmi = () => {
    if (fichas.length > 0) {
      setRmiModalOpen(true);
      return;
    }
    setLoadingRmi(true);
    axios
      .get('instructores/fichas', {
        params: {
          idContrato: instructor.idContrato,
          periodo: periodo || undefined
        }
      })
      .then((r) => {
        setFichas(r.data);
        setRmiModalOpen(true);
      })
      .finally(() => setLoadingRmi(false));
  };

  return (
    <>
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
                <span className={`font-bold text-sm ${semaforoHoras}`}>
                  {totalHoras.toFixed(1)}h
                </span>
              </p>
              {instructorState.estado === 'RECHAZADO' && instructorState.motivoRechazo && (
                <div className="mt-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                    Motivo de rechazo:
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {instructorState.motivoRechazo}
                  </p>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="mt-3 w-2/3 flex gap-2 m-1">
              <button
                onClick={() => setHorarioMensualOpen(true)}
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
                  <i className="ki-outline ki-book-square text-base" />
                )}
              </button>
              {instructorState.estado === 'PENDIENTE' && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        await axios.put(`instructores/${instructor.idActivation}/aceptar-rmi`, {
                          periodo: periodo,
                          email: emailUsuario
                        });
                        enqueueSnackbar('RMI aceptado con éxito.', { variant: 'success' });
                        const actualizado: Instructor = {
                          ...instructorState,
                          estado: 'ACEPTADO',
                          motivoRechazo: undefined
                        };
                        setInstructorState(actualizado);
                        onEstadoChange?.(instructor.idActivation, 'ACEPTADO');
                      } catch (error: any) {
                        const errorMessage = error.response?.data?.message || 'Error al aceptar el RMI.';
                        enqueueSnackbar(errorMessage, { variant: 'error' });
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
                    title="Aceptar RMI"
                  >
                    <i className="ki-outline ki-check-circle text-base" />
                  </button>
                  <button
                    onClick={() => setRechazarModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                    title="Rechazar RMI"
                  >
                    <i className="ki-outline ki-cross-circle text-base" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
      {/* Horario Mensual */}
      <HorarioMensual
        isOpen={horarioMensualOpen}
        onClose={() => setHorarioMensualOpen(false)}
        instructor={instructor}
        periodo={periodo}
      />
      {/* Modal RMI */}
      <RmiModal
        isOpen={rmiModalOpen}
        onClose={() => setRmiModalOpen(false)}
        instructor={instructorState}
        periodo={periodo}
        fichas={fichas}
      />
      {/* Modal Rechazar RMI */}
      <ModalRechazarRmi
        isOpen={rechazarModalOpen}
        onClose={() => setRechazarModalOpen(false)}
        instructor={instructorState}
        correoInstructor={emailUsuario}
        periodo={periodo}
        onSave={(motivoRechazo?: string) => {
          const actualizado: Instructor = { ...instructorState, estado: 'RECHAZADO', motivoRechazo };
          setInstructorState(actualizado);
          onEstadoChange?.(instructor.idActivation, 'RECHAZADO', motivoRechazo);
        }}
      />
    </>
  );
};

export default InstructorCard;
