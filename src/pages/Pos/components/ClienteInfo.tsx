import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Cliente } from '../models/ClienteModel';
import { Container } from '@/components';
import ModalClienteNuevo from './ModalClienteNuevo';

interface ClienteInfoProps {
  cliente?: Cliente | null;
  setCliente?: React.Dispatch<React.SetStateAction<Cliente | null>>;
  recargarClientes?: boolean;
}

const ClienteInfo = ({ cliente, setCliente, recargarClientes }: ClienteInfoProps) => {
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showModalNuevoCliente, setshowModalNuevoCliente] = useState(false);

  // Usar cliente del padre cuando esté disponible
  const clienteActual = cliente;

  useEffect(() => {
    const buscarCliente = async () => {
      if (!telefono) {
        if (setCliente) setCliente(null);
        setError('');
        return;
      }

      setCargando(true);
      try {
        const res = await axios.get('/buscar_tercero', {
          params: {
            telefono: telefono,
            identificacion: telefono
          }
        });

        const clienteEncontrado: Cliente = {
          id: res.data.id,
          nombre: res.data.nombre,
          email: res.data.email,
          direccion: res.data.direccion
        };

        if (setCliente) setCliente(clienteEncontrado);
        setError('');
      } catch (err) {
        if (setCliente) setCliente(null);
        setError('Cliente no encontrado');
      } finally {
        setCargando(false);
      }
    };

    const delayDebounce = setTimeout(buscarCliente, 600);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telefono]);

  useEffect(() => {
    setTelefono('');
    setError('');
  }, [recargarClientes]);

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar cliente (Teléfono/Identificación)..."
            className="input input-sm w-full pl-9"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
        </div>
        <button
          onClick={() => setshowModalNuevoCliente(true)}
          className="btn btn-sm btn-primary flex items-center gap-1 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo
        </button>
      </div>

      {cargando && <p className="text-xs text-gray-500 mb-2 ml-1">Buscando cliente...</p>}
      {error && !cargando && <p className="text-xs text-red-500 mb-2 ml-1">{error}</p>}

      {clienteActual ? (
        <div className="border border-gray-200 rounded-lg p-3">
          <div className="mb-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              Cliente
            </span>
            <div className="font-medium text-gray-900 text-sm truncate">{clienteActual.nombre}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Email
              </span>
              <div className="text-xs text-gray-600 truncate" title={clienteActual.email}>
                {clienteActual.email || '-'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Dirección
              </span>
              <div className="text-xs text-gray-600 truncate" title={clienteActual.direccion}>
                {clienteActual.direccion || '-'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        !cargando &&
        !error && (
          <div className="text-center py-4 text-gray-400 text-xs italic border border-dashed border-gray-300 rounded-lg">
            Busque un cliente para comenzar la venta si no se usará un cliente por defecto
          </div>
        )
      )}

      <Container>
        <ModalClienteNuevo
          open={showModalNuevoCliente}
          onClose={() => setshowModalNuevoCliente(false)}
          onSave={() => {}}
        />
      </Container>
    </div>
  );
};

export { ClienteInfo };
