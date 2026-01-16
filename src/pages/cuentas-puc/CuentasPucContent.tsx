import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { DataGrid, KeenIcon } from '@/components';

import { useConfirm } from '@/hooks';
import { ModalCuentasPuc } from './ModalCuentasPuc';
import { useSnackbar } from 'notistack';

interface cuentasTypeProps {
  reload: boolean;
}

const CuentasPucContent = ({ reload }: cuentasTypeProps) => {
    const { enqueueSnackbar } = useSnackbar();
  const StorageFilteredId = 'filtered_cuentas_puc';
  const [subCuentasPropias, setSubCuentasPropias] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subCuentaSeleccionada, setSubCuentaSeleccionada] = useState<any | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(StorageFilteredId) || '');

  const { confirmAction } = useConfirm();

  useEffect(() => {
    localStorage.setItem(StorageFilteredId, searchTerm);
  }, [searchTerm]);

  const fetchSubcuentasPropias = async () => {
    try {
      const response = await axios.get('subcuentas_propias');
      setSubCuentasPropias(response.data);
    } catch (err) {
      setError(`Error al cargar los datos: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteCuenta = async (id: number | undefined) => {
    try {
      await axios.delete(`delete_subcuenta_propia/${id}`);
      fetchSubcuentasPropias();
    } catch (err) {
      enqueueSnackbar('Error al guardar eliminar', {
            variant: 'error'
          });
    }
  };

  const handleAfterSave = () => {
    fetchSubcuentasPropias();
    setIsModalOpen(false);
  };

  useEffect(() => {
    fetchSubcuentasPropias();
  }, [reload]);

  const handleDelete = (id?: number) => {
    confirmAction('Esta acción eliminará la cuenta', () => deleteCuenta(id));
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'nombreSubcuentaPropia',
        header: () => 'Nombre Subcuenta Propia',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        accessorKey: 'codigo',
        header: () => 'Código',
        enableSorting: true,
        cell: (info) => (
          <span className="text-sm font-medium text-gray-900">{info.getValue() as string}</span>
        ),
        meta: { className: 'min-w-[150px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        id: 'nombreSubcuenta',
        header: () => 'Nombre Subcuenta',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-gray-900">
            {row.original.subCuenta?.nombreSubcuenta || ''}
          </span>
        ),
        meta: { className: 'min-w-[200px]', cellClassName: 'text-gray-700 font-medium' }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => {
              setSubCuentaSeleccionada(row.original);
              setIsModalOpen(true);
            }}
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      },
      {
        id: 'delete',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-sm btn-icon btn-clear btn-light"
            onClick={() => handleDelete(row.original.id)}
          >
            <KeenIcon icon="trash" />
          </button>
        ),
        meta: { className: 'w-[60px]' }
      }
    ],
    /* eslint-disable react-hooks/exhaustive-deps */
    []
  );
  const filteredData = useMemo(() => {
    if (!searchTerm) return subCuentasPropias;

    return subCuentasPropias.filter((e) => {
      const term = searchTerm.toLowerCase();
      const nombrePropia = e.nombreSubcuentaPropia?.toLowerCase() || '';
      const codigo = e.codigo?.toLowerCase() || '';
      const nombreSubCuenta = e.subCuenta?.nombreSubcuenta?.toLowerCase() || '';

      return nombrePropia.includes(term) || nombreSubCuenta.includes(term) || codigo.includes(term);
    });
  }, [searchTerm, subCuentasPropias]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-w-full card card-grid">
      <div className="flex-wrap py-5 card-header">
        <h3 className="card-title">Cuentas Plan Único de Cuentas</h3>
        <div className="flex gap-6">
          <div className="relative">
            <KeenIcon
              icon="magnifier"
              className="absolute left-0 ml-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              placeholder="Buscar cuenta..."
              className="pl-8 input input-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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

      <ModalCuentasPuc
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSubCuentaSeleccionada(undefined);
        }}
        data={subCuentaSeleccionada}
        onSave={handleAfterSave}
      />
    </div>
  );
};

export { CuentasPucContent };
