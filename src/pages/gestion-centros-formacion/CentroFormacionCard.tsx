import { KeenIcon } from '@/components';

/* Interfaces */
interface Ciudad {
  id: number;
  descripcion: string;
}

interface Empresa {
  id: number;
  razonSocial: string;
  rutaLogoUrl?: string;
}

interface CentrosFormacion {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  subdirector: string;
  ciudad?: Ciudad | null;
  empresa?: Empresa | null;
}

interface Props {
  centro: CentrosFormacion;
  onEdit: () => void;
  onInfo?: () => void;
}

/* Componente */
const CentroFormacionCard: React.FC<Props> = ({ centro, onEdit }) => {
  return (
    <div
      className="
        group relative w-full overflow-hidden rounded-2xl
        border border-gray-200 bg-white
        shadow-sm hover:shadow-xl hover:shadow-blue-500/10
        transition-all duration-300 ease-out
        hover:-translate-y-1
      "
    >
      {/* HEADER */}
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        <img
          src={centro.empresa?.rutaLogoUrl ?? 'https://via.placeholder.com/400x200?text=Centro'}
          alt={centro.empresa?.razonSocial}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/400x200?text=Centro+de+Formación';
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Ciudad */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-700 shadow backdrop-blur">
            <i className="ki-outline ki-geolocation text-xs text-blue-600" />
            {centro.ciudad?.descripcion ?? 'SIN CIUDAD'}
          </span>
        </div>

        {/* Nombre */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-base font-extrabold uppercase leading-snug text-white drop-shadow-md line-clamp-2">
            {centro.nombre}
          </h3>
          <p className="text-[10px] text-gray-200 uppercase tracking-wide">
            {centro.empresa?.razonSocial}
          </p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 flex flex-col h-[420px]">
        {/* INFO */}
        <div className="space-y-3 text-xs flex-1 overflow-hidden">
          <InfoRow
            icon="user-square"
            color="blue"
            label="Subdirector"
            value={centro.subdirector}
          />
          <InfoRow
            icon="sms"
            color="green"
            label="Correo"
            value={centro.correo}
          />
          <InfoRow
            icon="phone"
            color="purple"
            label="Teléfono"
            value={centro.telefono}
          />
          <InfoRow
            icon="map"
            color="green"
            label="Dirección"
            value={centro.direccion}
            multiline
          />
        </div>

        {/* ACCIONES */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            title="Editar"
            onClick={onEdit}
            className="flex items-center justify-center h-8 bg-blue-100/40 text-blue-600 rounded-lg hover:border hover:border-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        </div>

        {/* CTA */}
        <button className="w-full py-2 text-xs font-bold uppercase bg-primary text-white rounded-lg hover:bg-primary-active transition-colors">
          Ver detalle del centro →
        </button>
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
  multiline = false
}: {
  icon: string;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'red';
  multiline?: boolean;
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <i className={`ki-outline ki-${icon} text-sm`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p
          className={`
            font-bold text-gray-700 leading-snug
            ${multiline ? 'line-clamp-2' : 'truncate'}
          `}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

export default CentroFormacionCard;
