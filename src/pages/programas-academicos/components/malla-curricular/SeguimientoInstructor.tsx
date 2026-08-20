import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  RefreshCw,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Filter,
  Eye,
  FileText,
  UserCheck
} from 'lucide-react';
import { useAuthContext } from '@/auth';
import { Seguimiento, AprendizSeguimiento } from './interfaces/Seguimiento';
import { ModalGestionSeguimiento } from './ModalGestionSeguimiento';

const SeguimientoInstructor: React.FC = () => {
  const { user, persona } = useAuthContext();

  const idPersona = user?.idpersona || persona?.id;
  const idContrato =
    user?.persona?.contrato?.[0]?.id ||
    user?.contrato?.[0]?.id ||
    persona?.contrato?.[0]?.id;

  const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [soloPendientes, setSoloPendientes] = useState<boolean>(false);

  // Modal para gestionar un aprendiz seleccionado
  const [aprendizSeleccionado, setAprendizSeleccionado] = useState<AprendizSeguimiento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchSeguimientos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('seguimientos/por-instructor', {
        params: {
          idpersona: idPersona,
          idcontrato: idContrato
        }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setSeguimientos(data);
    } catch (err: any) {
      console.error('Error cargando seguimientos del instructor:', err);
      setError('No se pudieron cargar los seguimientos de los aprendices asignados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeguimientos();
  }, [idPersona, idContrato]);

  // Actualizar estado general del seguimiento de un aprendiz directamente
  const handleCambiarEstado = async (seguimientoId: number, nuevoEstado: string) => {
    try {
      const { data } = await axios.put(`seguimientos/${seguimientoId}`, {
        estado: nuevoEstado
      });
      setSeguimientos((prev) =>
        prev.map((s) => (s.id === seguimientoId ? { ...s, estado: data.estado } : s))
      );
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('No se pudo actualizar el estado del seguimiento.');
    }
  };

  const handleAbrirModal = (seg: Seguimiento) => {
    const p = seg.persona;
    const nombre = p
      ? `${p.nombre1 || ''} ${p.nombre2 || ''} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim()
      : 'Aprendiz sin nombre';

    setAprendizSeleccionado({
      idPersona: seg.idpersona,
      idContrato: seg.idcontrato,
      nombreCompleto: nombre,
      identificacion: p?.identificacion
    });
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
    setAprendizSeleccionado(null);
    fetchSeguimientos(); // Recargar datos para refrescar contadores
  };

  // Estadísticas globales
  const stats = useMemo(() => {
    const total = seguimientos.length;
    const enProceso = seguimientos.filter((s) => s.estado === 'EN_PROCESO').length;
    const atrasados = seguimientos.filter((s) => s.estado === 'ATRASADO').length;
    const finalizados = seguimientos.filter((s) => s.estado === 'FINALIZADO').length;

    // Conteo total de documentos pendientes por revisar en todos los aprendices
    let docsPendientesTotal = 0;
    let aprendicesConPendientes = 0;

    seguimientos.forEach((s) => {
      const p = (s.documentos || []).filter((d) => d.estado === 'PENDIENTE').length;
      if (p > 0) {
        docsPendientesTotal += p;
        aprendicesConPendientes++;
      }
    });

    return {
      total,
      enProceso,
      atrasados,
      finalizados,
      docsPendientesTotal,
      aprendicesConPendientes
    };
  }, [seguimientos]);

  // Lista filtrada
  const seguimientosFiltrados = useMemo(() => {
    return seguimientos.filter((s) => {
      const personaObj = s.persona;
      const nombre = personaObj
        ? `${personaObj.nombre1} ${personaObj.nombre2 ?? ''} ${personaObj.apellido1 ?? ''} ${personaObj.apellido2 ?? ''}`.toLowerCase()
        : '';
      const identificacion = personaObj?.identificacion?.toLowerCase() || '';
      const email = personaObj?.email?.toLowerCase() || '';

      const query = busqueda.toLowerCase().trim();
      const coincideBusqueda =
        !query || nombre.includes(query) || identificacion.includes(query) || email.includes(query);

      const coincideEstado = filtroEstado === 'TODOS' || s.estado === filtroEstado;

      const docsPendientes = (s.documentos || []).filter((d) => d.estado === 'PENDIENTE').length;
      const coincideSoloPendientes = !soloPendientes || docsPendientes > 0;

      return coincideBusqueda && coincideEstado && coincideSoloPendientes;
    });
  }, [seguimientos, busqueda, filtroEstado, soloPendientes]);

  const badgeEstadoSeguimiento = (estado?: string) => {
    switch (estado) {
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
      case 'FINALIZADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'SUSPENDIDO':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800';
      case 'ATRASADO':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/60 dark:bg-coal-600 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* BANNER PRINCIPAL DE HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-cyan-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
              <UserCheck size={14} className="text-emerald-300" />
              <span>Panel del Instructor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Seguimiento de Aprendices
            </h1>
            <p className="text-sm text-teal-100 max-w-2xl">
              Supervisa la etapa productiva de tus aprendices asignados, revisa sus bitácoras y
              documentos cargados, y aprueba o rechaza los entregables en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSeguimientos}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/20 shadow-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* ALERTA DE ERROR */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 shadow-sm">
          <AlertCircle className="flex-shrink-0 text-rose-600 dark:text-rose-400" size={20} />
          <p className="text-xs sm:text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* KPI TARJETAS INFORMATIVAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-coal-500 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Aprendices</span>
            <Users size={18} className="text-teal-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</p>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Asignados a tu cargo</span>
        </div>

        <div className="bg-white dark:bg-coal-500 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">En Proceso</span>
            <CheckCircle2 size={18} />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats.enProceso}
          </p>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Etapa productiva activa</span>
        </div>

        <div
          className={`rounded-2xl p-5 border shadow-sm space-y-1 cursor-pointer transition-all ${
            stats.docsPendientesTotal > 0
              ? 'bg-amber-50/80 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800'
              : 'bg-white dark:bg-coal-500 border-gray-200 dark:border-gray-700'
          }`}
          onClick={() => setSoloPendientes(!soloPendientes)}
        >
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Por Revisar</span>
            <Clock size={18} className="animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {stats.docsPendientesTotal}
          </p>
          <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
            {stats.aprendicesConPendientes} aprendiz(ces) con docs
          </span>
        </div>

        <div className="bg-white dark:bg-coal-500 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="text-xs font-bold uppercase tracking-wider">Atrasados / Susp.</span>
            <AlertTriangle size={18} />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats.atrasados}
          </p>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Requieren atención</span>
        </div>
      </div>

      {/* BARRA DE CONTROLES: BUSQUEDA Y FILTROS */}
      <div className="bg-white dark:bg-coal-500 rounded-2xl p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por aprendiz, documento o correo..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-coal-400 text-xs sm:text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        {/* Pestañas de estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['TODOS', 'EN_PROCESO', 'PENDIENTE', 'ATRASADO', 'SUSPENDIDO', 'FINALIZADO'] as const).map(
            (estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado)}
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border whitespace-nowrap ${
                  filtroEstado === estado
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-coal-400 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {estado === 'TODOS' ? 'Todos' : estado.replace('_', ' ')}
              </button>
            )
          )}
        </div>

        {/* Checkbox solo pendientes */}
        <button
          type="button"
          onClick={() => setSoloPendientes(!soloPendientes)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all ${
            soloPendientes
              ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200 dark:border-amber-700'
              : 'bg-gray-50 dark:bg-coal-400 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
          }`}
        >
          <Filter size={14} className={soloPendientes ? 'text-amber-600' : 'text-gray-400'} />
          <span>Solo con docs pendientes</span>
        </button>
      </div>

      {/* LISTADO DE APRENDICES (GRID DE TARJETAS) */}
      {loading ? (
        <div className="bg-white dark:bg-coal-500 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center space-y-4 shadow-sm">
          <RefreshCw className="animate-spin text-emerald-600" size={36} />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
            Cargando aprendices en seguimiento...
          </p>
        </div>
      ) : seguimientosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-coal-500 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 text-center space-y-3 shadow-sm">
          <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            No se encontraron aprendices
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {seguimientos.length === 0
              ? 'Actualmente no tienes aprendices asignados para el seguimiento de la etapa productiva.'
              : 'Ningún aprendiz coincide con los filtros de búsqueda aplicados.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seguimientosFiltrados.map((seg) => {
            const personaObj = seg.persona;
            const nombreCompleto = personaObj
              ? `${personaObj.nombre1 || ''} ${personaObj.nombre2 || ''} ${personaObj.apellido1 || ''} ${personaObj.apellido2 || ''}`.trim()
              : 'Aprendiz no identificado';

            const docs = seg.documentos || [];
            const totalDocs = docs.length;
            const aprobados = docs.filter((d) => d.estado === 'APROBADO').length;
            const pendientes = docs.filter((d) => d.estado === 'PENDIENTE').length;
            const rechazados = docs.filter((d) => d.estado === 'RECHAZADO').length;
            const porcentaje = totalDocs > 0 ? Math.round((aprobados / totalDocs) * 100) : 0;

            return (
              <div
                key={seg.id}
                className={`bg-white dark:bg-coal-500 rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col justify-between overflow-hidden ${
                  pendientes > 0
                    ? 'border-amber-300 dark:border-amber-800/80 ring-1 ring-amber-200 dark:ring-amber-900/30'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Banner superior de tarjeta */}
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-base flex-shrink-0 border border-emerald-200 dark:border-emerald-800">
                        {personaObj?.nombre1?.[0] || 'A'}
                        {personaObj?.apellido1?.[0] || ''}
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white truncate">
                          {nombreCompleto}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          ID: {personaObj?.identificacion || 'N/A'}
                        </p>
                        {personaObj?.email && (
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 truncate opacity-90">
                            {personaObj.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Selector de estado general */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Estado:
                    </span>
                    <select
                      value={seg.estado || 'PENDIENTE'}
                      onChange={(e) => handleCambiarEstado(seg.id, e.target.value)}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border cursor-pointer focus:outline-none transition-all ${badgeEstadoSeguimiento(
                        seg.estado
                      )}`}
                    >
                      <option value="EN_PROCESO">EN PROCESO</option>
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="ATRASADO">ATRASADO</option>
                      <option value="SUSPENDIDO">SUSPENDIDO</option>
                      <option value="FINALIZADO">FINALIZADO</option>
                      <option value="CANCELADO">CANCELADO</option>
                    </select>
                  </div>

                  {/* Progreso de documentos */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-gray-600 dark:text-gray-300">
                        Documentación
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {porcentaje}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${porcentaje}%` }}
                      />
                    </div>
                  </div>

                  {/* Contadores de archivos */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                      <span className="font-black text-emerald-700 dark:text-emerald-400 block">
                        {aprobados}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-500">
                        Aprobados
                      </span>
                    </div>

                    <div
                      className={`p-2 rounded-xl border ${
                        pendientes > 0
                          ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 animate-pulse'
                          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50'
                      }`}
                    >
                      <span
                        className={`font-black block ${
                          pendientes > 0
                            ? 'text-amber-900 dark:text-amber-300'
                            : 'text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {pendientes}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400">
                        Pendientes
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50">
                      <span className="font-black text-rose-700 dark:text-rose-400 block">
                        {rechazados}
                      </span>
                      <span className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-500">
                        Rechazados
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer boton accion */}
                <div className="p-4 bg-gray-50/80 dark:bg-coal-400 border-t border-gray-100 dark:border-gray-700/80">
                  <button
                    onClick={() => handleAbrirModal(seg)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <FileText size={15} />
                    <span>Gestionar / Revisar</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE GESTION COMPLETA DEL SEGUIMIENTO */}
      <ModalGestionSeguimiento
        isOpen={isModalOpen}
        onClose={handleCerrarModal}
        aprendiz={aprendizSeleccionado}
      />
    </div>
  );
};

export default SeguimientoInstructor;
