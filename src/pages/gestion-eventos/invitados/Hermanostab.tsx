import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { KeenIcon } from '@/components';
import clsx from 'clsx';
import html2canvas from 'html2canvas';
import axios from 'axios';

import { ModalAbono } from './ModalAbono';
import { ModalCrearEditar } from './ModalCrearEditar';
import { ModalVerDetalle } from './ModalVerDetalle';
import { ModalQR } from './ModalQR';
import { QRCard } from './QRCard';

interface Hermano {
  id: number;
  nombre: string;
  celularContacto: string;
  edad: number;
  nombreContactoF: string;
  celularContactoF: string;
  pago: number;
  saldo: number;
  formaPago: string;
  email: string;
  celularEmergencia: string;
  parentesco: string;
  observacion: string;
  qr_token: string | null;
}

interface Stats {
  total_invitados: number;
  total_recaudado: number;
  saldo_pendiente: number;
  con_qr: number;
  sin_qr: number;
  asistencia_confirmada: number;
  porcentaje_asistencia: number;
}

type ModalMode = 'crear' | 'editar' | 'ver' | 'qr' | null;

const PAGE_SIZE = 15;

export const HermanosTab: React.FC = () => {
  const [hermanos, setHermanos] = useState<Hermano[]>([]);
  const [loading, setLoading] = useState(true);
  const [generandoQrs, setGenerandoQrs] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [hermanoSel, setHermanoSel] = useState<Hermano | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  const [guardandoQrId, setGuardandoQrId] = useState<number | null>(null);
  const [modalAbono, setModalAbono] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const captureRef = useRef<HTMLDivElement>(null);
  const API = '/invitado';

  const notif = useCallback((msg: string, tipo: 'ok' | 'err' = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const [resH, resS] = await Promise.all([
        axios.get(API),
        axios.get(`${API}/stats`)
      ]);
      setHermanos(resH.data?.data ?? resH.data ?? []);
      setStats(resS.data);
    } catch {
      notif('Error al cargar los invitados', 'err');
    } finally {
      setLoading(false);
    }
  }, [notif]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase();
    return hermanos.filter(
      (h) =>
        h.nombre.toLowerCase().includes(q) ||
        h.email?.toLowerCase().includes(q) ||
        h.celularContacto?.includes(busqueda)
    );
  }, [hermanos, busqueda]);

  // Reset page when filter changes
  useEffect(() => { setPage(1); }, [busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginados = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const abrirCrear = () => { setHermanoSel(null); setModalMode('crear'); };
  const abrirEditar = (h: Hermano) => { setHermanoSel(h); setModalMode('editar'); };
  const abrirVer = (h: Hermano) => { setHermanoSel(h); setModalMode('ver'); };
  const abrirQr = (h: Hermano) => { setHermanoSel(h); setModalMode('qr'); };
  const cerrar = () => { setModalMode(null); setHermanoSel(null); };
  const abrirAbonar = (h: Hermano) => { setHermanoSel(h); setModalAbono(true); };
  const cerrarAbono = () => { setModalAbono(false); setHermanoSel(null); };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar este invitado?')) return;
    try {
      await axios.delete(`${API}/${id}`);
      notif('Invitado eliminado');
      cargar();
    } catch {
      notif('Error al eliminar', 'err');
    }
  };

  const guardarQrImagen = useCallback(async (h: Hermano) => {
    try {
      setGuardandoQrId(h.id);
      await new Promise((r) => setTimeout(r, 350));
      if (!captureRef.current) throw new Error('ref vacío');
      const canvas = await html2canvas(captureRef.current, { scale: 2, useCORS: true });
      const image = canvas.toDataURL('image/png');
      await axios.post(`${API}/${h.id}/qr`, { qr_image: image });
      notif(`QR guardado para ${h.nombre}`);
      cargar();
    } catch {
      notif('Error al guardar el QR', 'err');
    } finally {
      setGuardandoQrId(null);
    }
  }, [cargar, notif]);

  const generarQrsMasivo = async () => {
    const ids =
      seleccionados.size > 0
        ? Array.from(seleccionados)
        : hermanos.filter((h) => !h.qr_token).map((h) => h.id);

    if (ids.length === 0) {
      notif('Todos ya tienen QR o no hay seleccionados', 'err');
      return;
    }
    try {
      setGenerandoQrs(true);
      await axios.post(`${API}/generar-qrs`, { ids });
      notif(`QR tokens generados para ${ids.length} invitado(s)`);
      setSeleccionados(new Set());
      cargar();
    } catch {
      notif('Error al generar QRs', 'err');
    } finally {
      setGenerandoQrs(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const res = await axios.get(`${API}/export-csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invitados_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      notif('Reporte CSV descargado');
    } catch {
      notif('Error al exportar', 'err');
    } finally {
      setExporting(false);
    }
  };

  const toggleSel = (id: number) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const todosMarcados = filtrados.length > 0 && seleccionados.size === filtrados.length;
  const toggleTodos = () =>
    todosMarcados
      ? setSeleccionados(new Set())
      : setSeleccionados(new Set(filtrados.map((h) => h.id)));

  return (
    <>
      {toast && (
        <div
          className={clsx(
            'fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-slide-in',
            toast.tipo === 'ok' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          <KeenIcon
            icon={toast.tipo === 'ok' ? 'check-circle' : 'cross-circle'}
            className="text-lg"
          />
          {toast.msg}
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* KPI Dashboard Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-5 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(249,115,22,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
                  <KeenIcon icon="people" className="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Invitados">Invitados</p>
                  <p className="text-xl font-black text-neutral-800 dark:text-white italic leading-none">{stats.total_invitados}</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-5 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(16,185,129,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
                  <KeenIcon icon="dollar" className="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Recaudado">Recaudado</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 italic leading-none">${stats.total_recaudado.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-5 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(239,68,68,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
                  <KeenIcon icon="notification-status" className="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Pendiente">Pendiente</p>
                  <p className="text-xl font-black text-rose-500 italic leading-none">${stats.saldo_pendiente.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-5 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-[0_10px_20px_rgba(124,58,237,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
                  <KeenIcon icon="scan-barcode" className="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="QR Ready">QR Ready</p>
                  <p className="text-xl font-black text-neutral-800 dark:text-white italic leading-none">
                    {stats.con_qr}<span className="text-[10px] font-bold text-gray-400">/{stats.total_invitados}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="group relative bg-white dark:bg-zinc-900/90 rounded-[2rem] p-5 border border-neutral-100 dark:border-white/5 shadow-sm hover:shadow-[0_20px_50px_rgba(249,115,22,0.06)] hover:-translate-y-1 transition-all duration-300 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl bg-info text-white flex items-center justify-center shadow-[0_10px_20px_rgba(6,182,212,0.2)] transform -rotate-3 group-hover:rotate-0 transition-transform duration-300 shrink-0">
                  <KeenIcon icon="verify" className="text-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 leading-tight truncate" title="Asistencia">Asistencia</p>
                  <p className="text-xl font-black text-neutral-800 dark:text-white italic leading-none">
                    {stats.porcentaje_asistencia}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions bar */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-sm p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <KeenIcon
                icon="magnifier"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, email o celular..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl border border-gray-150 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
              />
            </div>

            <div className="flex items-center gap-3 ml-auto flex-wrap w-full sm:w-auto">
              {seleccionados.size > 0 && (
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/10 shrink-0">
                  {seleccionados.size} Seleccionado(s)
                </span>
              )}

              <button
                onClick={handleExportCsv}
                disabled={exporting}
                title="Exportar reporte CSV"
                className="flex items-center gap-2 px-5 h-12 text-xs font-black uppercase tracking-wider rounded-2xl border border-gray-200 dark:border-zinc-700 text-gray-650 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-zinc-850 transition-colors disabled:opacity-60 shrink-0"
              >
                {exporting ? (
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <KeenIcon icon="folder-down" className="text-base" />
                )}
                <span>Exportar</span>
              </button>

              <button
                onClick={generarQrsMasivo}
                disabled={generandoQrs}
                className="flex items-center gap-2 px-5 h-12 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/25 transition-all disabled:opacity-60 shrink-0"
              >
                {generandoQrs ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <KeenIcon icon="scan-barcode" className="text-base" />
                )}
                <span>
                  {seleccionados.size > 0
                    ? `Generar QR (${seleccionados.size})`
                    : 'Generar QRs'}
                </span>
              </button>

              <button
                onClick={abrirCrear}
                className="flex items-center gap-2 px-6 h-12 text-[10px] font-black uppercase tracking-[0.15em] rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25 transition-all shrink-0 w-full sm:w-auto justify-center"
              >
                <KeenIcon icon="plus" className="text-base" />
                <span>Nuevo invitado</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-zinc-900/90 rounded-[2rem] border border-neutral-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/40 dark:bg-zinc-950/20">
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={todosMarcados}
                        onChange={toggleTodos}
                        className="checkbox checkbox-sm"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap hidden md:table-cell">
                      Celular
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap hidden lg:table-cell">
                      Pago
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap hidden lg:table-cell">
                      Saldo
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap hidden xl:table-cell">
                      Forma Pago
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                      QR
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap min-w-[220px]">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/60">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-sm">Cargando invitados...</span>
                        </div>
                      </td>
                    </tr>
                  ) : paginados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <KeenIcon
                            icon="people"
                            className="text-5xl text-gray-200 dark:text-zinc-700"
                          />
                          <span className="text-sm">
                            {busqueda
                              ? 'Sin resultados para la búsqueda'
                              : 'No hay invitados registrados'}
                          </span>
                          {!busqueda && (
                            <button
                              onClick={abrirCrear}
                              className="mt-1 text-sm text-primary hover:underline font-medium"
                            >
                              Crear el primero
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginados.map((h) => (
                      <tr
                        key={h.id}
                        className={clsx(
                          'transition-colors hover:bg-gray-50/80 dark:hover:bg-zinc-800/30',
                          seleccionados.has(h.id) && 'bg-primary/5 dark:bg-primary/10'
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={seleccionados.has(h.id)}
                            onChange={() => toggleSel(h.id)}
                            className="checkbox checkbox-sm"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
                              {h.nombre?.charAt(0) ?? '?'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 dark:text-white text-sm leading-tight truncate">
                                {h.nombre}
                              </div>
                              <div className="text-xs text-gray-400">
                                {h.edad ? `${h.edad} años` : '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-[180px] block">
                            {h.email || '—'}
                          </span>
                        </td>

                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-gray-500 dark:text-gray-400 text-sm">
                            {h.celularContacto || '—'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
                            ${(h.pago ?? 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span
                            className={clsx(
                              'text-sm font-semibold',
                              (h.saldo ?? 0) > 0
                                ? 'text-red-500'
                                : 'text-emerald-600 dark:text-emerald-400'
                            )}
                          >
                            ${(h.saldo ?? 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="px-4 py-3 hidden xl:table-cell">
                          <span className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                            {h.formaPago || '—'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {h.qr_token ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                              <KeenIcon icon="check" className="text-[10px]" />
                              Listo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-400 dark:text-gray-500 text-xs font-medium">
                              Sin QR
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 min-w-[220px] whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => abrirVer(h)}
                              title="Ver detalle"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <KeenIcon icon="eye" className="text-base" />
                            </button>
                            <button
                              onClick={() => abrirEditar(h)}
                              title="Editar"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <KeenIcon icon="notepad-edit" className="text-base" />
                            </button>
                            <button
                              onClick={() => abrirQr(h)}
                              title="Ver / Guardar QR"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                            >
                              <KeenIcon icon="scan-barcode" className="text-base" />
                            </button>
                            {h.qr_token && (
                              <button
                                onClick={() => guardarQrImagen(h)}
                                disabled={guardandoQrId === h.id}
                                title="Guardar QR como imagen"
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
                              >
                                {guardandoQrId === h.id ? (
                                  <span className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <KeenIcon icon="folder-down" className="text-base" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => abrirAbonar(h)}
                              title="Abonar"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                            >
                              <KeenIcon icon="dollar" className="text-base" />
                            </button>
                            <button
                              onClick={() => eliminar(h.id)}
                              title="Eliminar"
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <KeenIcon icon="trash" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {filtrados.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-800/40">
                      <td
                        colSpan={4}
                        className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500"
                      >
                        {filtrados.length} invitado(s) · {hermanos.filter((h) => h.qr_token).length}{' '}
                        con QR
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                        ${filtrados.reduce((s, h) => s + (h.pago ?? 0), 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-red-500 hidden lg:table-cell">
                        ${filtrados.reduce((s, h) => s + (h.saldo ?? 0), 0).toLocaleString()}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/20 dark:bg-zinc-950/10">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  Página {page} de {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-orange-500 hover:text-white transition-all duration-200"
                  >
                    <KeenIcon icon="arrow-left" className="text-xs" />
                  </button>
                  <div className="flex gap-1.5">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) {
                        p = i + 1;
                      } else if (page <= 3) {
                        p = i + 1;
                      } else if (page >= totalPages - 2) {
                        p = totalPages - 4 + i;
                      } else {
                        p = page - 2 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={clsx(
                            'w-8 h-8 flex items-center justify-center rounded-xl text-xs font-bold transition-all duration-200',
                            page === p
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                              : 'bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-zinc-750'
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-orange-500 hover:text-white transition-all duration-200"
                  >
                    <KeenIcon icon="arrow-right" className="text-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalCrearEditar
        open={modalMode === 'crear' || modalMode === 'editar'}
        onClose={cerrar}
        hermano={hermanoSel}
        onSuccess={cargar}
        notif={notif}
      />

      <ModalVerDetalle
        open={modalMode === 'ver'}
        onClose={cerrar}
        hermano={hermanoSel}
        onVerQr={abrirQr}
        onEditar={abrirEditar}
      />

      <ModalQR
        open={modalMode === 'qr'}
        onClose={cerrar}
        hermano={hermanoSel}
        captureRef={captureRef}
        notif={notif}
      />

      <ModalAbono
        open={modalAbono}
        onClose={cerrarAbono}
        hermano={hermanoSel}
        onSuccess={cargar}
        notif={notif}
      />

      {guardandoQrId !== null && hermanoSel && modalMode !== 'qr' && (
        <div className="fixed -left-[9999px] top-0 pointer-events-none">
          <QRCard hermano={hermanoSel} captureRef={captureRef} />
        </div>
      )}
    </>
  );
};

export default HermanosTab;
