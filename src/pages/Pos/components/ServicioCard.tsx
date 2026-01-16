import { ItemSeleccionado } from '../models/ProductoModel';
import { Servicio } from '../models/ServicioModel';

interface Props {
  servicio: Servicio;
  onAgregar: (item: Servicio) => void;
}

const ServicioCard = ({ servicio, onAgregar }: Props) => {
  return (
    <div className="flex flex-col p-4 text-center transition-shadow duration-200 border shadow-sm rounded-2xl hover:shadow-md">
      <div className="w-full h-40 mb-4">
        <img
          src={servicio.rutaServicioUrl}
          alt={servicio.nombre}
          className="object-cover w-full h-full rounded-xl"
        />
      </div>

      <h3 className="mb-1 text-lg font-semibold text-gray-800 truncate">{servicio.nombre}</h3>

      <p className="mb-3 text-sm text-gray-500">
        {Number(servicio.valor).toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP'
        })}
      </p>

      <button
        onClick={() => {
          onAgregar(servicio);
        }}
        className="w-full px-4 py-2 font-medium text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600"
      >
        Agregar
      </button>
    </div>
  );
};

export default ServicioCard;
