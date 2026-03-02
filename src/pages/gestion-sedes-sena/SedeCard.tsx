interface Ciudad {
  id: number;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
  rutaLogoUrl?: string;
}

interface Sede {
  id: number;
  nombre: string;
  jefeInmediato?: string | null;
  descripcion?: string | null;
  direccion?: string | null;
  email?: string | null;
  telefono?: string | null;
  celular?: string | null;
  ciudad?: Ciudad | null;
  empresa?: Empresa | null;
  urlImagen: string;
  rutaFotoUrl: string;
}

interface Props {
  sede: Sede;
  onEdit: () => void;
  onInfo?: () => void;
  onDelete?: () => void;
}

const SedeCard: React.FC<Props> = ({ sede, onEdit, onDelete, onInfo }) => {
  return (
    <div
      className="
        group relative w-full overflow-hidden rounded-2xl
        border border-gray-200 
        shadow-sm hover:shadow-xl hover:shadow-blue-500/10
        transition-all duration-300 ease-out
        hover:-translate-y-1
      "
    >
      {/* HEADER */}
      <div className="relative h-40">
        <img
          src={sede.rutaFotoUrl}
          alt={sede.empresa?.razonSocial || 'Sede'}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Ciudad */}
        <div className="absolute top-3 right-3">
          <span
            className="
            inline-flex items-center gap-1.5
            rounded-full px-3 py-1
            text-[10px] font-bold uppercase tracking-wide text-gray-700
            shadow backdrop-blur bg-white/90
          "
          >
            <i className="ki-outline ki-geolocation text-xs text-blue-600" />
            {sede.ciudad?.descripcion || 'SIN CIUDAD'}
          </span>
        </div>

        {/* Nombre */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3
            className="
            text-base font-extrabold uppercase leading-snug
            text-white drop-shadow-md line-clamp-2
          "
          >
            {sede.nombre}
          </h3>
          <p className="text-xs text-white/90 mt-1">{sede.empresa?.razonSocial || 'Sin empresa'}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 space-y-4">
        <div className="space-y-3 text-xs flex-1 overflow-hidden">
          <InfoRow
            icon="user-square"
            color="blue"
            label="Jefe inmediato"
            value={sede.jefeInmediato || 'No asignado'}
            isEmpty={!sede.jefeInmediato}
          />
          <InfoRow
            icon="phone"
            color="purple"
            label="Teléfono"
            value={sede.telefono || 'No asignado'}
            isEmpty={!sede.telefono}
          />
          <InfoRow
            icon="phone"
            color="purple"
            label="Celular"
            value={sede.celular || 'No asignado'}
            isEmpty={!sede.celular}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 mt-4">
          <button
            onClick={onInfo}
            title="Editar"
            className="flex items-center justify-center w-full h-8 text-blue-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <i className="text-sm ki-outline ki-eye"></i>
          </button>
        </div>

        {/* ACCIONES */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={onEdit}
            title="Editar"
            className="flex items-center justify-center w-full h-8 text-blue-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <i className="text-sm ki-outline ki-arrows-loop"></i>
          </button>

          <button
            title="Eliminar"
            onClick={onDelete}
            className="flex items-center justify-center w-full h-8 text-red-600 border border-transparent rounded-lg dark:text-red-300 bg-red-100/30 dark:bg-red-500/10 hover:border-red-500 hover:scale-105 active:scale-95 transition-all"
          >
            <i className="text-sm ki-outline ki-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

/* Subcomponente reutilizable */
const InfoRow = ({
  icon,
  label,
  value,
  color,
  multiline = false,
  isEmpty = false
}: {
  icon: string;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'red';
  multiline?: boolean;
  isEmpty?: boolean;
}) => {
  const colors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <i className={`ki-outline ki-${icon} text-sm`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p
          className={`
            font-bold leading-snug
            ${multiline ? 'line-clamp-2 break-words' : 'truncate'}
            ${
              isEmpty
                ? 'text-gray-400 dark:text-gray-500 italic'
                : 'text-gray-700 dark:text-gray-200'
            }
          `}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default SedeCard;
