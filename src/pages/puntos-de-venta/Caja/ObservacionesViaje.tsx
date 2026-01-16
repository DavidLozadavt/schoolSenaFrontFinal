import React, { useEffect, useState } from "react";
import axios from "axios";
import { Observacion } from "../models/ObservacionesInterface";

interface ModalOProps {
  idViaje: any;
}

const ObservacionesViaje = ({ idViaje }: ModalOProps) => {
  const [observaciones, setObservaciones] = useState<Observacion[] | null>(null);
  const [nuevaObservacion, setNuevaObservacion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchObservaciones = async () => {
    try {
      const response = await axios.get<Observacion[]>("observaciones_viaje", {
        params: { idViaje: idViaje },
      });
      setObservaciones(response.data);
    } catch (error) {
      console.error("Error fetching observaciones:", error);
    }
  };

  useEffect(() => {
    fetchObservaciones();
  }, [idViaje]);

  const handleAgregarObservacion = async () => {
    if (!nuevaObservacion.trim()) return;

    setIsLoading(true);

    try {
      await axios.post("observaciones_viaje", {
        idViaje: idViaje,
        observacion: nuevaObservacion,
      });

      await fetchObservaciones();
      setNuevaObservacion("");
    } catch (error) {
      console.error("Error agregando observación:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEtiquetaClick = (etiqueta: string) => {
    setNuevaObservacion((prev) => (prev ? `${prev} ${etiqueta}` : etiqueta));
  };

  return (
    <div className="p-4 rounded-lg shadow-sm">
      <div className="flex gap-2 mb-4">
        {["Cambio de conductor", "Vehículo en el taller", "Retraso en la ruta"].map((etiqueta) => (
          <button
            key={etiqueta}
            onClick={() => handleEtiquetaClick(etiqueta)}
            className="px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            {etiqueta}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 mb-4">
        <textarea
          value={nuevaObservacion}
          onChange={(e) => setNuevaObservacion(e.target.value)}
          className={`textarea p-2 border  'border-red-500' : 'border-gray-300'} rounded-md w-full`}

          placeholder="Escribe una observación..."
          rows={3}
        />
        <button
          onClick={handleAgregarObservacion}
          disabled={isLoading}
          className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isLoading ? "Enviando..." : "Enviar"}
        </button>
      </div>

  

      <div className="relative h-64 overflow-y-auto"> 
        {observaciones ? (
          observaciones.length > 0 ? (
            observaciones.map((observacion, index) => (
              <div key={observacion.id} className="relative flex gap-3 pb-4">
                {index !== observaciones.length - 1 && (
                  <div className="absolute h-full border-l-2 border-green-500 left-4 top-10"></div>
                )}
                {observacion.user?.persona?.rutaFotoUrl && (
                  <img
                    src={observacion.user.persona.rutaFotoUrl}
                    alt={`${observacion.user.persona.nombre1} ${observacion.user.persona.apellido1}`}
                    className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white"
                  />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-800">
                    {observacion.user?.persona
                      ? `${observacion.user.persona.nombre1} ${observacion.user.persona.nombre2} ${observacion.user.persona.apellido1} ${observacion.user.persona.apellido2}`
                      : "Usuario desconocido"}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(observacion.created_at).toLocaleDateString()}
                  </span>
                  <p className="mt-1 text-xs text-gray-600">
                    {observacion.observacion}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No hay observaciones para este viaje.</p>
          )
        ) : (
          <p className="text-sm text-gray-500">Cargando observaciones...</p>
        )}
      </div>
    </div>
  );
};

export default ObservacionesViaje;