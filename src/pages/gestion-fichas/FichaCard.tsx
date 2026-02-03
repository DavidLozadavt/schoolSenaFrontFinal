import { KeenIcon } from '@/components';

/* Interfaces */
interface Jornada {
  id: number;
  nombreJornada: string;
}

interface Programa {
  id: number;
  nombrePrograma: string;
}

interface Asignacion {
  id: number;
  estado: string;
  programa: Programa;
}

interface Sede {
  id: number;
  nombre: string;
}

interface Regional {
  id: number;
  razonSocial: string;
}

interface Ficha {
  id: number;
  codigo: string;
  porcentajeEjecucion: number;
  jornada: Jornada;
  asignacion: Asignacion | null;
  sede: Sede;
  regional: Regional;
}

interface Props {
  ficha: Ficha;
  onEdit: () => void;
  onInfo?: () => void;
  onDelete?: () => void;
}

const FichaCard: React.FC<Props> = ({ ficha, onEdit }) => {
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
      <div className="relative h-40 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 overflow-hidden">
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Icono grande decorativo */}
        <div className="absolute -top-6 -left-6 opacity-20">
          <KeenIcon icon="book-open" className="text-[120px] text-white" />
        </div>

        {/* Regional */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-700 shadow backdrop-blur">
            <i className="ki-outline ki-office-bag text-xs text-blue-600" />
            {ficha.regional?.razonSocial}
          </span>
        </div>

        {/* Código */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-xl font-extrabold uppercase text-white drop-shadow-md">
            {ficha.codigo}
          </h3>
          <p className="text-[10px] text-gray-200 uppercase tracking-wide">{ficha.sede?.nombre}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-5 flex flex-col h-[420px]">
        {/* INFO */}
        <div className="space-y-3 text-xs flex-1 overflow-hidden">
          <InfoRow
            icon="book"
            color="blue"
            label="Programa"
            value={ficha.asignacion?.programa?.nombrePrograma ?? 'Sin programa'}
          />

          <InfoRow
            icon="calendar"
            color="purple"
            label="Jornada"
            value={ficha.jornada?.nombreJornada}
          />

          <InfoRow icon="office-bag" color="green" label="Sede" value={ficha.sede?.nombre} />

          <InfoRow
            icon="chart-line"
            color="red"
            label="Ejecución"
            value={`${ficha.porcentajeEjecucion}%`}
          />
        </div>

        {/* ACCIONES */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            title="Editar ficha"
            onClick={onEdit}
            className="flex items-center justify-center h-8 bg-blue-100/40 text-blue-600 rounded-lg hover:border hover:border-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <KeenIcon icon="notepad-edit" />
          </button>
        </div>

        {/* CTA */}
        <button className="w-full py-2 text-xs font-bold uppercase bg-primary text-white rounded-lg hover:bg-primary-active transition-colors">
          Ver detalle de la ficha →
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
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
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

export default FichaCard;
