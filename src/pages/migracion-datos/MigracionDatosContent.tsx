import { Container } from '@/components';
import { useState } from 'react';
import { ModalMigracionDatos } from './modal/ModalMigracionDatos';
import * as XLSX from 'xlsx';

type EntidadKey = 'trabajadores' ;
                  // | 'estudiantes'         /////////////////////
                  // | 'productos' |    ///// Para más tarjetas ////
                  // | 'infraestructura';  /////////////////////

// Lista de entidades con sus datos (imagen, color, headers)
const ENTIDADES: {
  key: EntidadKey;
  nombre: string;
  color: string;
  img: string;
  headers: string[];
}[] = [
  {
    key: 'trabajadores',
    nombre: 'Trabajadores',
    color: 'blue-700',
    img: '/images/trabajadores.jpg',
    headers: [
      'nombre1','nombre2','apellido1','apellido2','tipo_identificacion','identificacion',
      'correo','celular','fecha_nacimiento','tipo_contratacion','valor','fecha_inicial',
      'fecha_final','rol','area_conocimientos','nivel_educativo'
    ]
  },
      
                      ////////////////////
          //////////// INFO DE TARJETAS ////////////
                    ////////////////////
//   {
//     key: 'estudiantes',
//     nombre: 'Estudiantes',
//     color: 'green-700',
//     img: '/images/estudiantes.jpg',
//     headers: [
//       'nombre1','nombre2','apellido1','apellido2','tipo_identificacion','identificacion',
//       'correo','celular','fecha_nacimiento','grado','curso','matricula'
//     ]
//   },
//   {
//     key: 'productos',
//     nombre: 'Productos',
//     color: 'orange-600',
//     img: '/images/productos.jpg',
//     headers: ['codigo','nombre','categoria','precio','stock']
//   },
//   {
//     key: 'infraestructura',
//     nombre: 'Infraestructura',
//     color: 'purple-700',
//     img: '/images/infraestructura.jpg',
//     headers: ['nombre','tipo','ubicacion','estado','fecha_adquisicion']
//   }

];

const MigracionDatosContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<EntidadKey>('trabajadores');

  const openModalFor = (entity: EntidadKey) => {
    setSelectedEntity(entity);
    setIsModalOpen(true);
  };

  const handleDownload = (entityKey: EntidadKey) => {
    const entity = ENTIDADES.find(e => e.key === entityKey);
    if (!entity) return;

    // Creamos fila vacía para los headers
    const data = [Object.fromEntries(entity.headers.map(h => [h, '']))];

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajustamos ancho de columnas
    worksheet['!cols'] = entity.headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, entity.nombre);

    XLSX.writeFile(workbook, `plantilla_${entityKey}.xlsx`);
  };

  return (
    <Container>
      <div className="card-header mb-6">
        <h3 className="card-title">Migración de Datos</h3>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-6">
        {ENTIDADES.map(e => (
          <div key={e.key} className="group relative w-full max-w-sm border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 rounded-2xl shadow-lg overflow-hidden">
            <div className="h-52 w-full relative">
              <img src={e.img} alt={e.nombre} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 top-0 h-52 flex items-start justify-center pointer-events-none transition-all duration-300 transform -translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                <div className="w-full h-52 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center">
                  <button
                    onClick={() => handleDownload(e.key)}
                    className="pointer-events-auto bg-white/90 text-black border-2 border-white rounded-full px-8 py-3 font-semibold tracking-wide uppercase shadow-lg hover:bg-white"
                    title={`Descargar plantilla ${e.nombre}`}
                  >
                    DESCARGAR
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 text-center">
              <h4 className={`text-xl font-semibold text-${e.color} mb-2`}>{e.nombre}</h4>
              <div className={`w-12 h-1 bg-${e.color} mx-auto mb-4 rounded`}></div>
              <p className="text-gray-600 mb-6">Carga masiva de {e.nombre.toLowerCase()}</p>
              <button
                className="border-2 border-black px-8 py-2 rounded-lg font-semibold tracking-wide hover:bg-black hover:text-white transition"
                title={`Cargar ${e.nombre}`}
                onClick={() => openModalFor(e.key)}
              >
                CARGAR
              </button>
            </div>
          </div>
        ))}
      </div>

      <ModalMigracionDatos
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entity={selectedEntity}
      />

      <style>
        {`
          .scroll-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scroll-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </Container>
  );
};

export default MigracionDatosContent;
