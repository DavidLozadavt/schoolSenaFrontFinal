import { SolicitudInscripcion } from '../solicitudInscripcionTypes';

interface Props {
  solicitud: SolicitudInscripcion;
  recibida: boolean;
  onRecibidaChange: (value: boolean) => void;
}

const Paso1RecibirInscripcion = ({ solicitud, recibida, onRecibidaChange }: Props) => (
  <div className="space-y-4">
    <h3 className="text-sm font-black uppercase text-gray-900 dark:text-white">
      Recibir inscripción
    </h3>
    <p className="text-xs text-gray-600 dark:text-gray-400">
      Confirme que la solicitud fue recibida y está lista para el proceso de validación administrativa.
    </p>

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase text-gray-500">Solicitud</span>
        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
          {solicitud.numeroSolicitud}
        </p>
        <p className="text-xs text-gray-500">{solicitud.fechaSolicitud}</p>
        {solicitud.numeroFactura && (
          <p className="text-xs text-primary">Factura {solicitud.numeroFactura}</p>
        )}
      </div>
      <div className="p-4 border border-gray-200 rounded-xl bg-white dark:bg-coal-500 dark:border-white/10">
        <span className="text-[10px] font-bold uppercase text-gray-500">Programa</span>
        <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{solicitud.nombrePrograma}</p>
        <p className="text-xs text-gray-500">{solicitud.codigoPrograma}</p>
      </div>
    </div>

    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer bg-white dark:bg-coal-500 dark:border-white/10">
      <input
        type="checkbox"
        checked={recibida}
        onChange={(e) => onRecibidaChange(e.target.checked)}
        className="mt-1 checkbox checkbox-sm"
      />
      <span className="text-sm text-gray-800 dark:text-gray-200">
        Confirmo que la solicitud de inscripción fue recibida y puede continuar el proceso de
        validación.
      </span>
    </label>
  </div>
);

export default Paso1RecibirInscripcion;
