const HistorialServicios = () => {
    return (
      <div className="p-4 mt-4 border rounded">
        <h3 className="mb-2 text-lg font-semibold">Historial</h3>
        <table className="w-full text-sm border table-auto">
          <thead className=''>
            <tr>
              <th className="p-2 border">Tiempo</th>
              <th className="p-2 border">Servicio</th>
              <th className="p-2 border">Observación</th>
              <th className="p-2 border">Cliente - Código</th>
              <th className="p-2 border">Responsable - Escenario</th>
              <th className="p-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="p-2 border">0 Minutos</td>
              <td className="p-2 border">CORTE DE CABELLO</td>
              <td className="p-2 border">ERROR</td>
              <td className="p-2 border">MANUEL JESUS BARRAGAN DORADO - 3155897611</td>
              <td className="p-2 border"></td>
              <td className="p-2 border">[...acciones]</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };
  
  export { HistorialServicios };
  