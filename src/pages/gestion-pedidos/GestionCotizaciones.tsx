import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Container } from '@/components/container';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import GetCotizacion from '../gestion-pedidos/modales/GetCotizacion';

interface Cliente {
  nombre1?: string;
  apellido1?: string;
  [key: string]: any;
}

interface Cotizacion {
  idCotizacion: string;
  cliente: Cliente;
  fecha: string;
  subtotal: number;
  totalProductos: number;
  estado: string;
  detalles: RawItem[];
}

/** Tipo para cada fila cruda que viene del backend */
type RawItem = {
  idCotizacion?: string | number;
  id?: string | number;
  valorUnitario?: string | number;
  cantidad?: string | number;
  cliente?: any;
  user?: { persona?: any };
  updated_at?: string;
  fecha?: string;
  estado?: string;
  producto?: any;
  [key: string]: any;
};

const GestionCotizaciones: React.FC = () => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState<Cotizacion | null>(null);
  const [showCotizacion, setShowCotizacion] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [pageActual, setPageActual] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalCotizaciones, setTotalCotizaciones] = useState(0);

  const [loading, setLoading] = useState(false);

  // DEBOUNCE SEARCH
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // FETCH PRINCIPAL — SE TRAE LAS COTIZACIONES AGRUPADAS
  const fetchCotizaciones = useCallback(
    async (page = 1) => {
      if (loading) return;
      setLoading(true);

      try {
        const response = await axios.get(
          `/get_cotizaciones?search=${encodeURIComponent(debouncedSearch)}&per_page=${perPage}&page=${page}`
        );

        const respData = response.data || {};
        let raw: RawItem[] = [];

        // puede venir array o objeto
        if (Array.isArray(respData.data)) {
          raw = respData.data as RawItem[];
        } else if (respData.data && typeof respData.data === 'object') {
          // Object.values puede devolver array de arrays, por eso usamos flat
          raw = Object.values(respData.data).flat() as RawItem[];
        }

        // AGRUPAR igual que Angular
        const agrupado = raw.reduce((acc: Record<string, RawItem[]>, item: RawItem) => {
          const id = String(item.idCotizacion ?? item.id ?? '');
          if (!acc[id]) acc[id] = [];
          acc[id].push(item);
          return acc;
        }, {});

        // MAPEAR igual que Angular
        const mapped: Cotizacion[] = Object.keys(agrupado).map((id) => {
          const detalles = agrupado[id];
          const head = detalles[0];

          const subtotal = detalles.reduce((acc: number, item: RawItem) => {
            const valor = Number(item.valorUnitario ?? 0);
            const cant = Number(item.cantidad ?? 0);
            return acc + valor * cant;
          }, 0);

          const totalProductos = detalles.reduce((acc: number, item: RawItem) => {
            return acc + Number(item.cantidad ?? 0);
          }, 0);

          return {
            idCotizacion: id,
            cliente: (head?.cliente ?? head?.user?.persona ?? {}) as Cliente,
            fecha: head?.updated_at ?? head?.fecha ?? '',
            subtotal,
            totalProductos,
            estado: head?.estado ?? 'PENDIENTE',
            detalles
          };
        });

        setCotizaciones(mapped);
        setTotalCotizaciones(respData.total ?? mapped.length);
        setTotalPaginas(respData.last_page ?? 1);
        setPageActual(respData.current_page ?? page);

      } catch (err) {
        console.error('Error cargando cotizaciones:', err);
        setCotizaciones([]);
        setTotalCotizaciones(0);
        setTotalPaginas(1);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, perPage]
  );

  useEffect(() => {
    fetchCotizaciones(1);
  }, [debouncedSearch, perPage, fetchCotizaciones]);

  // ABRIR MODAL — CARGAR COTIZACIÓN COMPLETA
  const abrirModalCotizacion = async (c: Cotizacion) => {
    try {
      setLoading(true);

      const response = await axios.get('/get_cotizacion', {
        params: { query: c.idCotizacion }
      });

      const items = (response.data ?? []) as RawItem[];

      if (!Array.isArray(items) || items.length === 0) {
        setCotizacionSeleccionada(c);
        setShowCotizacion(true);
        return;
      }

      const head = items[0];

      // 🔥 NORMALIZACIÓN DEL CLIENTE AQUÍ
      const cliente =
        head.cliente ||
        head.user?.persona ||
        c.cliente || 
        {};

      const cotizacionFormateada: Cotizacion = {
        idCotizacion: String(head.idCotizacion ?? c.idCotizacion),
        cliente,
        subtotal: items.reduce((acc: number, item: RawItem) =>
          acc + Number(item.valorUnitario ?? 0) * Number(item.cantidad ?? 0)
        , 0),
        detalles: items,
        fecha: head.updated_at ?? head.fecha ?? c.fecha ?? '',
        totalProductos: items.reduce((acc: number, item: RawItem) =>
          acc + Number(item.cantidad ?? 0)
        , 0),
        estado: head.estado ?? c.estado ?? 'PENDIENTE'
      };

      setCotizacionSeleccionada(cotizacionFormateada);
      setShowCotizacion(true);

    } catch (error) {
      console.error('Error cargando la cotización completa:', error);

      setCotizacionSeleccionada(c);
      setShowCotizacion(true);
    } finally {
      setLoading(false);
    }
  };

  const cerrarModal = () => {
    setCotizacionSeleccionada(null);
    setShowCotizacion(false);
  };

  // COLUMNAS DEL DATAGRID
  const columns: ColumnDef<Cotizacion>[] = useMemo(
    () => [
      { accessorKey: 'idCotizacion', header: 'Número de Cotización' },

      {
        id: 'cliente',
        header: 'Cliente',
        accessorFn: (row) =>
          `${row.cliente?.nombre1 ?? ''} ${row.cliente?.apellido1 ?? ''}`.trim()
      },

      {
        accessorKey: 'fecha',
        header: 'Fecha',
        cell: (info) =>
          info.getValue()
            ? new Date(info.getValue() as string).toLocaleString('es-CO', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
            : ''
      },

      { accessorKey: 'totalProductos', header: 'Productos' },

      {
        accessorKey: 'subtotal',
        header: 'Subtotal',
        cell: (info) =>
          (info.getValue() as number).toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP'
          })
      },

      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: (info) => {
          const estado = info.getValue() as string;
          let clase = '';

          if (estado === 'PENDIENTE') clase = 'bg-warning';
          else if (estado === 'FINALIZADO') clase = 'bg-success';
          else if (['ENVIADO', 'ENVIO CLIENTE', 'ENVIO GRATIS'].includes(estado))
            clase = 'bg-primary';
          else if (['GARANTIA', 'RECHAZADO'].includes(estado))
            clase = 'bg-danger';

          return <span className={`badge text-white px-3 py-2 ${clase}`}>{estado}</span>;
        }
      },

      {
        id: 'acciones',
        header: 'Acciones',
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-light-primary flex items-center gap-1"
            onClick={() => abrirModalCotizacion(row.original)}
          >
            <KeenIcon icon="eye" className="text-primary" />
            Ver cotización
          </button>
        )
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Container>
      <div className="card card-grid min-w-full">
        <div className="card-header flex-wrap py-5">
          <h3 className="card-title">Gestión de Cotizaciones</h3>

          <div className="flex gap-6">
            <div className="relative">
              <KeenIcon icon="magnifier" className="absolute top-1/2 left-0 -translate-y-1/2 ml-3 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar..."
                className="input input-sm pl-8"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageActual(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-10">Cargando cotizaciones...</div>
          ) : (
            <DataGrid columns={columns} data={cotizaciones} />
          )}
        </div>
      </div>

      <GetCotizacion
        open={showCotizacion}
        cotizacion={cotizacionSeleccionada}
        onClose={cerrarModal}
      />
    </Container>
  );
};

export default GestionCotizaciones;