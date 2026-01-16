import { useState } from 'react';
import { KeenIcon } from '@/components';

interface RedeemTicketFormProps {
  codigoRedimir: string;
  onCodigoChange: (codigo: string) => void;
  onBuscar: () => void;
  loadingBusqueda: boolean;
  reservaEncontrada: any | null;
  cantidadRedimir: number;
  onCantidadChange: (cantidad: number) => void;
  onLimpiar: () => void;
}

const RedeemTicketForm = ({
  codigoRedimir,
  onCodigoChange,
  onBuscar,
  loadingBusqueda,
  reservaEncontrada,
  cantidadRedimir,
  onCantidadChange,
  onLimpiar
}: RedeemTicketFormProps) => {
  return (
    <>
      {/* Búsqueda de ticket */}
      <div className="rounded-xl shadow-sm p-6 space-y-4 border border-gray-100 bg-gradient-to-br  ">
        <div className="flex items-center gap-2 mb-4">
          <KeenIcon icon="barcode" className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-700">Buscar Ticket Reservado</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Ingresa el código del ticket reservado para proceder con su redención y pago.
        </p>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Código del ticket (Ej. B52VX1HFGF)"
            value={codigoRedimir}
            onChange={(e) => onCodigoChange(e.target.value.toUpperCase().trim())}
            className="flex-1 input p-3 border border-gray-300 rounded-md focus:ring-2   text-base font-mono"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && codigoRedimir) onBuscar();
            }}
            disabled={loadingBusqueda}
          />
          <button
            onClick={onBuscar}
            disabled={loadingBusqueda || !codigoRedimir}
            className="px-5 py-2 rounded-md bg-green-600 text-white transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {loadingBusqueda ? (
              <>
                <div className="w-4 h-4 border-2  border-t-transparent rounded-full animate-spin"></div>
                Buscando...
              </>
            ) : (
              <>
                <KeenIcon icon="magnifier" className="w-4 h-4" />
                Buscar
              </>
            )}
          </button>
        </div>

        {!reservaEncontrada && codigoRedimir && (
          <div className=" border border-gray-200 rounded-lg p-3 mt-3">
            <p className="text-xs text-gray-600 italic flex items-center gap-2">
              <KeenIcon icon="information-2" className="w-4 h-4" />
              Presiona <strong>Enter</strong> o el botón <strong>Buscar</strong> para consultar el
              ticket.
            </p>
          </div>
        )}
      </div>

      {/* Información de la reserva encontrada */}
      {reservaEncontrada && (
        <div className="rounded-xl shadow-lg border-2  p-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold text-green-800 flex items-center gap-2">
              <KeenIcon icon="verify" className="w-6 h-6" />
              Ticket Encontrado
            </h4>
            <span className="px-3 py-1   text-xs font-semibold rounded-full shadow-sm">
              {reservaEncontrada.estado}
            </span>
          </div>

          {/* Grid de información */}
          <div className="grid grid-cols-2 gap-4">
            <div className=" rounded-lg p-3 border  shadow-sm">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <KeenIcon icon="profile-circle" className="w-3 h-3" />
                Cliente
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {reservaEncontrada.tercero?.nombre}
              </p>
            </div>

            <div className=" rounded-lg p-3 border shadow-sm">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <KeenIcon icon="barcode" className="w-3 h-3" />
                Código
              </p>
              <p className="text-sm font-semibold text-gray-800 font-mono">
                {reservaEncontrada.codigo || codigoRedimir}
              </p>
            </div>

            <div className=" rounded-lg p-3 border  shadow-sm">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <KeenIcon icon="bus" className="w-3 h-3" />
                Viaje
              </p>
              <p className="text-sm font-semibold text-gray-800">
                #{reservaEncontrada.viaje?.numeroPlanillaViaje}
              </p>
            </div>

            <div className=" rounded-lg p-3 border  shadow-sm">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <KeenIcon icon="notepad" className="w-3 h-3" />
                Disponibles
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {reservaEncontrada.cantidad} ticket(s)
              </p>
            </div>
          </div>

          {/* Ruta si está disponible */}
          {reservaEncontrada.ruta && (
            <div className=" rounded-lg p-3 border  shadow-sm">
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <KeenIcon icon="route" className="w-3 h-3" />
                Ruta
              </p>
              <p className="text-sm font-semibold text-gray-800">{reservaEncontrada.ruta.nombre}</p>
            </div>
          )}

          {/* Campo para cantidad a redimir */}
          <div className="50 rounded-lg p-4 border shadow-sm">
            <label className=" text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <KeenIcon icon="tag" className="w-4 h-4 text-blue-600" />
              Cantidad a Redimir
            </label>
            <input
              type="number"
              value={cantidadRedimir}
              onChange={(e) =>
                onCantidadChange(
                  Math.max(1, Math.min(reservaEncontrada.cantidad, Number(e.target.value)))
                )
              }
              min="1"
              max={reservaEncontrada.cantidad}
              className="input p-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 text-base font-semibold text-center"
              placeholder="Cantidad"
            />
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <KeenIcon icon="information-2" className="w-3 h-3" />
              Máximo disponible: <strong>{reservaEncontrada.cantidad}</strong> ticket(s)
            </p>
          </div>

          {/* Botón limpiar */}
          <div className="flex justify-end">
            <button
              onClick={onLimpiar}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2 transition-colors"
            >
              <KeenIcon icon="eraser" className="w-4 h-4" />
              Limpiar búsqueda
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default RedeemTicketForm;