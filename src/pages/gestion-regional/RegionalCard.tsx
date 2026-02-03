import { KeenIcon } from '@/components';

interface Props {
  regional: any;
  onEdit: any;
  onInfo: any;
}

const RegionalCard: React.FC<Props> = ({ regional, onEdit, onInfo }) => {
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
          src={regional.rutaLogoUrl}
          alt={regional.razonSocial}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://via.placeholder.com/400x200?text=Regional';
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Ciudad */}
        <div className="absolute top-3 right-3">
          <span
            className="
            inline-flex items-center gap-1.5
            rounded-full bg-white/90 px-3 py-1
            text-[10px] font-bold uppercase tracking-wide text-gray-700
            shadow backdrop-blur
          "
          >
            <i className="ki-outline ki-geolocation text-xs text-blue-600" />
            {regional.ciudad?.descripcion ?? 'SIN CIUDAD'}
          </span>
        </div>

        {/* Título */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3
            className="
            text-base font-extrabold uppercase leading-snug
            text-white drop-shadow-md line-clamp-2
          "
          >
            {regional.razonSocial}
          </h3>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 space-y-4">
        {/* INFO */}
        <div className="space-y-3 text-xs">
          <InfoRow
            icon="abstract-14"
            color="blue"
            label="NIT"
            value={`${regional.nit}-${regional.digitoVerificacion}`}
          />
          <InfoRow
            icon="profile-user"
            color="purple"
            label="Representante"
            value={regional.representanteLegal}
          />
          <InfoRow icon="sms" color="green" label="Email" value={regional.email} />
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

        {/* ACTIONS */}
        <div className="flex justify-center">
          <button
            onClick={onEdit}
            className="
              group/edit flex h-14 w-14 items-center justify-center
              rounded-xl bg-blue-50 text-blue-600
              border border-blue-100
              hover:bg-blue-600 hover:text-white
              hover:shadow-lg hover:shadow-blue-500/30
              active:scale-95 transition-all
            "
            title="Editar regional"
          >
            <KeenIcon
              icon="notepad-edit"
              className="text-xl transition-transform group-hover/edit:scale-110"
            />
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
  color
}: {
  icon: string;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green';
}) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600'
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
        <i className={`ki-outline ki-${icon} text-sm`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="font-bold text-gray-700 truncate">{value}</p>
      </div>
    </div>
  );
};

export default RegionalCard;
