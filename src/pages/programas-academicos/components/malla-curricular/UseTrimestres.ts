import { useState } from 'react';
import axios from 'axios';

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
      return ultimo.grado?.fechaFin || ultimo.fechaFin || ficha?.asignacion?.fechaInicialClases;
    }
    return new Date(ficha?.asignacion?.fechaInicialClases).toISOString().split('T')[0] || null;
  };


  const agregarNuevoTrimestre = (ficha: any) => {
    if (!ficha || !programaId || nuevoTrimestre) return;

    const nuevo = {
      id: `temp-${Date.now()}`,
      idPrograma: programaId,
      numeroGrado: trimestres.length + 1,
      fechaInicio: calcularFechaInicio(ficha),
      fechaFin: '',
      idFicha: ficha.id,
      materias: [],
      esNuevo: true,
      grado: {
        numeroGrado: trimestres.length + 1,
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
      alert('No se ha proporcionado la ficha');
      return false;
    }

    if (!nuevoTrimestre.fechaFin) {
      alert('Debes asignar una fecha de fin');
      return false;
    }

    if (!Array.isArray(nuevoTrimestre.materias) || nuevoTrimestre.materias.length === 0) {
      alert('Debes asignar al menos una competencia');
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

  const asignarCompetenciasTrimestre = async (idGradoPrograma: number, materias: any[], idFicha:number): Promise<boolean> => {
    if (!idGradoPrograma) {
      alert('ID de trimestre no válido');
      return false;
    }

    if (!materias || materias.length === 0) {
      alert('Debes seleccionar al menos una competencia');
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
      alert(error.response?.data?.message || 'Error al asignar competencias');
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
    actualizarMaterias,
    crearTrimestre,
    asignarCompetenciasTrimestre,
    toast,
    setToast,
    loadingTrimestres,
    programaId
  };
};