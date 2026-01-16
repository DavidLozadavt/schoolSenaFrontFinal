import React, { useEffect, useState, useMemo } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon, DataGrid } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface ModalTransaccionesProps {
  open: boolean;
  onClose: () => void;
  idCaja: number | null;
  tipo: 'efectivo' | 'transferencias' | 'gastos';
  onTotalCalculated?: (total: number, hasData: boolean) => void;
}

interface Transaccion {
  id: number;
  codigo?: string;
  fechaTransaccion: string;
  valor: number;
  descripcion?: string;
  [key: string]: any;
}

const ModalTransacciones: React.FC<ModalTransaccionesProps> = ({
  open,
  onClose,
  idCaja,
  tipo,
  onTotalCalculated
}) => {
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const titulosModal = {
    efectivo: 'Transacciones en Efectivo',
    transferencias: 'Transacciones por Transferencias',
    gastos: 'Transacciones de Gastos'
  };

  const endpoints = {
    efectivo: 'transacciones_efectivo',
    transferencias: 'transacciones_transferencias',
    gastos: 'transacciones_gastos'
  };

  useEffect(() => {
    if (open && idCaja) {
      fetchTransacciones();
    }
  }, [open, idCaja, tipo]);

  const fetchTransacciones = async () => {
    if (!idCaja) return;

    setLoading(true);
    try {
      const response = await axios.get(`${endpoints[tipo]}/${idCaja}`);
      console.log('Respuesta del backend:', response.data); // Para debug
      const data = response.data || [];
      setTransacciones(data);
      
      // Calcular el total y notificar al componente padre
      if (onTotalCalculated) {
        const total = data.reduce((acc: number, item: any) => {
          const valor = item.valor || item.monto || item.total || 0;
          const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
          return acc + (valorNumerico || 0);
        }, 0);
        onTotalCalculated(total, data.length > 0);
      }
    } catch (error: any) {
      console.error('Error al cargar transacciones:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Error al cargar las transacciones',
        { variant: 'error' }
      );
      // Notificar que no hay datos
      if (onTotalCalculated) {
        onTotalCalculated(0, false);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fechaString: any) => {
    if (!fechaString) return 'Sin fecha';
    
    try {
      let fecha: Date;
      
      if (typeof fechaString === 'string' && fechaString.includes(' ')) {
        fecha = new Date(fechaString.replace(' ', 'T'));
      } else {
        fecha = new Date(fechaString);
      }
      
      if (isNaN(fecha.getTime())) {
        console.log('Fecha inválida:', fechaString);
        return 'Sin fecha';
      }
      
      return fecha.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.log('Error al formatear fecha:', error, fechaString);
      return 'Sin fecha';
    }
  };

  const formatValor = (valor: any) => {
    const valorNumerico = typeof valor === 'string' ? parseFloat(valor) : valor;
    
    if (!valorNumerico && valorNumerico !== 0) {
      console.log('Valor inválido:', valor);
      return '$0';
    }
    
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valorNumerico);
  };

  const columnsEfectivo = useMemo<ColumnDef<Transaccion>[]>(
    () => [
      {
        accessorFn: (row) => row.fecha || row.created_at || row.fechaTransaccion,
        id: 'fecha',
        header: 'Fecha',
        cell: (info) => {
          const fechaFormateada = formatFecha(info.getValue());
          return <span className="text-sm">{fechaFormateada}</span>;
        },
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorFn: (row) => row.valor || row.monto || row.total,
        id: 'valor',
        header: 'Valor',
        cell: (info) => {
          const valorFormateado = formatValor(info.getValue());
          return <span className="font-semibold text-green-600">{valorFormateado}</span>;
        },
        meta: { className: 'min-w-[120px]' }
      }
    ],
    []
  );

  const columnsConCodigo = useMemo<ColumnDef<Transaccion>[]>(
    () => [
      {
        accessorFn: (row) => row.codigo || row.id || row.numeroTransaccion,
        id: 'codigo',
        header: 'Código',
        cell: (info) => <span className="font-medium">{info.getValue() as string}</span>,
        meta: { className: 'min-w-[120px]' }
      },
      {
        accessorFn: (row) => row.fecha || row.created_at || row.fechaTransaccion,
        id: 'fecha',
        header: 'Fecha',
        cell: (info) => {
          const fechaFormateada = formatFecha(info.getValue());
          return <span className="text-sm">{fechaFormateada}</span>;
        },
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorFn: (row) => row.valor || row.monto || row.total,
        id: 'valor',
        header: 'Valor',
        cell: (info) => {
          const valorFormateado = formatValor(info.getValue());
          return <span className="font-semibold text-green-600">{valorFormateado}</span>;
        },
        meta: { className: 'min-w-[120px]' }
      },
      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <button
              className="btn btn-sm btn-icon btn-clear btn-light"
              title="Ver detalles"
              onClick={() => {
                console.log('Ver detalles:', row.original);
              }}
            >
              <KeenIcon icon="eye" />
            </button>
          </div>
        ),
        meta: { className: 'w-[100px]' }
      }
    ],
    []
  );

  const columns = tipo === 'efectivo' ? columnsEfectivo : columnsConCodigo;

  const totalValor = useMemo(() => {
    const total = transacciones.reduce((sum, t) => {
      const valor = typeof t.valor === 'string' ? parseFloat(t.valor) : t.valor;
      return sum + (valor || 0);
    }, 0);
    console.log('Total calculado:', total, 'de transacciones:', transacciones);
    return total;
  }, [transacciones]);

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-[800px] top-[5%]">
        <ModalHeader className="p-5">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              
              <div>
                <ModalTitle className="text-lg font-bold">{titulosModal[tipo]}</ModalTitle>
                <p className="text-xs opacity-70 mt-1">
                  Total de transacciones: {transacciones.length}
                </p>
              </div>
            </div>
            <button className="btn btn-sm btn-icon btn-light btn-clear" onClick={onClose}>
              <KeenIcon icon="cross" className="w-5 h-5" />
            </button>
          </div>
        </ModalHeader>

        <ModalBody className="p-5 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="flex flex-col items-center gap-3">
                <KeenIcon icon="arrows-circle" className="animate-spin w-8 h-8" />
                <p className="text-sm opacity-70">Cargando transacciones...</p>
              </div>
            </div>
          ) : transacciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <KeenIcon icon="information-5" className="w-12 h-12 opacity-30 mb-3" />
              <p className="text-sm opacity-70">No hay transacciones registradas</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="card card-grid">
                <div className="card-body p-0">
                  <DataGrid
                    columns={columns}
                    data={transacciones}
                    pagination={{ size: 10 }}
                    sorting={[{ id: 'fecha', desc: true }]}
                  />
                </div>
              </div>

              {/* Resumen */}
              <div className="border rounded-lg p-4 flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatValor(totalValor)}
                </span>
              </div>
            </div>
          )}
        </ModalBody>

        <div className="border-t p-5 flex justify-end">
          <button className="btn btn-light" onClick={onClose}>
           
            Cerrar
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default ModalTransacciones;
