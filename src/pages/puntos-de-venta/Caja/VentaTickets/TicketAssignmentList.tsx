import { KeenIcon } from '@/components';
import { Tercero } from '../../models/TerceroInterface';

interface TicketAsignacion {
  numeroTicket: number;
  tercero: Tercero | null;
  identificacion: string;
}

interface TicketAssignmentListProps {
  asignacionTickets: TicketAsignacion[];
  cantidad: number;
  onIdentificacionChange: (numeroTicket: number, identificacion: string) => void;
  onAbrirFormularioTercero: (numeroTicket: number) => void;
  onAplicarATodos: (tercero: Tercero) => void;
}

const TicketAssignmentList = ({
  asignacionTickets,
  cantidad,
  onIdentificacionChange,
  onAbrirFormularioTercero,
  onAplicarATodos
}: TicketAssignmentListProps) => {
  const ticketsAsignados = asignacionTickets.filter((a) => a.tercero !== null).length;

  return (
    <div className="rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r ">
        <h3 className="text-base font-semibold text-gray-700 flex items-center gap-2">
          <KeenIcon icon="user" className="w-4 h-4" />
          2️⃣ Asignar Clientes ({ticketsAsignados}/{cantidad})
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Busca o crea el cliente para cada ticket.
        </p>
      </div>

      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {asignacionTickets.map((asignacion) => (
          <div
            key={asignacion.numeroTicket}
            className="border border-gray-200 rounded-lg p-4 transition-all hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              {/* Número del ticket */}
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600  rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                {asignacion.numeroTicket}
              </div>

              <div className="flex-1 space-y-3">
                {/* Input de búsqueda */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={asignacion.identificacion}
                    onChange={(e) =>
                      onIdentificacionChange(asignacion.numeroTicket, e.target.value)
                    }
                    placeholder="Documento del cliente"
                    className="flex-1 input p-2 border border-gray-300 rounded-md focus:ring-2  transition-all"
                  />
                  <button
                    onClick={() => onAbrirFormularioTercero(asignacion.numeroTicket)}
                    className="p-2 rounded-md bg-gray-100 text-blue-700 hover transition-colors shadow-sm"
                    title="Registrar nuevo cliente"
                  >
                    <KeenIcon icon="plus" className="w-4 h-4" />
                  </button>
                </div>

                {/* Información del cliente encontrado */}
                {asignacion.tercero ? (
                  <div className="border  rounded-md p-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <KeenIcon icon="check-circle" className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-semibold text-gray-800">
                            {asignacion.tercero.nombre}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600">
                          📄 {asignacion.tercero.identificacion}
                        </p>
                        {asignacion.tercero.email && (
                          <p className="text-xs text-gray-600">
                            ✉️ {asignacion.tercero.email}
                          </p>
                        )}
                        {asignacion.tercero.telefono && (
                          <p className="text-xs text-gray-600">
                            📞 {asignacion.tercero.telefono}
                          </p>
                        )}
                      </div>

                      {/* Botón "Aplicar a todos" solo en el primer ticket */}
                      {asignacion.numeroTicket === 1 && cantidad > 1 && (
                        <button
                          onClick={() => onAplicarATodos(asignacion.tercero!)}
                          className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                        >
                          <KeenIcon icon="copy" className="w-3 h-3" />
                          Aplicar a todos
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-start gap-2">
                      <KeenIcon icon="information-2" className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-xs text-yellow-700">
                        Cliente no encontrado. Ingrese un documento válido o cree uno nuevo usando el botón{' '}
                        <strong>+</strong>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Mensaje de ayuda si hay muchos tickets */}
        {cantidad > 3 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <div className="flex items-start gap-2">
              <KeenIcon icon="information-circle" className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> Asigna el primer cliente y usa el botón{' '}
                <strong>"Aplicar a todos"</strong> si todos los tickets son para la misma persona.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketAssignmentList;