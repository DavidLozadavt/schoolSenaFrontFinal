import { User, Pencil, Trash2, Calendar, FolderPlus } from 'lucide-react';
import { useEffect, useState } from 'react';

export const CardRap = ({ materia }: any) => {
  const [horarios, setHorarios] = useState<any[]>([]);

  useEffect(() => {
    setHorarios(materia.horarios.filter((h: any) => h.estado == 'ASIGNADO'));
  }, []);
  return (
    <div className="rounded-xl border border-gray-300 p-2 my-2 flex gap-4">
      {/* Contenido principal */}
      <div className="flex-1 space-y-4">
        {/* Título del RAP */}
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-900">{materia.nombre}</h3>
          <div>
            <p className="text-sm text-gray-500">Progreso</p>
            <p className="text-lg text-center text-blue-500 font-semibold">
              {materia.porcentajeAvance}%
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 rounded-lg p-4 text-center">
          {/* Instructor */}
          <div className="flex items-center justify-center gap-3 text-left">
            {/* Avatars */}
            <div className="flex -space-x-3">
              {horarios && horarios.length > 0 ? (
                horarios.map((h, idx) => (
                  <div
                    key={idx}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden flex items-center justify-center"
                  >
                    {h.instructor ? (
                      h.instructor?.rutaFoto ? (
                        <img
                          src={h.instructor.rutaFoto}
                          alt={`${h.instructor.nombre1 ?? '--'} ${h.instructor.apellido1 ?? '--'}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="text-gray-500" size={18} />
                      )
                    ) : (
                      <></>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="text-gray-400" size={18} />
                </div>
              )}
            </div>

            {/* Texto solo si hay 1 instructor */}
            {horarios?.length === 1 && horarios[0].instructor && (
              <div>
                <p className="text-xs text-gray-500">Instructor</p>
                <p className="text-sm font-medium text-gray-800 leading-tight">
                  {`${horarios[0].instructor.nombre1 ?? ''}
                    ${horarios[0].instructor.nombre2 ?? ''} 
                    ${horarios[0].instructor.apellido1 ?? ''} 
                    ${horarios[0].instructor.apellido2 ?? ''}`}
                </p>
              </div>
            )}

            {/* Texto si no hay ninguno */}
            {(!horarios || horarios.length === 0) && (
              <p className="text-sm text-gray-500">SIN ASIGNAR HORARIOS</p>
            )}
          </div>

          {/* Horas */}
          <div>
            <p className="text-xs text-gray-500">Total de horas</p>
            <p className="text-lg font-semibold">{materia.horasTotales}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Horas acumuladas</p>
            <p className="text-lg font-semibold text-green-600">{materia.horasActuales}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Horas restantes</p>
            <p className="text-lg font-semibold text-orange-500">{materia.horasFaltantes}</p>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col items-center justify-between py-2">
        <button
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition"
          title="Editar"
        >
          <Pencil size={18} />
        </button>

        <button
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-yellow-600 transition"
          title="Agregar RAP"
        >
          <FolderPlus size={18} />
        </button>

        <button
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-green-600 transition"
          title="Calendario"
        >
          <Calendar size={18} />
        </button>

        <button
          className="p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-red-600 transition"
          title="Eliminar"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
