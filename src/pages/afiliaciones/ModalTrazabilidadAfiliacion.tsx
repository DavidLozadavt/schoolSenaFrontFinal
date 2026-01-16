import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { useSnackbar } from 'notistack';
import Spinner from '@/components/loaders/Spinner';
import ApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { AfiliacionEstadoInterface } from './models/AfiliacionEstadoInterface';

interface ModalProps {
  open: boolean;
  data?: any;
  onClose: () => void;
  onSave?: () => void;
}

const ModalTrazabilidadAfiliacion = ({ open, data, onClose, onSave }: ModalProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [trazabilidad, setTrazabilidad] = useState<AfiliacionEstadoInterface[]>([]);

  const fechas = trazabilidad.map((item) => item.fechaInicial);
  const dias = trazabilidad.map((item) => item.diasTranscurridos);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tab1');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const fetchTrazabilidad = useCallback(async () => {
    if (!data?.id) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`get_observaciones_by_id/${data?.id}`);
      setTrazabilidad(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [data?.id]);

  const filteredTrazabilidad = trazabilidad.filter((item) =>
    Object.values(item).some(
      (value) => value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = fechas
    .map((fecha, index) => ({ fecha, dias: dias[index] }))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const fechasOrdenadas = sortedData.map((item) => item.fecha);
  const diasOrdenados = sortedData.map((item) => item.dias);

  const options: ApexOptions = {
    series: [
      {
        name: 'Días Transcurridos',
        data: diasOrdenados
      }
    ],
    chart: {
      height: 250,
      type: 'area',
      toolbar: { show: false }
    },
    xaxis: {
      categories: fechasOrdenadas,
      title: {
        text: 'Fecha Inicial',
        style: { color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }
      },
      labels: {
        style: { colors: '#6b7280', fontSize: '12px' }
      }
    },
    yaxis: {
      title: {
        text: 'Días Transcurridos',
        style: { color: '#6b7280', fontSize: '14px', fontWeight: 'bold' }
      },
      labels: {
        formatter: (value) => `${value} días`,
        style: { colors: '#6b7280', fontSize: '12px' }
      }
    },
    grid: {
      strokeDashArray: 4,
      borderColor: '#6b7280'
    },
    tooltip: {
      custom({ series, seriesIndex, dataPointIndex }) {
        return `
    <div class="p-3.5">
      <div class="font-medium text-2sm text-gray-600">
        Fecha: ${fechasOrdenadas[dataPointIndex]}
      </div>
      <div class="font-semibold text-md text-gray-900">
        ${series[seriesIndex][dataPointIndex]} días
      </div>
    </div>
  `;
      }
    }
  };

  useEffect(() => {
    fetchTrazabilidad();
  }, [fetchTrazabilidad]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[950px] top-[5%] p-4">
        <ModalHeader>
          <ModalTitle>Cambios de estado de la vinculación</ModalTitle>
          <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>
        <ModalBody className="grid gap-3 px-0 py-2">
          {loading && <Spinner />}
          <div>
            <div className="tabs mb-5 flex">
              <button
                className={`tab px-4 py-2 ${activeTab === 'tab1' ? 'active ' : ''}`}
                onClick={() => handleTabChange('tab1')}
              >
                Trazabilidad de estados de la vinculación
              </button>
              <button
                className={`tab px-4 py-2 ${activeTab === 'tab2' ? 'active' : ''}`}
                onClick={() => handleTabChange('tab2')}
              >
                Grafico de trazabilidad de la vinculación
              </button>
            </div>

            <div>
              {activeTab === 'tab1' && (
                <div id="tab_1" className="p-2">
                  {loading ? (
                    <p className="text-gray-500">Cargando...</p>
                  ) : trazabilidad.length > 0 ? (
                    <div className="card card-grid min-w-full">
                      {loading && <Spinner />}
                      <div className="card-header flex-wrap py-2 justify-end">
                        <div className="flex gap-6">
                          <div className="relative">
                            <KeenIcon
                              icon="magnifier"
                              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
                            />
                            <input
                              type="text"
                              placeholder="Buscar Trazabilidad"
                              className="input input-sm pl-8"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="card-table">
                        <table className="table table-border align-middle text-gray-700 font-medium text-sm">
                          <thead>
                            <tr>
                              <th className="px-4 py-2">Código</th>
                              <th className="px-4 py-2">Fecha</th>
                              <th className="px-4 py-2">Fecha Final</th>
                              <th className="px-4 py-2">Observación</th>
                              <th className="px-4 py-2">Días Transcurridos</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTrazabilidad.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2">{item.id}</td>
                                <td className="px-4 py-2">{item.fechaInicial}</td>
                                <td className="px-4 py-2">{item.fechaFinal}</td>
                                <td className="px-4 py-2">{item.observacion}</td>
                                <td className="px-4 py-2">{item.diasTranscurridos}</td>
                              </tr>
                            ))}
                            {filteredTrazabilidad.length === 0 && (
                              <tr>
                                <td colSpan={5} className="text-center py-4 text-gray-500">
                                  No se encontraron resultados
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <p className="p-4 text-center text-gray-500">
                      No hay observaciones disponibles.
                    </p>
                  )}
                </div>
              )}
              {activeTab === 'tab2' && trazabilidad.length > 0 && (
                <div id="tab_2" className="p-2">
                  <div className="card h-full">
                    <div className="card-header flex-wrap gap-2">
                      <h3 className="card-title">Gráfico de Trazabilidad</h3>
                    </div>

                    <div className="card-body flex flex-col justify-end items-stretch grow px-3 py-1">
                      <ApexChart
                        id="trazabilidad_chart"
                        options={options}
                        series={options.series}
                        type="area"
                        height="250"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalTrazabilidadAfiliacion };
