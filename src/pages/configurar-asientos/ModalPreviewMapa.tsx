import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import { MapaAsientosInterface, AsientoInterface } from './model/MapaAsientosInterface';

interface ModalPreviewMapaProps {
  open: boolean;
  onClose: () => void;
  mapa?: MapaAsientosInterface;
}

const ModalPreviewMapa = ({ open, onClose, mapa }: ModalPreviewMapaProps) => {
  if (!mapa) return null;

  // Componente SVG para el asiento
  const AsientoSVG = ({ asiento }: { asiento: AsientoInterface }) => {
    const disponible = asiento.disponible;
    const colorPrincipal = disponible ? '#e0e0e0' : '#b0b0b0';
    const colorRespaldo = disponible ? '#c0c0c0' : '#909090';
    const colorSombra = disponible ? '#a0a0a0' : '#707070';

    return (
      <div className="relative" style={{ width: '64px', height: '64px' }}>
        <svg
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Sombra */}
          <ellipse cx="50" cy="95" rx="35" ry="5" fill="#00000020" />
          
          {/* Base del asiento */}
          <rect
            x="20"
            y="55"
            width="60"
            height="35"
            rx="8"
            fill={colorPrincipal}
            stroke={colorSombra}
            strokeWidth="2"
          />
          
          {/* Efecto de profundidad en la base */}
          <rect
            x="25"
            y="60"
            width="50"
            height="5"
            rx="3"
            fill={colorSombra}
            opacity="0.3"
          />
          
          {/* Respaldo */}
          <rect
            x="20"
            y="25"
            width="60"
            height="35"
            rx="8"
            fill={colorRespaldo}
            stroke={colorSombra}
            strokeWidth="2"
          />
          
          {/* Efecto de profundidad en el respaldo */}
          <rect
            x="25"
            y="30"
            width="50"
            height="5"
            rx="3"
            fill="#ffffff"
            opacity="0.2"
          />
          
          {/* Apoyabrazos izquierdo */}
          <rect
            x="15"
            y="45"
            width="8"
            height="30"
            rx="4"
            fill={colorRespaldo}
            stroke={colorSombra}
            strokeWidth="1.5"
          />
          
          {/* Apoyabrazos derecho */}
          <rect
            x="77"
            y="45"
            width="8"
            height="30"
            rx="4"
            fill={colorRespaldo}
            stroke={colorSombra}
            strokeWidth="1.5"
          />
          
          {/* Texto del número de asiento */}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={disponible ? '#4b5563' : '#ffffff'}
            fontSize="20"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {asiento.etiqueta || asiento.numero}
          </text>
        </svg>
        
        {/* Indicador de no disponible */}
        {!disponible && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
            <KeenIcon icon="cross" className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  const renderAsientos = () => {
    const asientos = mapa.asientos || [];
    const filas = Math.max(...asientos.map((a) => a.fila)) + 1;
    const resultado = [];

    for (let fila = 0; fila < filas; fila++) {
      const asientosFila = asientos.filter((a) => a.fila === fila);
      const asientosIzquierda = asientosFila.filter((a) => a.posicion === 'izquierda');
      const asientosDerecha = asientosFila.filter((a) => a.posicion === 'derecha');
      const asientosCentro = asientosFila.filter((a) => a.posicion === 'centro');

      if (asientosCentro.length > 0) {
        resultado.push(
          <div key={fila} className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-2">
              {asientosCentro.map((asiento) => (
                <AsientoSVG key={asiento.numero} asiento={asiento} />
              ))}
            </div>
          </div>
        );
        continue;
      }

      resultado.push(
        <div key={fila} className="flex items-center justify-center gap-6 mb-2">
          {/* Columna Izquierda */}
          <div className="flex gap-2">
            {asientosIzquierda.map((asiento) => (
              <AsientoSVG key={asiento.numero} asiento={asiento} />
            ))}
          </div>

          {/* Pasillo Central */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent mb-1"></div>
            <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              Pasillo
            </div>
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-slate-300 to-transparent mt-1"></div>
          </div>

          {/* Columna Derecha */}
          <div className="flex gap-2">
            {asientosDerecha.map((asiento) => (
              <AsientoSVG key={asiento.numero} asiento={asiento} />
            ))}
          </div>
        </div>
      );
    }

    return resultado;
  };

  const asientosDisponibles = mapa.asientos.filter((a) => a.disponible).length;
  const asientosBloqueados = mapa.asientos.filter((a) => !a.disponible).length;

  return (
    <Modal open={open} onClose={onClose}>
     <ModalContent className="max-w-[1000px] top-[2%]">
        <ModalHeader className="p-5 flex justify-between items-center border-b bg-gradient-to-r to-indigo-50">
          <ModalTitle className="text-lg font-semibold flex items-center gap-3">
            {/* <div className="p-2  rounded-lg">
              <KeenIcon icon="cube-3" className="w-6 h-6 text-gray" />
            </div> */}
            <div>
              <p className="text-gray-800">Preview del mapa</p>
              <p className="text-xs font-normal text-gray-600">{mapa.nombreMapa}</p>
            </div>
          </ModalTitle>
          <button
            className="p-2 rounded-full transition-colors hover:bg-gray-200"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="w-5 h-5" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Información del Mapa */}
            <div className="bg-gradient-to-r  via-indigo-50 to-purple-50 rounded-xl p-5 border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3  rounded-xl shadow-lg">
                    <KeenIcon icon="bus" className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{mapa.nombreMapa}</h3>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <KeenIcon icon="abstract-26" className="w-4 h-4" />
                        {mapa.cantidadAsientos} asientos
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center gap-1">
                        <KeenIcon icon="menu" className="w-4 h-4" />
                        {mapa.tipoDistribucion}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="flex items-center gap-1">
                        <KeenIcon icon="exit-right" className="w-4 h-4" />
                        {mapa.ladoPuerta === 'izquierda' ? 'Izquierda' : 'Derecha'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-8 p-5 bg-gradient-to-r  to-slate-100 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="scale-75">
                  <AsientoSVG asiento={{ numero: 1, etiqueta: 'A1', disponible: true, fila: 0, columna: 0, posicion: 'izquierda' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                    <KeenIcon icon="check-circle" className="w-4 h-4" />
                    Disponible
                  </p>
                  <p className="text-xs text-slate-600">Asientos habilitados</p>
                </div>
              </div>

              <div className="w-px h-12 bg-slate-300"></div>

              <div className="flex items-center gap-3">
                <div className="scale-75">
                  <AsientoSVG asiento={{ numero: 2, etiqueta: 'B1', disponible: false, fila: 0, columna: 1, posicion: 'derecha' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    <KeenIcon icon="cross-circle" className="w-4 h-4" />
                    Bloqueado
                  </p>
                  <p className="text-xs text-slate-600">Asientos no disponibles</p>
                </div>
              </div>
            </div>

            {/* Representación del Bus */}
            <div className="relative mx-auto max-w-2xl">
              <div className="relative bg-gradient-to-b   rounded-[2.5rem] border-4 shadow-2xl overflow-visible">
                {/* Líneas laterales del bus */}
                <div className="absolute left-0 top-12 bottom-12 w-1 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>
                <div className="absolute right-0 top-12 bottom-12 w-1 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>

                {/* Frente del Bus */}
                <div className="relative bg-gradient-to-b  border-b-4  rounded-t-[2rem] py-4 shadow-inner">
                  <div className="flex items-center justify-center gap-4 px-6">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse"></div>
                      <div
                        className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse"
                        style={{ animationDelay: '0.3s' }}
                      ></div>
                    </div>

                    <div className="flex gap-2">
                      <div className="w-16 h-8 bg-gradient-to-br from-sky-200 to-blue-300 rounded-lg border-2 border-slate-600 shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12"></div>
                      </div>
                      <div className="w-16 h-8 bg-gradient-to-br from-sky-200 to-blue-300 rounded-lg border-2 border-slate-600 shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12"></div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-3 border-amber-600 flex items-center justify-center shadow-lg">
                        <KeenIcon icon="user" className="w-5 h-5 text-slate-800" />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <div
                        className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse"
                        style={{ animationDelay: '0.6s' }}
                      ></div>
                      <div
                        className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse"
                        style={{ animationDelay: '0.9s' }}
                      ></div>
                    </div>
                  </div>

                  {/* <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded text-[10px] font-bold text-slate-700 border-2 border-slate-600">
                    BUS-{mapa.cantidadAsientos}
                  </div> */}
                </div>

                {/* Contenedor principal con puerta */}
                <div className="relative bg-gradient-to-b  ">
                  {/* Puerta Izquierda */}
                  {mapa.ladoPuerta === 'izquierda' && (
                    <div className="absolute left-0 top-8 -translate-x-8 z-10">
                      <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-r-xl px-4 py-3 shadow-2xl border-3 border-amber-600">
                        <div className="flex items-center gap-2">
                          <KeenIcon icon="exit-right" className="w-5 h-5 text-slate-800" />
                          <div>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                              Puerta
                            </p>
                            <p className="text-[8px] text-slate-700">Principal</p>
                          </div>
                        </div>
                        <div className="absolute left-0 top-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                        <div className="absolute left-0 bottom-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                  )}

                  {/* Ventanas laterales decorativas */}
                  <div className="absolute left-2 top-4 bottom-4 w-2 flex flex-col gap-3">
                    {Array(Math.min(5, Math.ceil(mapa.asientos.length / 4)))
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="w-full h-8 bg-gradient-to-r from-blue-200 to-sky-100 rounded-sm border border-slate-300 shadow-inner"
                        ></div>
                      ))}
                  </div>
                  <div className="absolute right-2 top-4 bottom-4 w-2 flex flex-col gap-3">
                    {Array(Math.min(5, Math.ceil(mapa.asientos.length / 4)))
                      .fill(0)
                      .map((_, i) => (
                        <div
                          key={i}
                          className="w-full h-8 bg-gradient-to-l from-blue-200 to-sky-100 rounded-sm border border-slate-300 shadow-inner"
                        ></div>
                      ))}
                  </div>

                  {/* Asientos */}
                  <div className="py-6 px-8">{renderAsientos()}</div>

                  {/* Puerta Derecha */}
                  {mapa.ladoPuerta === 'derecha' && (
                    <div className="absolute right-0 top-8 translate-x-8 z-10">
                      <div className="bg-gradient-to-l from-amber-400 to-amber-500 rounded-l-xl px-4 py-3 shadow-2xl border-3 border-amber-600">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide text-right">
                              Puerta
                            </p>
                            <p className="text-[8px] text-slate-700 text-right">Principal</p>
                          </div>
                          <KeenIcon icon="exit-left" className="w-5 h-5 text-slate-800" />
                        </div>
                        <div className="absolute right-0 top-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                        <div className="absolute right-0 bottom-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Parte Trasera del Bus */}
                <div className="relative bg-gradient-to-b  border-t-4 00 rounded-b-[2rem] py-4 shadow-inner">
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-700 shadow-lg shadow-red-500/50 animate-pulse"></div>
                      <div className="w-4 h-4 bg-amber-400 rounded border-2 border-amber-600 shadow-lg"></div>
                    </div>

                    <div className="text-center">
                      <KeenIcon icon="wrench" className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                        Motor
                      </p>
                    </div>

                    <div className="flex flex-col gap-1">
                      <div
                        className="w-4 h-4 bg-red-500 rounded border-2 border-red-700 shadow-lg shadow-red-500/50 animate-pulse"
                        style={{ animationDelay: '0.5s' }}
                      ></div>
                      <div className="w-4 h-4 bg-amber-400 rounded border-2 border-amber-600 shadow-lg"></div>
                    </div>
                  </div>

                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-4 py-1 bg-white rounded text-[10px] font-bold text-slate-700 border-2 border-slate-600">
                    {mapa.nombreMapa.substring(0, 10).toUpperCase() || 'VEHICULO'}
                  </div>
                </div>
              </div>

              {/* Sombra del bus */}
              <div className="absolute -bottom-4 left-12 right-12 h-8 bg-gradient-radial from-slate-900/20 to-transparent rounded-full blur-xl"></div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="relative overflow-hidden bg-gradient-to-br   border-2 border-green-200 rounded-xl p-5 text-center group hover:shadow-lg transition-all">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
                <KeenIcon icon="check-circle" className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-green-700 mb-1">{asientosDisponibles}</p>
                <p className="text-xs font-medium text-green-800 uppercase tracking-wide">
                  Disponibles
                </p>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br  to-gray-100 border-2 border-gray-200 rounded-xl p-5 text-center group hover:shadow-lg transition-all">
                <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
                <KeenIcon icon="cross-circle" className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-gray-700 mb-1">{asientosBloqueados}</p>
                <p className="text-xs font-medium text-gray-800 uppercase tracking-wide">
                  Bloqueados
                </p>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br  to-blue-100 border-2 border-blue-200 rounded-xl p-5 text-center group hover:shadow-lg transition-all">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
                <KeenIcon icon="cube-3" className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-3xl font-bold text-blue-700 mb-1">{mapa.asientos.length}</p>
                <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">Total</p>
              </div>
            </div>

            {/* Botón de Cerrar */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalPreviewMapa };
