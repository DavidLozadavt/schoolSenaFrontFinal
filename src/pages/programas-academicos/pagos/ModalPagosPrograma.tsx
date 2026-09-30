import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AcademicoPagoPayload,
  CHECKOUT_ACADEMICO_PATH,
  guardarPayloadAcademico
} from './academicoPagoTypes';
import { EstudiantePagoMock, estudiantesPagoMock } from './mockEstudiantesPago';
import {
  ConceptoPagoMock,
  EstadoConceptoPago,
  getMockPagosPrograma
} from './mockPagosPrograma';

export interface ModalPagosProgramaProps {
  open: boolean;
  onClose: () => void;
  programa?: { id?: number; name?: string; codigo?: string } | null;
}

type TabActiva = 'pendientes' | 'historial';

const formatearPeso = (valor: number): string =>
  valor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const estilosEstado: Record<EstadoConceptoPago, string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300',
  PAGADO: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300',
  RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  EN_PROCESO: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
};

const ModalPagosPrograma = ({ open, onClose, programa }: ModalPagosProgramaProps) => {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState<TabActiva>('pendientes');
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [searchEstudiante, setSearchEstudiante] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudiantePagoMock | null>(
    null
  );

  useEffect(() => {
    if (open) {
      setSeleccionados([]);
      setTabActiva('pendientes');
      setSearchEstudiante('');
      setEstudianteSeleccionado(null);
    }
  }, [open, programa]);

  const data = useMemo(
    () => getMockPagosPrograma(programa, estudianteSeleccionado),
    [programa, estudianteSeleccionado]
  );

  const resultadosBusqueda = useMemo(() => {
    const termino = searchEstudiante.trim().toLowerCase();
    if (!termino) return [];

    return estudiantesPagoMock.filter(
      (e) =>
        e.nombre.toLowerCase().includes(termino) ||
        e.documento.includes(termino) ||
        String(e.idMatricula).includes(termino)
    );
  }, [searchEstudiante]);

  const conceptosPendientes = useMemo(
    () => data.conceptos.filter((c) => c.estado === 'PENDIENTE'),
    [data.conceptos]
  );

  const conceptosHistorial = useMemo(
    () => data.conceptos.filter((c) => c.estado !== 'PENDIENTE'),
    [data.conceptos]
  );

  const totalPendiente = useMemo(
    () => conceptosPendientes.reduce((sum, c) => sum + c.valor, 0),
    [conceptosPendientes]
  );

  const totalPagado = useMemo(
    () =>
      data.conceptos
        .filter((c) => c.estado === 'PAGADO')
        .reduce((sum, c) => sum + c.valor, 0),
    [data.conceptos]
  );

  const totalSeleccionado = useMemo(
    () =>
      data.conceptos
        .filter((c) => seleccionados.includes(c.idPago))
        .reduce((sum, c) => sum + c.valor, 0),
    [data.conceptos, seleccionados]
  );

  const handleSeleccionarEstudiante = (estudiante: EstudiantePagoMock) => {
    setEstudianteSeleccionado(estudiante);
    setSeleccionados([]);
    setTabActiva('pendientes');
  };

  const handleCambiarEstudiante = () => {
    setEstudianteSeleccionado(null);
    setSeleccionados([]);
    setSearchEstudiante('');
  };

  const toggleSeleccion = (concepto: ConceptoPagoMock) => {
    if (!concepto.seleccionable || concepto.estado !== 'PENDIENTE') return;

    setSeleccionados((prev) =>
      prev.includes(concepto.idPago)
        ? prev.filter((id) => id !== concepto.idPago)
        : [...prev, concepto.idPago]
    );
  };

  const handleContinuar = () => {
    if (!estudianteSeleccionado || seleccionados.length === 0) return;

    const conceptosSeleccionados = data.conceptos
      .filter((c) => seleccionados.includes(c.idPago) && c.estado === 'PENDIENTE')
      .map((item) => ({
        idPago: item.idPago,
        concepto: item.concepto,
        descripcion: item.descripcion,
        valor: item.valor,
        estado: item.estado
      }));

    const payload: AcademicoPagoPayload = {
      idTransaccion: estudianteSeleccionado.idTransaccion,
      programaId: programa?.id ?? data.programa.id,
      estudianteId: estudianteSeleccionado.idEstudiante,
      idMatricula: estudianteSeleccionado.idMatricula,
      origen: 'ACADEMICO',
      contexto: 'GESTION_ACADEMICA',
      registradoPor: 'ADMIN',
      pagosSeleccionados: seleccionados,
      conceptosSeleccionados,
      totalSeleccionado,
      estudiante: {
        id: estudianteSeleccionado.idEstudiante,
        nombre: estudianteSeleccionado.nombre,
        documento: estudianteSeleccionado.documento
      }
    };

    console.log('Payload para registro de pago académico:', payload);
    guardarPayloadAcademico(payload);

    onClose();
    navigate(CHECKOUT_ACADEMICO_PATH, {
      state: { academicoPagoPayload: payload }
    });
  };

  if (!open) return null;

  const terminoBusqueda = searchEstudiante.trim();

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-coal-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white border border-gray-200 shadow-2xl dark:bg-coal-600 rounded-2xl dark:border-white/10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-emerald-50/80 dark:bg-emerald-500/10">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <i className="text-xl text-emerald-600 ki-outline ki-wallet dark:text-emerald-400" />
              <h2 className="text-lg font-black tracking-tight text-gray-900 uppercase dark:text-white">
                Billetera académica
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {estudianteSeleccionado
                ? 'Estado de cuenta del estudiante. Seleccione conceptos pendientes y continúe al registro administrativo del pago.'
                : 'Busque y seleccione un estudiante para consultar su estado de cuenta y registrar pagos.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center flex-shrink-0 w-8 h-8 transition-all border rounded-lg shadow-sm bg-danger/10 text-danger border-danger/20 hover:bg-danger hover:text-white"
            aria-label="Cerrar"
          >
            <i className="text-lg ki-filled ki-cross" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50 dark:bg-transparent">
          {/* Buscador de estudiante */}
          {!estudianteSeleccionado && (
            <div className="p-4 space-y-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Buscar estudiante
                </span>
                <div className="relative mt-2">
                  <i className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ki-outline ki-magnifier" />
                  <input
                    type="text"
                    value={searchEstudiante}
                    onChange={(e) => setSearchEstudiante(e.target.value)}
                    placeholder="Buscar estudiante por nombre, documento o matrícula"
                    className="w-full py-2.5 pl-10 pr-4 text-sm border border-gray-200 rounded-lg bg-gray-50 dark:bg-coal-400 dark:border-white/10 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </label>

              {!terminoBusqueda && (
                <p className="py-6 text-sm text-center text-gray-500 dark:text-gray-400">
                  Busca y selecciona un estudiante para consultar su estado de cuenta.
                </p>
              )}

              {terminoBusqueda && resultadosBusqueda.length === 0 && (
                <p className="py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                  No se encontraron estudiantes con &quot;{terminoBusqueda}&quot;.
                </p>
              )}

              {terminoBusqueda && resultadosBusqueda.length > 0 && (
                <div className="space-y-2">
                  {resultadosBusqueda.map((estudiante) => (
                    <div
                      key={estudiante.idEstudiante}
                      className="flex flex-wrap items-center justify-between gap-3 p-4 border border-gray-200 rounded-xl bg-gray-50/50 dark:bg-coal-400/50 dark:border-white/10"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {estudiante.nombre}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          CC {estudiante.documento} · Matrícula #{estudiante.idMatricula}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSeleccionarEstudiante(estudiante)}
                        className="px-3 py-1.5 text-xs font-bold text-white uppercase rounded-lg bg-primary hover:bg-primary-active"
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Billetera — solo con estudiante seleccionado */}
          {estudianteSeleccionado && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Estudiante activo:{' '}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {estudianteSeleccionado.nombre}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={handleCambiarEstudiante}
                  className="px-3 py-1.5 text-xs font-bold uppercase border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-white/20 dark:text-gray-200 dark:hover:bg-coal-500"
                >
                  Cambiar estudiante
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Estudiante
                  </span>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                    {data.estudiante.nombre}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    CC {data.estudiante.documento}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Matrícula #{estudianteSeleccionado.idMatricula}
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Programa
                  </span>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white line-clamp-2">
                    {data.programa.nombre}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{data.programa.codigo}</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Transacción
                  </span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    #{data.transaccion.id}
                  </p>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded ${estilosEstado.PENDIENTE}`}
                  >
                    {data.transaccion.estado}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="p-3 text-center border border-amber-200 rounded-xl bg-amber-50/80 dark:bg-amber-500/10 dark:border-amber-500/30">
                  <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                    Total pendiente
                  </span>
                  <p className="text-lg font-black text-amber-900 dark:text-amber-200">
                    {formatearPeso(totalPendiente)}
                  </p>
                </div>
                <div className="p-3 text-center border border-emerald-200 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 dark:border-emerald-500/30">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                    Total pagado
                  </span>
                  <p className="text-lg font-black text-emerald-900 dark:text-emerald-200">
                    {formatearPeso(totalPagado)}
                  </p>
                </div>
                <div className="p-3 text-center border border-primary/30 rounded-xl bg-primary/5 dark:bg-primary/10">
                  <span className="text-[10px] font-bold uppercase text-primary">
                    Total seleccionado
                  </span>
                  <p className="text-lg font-black text-primary">{formatearPeso(totalSeleccionado)}</p>
                </div>
              </div>

              <div className="flex gap-2 p-1 border border-gray-200 rounded-lg bg-white dark:bg-coal-500 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTabActiva('pendientes')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-colors ${
                    tabActiva === 'pendientes'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-coal-400'
                  }`}
                >
                  Pendientes ({conceptosPendientes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTabActiva('historial')}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-colors ${
                    tabActiva === 'historial'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-coal-400'
                  }`}
                >
                  Historial ({conceptosHistorial.length})
                </button>
              </div>

              {tabActiva === 'pendientes' && (
                <div className="space-y-2">
                  {conceptosPendientes.length === 0 ? (
                    <p className="py-8 text-sm text-center text-gray-500 dark:text-gray-400">
                      No hay conceptos pendientes.
                    </p>
                  ) : (
                    conceptosPendientes.map((concepto) => {
                      const marcado = seleccionados.includes(concepto.idPago);
                      const deshabilitado = !concepto.seleccionable;

                      return (
                        <label
                          key={concepto.idPago}
                          className={`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all ${
                            deshabilitado
                              ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-50 dark:bg-coal-500/50'
                              : marcado
                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                : 'border-gray-200 bg-white hover:border-primary/50 dark:bg-coal-500 dark:border-white/10'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            disabled={deshabilitado}
                            onChange={() => toggleSeleccion(concepto)}
                            className="mt-1 checkbox checkbox-sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {concepto.concepto}
                              </span>
                              <span className="text-sm font-black text-primary">
                                {formatearPeso(concepto.valor)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                              {concepto.descripcion}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-500">Vence: {concepto.fecha}</p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              )}

              {tabActiva === 'historial' && (
                <div className="overflow-x-auto border border-gray-200 rounded-xl dark:border-white/10">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-coal-500 dark:text-gray-400">
                        <th className="px-4 py-3">Concepto</th>
                        <th className="px-4 py-3">Valor</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Medio</th>
                        <th className="px-4 py-3">Referencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                      {conceptosHistorial.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                            Sin registros en el historial.
                          </td>
                        </tr>
                      ) : (
                        conceptosHistorial.map((concepto) => (
                          <tr
                            key={concepto.idPago}
                            className="bg-white dark:bg-coal-500 hover:bg-gray-50 dark:hover:bg-coal-400/50"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                              {concepto.concepto}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {formatearPeso(concepto.valor)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded ${estilosEstado[concepto.estado]}`}
                              >
                                {concepto.estado.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                              {concepto.medioPago ?? '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                              {concepto.referencia ?? '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 px-6 py-4 border-t border-gray-200 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 bg-white dark:bg-coal-600">
          {estudianteSeleccionado ? (
            <div>
              <span className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">
                Total a registrar
              </span>
              <p className="text-xl font-black text-primary">{formatearPeso(totalSeleccionado)}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Seleccione un estudiante para continuar.
            </p>
          )}
          <div className="flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase transition-colors border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 dark:border-white/20 dark:text-gray-200 dark:hover:bg-coal-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!estudianteSeleccionado || seleccionados.length === 0}
              onClick={handleContinuar}
              className="px-4 py-2 text-xs font-bold text-white uppercase transition-colors rounded-lg bg-primary hover:bg-primary-active disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuar al registro de pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalPagosPrograma;
