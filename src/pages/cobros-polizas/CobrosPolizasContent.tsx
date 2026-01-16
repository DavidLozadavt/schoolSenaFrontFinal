import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';
import { ColumnDef } from '@tanstack/react-table';
import axios from 'axios';
import clsx from 'clsx';
import { TipoAfiliacionInterface } from '../afiliacion-vehiculos/models/TipoAfiliacionInterface';
import { ModalCobrosPolizas } from './ModalCobrosPolizas';

interface ContentProps {
  reload: boolean;
}

const CobrosPolizasContent = ({ reload }: ContentProps) => {
  const StorageFilteredId = 'filtered_asociados_admin';
  const [asociadosAdmin, setAsociadosAdmin] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(StorageFilteredId) || '';
  });
  const [tipoAfiliaciones, setTipoAfiliaciones] = useState<TipoAfiliacionInterface[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedData, setSelectedData] = useState<any[]>([]);
  const [selectedTipoFilter, setSelectedTipoFilter] = useState<string>('');
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      const response = await axios.get('get_asociados_admin');
      setAsociadosAdmin(response.data);
    } catch (err) {
      setError(`Error fetching ahorros tercero: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchTipoAfiliacion = async () => {
    try {
      const response = await axios.get('tipo_afiliaciones');
      setTipoAfiliaciones(response.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTipoAfiliacion();
  }, [reload]);

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map((item) => item.id)));
    }
  };

  const handleSelectByTipo = (tipo: string) => {
    const itemsOfType = filteredData.filter(
      (item) => (item.afiliacion?.tipo_afiliacion[0]?.tipoAfiliacion || 'Sin tipo') === tipo
    );
    const idsOfType = new Set(itemsOfType.map((item) => item.id));

    // Check if all items of this type are already selected
    const allSelected = itemsOfType.every((item) => selectedRows.has(item.id));

    const newSelected = new Set(selectedRows);
    if (allSelected) {
      // Deselect all of this type
      idsOfType.forEach((id) => newSelected.delete(id));
    } else {
      // Select all of this type
      idsOfType.forEach((id) => newSelected.add(id));
    }
    setSelectedRows(newSelected);
  };

  const handleSaveSelection = () => {
    const selected = filteredData.filter((item) => selectedRows.has(item.id));
    setSelectedData(selected);
    console.log('Datos seleccionados:', selected);
    console.log('Agrupados por tipo de afiliación:', groupByTipoAfiliacion(selected));
  };

  const resetSelections = () => {
    setSelectedRows(new Set());
    setSelectedData([]);
    setSelectedTipoFilter('');
    setSearchTerm('');
  };

  const groupByTipoAfiliacion = (data: any[]) => {
    return data.reduce(
      (acc, item) => {
        const tipo = item.afiliacion?.tipo_afiliacion[0]?.tipoAfiliacion || 'Sin tipo';
        if (!acc[tipo]) {
          acc[tipo] = [];
        }
        acc[tipo].push(item);
        return acc;
      },
      {} as Record<string, any[]>
    );
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={selectedRows.size === filteredData.length && filteredData.length > 0}
            onChange={handleSelectAll}
          />
        ),
        cell: (info) => (
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={selectedRows.has(info.row.original.id)}
            onChange={() => handleSelectRow(info.row.original.id)}
          />
        ),
        enableSorting: false,
        meta: { className: 'w-[50px]' }
      },
      {
        accessorFn: (row) => row.id,
        id: 'id',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => <span className="text-gray-700">{info.row.original.id}</span>,
        meta: { className: 'w-[100px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.tercero?.nombre,
        id: 'nombreTercero',
        header: () => 'Nombre Propietario',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.tercero?.nombre || 'N/A'}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.tercero?.identificacion,
        id: 'identificacionTercero',
        header: () => 'Identificación Propietario',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.tercero?.identificacion || 'N/A'}
          </Link>
        ),
        meta: { className: 'min-w-[250px]', cellClassName: 'text-gray-700 font-normal' }
      },

      {
        accessorFn: (row) => row.vehiculo?.placa,
        id: 'placaVehiculo',
        header: () => 'Placa Vehiculo',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.vehiculo?.placa || 'N/A'}
          </Link>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      },
      {
        accessorFn: (row) => row.tipoAfiliacion,
        id: 'tipoAfiliacion',
        header: () => 'Tipo Afiliación',
        enableSorting: true,
        cell: (info) => (
          <Link
            className="text-sm font-medium leading-none text-gray-900 hover:text-primary"
            to="#"
          >
            {info.row.original.afiliacion?.tipo_afiliacion[0].tipoAfiliacion || 'N/A'}
          </Link>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-normal' }
      }
    ],
    [selectedRows]
  );

  const filteredData = useMemo(() => {
    if (!searchTerm) return asociadosAdmin;
    return asociadosAdmin.filter((asociadoAdmin) => {
      const nombreTercero = asociadoAdmin.tercero?.nombre?.toLowerCase() || '';
      const identificacionTercero = asociadoAdmin.tercero?.identificacion?.toLowerCase() || '';
      const placa = asociadoAdmin.vehiculo?.placa?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();

      return (
        nombreTercero.includes(searchLower) ||
        identificacionTercero.includes(searchLower) ||
        placa.includes(searchLower)
      );
    });
  }, [searchTerm, asociadosAdmin]);

  const tipoAfiliacionGroups = useMemo(() => {
    const groups: Record<string, { count: number; selected: number; items: any[] }> = {};

    filteredData.forEach((item) => {
      const tipo = item.afiliacion?.tipo_afiliacion[0]?.tipoAfiliacion || 'Sin tipo';
      if (!groups[tipo]) {
        groups[tipo] = { count: 0, selected: 0, items: [] };
      }
      groups[tipo].count++;
      groups[tipo].items.push(item);
      if (selectedRows.has(item.id)) {
        groups[tipo].selected++;
      }
    });

    return groups;
  }, [filteredData, selectedRows]);

  const displayData = useMemo(() => {
    if (!selectedTipoFilter) return filteredData;
    return filteredData.filter(
      (item) =>
        (item.afiliacion?.tipo_afiliacion[0]?.tipoAfiliacion || 'Sin tipo') === selectedTipoFilter
    );
  }, [filteredData, selectedTipoFilter]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Generar cuentas de polizas</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 leading-none text-gray-500 -translate-y-1/2 text-md top-1/2"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, placa o identificación"
              className="pl-8 input input-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="min-w-[200px]">
            <select
              className="select select-sm w-full"
              value={selectedTipoFilter}
              onChange={(e) => setSelectedTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos ({filteredData.length})</option>
              {Object.entries(tipoAfiliacionGroups).map(([tipo, data]) => (
                <option key={tipo} value={tipo}>
                  {tipo} ({data.count}){data.selected > 0 ? ` - ${data.selected} ✓` : ''}
                </option>
              ))}
            </select>
          </div>

          {selectedRows.size > 0 && (
            <div className="flex items-center gap-3">
              <button
                disabled={selectedRows.size === 0}
                className="btn btn-sm btn-primary"
                onClick={() => {
                  setOpenModal(true);
                  handleSaveSelection();
                }}
              >
                <KeenIcon icon="check" className="text-base" />
                Generar cuentas de cobro
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="px-1.5 py-2 mb-2 border-b border-gray-200">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              <KeenIcon icon="abstract-26" className="text-xs mr-1" />
              Selección Masiva por Tipo
            </label>
            <select
              className="select select-sm w-full"
              onChange={(e) => {
                if (e.target.value) {
                  handleSelectByTipo(e.target.value);
                  e.target.value = '';
                }
              }}
            >
              <option value="">Seleccionar todos de un tipo...</option>
              {Object.entries(tipoAfiliacionGroups).map(([tipo, data]) => {
                const allSelected = data.selected === data.count;
                const someSelected = data.selected > 0 && data.selected < data.count;
                return (
                  <option key={tipo} value={tipo}>
                    {allSelected ? '☑' : someSelected ? '◐' : '☐'} {tipo} ({data.count})
                    {data.selected > 0 ? ` - ${data.selected} ya seleccionados` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Resumen</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(tipoAfiliacionGroups).map(([tipo, data]) => {
                if (data.selected === 0) return null;
                const percentage = ((data.selected / data.count) * 100).toFixed(0);
                return (
                  <div
                    key={tipo}
                    className="badge badge-sm badge-primary"
                    title={`${tipo}: ${data.selected} de ${data.count} seleccionados`}
                  >
                    {tipo.substring(0, 10)}
                    {tipo.length > 10 ? '...' : ''}: {data.selected}/{data.count}
                  </div>
                );
              })}
              {Object.values(tipoAfiliacionGroups).every((data) => data.selected === 0) && (
                <span className="text-xs text-gray-500 italic">Sin selecciones</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        <DataGrid
          key={JSON.stringify(displayData)}
          columns={columns}
          data={displayData}
          pagination={{ size: 10 }}
          sorting={[{ id: 'nombreTercero', desc: false }]}
        />

        <ModalCobrosPolizas
          open={openModal}
          onClose={() => {
            setOpenModal(false);
          }}
          data={selectedData}
          onSave={() => {
            resetSelections();
          }}
        />
      </div>
    </div>
  );
};
export { CobrosPolizasContent };
