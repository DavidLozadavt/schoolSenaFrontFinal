import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { KeenIcon } from '@/components';
import clsx from 'clsx';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface NotaMateria {
  idMateria: number;
  nombreMateria: string;
  nota1: number | null;
  nota2: number | null;
  nota3: number | null;
  definitiva: number;
  estado: 'APROBADA' | 'REPROBADA' | 'PENDIENTE';
}

interface InasistenciaResumen {
  totalClases: number;
  asistencias: number;
  ausencias: number;
  porcentaje: number;
}

interface BoletinDetalle {
  idEstudiante: number;
  documento: string;
  nombre: string;
  email: string;
  ficha: {
    codigo: string;
    programa: string;
    jornada: string;
    periodo: string;
  };
  inasistencia: InasistenciaResumen;
  promedioGeneral: number;
  observaciones: string;
  materias: NotaMateria[];
}

interface BoletinViewModalProps {
  idEstudiante: number | null;
  open: boolean;
  onClose: () => void;
}

// ─── Datos obtenidos desde la API ──────────────────────────

// ─── Helpers ──────────────────────────────────────────────────────────────────

const obtenerIniciales = (nombre: string): string => {
  const partes = nombre.trim().split(' ').filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase();
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase();
};

const colorNota = (nota: number): string => {
  if (nota >= 4.0) return 'text-green-700 dark:text-green-400';
  if (nota >= 3.0) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

const getDesempeno = (nota: number): string => {
  if (nota >= 4.6) return 'SUPERIOR';
  if (nota >= 4.0) return 'ALTO';
  if (nota >= 3.0) return 'BÁSICO';
  return 'BAJO';
};

const configEstadoMateria: Record<NotaMateria['estado'], { label: string; clases: string }> = {
  APROBADA: {
    label: 'Aprobada',
    clases: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
  },
  REPROBADA: {
    label: 'Reprobada',
    clases: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300'
  },
  PENDIENTE: {
    label: 'Pendiente',
    clases: 'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300'
  }
};

const formatoNota = (n: number | null): string => (n === null ? '—' : n.toFixed(1));

// ─── Componente ────────────────────────────────────────────────────────────────

const BoletinViewModal: React.FC<BoletinViewModalProps> = ({ idEstudiante, open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<BoletinDetalle | null>(null);
  const [descargando, setDescargando] = useState(false);

  const fetchDetalle = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<{ data: BoletinDetalle }>(`coordinador/boletines/${id}`);
      const data = response.data?.data;
      if (data) {
        // Asegurar valores por defecto
        const detalleSeguro: BoletinDetalle = {
          ...data,
          promedioGeneral: data.promedioGeneral ?? 0, // Valor por defecto
          inasistencia: data.inasistencia ?? {
            totalClases: 0,
            asistencias: 0,
            ausencias: 0,
            porcentaje: 0
          },
          materias: data.materias ?? []
        };
        setDetalle(detalleSeguro);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(
        axiosError?.response?.data?.error ??
          'No se pudo cargar el boletín del estudiante. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && idEstudiante !== null) {
      fetchDetalle(idEstudiante);
    }
  }, [open, idEstudiante, fetchDetalle]);

  useEffect(() => {
    if (!open) {
      setDetalle(null);
      setError(null);
    }
  }, [open]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleDescargar = useCallback(() => {
    window.print();
  }, []);

  if (!open) return null;

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              margin: 1.5cm;
              size: portrait;
            }
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background-color: white !important;
            }
            body * {
              visibility: hidden;
            }
            #boletin-print-area, #boletin-print-area * {
              visibility: visible;
            }
            #boletin-print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 0;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead {
              display: table-header-group;
            }
            tfoot {
              display: table-footer-group;
            }
            /* Evita que los bordes de la tabla colapsen y no se impriman bien en algunos navegadores */
            table, th, td {
              border-collapse: collapse !important;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
        {/* Fondo */}
        <div
          className="absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity"
          onClick={onClose}
        />

        {/* Contenido */}
        <div className="relative bg-white dark:bg-coal-400 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Encabezado */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Boletín académico</p>
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">
                {detalle ? detalle.nombre : 'Cargando...'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-coal-300 text-gray-500 dark:text-gray-400 transition-colors flex-shrink-0"
              title="Cerrar"
            >
              <KeenIcon icon="cross" className="text-base" />
            </button>
          </div>

          {/* Cuerpo */}
          <div className="overflow-y-auto flex-1 px-5 py-4">
            {loading && (
              <div className="flex items-center justify-center min-h-[240px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Cargando boletín...
                  </p>
                </div>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center justify-center py-12">
                <KeenIcon
                  icon="cross-circle"
                  className="text-4xl text-red-400 dark:text-red-500 mx-auto mb-3"
                />
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                  Error al cargar el boletín
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => idEstudiante !== null && fetchDetalle(idEstudiante)}
                  className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors"
                >
                  <KeenIcon icon="arrows-circle" className="text-base" />
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && detalle && (
              <div className="space-y-5">
                {/* Datos del estudiante y ficha */}
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    {obtenerIniciales(detalle.nombre)}
                  </div>
                  <div className="min-w-0 grid grid-cols-2 gap-x-4 gap-y-1 flex-1">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Documento
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        CC {detalle.documento}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Ficha
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {detalle.ficha.codigo} — {detalle.ficha.programa}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Jornada
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {detalle.ficha.jornada}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Periodo
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {detalle.ficha.periodo}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-coal-300 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Promedio general
                    </p>
                    <p
                      className={clsx('text-2xl font-semibold', colorNota(detalle.promedioGeneral))}
                    >
                      {detalle.promedioGeneral.toFixed(1) ?? 1}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-coal-300 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Asistencia</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {detalle.inasistencia.porcentaje}%
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-coal-300 rounded-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ausencias</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {detalle.inasistencia.ausencias}{' '}
                      <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                        / {detalle.inasistencia.totalClases}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tabla de materias */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                    Materias
                  </p>
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-2 bg-gray-50 dark:bg-coal-300 border-b border-gray-200 dark:border-gray-600">
                      {['Materia', 'Corte 1', 'Corte 2', 'Corte 3', 'Definitiva', 'Estado'].map(
                        (h) => (
                          <span
                            key={h}
                            className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500"
                          >
                            {h}
                          </span>
                        )
                      )}
                    </div>
                    {detalle.materias.map((materia) => (
                      <div
                        key={materia.idMateria}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 py-2 items-center border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <span className="text-sm text-gray-900 dark:text-white truncate">
                          {materia.nombreMateria}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {formatoNota(materia.nota1)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {formatoNota(materia.nota2)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {formatoNota(materia.nota3)}
                        </span>
                        <span
                          className={clsx('text-sm font-semibold', colorNota(materia.definitiva))}
                        >
                          {materia.definitiva.toFixed(1)}
                        </span>
                        <span>
                          <span
                            className={clsx(
                              'inline-flex text-xs font-medium px-2 py-0.5 rounded',
                              configEstadoMateria[materia.estado].clases
                            )}
                          >
                            {configEstadoMateria[materia.estado].label}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observaciones */}
                {detalle.observaciones && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                      Observaciones
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-coal-300 rounded-lg p-3">
                      {detalle.observaciones}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-coal-400 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-coal-300 transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleDescargar}
              disabled={loading || !!error || descargando}
              className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded border border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <KeenIcon icon="printer" className="text-base" />
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      </div>

      {/* ÁREA DE IMPRESIÓN (Estilo Colombia - Rediseñado) */}
      {!loading && !error && detalle && (
        <div
          id="boletin-print-area"
          className="hidden print:block bg-white text-black font-sans w-full"
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '11px' }}
        >
          {/* ── ENCABEZADO INSTITUCIONAL ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px 8px',
              borderBottom: '3px solid #1565C0'
            }}
          >
            {/* Logo izquierdo */}
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#E3F2FD',
                border: '2px solid #1565C0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: '#1565C0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}
              >
                LOGO
                <br />
                INST.
              </span>
            </div>

            {/* Datos institucionales centrados */}
            <div style={{ textAlign: 'center', flex: 1, padding: '0 16px' }}>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: 11, letterSpacing: 0.5 }}>
                REPÚBLICA DE COLOMBIA
              </p>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: 10 }}>
                INSTITUCIÓN EDUCATIVA VIRTUAL SCHOOL
              </p>
              <p style={{ margin: '2px 0', fontSize: 9.5, color: '#333' }}>
                Resolución de Aprobación No. 12345 de 2026
              </p>
              <p style={{ margin: 0, fontSize: 9, color: '#555' }}>
                DANE: 123456789012 &nbsp;|&nbsp; NIT: 900.123.456-7
              </p>
            </div>

            {/* Logo derecho */}
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: '#E3F2FD',
                border: '2px solid #1565C0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: '#1565C0',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}
              >
                LOGO
                <br />
                INST.
              </span>
            </div>
          </div>

          {/* ── TÍTULO DEL BOLETÍN ── */}
          <div
            style={{
              textAlign: 'center',
              background: '#1565C0',
              color: 'white',
              padding: '6px 24px',
              margin: '0 0 10px'
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 'bold',
                fontSize: 13,
                letterSpacing: 1,
                textTransform: 'uppercase'
              }}
            >
              Informe Académico &nbsp;—&nbsp; {detalle.ficha.periodo}
            </p>
          </div>

          {/* ── DATOS DEL ESTUDIANTE ── */}
          <div style={{ padding: '0 24px 10px' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.5px solid #1565C0',
                borderRadius: 6,
                overflow: 'hidden'
              }}
            >
              <thead>
                <tr style={{ background: '#1565C0', color: 'white' }}>
                  <th
                    colSpan={4}
                    style={{
                      padding: '5px 10px',
                      textAlign: 'left',
                      fontSize: 10.5,
                      fontWeight: 'bold',
                      letterSpacing: 0.5
                    }}
                  >
                    DATOS DEL ESTUDIANTE
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#E3F2FD' }}>
                  <td
                    style={{
                      padding: '4px 10px',
                      fontWeight: 'bold',
                      width: '15%',
                      borderRight: '1px solid #90CAF9'
                    }}
                  >
                    ESTUDIANTE:
                  </td>
                  <td
                    style={{ padding: '4px 10px', width: '35%', borderRight: '1px solid #90CAF9' }}
                  >
                    {detalle.nombre}
                  </td>
                  <td
                    style={{
                      padding: '4px 10px',
                      fontWeight: 'bold',
                      width: '15%',
                      borderRight: '1px solid #90CAF9'
                    }}
                  >
                    DOCUMENTO:
                  </td>
                  <td style={{ padding: '4px 10px', width: '35%' }}>{detalle.documento}</td>
                </tr>
                <tr style={{ background: '#BBDEFB' }}>
                  <td
                    style={{
                      padding: '4px 10px',
                      fontWeight: 'bold',
                      borderRight: '1px solid #90CAF9'
                    }}
                  >
                    FICHA/GRADO:
                  </td>
                  <td style={{ padding: '4px 10px', borderRight: '1px solid #90CAF9' }}>
                    {detalle.ficha.codigo} — {detalle.ficha.programa}
                  </td>
                  <td
                    style={{
                      padding: '4px 10px',
                      fontWeight: 'bold',
                      borderRight: '1px solid #90CAF9'
                    }}
                  >
                    JORNADA:
                  </td>
                  <td style={{ padding: '4px 10px' }}>{detalle.ficha.jornada}</td>
                </tr>
                <tr style={{ background: '#E3F2FD' }}>
                  <td
                    style={{
                      padding: '4px 10px',
                      fontWeight: 'bold',
                      borderRight: '1px solid #90CAF9'
                    }}
                  >
                    SEDE:
                  </td>
                  <td style={{ padding: '4px 10px', borderRight: '1px solid #90CAF9' }}>
                    Principal
                  </td>
                  <td
                    style={{
                      padding: '4px 10px',
                      fontWeight: 'bold',
                      borderRight: '1px solid #90CAF9'
                    }}
                  >
                    AÑO LECTIVO:
                  </td>
                  <td style={{ padding: '4px 10px' }}>2026</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── TABLA DE NOTAS ── */}
          <div style={{ padding: '0 24px 10px' }}>
            <table
              style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1565C0' }}
            >
              <thead>
                <tr style={{ background: '#1565C0', color: 'white' }}>
                  <th
                    style={{
                      padding: '6px 10px',
                      textAlign: 'left',
                      width: '30%',
                      borderRight: '1px solid #42A5F5',
                      fontSize: 10,
                      fontWeight: 'bold',
                      letterSpacing: 0.5
                    }}
                  >
                    ÁREAS / ASIGNATURAS
                  </th>
                  <th
                    style={{
                      padding: '6px 6px',
                      textAlign: 'center',
                      width: '8%',
                      borderRight: '1px solid #42A5F5',
                      fontSize: 9.5
                    }}
                  >
                    CORTE 1
                  </th>
                  <th
                    style={{
                      padding: '6px 6px',
                      textAlign: 'center',
                      width: '8%',
                      borderRight: '1px solid #42A5F5',
                      fontSize: 9.5
                    }}
                  >
                    CORTE 2
                  </th>
                  <th
                    style={{
                      padding: '6px 6px',
                      textAlign: 'center',
                      width: '8%',
                      borderRight: '1px solid #42A5F5',
                      fontSize: 9.5
                    }}
                  >
                    CORTE 3
                  </th>
                  <th
                    style={{
                      padding: '6px 6px',
                      textAlign: 'center',
                      width: '10%',
                      borderRight: '1px solid #42A5F5',
                      fontSize: 9.5
                    }}
                  >
                    NOTA DEF.
                  </th>
                  <th
                    style={{
                      padding: '6px 6px',
                      textAlign: 'center',
                      width: '13%',
                      borderRight: '1px solid #42A5F5',
                      fontSize: 9.5
                    }}
                  >
                    DESEMPEÑO
                  </th>
                  <th
                    style={{ padding: '6px 6px', textAlign: 'center', width: '23%', fontSize: 9.5 }}
                  >
                    ESTADO
                  </th>
                </tr>
              </thead>
              <tbody>
                {detalle.materias.map((m, idx) => {
                  const desempeno = getDesempeno(m.definitiva);
                  const desempenoColor =
                    desempeno === 'SUPERIOR'
                      ? '#1B5E20'
                      : desempeno === 'ALTO'
                        ? '#1565C0'
                        : desempeno === 'BÁSICO'
                          ? '#E65100'
                          : '#B71C1C';
                  const desempenoBg =
                    desempeno === 'SUPERIOR'
                      ? '#E8F5E9'
                      : desempeno === 'ALTO'
                        ? '#E3F2FD'
                        : desempeno === 'BÁSICO'
                          ? '#FFF3E0'
                          : '#FFEBEE';
                  const rowBg = idx % 2 === 0 ? '#E3F2FD' : '#BBDEFB';

                  return (
                    <tr key={m.idMateria} style={{ background: rowBg }}>
                      <td
                        style={{
                          padding: '4px 10px',
                          fontWeight: '600',
                          borderRight: '1px solid #90CAF9',
                          borderBottom: '1px solid #90CAF9',
                          fontSize: 10.5
                        }}
                      >
                        {m.nombreMateria}
                      </td>
                      <td
                        style={{
                          padding: '4px 6px',
                          textAlign: 'center',
                          borderRight: '1px solid #90CAF9',
                          borderBottom: '1px solid #90CAF9',
                          color: '#333',
                          fontSize: 10.5
                        }}
                      >
                        {formatoNota(m.nota1)}
                      </td>
                      <td
                        style={{
                          padding: '4px 6px',
                          textAlign: 'center',
                          borderRight: '1px solid #90CAF9',
                          borderBottom: '1px solid #90CAF9',
                          color: '#333',
                          fontSize: 10.5
                        }}
                      >
                        {formatoNota(m.nota2)}
                      </td>
                      <td
                        style={{
                          padding: '4px 6px',
                          textAlign: 'center',
                          borderRight: '1px solid #90CAF9',
                          borderBottom: '1px solid #90CAF9',
                          color: '#333',
                          fontSize: 10.5
                        }}
                      >
                        {formatoNota(m.nota3)}
                      </td>
                      <td
                        style={{
                          padding: '4px 6px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                          borderRight: '1px solid #90CAF9',
                          borderBottom: '1px solid #90CAF9',
                          fontSize: 11,
                          color: '#0D47A1'
                        }}
                      >
                        {m.definitiva.toFixed(1)}
                      </td>
                      <td
                        style={{
                          padding: '4px 6px',
                          textAlign: 'center',
                          borderRight: '1px solid #90CAF9',
                          borderBottom: '1px solid #90CAF9'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: desempenoBg,
                            color: desempenoColor,
                            fontWeight: 'bold',
                            fontSize: 9
                          }}
                        >
                          {desempeno}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '4px 6px',
                          textAlign: 'center',
                          borderBottom: '1px solid #90CAF9'
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 8px',
                            borderRadius: 10,
                            fontSize: 9,
                            fontWeight: 'bold',
                            background:
                              m.estado === 'APROBADA'
                                ? '#E8F5E9'
                                : m.estado === 'REPROBADA'
                                  ? '#FFEBEE'
                                  : '#FFF3E0',
                            color:
                              m.estado === 'APROBADA'
                                ? '#2E7D32'
                                : m.estado === 'REPROBADA'
                                  ? '#C62828'
                                  : '#E65100',
                            border: `1px solid ${m.estado === 'APROBADA' ? '#A5D6A7' : m.estado === 'REPROBADA' ? '#EF9A9A' : '#FFCC80'}`
                          }}
                        >
                          {configEstadoMateria[m.estado].label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── RESUMEN DE RENDIMIENTO ── */}
          <div style={{ padding: '0 24px 10px', display: 'flex', gap: 12 }}>
            {/* Métricas */}
            <div
              style={{
                flex: 1,
                border: '1.5px solid #1565C0',
                borderRadius: 6,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  background: '#1565C0',
                  color: 'white',
                  padding: '4px 10px',
                  fontWeight: 'bold',
                  fontSize: 9.5,
                  letterSpacing: 0.5
                }}
              >
                RESUMEN ACADÉMICO
              </div>
              <div style={{ display: 'flex', background: '#E3F2FD' }}>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRight: '1px solid #90CAF9',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ margin: 0, fontSize: 9, color: '#555', marginBottom: 2 }}>
                    PROMEDIO GENERAL
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 'bold', color: '#0D47A1' }}>
                    {detalle.promedioGeneral.toFixed(1)}
                  </p>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 'bold',
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: '#1565C0',
                      color: 'white'
                    }}
                  >
                    {getDesempeno(detalle.promedioGeneral)}
                  </span>
                </div>
                <div
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRight: '1px solid #90CAF9',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ margin: 0, fontSize: 9, color: '#555', marginBottom: 2 }}>
                    ASISTENCIA
                  </p>
                  <p style={{ margin: 0, fontSize: 22, fontWeight: 'bold', color: '#1B5E20' }}>
                    {detalle.inasistencia.porcentaje}%
                  </p>
                  <p style={{ margin: 0, fontSize: 8, color: '#555' }}>
                    {detalle.inasistencia.asistencias} / {detalle.inasistencia.totalClases} clases
                  </p>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 9, color: '#555', marginBottom: 2 }}>
                    AUSENCIAS
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: detalle.inasistencia.ausencias > 5 ? '#B71C1C' : '#333'
                    }}
                  >
                    {detalle.inasistencia.ausencias}
                  </p>
                  <p style={{ margin: 0, fontSize: 8, color: '#555' }}>clases perdidas</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── OBSERVACIONES ── */}
          <div style={{ padding: '0 24px 10px' }}>
            <div
              style={{
                border: '1.5px solid #1565C0',
                borderRadius: 6,
                overflow: 'hidden',
                minHeight: 70
              }}
            >
              <div
                style={{
                  background: '#1565C0',
                  color: 'white',
                  padding: '4px 10px',
                  fontWeight: 'bold',
                  fontSize: 9.5,
                  letterSpacing: 0.5
                }}
              >
                OBSERVACIONES DEL DIRECTOR DE GRUPO
              </div>
              <div
                style={{
                  padding: '8px 10px',
                  background: '#F8FBFF',
                  fontSize: 10.5,
                  lineHeight: 1.6
                }}
              >
                {detalle.observaciones || 'Sin observaciones registradas para este periodo.'}
              </div>
            </div>
          </div>

          {/* ── FIRMAS ── */}
          <div style={{ padding: '10px 24px 0', display: 'flex', justifyContent: 'space-around' }}>
            {['RECTOR(A)', 'DIRECTOR(A) DE GRUPO', 'ACUDIENTE / PADRE DE FAMILIA'].map((rol) => (
              <div key={rol} style={{ textAlign: 'center', width: '28%' }}>
                <div style={{ height: 40, borderBottom: '1.5px solid #1565C0', marginBottom: 4 }} />
                <p
                  style={{
                    margin: 0,
                    fontWeight: 'bold',
                    fontSize: 9,
                    color: '#1565C0',
                    letterSpacing: 0.5
                  }}
                >
                  {rol}
                </p>
              </div>
            ))}
          </div>

          {/* ── ESCALA VALORATIVA ── */}
          <div
            style={{
              margin: '14px 24px 12px',
              border: '1.5px solid #1565C0',
              borderRadius: 6,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: '#1565C0',
                color: 'white',
                padding: '3px 10px',
                fontWeight: 'bold',
                fontSize: 9,
                letterSpacing: 0.5
              }}
            >
              ESCALA DE VALORACIÓN NACIONAL — Decreto 1290
            </div>
            <div style={{ display: 'flex', background: '#E3F2FD' }}>
              {[
                {
                  label: 'SUPERIOR',
                  rango: '4.6 – 5.0',
                  bg: '#E8F5E9',
                  color: '#1B5E20',
                  border: '#A5D6A7'
                },
                {
                  label: 'ALTO',
                  rango: '4.0 – 4.5',
                  bg: '#E3F2FD',
                  color: '#0D47A1',
                  border: '#90CAF9'
                },
                {
                  label: 'BÁSICO',
                  rango: '3.0 – 3.9',
                  bg: '#FFF3E0',
                  color: '#E65100',
                  border: '#FFCC80'
                },
                {
                  label: 'BAJO',
                  rango: '1.0 – 2.9',
                  bg: '#FFEBEE',
                  color: '#B71C1C',
                  border: '#EF9A9A'
                }
              ].map((d) => (
                <div
                  key={d.label}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    textAlign: 'center',
                    borderRight: '1px solid #90CAF9'
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: d.bg,
                      color: d.color,
                      border: `1px solid ${d.border}`,
                      fontWeight: 'bold',
                      fontSize: 9,
                      marginBottom: 2
                    }}
                  >
                    {d.label}
                  </span>
                  <p style={{ margin: 0, fontSize: 9, color: '#333' }}>{d.rango}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BoletinViewModal;
