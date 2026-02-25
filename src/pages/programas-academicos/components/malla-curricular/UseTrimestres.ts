import { useState } from 'react';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';

export const useTrimestres = (fichaId: number | undefined, programaId: number | undefined) => {
  const [trimestres, setTrimestres] = useState<any[]>([]);
  const [nuevoTrimestre, setNuevoTrimestre] = useState<any | null>(null);
  const [guardandoTrimestre, setGuardandoTrimestre] = useState(false);
  const [loadingTrimestres, setLoadingTrimestres] = useState<boolean>(false);

  // estado para toast
  const [toast, setToast] = useState<boolean>(false);

  // Cargar trimestres
  const cargarTrimestres = async (fichaIdParam?: number) => {
    const idFicha = fichaIdParam || fichaId;
    if (!idFicha) {
      setTrimestres([]);
      setLoadingTrimestres(true);
      return;
    }

    try {
      const response = await axios.get(`trimestres-ficha/${idFicha}`);
      setTrimestres(response.data.data || []);
      setLoadingTrimestres(true);
      setNuevoTrimestre(null);
    } catch {
      setTrimestres([]);
    }
  };

  // Calcular fecha de inicio del nuevo trimestre
  const calcularFechaInicio = (ficha: any) => {
    if (trimestres.length > 0) {
      const ultimo = trimestres[trimestres.length - 1];
      return ultimo.grado?.fechaFin || ultimo.fechaFin || new Date().toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  };


  const agregarNuevoTrimestre = (ficha: any) => {
    if (!ficha || !programaId || nuevoTrimestre) return;

    // Calcular el siguiente número de trimestre basado en el máximo existente
    const maxGrado = trimestres.reduce((max, t) => {
      const num = t.grado?.numeroGrado || t.numeroGrado || 0;
      return num > max ? num : max;
    }, 0);

    const siguienteGrado = maxGrado + 1;

    const nuevo = {
      id: `temp-${Date.now()}`,
      idPrograma: programaId,
      numeroGrado: siguienteGrado,
      fechaInicio: calcularFechaInicio(ficha),
      fechaFin: '',
      idFicha: ficha.id,
      materias: [],
      esNuevo: true,
      grado: {
        numeroGrado: siguienteGrado,
        fechaInicio: calcularFechaInicio(ficha),
        fechaFin: '',
        estado: 'NUEVO'
      }
    };

    setNuevoTrimestre(nuevo);
    setTrimestres([...trimestres, nuevo]);
  };

  // Cancelar nuevo trimestre
  const cancelarNuevoTrimestre = () => {
    if (!nuevoTrimestre) return;
    setTrimestres(trimestres.filter(t => t.id !== nuevoTrimestre.id));
    setNuevoTrimestre(null);
  };

  // Actualizar fecha fin
  const actualizarFechaFin = (fechaFin: string) => {
    if (!nuevoTrimestre) return;

    const actualizado = {
      ...nuevoTrimestre,
      fechaFin,
      grado: { ...nuevoTrimestre.grado, fechaFin }
    };

    setNuevoTrimestre(actualizado);
    setTrimestres(trimestres.map(t => (t.id === nuevoTrimestre.id ? actualizado : t)));
  };

  // Actualizar fecha inicio
  const actualizarFechaInicio = (fechaInicio: string) => {
    if (!nuevoTrimestre) return;

    const actualizado = {
      ...nuevoTrimestre,
      fechaInicio,
      grado: { ...nuevoTrimestre.grado, fechaInicio }
    };

    setNuevoTrimestre(actualizado);
    setTrimestres(trimestres.map(t => (t.id === nuevoTrimestre.id ? actualizado : t)));
  };

  // Actualizar numero grado
  const actualizarNumeroGrado = (numeroGrado: number) => {
    if (!nuevoTrimestre) return;

    const actualizado = {
      ...nuevoTrimestre,
      numeroGrado,
      grado: { ...nuevoTrimestre.grado, numeroGrado }
    };

    setNuevoTrimestre(actualizado);
    setTrimestres(trimestres.map(t => (t.id === nuevoTrimestre.id ? actualizado : t)));
  };

  const actualizarMaterias = (idsMateria: number[]) => {
    if (!nuevoTrimestre) return;

    const actualizado = {
      ...nuevoTrimestre,
      materias: idsMateria
    };

    setNuevoTrimestre(actualizado);
    setTrimestres(trimestres.map(t => (t.id === nuevoTrimestre.id ? actualizado : t)));
  };

  // Guardar trimestre
  const crearTrimestre = async (ficha: any): Promise<boolean> => {
    if (!nuevoTrimestre || !ficha) {
      enqueueSnackbar('No se ha proporcionado la ficha', { variant: 'error' });
      return false;
    }

    if (!nuevoTrimestre.fechaFin) {
      enqueueSnackbar('Debes asignar una fecha de fin', { variant: 'error' });
      return false;
    }

    if (!Array.isArray(nuevoTrimestre.materias) || nuevoTrimestre.materias.length === 0) {
      enqueueSnackbar('Debes asignar al menos una competencia', { variant: 'error' });
      return false;
    }

    try {
      setGuardandoTrimestre(true);

      const payload = {
        idPrograma: nuevoTrimestre.idPrograma || programaId,
        numeroGrado: nuevoTrimestre.numeroGrado,
        fechaInicio: nuevoTrimestre.fechaInicio || nuevoTrimestre.grado.fechaInicio,
        fechaFin: nuevoTrimestre.fechaFin || nuevoTrimestre.grado.fechaFin,
        idFicha: ficha.id,
        materias: nuevoTrimestre.materias
      };
      await axios.post('trimestres-ficha', payload);
      setToast(true)
      await cargarTrimestres(ficha.id);

      return true;
    } catch (error: any) {

      return false;
    } finally {
      setGuardandoTrimestre(false);
    }
  };

  const asignarCompetenciasTrimestre = async (idGradoPrograma: number, materias: any[], idFicha: number): Promise<boolean> => {
    if (!idGradoPrograma) {
      enqueueSnackbar('ID de trimestre no válido', { variant: 'error' });
      return false;
    }

    if (!materias || materias.length === 0) {
      enqueueSnackbar('Debes seleccionar al menos una competencia', { variant: 'error' });
      return false;
    }

    try {
      setGuardandoTrimestre(true);

      await axios.post('competencias/trimestre', {
        idGradoPrograma,
        materias: materias,
        idFicha: idFicha
      });

      setToast(true);
      return true;
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || 'Error al asignar competencias', { variant: 'error' });
      return false;
    } finally {
      setGuardandoTrimestre(false);
    }
  };

  return {
    trimestres,
    nuevoTrimestre,
    guardandoTrimestre,
    cargarTrimestres,
    agregarNuevoTrimestre,
    cancelarNuevoTrimestre,
    actualizarFechaFin,
    actualizarFechaInicio,
    actualizarNumeroGrado,
    actualizarMaterias,
    crearTrimestre,
    asignarCompetenciasTrimestre,
    toast,
    setToast,
    loadingTrimestres,
    programaId
  };
};