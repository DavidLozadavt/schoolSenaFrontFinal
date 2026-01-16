import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import Chart from 'react-apexcharts';
import axios from 'axios';
import { KeenIcon } from '@/components';

interface ProductoInterface {
  id: number;
  nombreProducto?: string;
  caracteristicas?: string;
}

interface HistorialPrecio {
  id: number;
  idProducto: number;
  valorCompra: number;
  ValorVenta: number;
  fechaActualizacion: string;
  producto: ProductoInterface;
}

interface HistorialProductoProps {
  producto: ProductoInterface;
  open: boolean;
  onClose: () => void;
}

const HistorialProducto: React.FC<HistorialProductoProps> = ({ producto, open, onClose }) => {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().split('T')[0]);
  const [datosPrecios, setDatosPrecios] = useState<HistorialPrecio[]>([]);
  const [chartOptions, setChartOptions] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar historial cada vez que cambie el producto, fechas o modal
  useEffect(() => {
    if (open && producto?.id) {
      fetchHistorialPrecio(producto.id);
    }
  }, [open, producto, fechaInicio, fechaFin]);

  const fetchHistorialPrecio = async (idProducto: number) => {
    setLoading(true);
    try {
      const { data } = await axios.get(`get_historial_precios/${idProducto}`);

      // Filtrar por fechas
      const filtrados = data.filter((item: HistorialPrecio) => {
        const cumpleInicio = fechaInicio ? item.fechaActualizacion >= fechaInicio : true;
        const cumpleFin = fechaFin ? item.fechaActualizacion <= fechaFin : true;
        return cumpleInicio && cumpleFin;
      });

      setDatosPrecios(filtrados);

      if (filtrados.length) {
        generarGrafica(filtrados);
      } else {
        setChartOptions(null);
      }
    } catch (error) {
      console.error('Error cargando historial de precios', error);
      setChartOptions(null);
    } finally {
      setLoading(false);
    }
  };

  const generarGrafica = (historial: HistorialPrecio[]) => {
    const labels = historial.map((item) => item.fechaActualizacion);
    const preciosCompra = historial.map((item) => Number(item.valorCompra));
    const preciosVenta = historial.map((item) => Number(item.ValorVenta));
    const productoData = historial[0]?.producto;

    setChartOptions({
      series: [
        { name: 'Precio de Compra', data: preciosCompra },
        { name: 'Precio de Venta', data: preciosVenta }
      ],
      chart: { type: 'line', height: 350, toolbar: { show: true } },
      xaxis: { categories: labels, title: { text: 'Fecha' } },
      yaxis: {
        min: Math.min(...preciosCompra, ...preciosVenta) - 5,
        max: Math.max(...preciosCompra, ...preciosVenta) + 5,
        title: { text: 'Precio' }
      },
      title: {
        text: `Histórico de Precios: ${productoData?.caracteristicas || productoData?.nombreProducto || 'Producto'}`,
        align: 'center',
        style: { fontSize: '16px', color: '#333' }
      },
      colors: ['#007bff', '#28a745'],
      dataLabels: { enabled: true },
      stroke: { curve: 'smooth', width: [3, 3] },
      markers: { size: 5 },
      tooltip: { enabled: true, shared: true, intersect: false }
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[95%] w-full h-[90vh] top-[5%] p-6 flex flex-col">
        <ModalHeader className="flex justify-between items-center mb-4">
          <ModalTitle>
            Historial de Precios: {producto.caracteristicas || producto.nombreProducto}
          </ModalTitle>
         <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
            <KeenIcon icon="cross" />
          </button>
        </ModalHeader>

        <ModalBody className="flex flex-1 gap-8 px-6">
          {/* Panel de fechas */}
          <div className="flex flex-col gap-4 w-64 shrink-0">
            <div>
              <label className="font-semibold">Fecha Inicio:</label>
              <input
                type="date"
                className="input w-full"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold">Fecha Fin:</label>
              <input
                type="date"
                className="input w-full"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          {/* Gráfica */}
          <div className="flex-1 flex justify-center items-center p-10 bg-gray-50 rounded-2xl shadow-lg min-w-[700px] mx-6">
            {loading ? (
              <p>Cargando historial...</p>
            ) : chartOptions ? (
              <Chart
                options={chartOptions}
                series={chartOptions.series}
                type="line"
                height={400}
                width="300%"
              />
            ) : (
              <p className="text-center text-gray-500">
                No hay datos para mostrar en este rango de fechas.
              </p>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default HistorialProducto;
