import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Container } from '@/components/container';
import { useLayout } from '@/providers';
import { useLocation, useNavigate, useParams } from 'react-router';

import axios from 'axios';
import { ApexOptions } from 'apexcharts';
import Chart from 'react-apexcharts';
import { KeenIcon } from '@/components';
import clsx from 'clsx';
import { ModalRechazarPago } from './ModalRechazarPago';
import FileViewerModal from '@/components/file-viewer/FileViewerModal';

interface CardDetail {
  id: number;
  idCard: number;
  fechaInicial: string;
  fechaFinal: string;
  fechaCompletado: string;
  completado: number;
  estado: string;
  hora: string;
  created_at: string;
  updated_at: string;
}

interface Card {
  id: number;
  titulo: string;
  descripcion: string;
  idList: number;
  created_at: string;
  updated_at: string;
  idUser: number;
  card_details: CardDetail[];
}

interface ChekItemDetail {
  id: number;
  idCard: number;
  fechaInicial: string;
  fechaFinal: string;
  completado: number;
  estado: string;
  hora: string;
  created_at: string;
  updated_at: string;
}

interface ChekItem {
  id: number;
  titulo: string;
  descripcion: string;
  idList: number;
  created_at: string;
  updated_at: string;
  idUser: number;
  check_item_detail: ChekItemDetail;
}

interface ReportResponse {
  cards_count: number;
  check_items_count: number;
  cards: Card[];
  check_items: ChekItem[];
}

type Errors = {
  observacion?: string;
  file?: string;
};

const PagoPendientePage = () => {
  const { currentLayout } = useLayout();
  const [certificacion, setCertificacion] = useState<any>([]);
  const [pagosAdicionales, setPagosAdicionales] = useState<any>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalRechazar, setIsModalRechazar] = useState(false);
  const [isModalViewer, setIsModalViewer] = useState(false);
  const [isModalViewerPago, setIsModalViewerPago] = useState(false);
  const [response, setResponse] = useState<ReportResponse>();
  const [pago, setPago] = useState<any>();
  const [completado, setCompletado] = useState<any>();
  const [pending, setPending] = useState<any>();
  const navigate = useNavigate();
  const location = useLocation();
  const data = location.state;

  const tablesInfo: any = [
    { status: 'Tipo de Pago:', info: 'Pago de Nómina' },
    { status: 'Fecha de Pago:', info: pago?.fechaPago },
    { status: 'Valor del Pago:', info: `$${parseFloat(pago?.valor || 0).toFixed(2)}` },
    { status: 'Valor Adicional:', info: `$${parseFloat(pago?.excedente || 0).toFixed(2)}` },
    {
      status: 'Total a Pagar:',
      info: `$${(parseFloat(pago?.valor || 0) + parseFloat(pago?.excedente || 0)).toFixed(2)}`
    },
    { status: 'Estado:', info: pago?.estado?.estado }
  ];

  const renderItem = (table: any, index: number) => {
    return (
      <tr key={index}>
        <td className="text-sm text-gray-600 min-w-36 pb-5 pe-6">{table.status}</td>
        <td className="flex items-center gap-2.5 text-sm text-gray-800">{table.info}</td>
      </tr>
    );
  };

  const fechaPago = new Date(data?.fechaPago);
  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];
  const mes = meses[fechaPago?.getMonth()];
  const anio = fechaPago?.getFullYear();

  const fetchCertificacionBancaria = useCallback(async () => {
    const idContrato = data?.transaccion?.contratos[0]?.id;

    if (!data)
      if (!idContrato) {
        setError('El ID del contrato no está disponible');
        return;
      }

    setLoading(true);
    try {
      const response = await axios.get(`certificacion_bancaria/${idContrato}`);
      setCertificacion(response.data);
    } catch (error) {
      setError('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  }, [data]);

  const fetchPagosAdicionales = useCallback(async () => {
    const idContrato = data?.transaccion?.contratos[0]?.id;
    const idPago = data?.id;

    if (!data)
      if (!idContrato) {
        setError('El ID del contrato no está disponible');
        return;
      }

    setLoading(true);
    try {
      const response = await axios.get(`pagos_adicionales/${idContrato}/${idPago}`);
      setPagosAdicionales(response.data);
    } catch (error) {
      setError('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  }, [data]);

  const fetchPago = useCallback(async () => {
    const idPago = data?.id;

    if (!data || !idPago) {
      setError('El ID del pago no está disponible');
      return;
    }

    setLoading(true);
    try {
      const params = { idPago: idPago };
      const response = await axios.get('pago_by_id', { params });
      setPago(response.data);
    } catch (error) {
      setError('Error al cargar el pago');
    } finally {
      setLoading(false);
    }
  }, [data]);

  const [chartData, setChartData] = useState({
    series: [0, 0],
    labels: ['Completado', 'Pendiente']
  });

  const fetchReportMonth = useCallback(async () => {
    if (!data) return;
  
    setLoading(true);
    try {
      const payload = {
        fecha: data.fechaPago,
        idContrato: data.transaccion?.contratos[0]?.id
      };
      const response = await axios.post<ReportResponse>('get_report_month', payload);
  
      setResponse(response.data);
      let completadoCount = 0;
      let pendienteCount = 0;
  
      Object.values(response.data.cards).forEach((card) => {
        card.card_details.forEach((detail) => {
          if (detail.estado === 'COMPLETADO') {
            completadoCount++;
          } else if (detail.estado === 'ATRASADO' || detail.estado === 'POR VENCER') {
            pendienteCount++;
          }
        });
      });
  
    
      if (Array.isArray(response.data.check_items) && response.data.check_items.length > 0) {
        response.data.check_items.forEach((checkItem) => {
          const detail = checkItem.check_item_detail;
          if (detail?.estado === 'COMPLETADO') {
            completadoCount++;
          } else if (detail?.estado === 'ATRASADO' || detail?.estado === 'POR VENCER') {
            pendienteCount++;
          }
        });
      }
  
      setCompletado(completadoCount);
      setPending(pendienteCount);
  
      const total = completadoCount + pendienteCount;
      const completadoPercentage = total > 0 ? (completadoCount / total) * 100 : 0;
      const pendientePercentage = total > 0 ? (pendienteCount / total) * 100 : 0;
  
      
      setChartData({
        series: [completadoPercentage, pendientePercentage],
        labels: ['Completado', 'Pendiente']
      });
    } catch (error) {
      setError('Error al cargar el contrato');
    } finally {
      setLoading(false);
    }
  }, [data]);

  const [total, setTotal] = useState(0);
  const [chartKey, setChartKey] = useState(0);

  const options: ApexOptions = {
    labels: ['Completado', 'Pendiente'],
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        useSeriesColors: true
      },
      onItemClick: {
        toggleDataSeries: true
      }
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: '55%',
          labels: {
            show: true,
            name: { show: true },
            value: { show: true },
            total: {
              show: true,
              showAlways: true,
              formatter: function () {
                return total.toString();
              }
            }
          }
        }
      }
    }
  };

  const series = [response?.cards_count || 0, response?.check_items_count || 0];

  useEffect(() => {
    if (response) {
      const updatedTotal = response.cards_count + response.check_items_count;
      setTotal(updatedTotal);

      setChartKey((prevKey) => prevKey + 1);
    }
  }, [response]);

  const handleAfterSave = () => {
    fetchPago();
  };

  const handleToggle = async (pagoId: number, hasAdditionalPayment: boolean) => {
    try {
      const response = await axios.post('update_valor_adicional', {
        idPago1: data?.id,
        idPago2: pagoId,
        checkboxMarcado: !hasAdditionalPayment
      });
      fetchPagosAdicionales();
      fetchPago();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const [observacion, setObservacion] = useState('');
  const [file, setFile] = useState<File | null>(null); 
  const [errors, setErrors] = useState<Errors>({});

  const handleSubmit = async () => {
    const newErrors: Errors = {};

    if (!observacion) newErrors.observacion = 'La observación es requerida.';
    if (!file) newErrors.file = 'Debe adjuntar un archivo.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = new FormData();
    formData.append('informacion', observacion);
    if (file) {
      formData.append('rutaComprobanteFile', file);
    }
    if (data) {
      formData.append('idPersona', data?.transaccion?.contratos[0]?.persona?.id);
    }
    if (data) {
      formData.append('idPago', data?.id);
    }

    try {
      const response = await axios.post('pago_mensual', formData);
      setObservacion('');
      setFile(null);
      const fileInput = document.getElementById('file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      fetchPago();
    } catch (error) {
      console.error('Error al enviar:', error);
    }
  };

  const handleObservacionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setObservacion(value);
    if (value && errors.observacion) {
      setErrors((prev) => ({ ...prev, observacion: undefined }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileSelected = e.target.files?.[0] || null;
    setFile(fileSelected);
    if (fileSelected && errors.file) {
      setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  useEffect(() => {
    if (!data) {
      navigate('/gestion-contratos/pagos-pendientes');
    }
  }, [data, navigate]);

  useEffect(() => {
    setObservacion('');
    setFile(null);
    fetchPago();
    fetchCertificacionBancaria();
    fetchReportMonth();
    fetchPagosAdicionales();
  }, [fetchCertificacionBancaria, fetchReportMonth, fetchPagosAdicionales, fetchPago]);

  return (
    <Fragment>
      {currentLayout?.name === 'demo1-layout' && (
        <Container>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-7.5">
            <div className="col-span-2">
              <div className="flex flex-col gap-5 lg:gap-7.5">
                <div className="card h-full">
                  <div className="card-header flex-wrap gap-2">
                    <h3 className="card-title">
                      Informe Mensual, Mes de {mes} {anio}
                    </h3>
                  </div>

                  <div className="flex flex-wrap xl:flex-nowrap items-start justify-between gap-6 md:gap-4 p-4.5">
                    <div className="flex flex-col items-start gap-3 p-6 xl:w-[65%]">
                      <p className="text-sm font-normal text-gray-700 leading-5.5 mb-2.5">
                        <span className="italic">
                          {data?.transaccion?.contratos[0]?.persona?.nombre1}{' '}
                          {data?.transaccion?.contratos[0]?.persona?.nombre2}{' '}
                          {data?.transaccion?.contratos[0]?.persona?.apellido1}{' '}
                          {data?.transaccion?.contratos[0]?.persona?.apellido2}
                        </span>{' '}
                        ha completado un total de <strong>{completado}</strong> tareas entre
                        checklist y tarjetas, correspondiente al{' '}
                        <strong>{chartData.series[0].toFixed(2)}%</strong> de las tareas asignadas
                        en el mes de <strong>{mes}</strong> del <strong>{anio}</strong>, dejando
                        como no terminadas o pendientes un total de <strong> {pending}</strong>,
                        correspondiente al <strong> {chartData.series[1].toFixed(2)}%</strong> de
                        las asignaciones.
                      </p>

                      <p className="text-sm font-normal text-gray-700 leading-5.5 mb-2.5">
                      {response?.cards && Object.values(response.cards).length > 0 && (
  <div>
    <h4 className="text-md font-bold">Tarjetas:</h4>
    {Object.values(response.cards).map((card) => (
                              <div key={card.id} className="mb-3">
                                <h5 className="font-semibold">{card.titulo}</h5>
                                <p
                                  className="text-justify"
                                  dangerouslySetInnerHTML={{ __html: card.descripcion }}
                                />
                                {card.card_details && card.card_details.length > 0 && (
                                  <div>
                                    <h6 className="text-sm font-medium">Detalles de la Tarjeta:</h6>
                                    {card.card_details.map((detail) => (
                                      <div key={detail.id}>
                                        <p className="text-justify">
                                          <strong>Fecha inicial:</strong> {detail.fechaInicial}
                                        </p>

                                        {detail?.fechaCompletado && (
                                          <p>
                                            <strong>Fecha Completado:</strong>{' '}
                                            {detail?.fechaCompletado}
                                          </p>
                                        )}
                                        <p className="text-justify">
                                          <strong>Estado:</strong>
                                          <span
                                            className={clsx('badge badge-outline ml-3', {
                                              'badge-primary': detail.estado === 'COMPLETADO',
                                              'badge-danger': detail.estado !== 'COMPLETADO'
                                            })}
                                          >
                                            {detail.estado}
                                          </span>
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

{response?.check_items && Object.values(response.check_items).length > 0 && (
  <div>
    <h4 className="text-md font-bold">CheckList:</h4>
    {Object.values(response.check_items).map((checkItem) => (
                              <div key={checkItem.id} className="mb-3">
                                <h5 className="font-semibold">{checkItem.descripcion}</h5>
                                {checkItem.check_item_detail && (
                                  <div>
                                    <h6 className="text-sm font-medium">Detalle del CheckItem:</h6>
                                    <p className="text-justify">
                                      <strong>Fecha final:</strong>{' '}
                                      {checkItem.check_item_detail.fechaFinal}
                                    </p>

                                    {checkItem.check_item_detail?.fechaFinal && (
                                      <p className="text-justify">
                                        <strong>Fecha completado:</strong>{' '}
                                        {checkItem.check_item_detail?.fechaFinal}
                                      </p>
                                    )}
                                    <p className="text-justify">
                                      <strong>Estado:</strong>
                                      <span
                                        className={clsx('badge badge-outline ml-3', {
                                          'badge-primary':
                                            checkItem.check_item_detail.estado === 'COMPLETADO',
                                          'badge-danger':
                                            checkItem.check_item_detail.estado !== 'COMPLETADO'
                                        })}
                                      >
                                        {checkItem.check_item_detail.estado}
                                      </span>
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-col items-start xl:w-[35%]">
                      <div>
                        <h4 className="font-bold text-center">Gráfico de Tareas</h4>

                        <Chart
                          key={chartKey}
                          options={options}
                          series={chartData.series}
                          type="donut"
                          width="300"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {pago?.idEstado !== 5 && (
                  <div className="card">
                    <div className="card-header" id="delete_account">
                      <h3 className="card-title">Confirmar Pago</h3>
                    </div>

                    <div className="card-body lg:py-7.5 lg:gap-7.5 gap-5">
                      <div className="flex flex-col gap-5">
                        <div className="text-sm text-gray-800">
                          Tras analizar el desempeño mensual de{' '}
                          {data?.transaccion?.contratos[0]?.persona?.nombre1}{' '}
                          {data?.transaccion?.contratos[0]?.persona?.apellido1}, puede proceder a
                          realizar el pago por un valor de $
                          {(
                            parseFloat(pago?.valor || 0) + parseFloat(pago?.excedente || 0)
                          ).toFixed(2)}{' '}
                          o, en su defecto, rechazarlo y agregar una observación para su revisión.
                        </div>

                        <label className="mb-3">
                          <textarea
                            name="pago"
                            id="pago"
                            rows={2}
                            className="textarea"
                            placeholder="Observación"
                            value={observacion}
                            onChange={handleObservacionChange}
                          ></textarea>
                          {errors.observacion && (
                            <p className="text-red-500 text-sm">{errors.observacion}</p>
                          )}
                        </label>

                        <label className="mb-3">
                          <input
                            type="file"
                            name="file"
                            id="file"
                            className="file-input"
                            onChange={handleFileChange}
                          />
                          {errors.file && <p className="text-red-500 text-sm">{errors.file}</p>}
                        </label>
                      </div>

                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => {
                            setIsModalRechazar(true);
                          }}
                          className="btn btn-danger"
                        >
                          Rechazar Pago
                        </button>
                        <button onClick={handleSubmit} className="btn btn-primary">
                          Confirmar Pago
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-1">
              <div className="flex flex-col gap-5 lg:gap-7.5">
                <div className="card grow">
                  <div className="card-header">
                    <h3 className="card-title">Información del Pago</h3>
                  </div>

                  <div className="card-body pt-4 pb-3">
                    <table className="table-auto">
                      <tbody>
                        {tablesInfo.map((table: any, index: any) => {
                          return renderItem(table, index);
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card grow">
                  <div className="card-header">
                    <h3 className="card-title">Pagos Adicionales</h3>

                    {/* <button className="btn btn-sm btn-light">Nuevo</button> */}
                  </div>
                  <div className="p-[2px]">
                    <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Detalle</th>
                          <th>Valor</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagosAdicionales.length > 0 ? (
                          pagosAdicionales.map((item: any, index: any) =>
                            item.transaccion?.pago?.map((pagoAdicional: any, pagoIndex: any) => (
                              <tr key={`${index}-${pagoIndex}`}>
                                <td>{pagoAdicional.id}</td>
                                <td className="max-w-[100px] break-words whitespace-normal">
              {pagoAdicional.observacion}
            </td>
                                <td>{pagoAdicional.valor}</td>
                                <td className="text-center">
                                  <label className="switch">
                                    <input
                                      disabled={pago?.idEstado === 5}
                                      type="checkbox"
                                      checked={pagoAdicional.hasAdditionalPayment}
                                      onChange={() =>
                                        handleToggle(
                                          pagoAdicional.id,
                                          pagoAdicional.hasAdditionalPayment
                                        )
                                      }
                                    />
                                    <span className="slider round"></span>
                                  </label>
                                </td>
                              </tr>
                            ))
                          )
                        ) : (
                          <tr>
                            <td colSpan={4} className="text-center">
                              No hay pagos disponibles.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card grow">
                  <div className="card-header">
                    <h3 className="card-title">Certficación Bancaria</h3>
                  </div>

                  <div className="p-[14px]">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between flex-wrap border border-gray-200 rounded-md gap-1 px-4 py-4 bg-secondary-clarity">
                        <div className="flex items-center">
                          <div
                            className="flex flex-col"
                            onClick={() => {
                              if (certificacion[0]?.rutaFileUrl) {
                                setIsModalViewer(true);
                              } else {
                                console.error('La URL del archivo no está disponible');
                              }
                            }}
                          >
                            <a
                              href="#"
                              className="text-sm font-medium hover:text-primary text-gray-900"
                            >
                              Certificación Bancaria
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (certificacion[0]?.rutaFileUrl) {
                              setIsModalViewer(true);
                            } else {
                              console.error('La URL del archivo no está disponible');
                            }
                          }}
                          className="btn btn-sm btn-icon btn-outline btn-success "
                        >
                          <KeenIcon icon="arrow-up-right" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>


                {pago?.idEstado === 5 && (
                <div className="card grow">
                  <div className="card-header">
                    <h3 className="card-title">Comprobante de Pago</h3>
                  </div>

                  <div className="p-[14px]">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between flex-wrap border border-gray-200 rounded-md gap-1 px-4 py-4 bg-secondary-clarity">
                        <div className="flex items-center">
                          <div
                            className="flex flex-col"
                            onClick={() => {
                              if (pago?.rutaComprobanteUrl) {
                                setIsModalViewerPago(true);
                              } else {
                                console.error('La URL del archivo no está disponible');
                              }
                            }}
                          >
                            <a
                              href="#"
                              className="text-sm font-medium hover:text-primary text-gray-900"
                            >
                              Comprobante de Pago
                            </a>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (pago?.rutaComprobanteUrl) {
                              setIsModalViewerPago(true);
                            } else {
                              console.error('La URL del archivo no está disponible');
                            }
                          }}
                          className="btn btn-sm btn-icon btn-outline btn-success "
                        >
                          <KeenIcon icon="arrow-up-right" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
    )}
              </div>
            </div>
          </div>
        </Container>
      )}
      <style>
        {`
          .apexcharts-legend {
            display: flex;
            flex-direction: row; 
            justify-content: center; 
            flex-wrap: wrap; 
          }

          .apexcharts-legend-series {
            margin: 0 10px;
          }
        `}
      </style>

      <ModalRechazarPago
        open={isModalRechazar}
        onClose={() => {
          setIsModalRechazar(false);
        }}
        pago={data}
        onSave={handleAfterSave}
      />

      <FileViewerModal
        open={isModalViewer}
        onClose={() => setIsModalViewer(false)}
        fileUrl={certificacion[0]?.rutaFileUrl}
        fileName={'Certficación Bancaria'}
      />
        <FileViewerModal
        open={isModalViewerPago}
        onClose={() => setIsModalViewerPago(false)}
        fileUrl={pago?.rutaComprobanteUrl	}
        fileName={'Comprobante de Pago'}
      />
    </Fragment>
  );
};

export { PagoPendientePage };
