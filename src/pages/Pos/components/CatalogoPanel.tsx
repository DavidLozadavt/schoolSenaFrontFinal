import { ArticulosSeleccionados } from "./ArticulosSeleccionados";
import { ClienteInfo } from "./ClienteInfo";

const CatalogoPanel = () => {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Catálogo (Productos u otros ítems) */}
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Catálogo</h2>
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full pl-8 input input-sm md:w-96"
              />
          </div>
          <div className="p-4 border rounded min-h-[150px] text-center text-gray-500">
            No se encontraron productos.
          </div>
        </div>
  
        {/* Lateral derecho */}
        <div className="space-y-4">
          <ClienteInfo />
          {/* <ArticulosSeleccionados /> */}
        </div>
      </div>
    );
  };
  
  export { CatalogoPanel };
  