import ModalInfoRow from "./ModalInfoRow";


interface Props {
  regional: any;
  onEdit: any;
  onInfo: any;
  onDelete?: any;
}

const RegionalCard: React.FC<Props> = ({ regional, onEdit, onDelete, onInfo }) => {
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
      <div className="relative h-40 ">
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
        <div className="absolute inset-0" />

        {/* Ciudad */}
        <div className="absolute top-3 right-3">
          <span
            className="
            inline-flex items-center gap-1.5
            rounded-full  px-3 py-1
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
          <ModalInfoRow
            icon="abstract-14"
            color="blue"
            label="NIT"
            value={`${regional.nit}-${regional.digitoVerificacion}`}
          />
          <ModalInfoRow
            icon="user"
            color="purple"
            label="Representante"
            value={regional.representanteLegal}
          />
          <ModalInfoRow icon="sms" color="green" label="Email" value={regional.email} />
        </div>

        <div className="h-px " />

           {/* VER MAS */}
         <div className="grid grid-cols-1 gap-2 mt-4">
          <button
            onClick={onInfo}
            title="Editar"
            className="flex items-center justify-center w-full h-8 text-blue-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all"
          >
            <i className="text-sm ki-outline ki-eye"></i>
          </button>
        </div>


        {/* ACTIONS */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={onEdit}
            className="flex items-center justify-center w-full h-8 text-blue-600 border border-transparent rounded-lg dark:text-blue-300 bg-blue-100/30 dark:bg-blue-500/10 hover:border-blue-500 hover:scale-105 active:scale-95 transition-all
            "
            title="Editar regional"
          >
            <i className="text-sm ki-outline ki-arrows-loop"></i>
          </button>
          <button
            onClick={onDelete}
            className="
            flex items-center justify-center w-full h-8 text-red-600 border border-transparent rounded-lg dark:text-red-300 bg-red-100/30 dark:bg-red-500/10 hover:border-red-500 hover:scale-105 active:scale-95 transition-all
            "
            title="Eliminar regional"
          >
            <i className="text-sm ki-outline ki-trash"></i>
          </button>
        </div>
      </div>
    </div>
  );
};


export default RegionalCard;
