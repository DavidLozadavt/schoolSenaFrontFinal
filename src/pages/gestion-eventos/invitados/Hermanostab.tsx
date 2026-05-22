import { useState, useEffect, useCallback, useRef } from 'react';
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

type ModalMode = 'crear' | 'editar' | 'ver' | 'qr' | null;

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

  const captureRef = useRef<HTMLDivElement>(null);
  const API = '/invitado';

  const notif = useCallback((msg: string, tipo: 'ok' | 'err' = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(API);
      setHermanos(res.data?.data ?? res.data ?? []);
    } catch {
      notif('Error al cargar los invitados', 'err');
    } finally {
      setLoading(false);
    }
  }, [notif]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtrados = hermanos.filter(
    (h) =>
      h.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      h.celularContacto?.includes(busqueda)
  );

  const abrirCrear = () => {
    setHermanoSel(null);
    setModalMode('crear');
  };

  const abrirEditar = (h: Hermano) => {
    setHermanoSel(h);
    setModalMode('editar');
  };

  const abrirVer = (h: Hermano) => {
    setHermanoSel(h);
    setModalMode('ver');
  };

  const abrirQr = (h: Hermano) => {
    setHermanoSel(h);
    setModalMode('qr');
  };

  const cerrar = () => {
    setModalMode(null);
    setHermanoSel(null);
  };

  const abrirAbonar = (h: Hermano) => {
    setHermanoSel(h);
    setModalAbono(true);
  };

  const cerrarAbono = () => {
    setModalAbono(false);
    setHermanoSel(null);
  };

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
            'fixed top-5 right-5 z-[999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-medium',
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
        <div className="card">
          <div className="card-body flex flex-wrap items-center gap-3 py-4 px-5">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <KeenIcon
                icon="magnifier"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por nombre, email o celular..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 ml-auto flex-wrap">
              {seleccionados.size > 0 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {seleccionados.size} seleccionado(s)
                </span>
              )}

              <button
                onClick={generarQrsMasivo}
                disabled={generandoQrs}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-60"
              >
                {generandoQrs ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <KeenIcon icon="scan-barcode" className="text-base" />
                )}
                {seleccionados.size > 0
                  ? `Generar QR (${seleccionados.size})`
                  : 'Generar QRs sin token'}
              </button>

              <button
                onClick={abrirCrear}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary hover:bg-primary/90 text-white transition-colors"
              >
                <KeenIcon icon="plus" className="text-base" />
                Nuevo invitado
              </button>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-0">
            <div className="overflow-x-auto rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800 bg-gray-50/60 dark:bg-zinc-800/40">
                    <th className="px-4 py-3 w-10">
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
                    <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
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
                  ) : filtrados.length === 0 ? (
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
                    filtrados.map((h) => (
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

                        <td className="px-4 py-3">
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
                        {filtrados.length} hermano(s) · {hermanos.filter((h) => h.qr_token).length}{' '}
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
