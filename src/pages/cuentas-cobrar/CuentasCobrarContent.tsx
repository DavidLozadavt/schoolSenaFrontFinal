import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';

import { useConfirm } from '@/hooks';

import Spinner from '@/components/loaders/Spinner';
import { ModalInformacionPago } from './ModalInformacionPago';
import { ModalPagoTransferencia } from './ModalPagoTransferencia';
import { useSnackbar } from 'notistack';
import { ModalTransferenciaAbonoCuentaCobrar } from './ModalTransferenciaAbonoCuentaCobrar';

const CuentasCobrarContent = () => {
  const storageFilterId = 'cuentasXC-filter';
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpenPago, setIsModalOpenPago] = useState(false);
  const [isModalOpenInformacionPago, setIsModalOpenInformacionPago] = useState(false);
  const [isModalOpenTransferenciaAbono, setIsModalOpenTransferenciaAbono] = useState(false);
  const [cuenta, setCuenta] = useState<any | undefined>(undefined);
  const { confirmAction } = useConfirm();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const { enqueueSnackbar } = useSnackbar();

  const fetchCuentasPendientes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('cuentas_pendientes');
      setCuentas(response.data);
    } catch (error) {
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCuentaCobro = useCallback(
    async (idTransaccion: string, idTercero: string) => {
      try {
        setLoading(true);
        const response = await axios.post(
          `generar_cuenta_cobro_cxc/${idTransaccion}/${idTercero}`,
          {},
          { responseType: 'blob' }
        );

        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `cuenta_cobro_${idTransaccion}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(url);
        fetchCuentasPendientes();
      } catch (error) {
        console.error('Error al generar el PDF:', error);
      } finally {
        setLoading(false);
      }
    },
    [fetchCuentasPendientes]
  );

  // const pagoEfectivo = async (cuenta: any) => {
  //   try {
  //     const id = cuenta.retencionNO.id;
  //     const idPagoRetencion = cuenta.retencionSI.id;
  //     const idPagoCompleto = cuenta.retencionNull.id;
  //     const email = cuenta.retencionNO.transaccion.contratosCliente[0].tercero.email;
  //     const idContrato = cuenta.retencionNO.transaccion.contratosCliente[0].id;

  //     const formData = new FormData();
  //     formData.append('idPago', id + '');
  //     formData.append('idPagoRetencion', idPagoRetencion + '');
  //     formData.append('idPagoCompleto', idPagoCompleto + '');
  //     formData.append('idContrato', idContrato + '');
  //     formData.append('email', email + '');

  //     const response = await axios.post('store_comprobante_pago_efectivo', formData);
  //     enqueueSnackbar('Pago exitoso', {
  //       variant: 'success'
  //     });

  //     fetchCuentasPendientes();
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error al procesar el pago:', error);
  //     throw error;
  //   }
  // };

  // const handleConfirm = (cuenta?: any) => {
  //   if (!cuenta) return;

  //   const mensaje = `¿Estás seguro que deseas realizar un pago en efectivo por un valor de
  //     ${cuenta.retencionNO.valor} correspondiente al ${cuenta.retencionNO.porcentaje}% de
  //     ${cuenta.retencionNO.transaccion.contratosCliente[0].descripcion}?`;

  //   confirmAction(mensaje, () => pagoEfectivo(cuenta));
  // };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.transacciones[0].valor,
        id: 'valor',
        header: () => 'Valor',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-CO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(info.row.original?.transacciones[0]?.valor)}
          </span>
        ),
        meta: {
          className: 'w-[120px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row?.transacciones[0]?.faltante,
        id: 'faltante',
        header: () => 'Valor Restante',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {new Intl.NumberFormat('es-CO', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(info.row?.original?.transacciones[0]?.faltante)}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.detalles,
        id: 'detalles',
        header: () => 'Detalle',
        enableSorting: true,
        cell: (info) => (
          <div className="text-gray-700">
            {info.row.original.detalles?.map((detalle: any, index: number) => (
              <div key={index} className="mb-1">
                • {detalle.detalle}
              </div>
            ))}
          </div>
        ),

        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.tercero,
        id: 'tercero',
        header: () => 'Tercero',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original?.tercero?.nombre}</span>,
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaRegistro,
        id: 'fechaRegistro',
        header: () => 'Fecha de Registro',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.transacciones[0]?.fechaTransaccion} -{' '}
            {info.row.original.transacciones[0]?.hora}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        accessorFn: (row) => row.fechaCobro,
        id: 'fechaCobro',
        header: () => 'Ultima Fecha de Cobro',
        enableSorting: true,
        cell: (info) => (
          <span className="text-gray-700">
            {info.row.original.transacciones[0]?.fechaCobro || 'Aún no se registra fecha'}
          </span>
        ),
        meta: {
          className: 'min-w-[150px]',
          cellClassName: 'text-gray-700 font-normal'
        }
      },
      {
        id: 'cuentaCobro',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              title="Generar cuenta de cobro"
              className="btn btn-sm btn-icon btn-clear btn-light"
              onClick={() => {
                handleCuentaCobro(row.original.transacciones[0].id, row.original.tercero.id);
              }}
            >
              <KeenIcon icon="bill" />
            </button>
          </div>
        ),
        meta: { className: 'w-[60px]' }
      },

      {
        id: 'pay',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            title="Abono de Pago"
            onClick={() => {
              setIsModalOpenTransferenciaAbono(true);
              setCuenta(row.original);
            }}
            className="btn btn-sm btn-icon btn-clear btn-light"
          >
            <KeenIcon icon="dollar" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'info',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            title="Información del Pago"
            onClick={() => {
              setIsModalOpenInformacionPago(true);
              setCuenta(row.original);
            }}
            className="btn btn-sm btn-icon btn-clear btn-light"
          >
            <KeenIcon icon="information-2" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    fetchCuentasPendientes();
  }, [fetchCuentasPendientes]);

  const handleAfterSave = () => {
    fetchCuentasPendientes();
    setIsModalOpenPago(false);
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return cuentas;

    return cuentas.filter((data) => {
      const valor = data.retencionNO.valor?.toLowerCase() || '';
      const nombre =
        data.retencionNO.transaccion?.contratosCliente?.[0]?.tercero?.nombre?.toLowerCase() || '';
      const fechaCobro = data.retencionNO.fechaCobro ? data.retencionNO.fechaCobro.toString() : '';

      return (
        valor.includes(searchTerm.toLowerCase()) ||
        nombre.includes(searchTerm.toLowerCase()) ||
        fechaCobro.includes(searchTerm.toLowerCase())
      );
    });
  }, [searchTerm, cuentas]);

  return (
    <div className="card card-grid min-w-full">
      {loading && <Spinner />}
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Cuentas Por Cobrar</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar Cuentas Por Cobrar"
              className="input input-sm pl-8"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <div className="card-body">
        <DataGrid
          key={JSON.stringify(filteredData)}
          columns={columns}
          data={filteredData}
          pagination={{ size: 10 }}
        />
      </div>

      <ModalPagoTransferencia
        open={isModalOpenPago}
        onClose={() => {
          setIsModalOpenPago(false);
          setCuenta(undefined);
        }}
        data={cuenta}
        onSave={handleAfterSave}
      />

      <ModalInformacionPago
        open={isModalOpenInformacionPago}
        onClose={() => {
          setIsModalOpenInformacionPago(false);
          setCuenta(undefined);
        }}
        data={cuenta}
      />

      <ModalTransferenciaAbonoCuentaCobrar
        open={isModalOpenTransferenciaAbono}
        onClose={() => {
          setIsModalOpenTransferenciaAbono(false);
          setCuenta(undefined);
        }}
        data={cuenta}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { CuentasCobrarContent };
