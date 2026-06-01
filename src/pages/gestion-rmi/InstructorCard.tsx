import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { enqueueSnackbar } from 'notistack';
import { Instructor } from './interfaceInstructor';
import HorarioMensual from './HorarioMensual';
import RmiModal from './RmiModal';
import ModalRechazarRmi from './ModalRechazarRmi';
import Swal from 'sweetalert2';

interface InstructorCardProps {
  instructor: Instructor;
  periodo?: string;
  onEstadoChange?: (idActivation: number, nuevoEstado: string, motivoRechazo?: string) => void;
}

const InstructorCard: React.FC<InstructorCardProps> = ({ instructor, periodo, onEstadoChange }) => {
  const { persona } = instructor;
  const fullName =
    `${persona.nombre1} ${persona.nombre2 ?? ''} ${persona.apellido1} ${persona.apellido2 ?? ''}`.trim();

  const totalHoras = instructor.horarios?.reduce((acc: number, h: any) => acc + Number(h.duracionHoras), 0) ?? 0;

  const semaforoHoras = (horas: number): string =>
    horas < 145
      ? 'text-red-600 dark:text-red-400'
      : horas < 160
        ? 'text-yellow-600 dark:text-yellow-400'
        : horas === 160
          ? 'text-green-600 dark:text-green-400'
          : horas <= 169
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400';

  // ── Estado del modal RMI ──
  const [rmiModalOpen, setRmiModalOpen] = useState(false);
  const [fichas, setFichas] = useState<any[]>([]);
  const [actividades, setActividades] = useState<any[]>([]);
  const [loadingRmi, setLoadingRmi] = useState(false);
  const [rechazarModalOpen, setRechazarModalOpen] = useState(false);
  const [instructorState, setInstructorState] = useState<Instructor>(instructor);

  const [disableActionRmi, setDisableActionRmi] = useState<boolean>(false);

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

  const fetchFichas = async () => {
    setLoadingRmi(true);
    try {
      const [fichasRes, actividadesRes] = await Promise.all([
        axios.get('instructores/fichas', {
          params: {
            idContrato: instructor.idContrato,
            periodo: periodo || undefined
          }
        }),
        instructor.idRmi
          ? axios.get('actividades-instructores', {
              params: { idRmi: instructor.idRmi, idContrato: instructor.idContrato }
            })
          : Promise.resolve({ data: [] })
      ]);

      setFichas(fichasRes.data);
      setActividades(actividadesRes.data);
    } catch (error) {
      console.error('Error fetching RMI data:', error);
      enqueueSnackbar('Error al cargar la información del RMI', { variant: 'error' });
    } finally {
      setLoadingRmi(false);
    }
  };

  const handleVerRmi = async () => {
    if (fichas.length > 0) {
      setRmiModalOpen(true);
      return;
    }
    await fetchFichas();
    setRmiModalOpen(true);
  };

  const handleVerHorarioMensual = async () => {
    if (fichas.length === 0) {
      await fetchFichas();
    }
    setHorarioMensualOpen(true);
  };

  const handleRevertir = async () => {
    setDisableActionRmi(true);
    const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
    const isDarkMode = theme === 'dark';
    const result = await Swal.fire({
      title: '¿Revertir a pendiente?',
      text: 'El RMI volverá al estado PENDIENTE.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, revertir',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-sm btn-warning',
        cancelButton: 'btn btn-sm btn-light'
      },
      background: isDarkMode ? '#1B1C22' : '#F9F9F9',
      color: isDarkMode ? 'white' : '#4B5675'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`instructores/${instructor.idActivation}/revertir-rmi`, {
          periodo
        });
        enqueueSnackbar('RMI revertido a pendiente.', { variant: 'info' });
        const actualizado: Instructor = {
          ...instructorState,
          estado: 'PENDIENTE',
          motivoRechazo: undefined
        };
        setInstructorState(actualizado);
        onEstadoChange?.(instructor.idActivation, 'PENDIENTE');
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Error al revertir el RMI.';
        enqueueSnackbar(errorMessage, { variant: 'error' });
      }
    }
    setDisableActionRmi(false);
  };

  const handleAceptar = async () => {
    setDisableActionRmi(true);
    const theme = JSON.parse(localStorage.getItem('settings-configs') || '{}')?.themeMode;
    const isDarkMode = theme === 'dark';
    const background = isDarkMode ? '#1B1C22' : '#F9F9F9';
    const color = isDarkMode ? 'white' : '#4B5675';
    const result = await Swal.fire({
      title: '¿Quieres aceptar este RMI?',
      text: '¿Estás seguro de que deseas aceptar este RMI?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, Aceptar',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn btn-sm btn-success',
        cancelButton: 'btn btn-sm btn-light'
      },
      background,
      color
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`instructores/${instructor.idActivation}/aceptar-rmi`, {
          periodo: periodo,
          email: persona.email
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
    }
    setDisableActionRmi(false);
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
                Número de horas:
                <span className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  {instructor.totalHoras || 160} h
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Horas programadas:
                <span className={`font-bold text-sm ${semaforoHoras(totalHoras)}`}>
                  {totalHoras || 0} h
                </span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Horas ejecutadas:{' '}
                <span
                  className={`font-bold text-sm ${semaforoHoras(Number(instructor.totalHorasFormato))}`}
                >
                  {instructor.totalHorasFormato || 0}h
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
                onClick={handleVerHorarioMensual}
                disabled={loadingRmi}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-yellow-50 hover:bg-yellow-100 font-semibold text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/10 rounded-lg transition-all disabled:opacity-50"
                title="Ver Horario"
              >
                {loadingRmi ? (
                  <div className="w-3.5 h-3.5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <i className="ki-outline ki-calendar text-base" />
                )}
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
              {/* ← Revertir (ACEPTADO o RECHAZADO) */}
              {/* Botón revertir a pendiente — solo cuando está ACEPTADO o RECHAZADO */}
              {(instructorState.estado === 'ACEPTADO' ||
                instructorState.estado === 'RECHAZADO') && (
                <button
                  onClick={handleRevertir}
                  disabled={disableActionRmi}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-yellow-50 hover:bg-yellow-100 font-semibold text-yellow-700 dark:text-yellow-400 dark:bg-yellow-500/10 rounded-lg transition-all"
                  title="Revertir a pendiente"
                >
                  {!disableActionRmi ? (
                    <i className="ki-outline ki-arrow-circle-left text-base" />
                  ) : (
                    <i className="ki-outline ki-loading text-base animate-spin" />
                  )}
                </button>
              )}
              {instructorState.estado === 'PENDIENTE' && (
                <>
                  <button
                    onClick={handleAceptar}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-green-50 hover:bg-green-100 font-semibold text-green-700 dark:text-green-400 dark:bg-green-500/10 rounded-lg transition-all"
                    title="Aceptar RMI"
                    disabled={disableActionRmi}
                  >
                    {!disableActionRmi ? (
                      <i className="ki-outline ki-check-circle text-base" />
                    ) : (
                      <i className="ki-outline ki-loading text-base animate-spin" />
                    )}
                  </button>
                  <button
                    onClick={() => setRechazarModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-red-50 hover:bg-red-100 font-semibold text-red-700 dark:text-red-400 dark:bg-red-500/10 rounded-lg transition-all"
                    title="Rechazar RMI"
                    disabled={disableActionRmi}
                  >
                    {!disableActionRmi ? (
                      <i className="ki-outline ki-cross-circle text-base" />
                    ) : (
                      <i className="ki-outline ki-loading text-base animate-spin" />
                    )}
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
        instructor={instructorState}
        periodo={periodo}
        fichas={fichas}
      />
      {/* Modal RMI */}
      <RmiModal
        isOpen={rmiModalOpen}
        onClose={() => setRmiModalOpen(false)}
        instructor={instructorState}
        periodo={periodo}
        fichas={fichas}
        actividades={actividades}
        onRefresh={fetchFichas}
        onAceptar={handleAceptar}
        onRechazar={() => setRechazarModalOpen(true)}
        onRevertir={handleRevertir}
        disableActionRmi={disableActionRmi}
      />
      {/* Modal Rechazar RMI */}
      <ModalRechazarRmi
        isOpen={rechazarModalOpen}
        onClose={() => setRechazarModalOpen(false)}
        instructor={instructorState}
        correoInstructor={persona.email}
        periodo={periodo}
        onSave={(motivoRechazo?: string) => {
          const actualizado: Instructor = {
            ...instructorState,
            estado: 'RECHAZADO',
            motivoRechazo
          };
          setInstructorState(actualizado);
          onEstadoChange?.(instructor.idActivation, 'RECHAZADO', motivoRechazo);
        }}
      />
    </>
  );
};

export default InstructorCard;
