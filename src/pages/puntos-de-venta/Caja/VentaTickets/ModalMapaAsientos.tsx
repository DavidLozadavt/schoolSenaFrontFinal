import React, { useState } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';

interface MapaAsiento {
  id: number;
  nombreMapa: string;
  cantidadAsientos: number;
  ladoPuerta: string;
  tipoDistribucion: string;
  ultimaFilaEspecial: boolean;
  asientosUltimaFila: number | null;
  descripcion: string;
}

interface ClaseVehiculo {
  id: number;
  nombre: string;
  descripcion: string;
  mapas_asientos?: MapaAsiento[];
}

interface ModalMapaAsientosProps {
  open: boolean;
  onClose: () => void;
  claseVehiculo: ClaseVehiculo | null;
  asientoSeleccionado?: number | null;
  onSeleccionarAsiento?: (asiento: number | null) => void;
}

interface AsientoData {
  numero: number;
  seleccionado: boolean;
  fila: number;
  columna: number;
  posicion: 'izquierda' | 'derecha' | 'centro';
}

const ModalMapaAsientos: React.FC<ModalMapaAsientosProps> = ({
  open,
  onClose,
  claseVehiculo,
  asientoSeleccionado,
  onSeleccionarAsiento
}) => {
  const [asientoTemp, setAsientoTemp] = useState<number | null>(asientoSeleccionado || null);

  // Componente SVG para el asiento
  const AsientoSVG = ({ asiento }: { asiento: AsientoData }) => {
    const esSeleccionado = asientoTemp === asiento.numero;
    const colorPrincipal = esSeleccionado ? '#3b82f6' : '#e0e0e0';
    const colorRespaldo = esSeleccionado ? '#2563eb' : '#c0c0c0';
    const colorSombra = esSeleccionado ? '#1d4ed8' : '#a0a0a0';

    return (
      <div 
        className="relative cursor-pointer transform transition-transform hover:scale-105" 
        style={{ width: '64px', height: '64px' }}
        onClick={() => handleSeleccionarAsiento(asiento.numero)}
      >
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
            fill={esSeleccionado ? '#ffffff' : '#4b5563'}
            fontSize="20"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {asiento.numero}
          </text>
        </svg>
        
        {/* Indicador de seleccionado */}
        {esSeleccionado && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
            <KeenIcon icon="check" className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  if (!claseVehiculo || !claseVehiculo.mapas_asientos || claseVehiculo.mapas_asientos.length === 0) {
    return (
      <Modal open={open} onClose={onClose}>
        <ModalContent className="max-w-[500px] top-[15%]">
          <ModalHeader>
            <ModalTitle>Mapa de Asientos</ModalTitle>
            <button className="btn btn-sm btn-icon btn-light btn-clear shrink-0" onClick={onClose}>
              <KeenIcon icon="cross" />
            </button>
          </ModalHeader>
          <ModalBody className="p-6">
            <div className="text-center text-gray-600">
              <KeenIcon icon="information-2" className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No hay un mapa de asientos disponible para este vehículo.</p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  const mapa = claseVehiculo.mapas_asientos[0]; // Tomar el primer mapa

  const generarAsientos = () => {
    const asientos: AsientoData[] = [];
    const distribucion = mapa.tipoDistribucion; // Ej: "2+2" o "2+1"
    const [izq, der] = distribucion.split('+').map(Number);
    
    let cantidadAsientosRegulares = mapa.cantidadAsientos;
    let asientosUltimaFila = 0;

    if (mapa.ultimaFilaEspecial && mapa.asientosUltimaFila) {
      asientosUltimaFila = mapa.asientosUltimaFila;
      cantidadAsientosRegulares = mapa.cantidadAsientos - asientosUltimaFila;
    }

    const asientosPorFila = izq + der;
    const filasRegulares = Math.ceil(cantidadAsientosRegulares / asientosPorFila);

    // Generar asientos regulares
    for (let fila = 0; fila < filasRegulares; fila++) {
      // Asientos izquierda
      for (let col = 0; col < izq; col++) {
        const numeroAsiento = fila * asientosPorFila + col + 1;
        if (numeroAsiento <= cantidadAsientosRegulares) {
          asientos.push({
            numero: numeroAsiento,
            seleccionado: asientoTemp === numeroAsiento,
            fila,
            columna: col,
            posicion: 'izquierda'
          });
        }
      }
      
      // Asientos derecha
      for (let col = 0; col < der; col++) {
        const numeroAsiento = fila * asientosPorFila + izq + col + 1;
        if (numeroAsiento <= cantidadAsientosRegulares) {
          asientos.push({
            numero: numeroAsiento,
            seleccionado: asientoTemp === numeroAsiento,
            fila,
            columna: izq + col,
            posicion: 'derecha'
          });
        }
      }
    }

    // Última fila especial
    if (mapa.ultimaFilaEspecial && asientosUltimaFila > 0) {
      const filaEspecial = filasRegulares;
      for (let i = 0; i < asientosUltimaFila; i++) {
        const numeroAsiento = cantidadAsientosRegulares + i + 1;
        asientos.push({
          numero: numeroAsiento,
          seleccionado: asientoTemp === numeroAsiento,
          fila: filaEspecial,
          columna: i,
          posicion: 'centro'
        });
      }
    }

    return asientos;
  };

  const renderAsientos = () => {
    const asientos = generarAsientos();
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

  const handleSeleccionarAsiento = (numero: number) => {
    // Si se clickea el mismo asiento, se deselecciona
    if (asientoTemp === numero) {
      setAsientoTemp(null);
    } else {
      setAsientoTemp(numero);
    }
  };

  const handleConfirmar = () => {
    if (onSeleccionarAsiento) {
      onSeleccionarAsiento(asientoTemp);
    }
    onClose();
  };

  const handleCerrar = () => {
    setAsientoTemp(asientoSeleccionado || null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleCerrar}>
      <ModalContent className="max-w-[1000px] top-[2%]">
        <ModalHeader className="p-5 flex justify-between items-center border-b bg-gradient-to-r to-indigo-50">
          <ModalTitle className="text-lg font-semibold flex items-center gap-3">
            <div>
              <p className="text-gray-800">Seleccionar Asiento</p>
              <p className="text-xs font-normal text-gray-600">{mapa.nombreMapa}</p>
            </div>
          </ModalTitle>
          <button
            className="p-2 rounded-full transition-colors hover:bg-gray-200"
            onClick={handleCerrar}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="w-5 h-5" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="space-y-6">
            {/* Información del Mapa */}
            <div className="bg-gradient-to-r via-indigo-50 to-purple-50 rounded-xl p-5 border">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                    <KeenIcon icon="bus" className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{claseVehiculo.nombre}</h3>
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
            <div className="flex items-center justify-center gap-8 p-5 bg-gradient-to-r to-slate-100 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3">
                <div className="scale-75">
                  <AsientoSVG asiento={{ numero: 1, seleccionado: false, fila: 0, columna: 0, posicion: 'izquierda' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                    <KeenIcon icon="check-circle" className="w-4 h-4" />
                    Disponible
                  </p>
                  <p className="text-xs text-slate-600">Click para seleccionar</p>
                </div>
              </div>

              <div className="w-px h-12 bg-slate-300"></div>

              <div className="flex items-center gap-3">
                <div className="scale-75">
                  <AsientoSVG asiento={{ numero: 2, seleccionado: true, fila: 0, columna: 1, posicion: 'derecha' }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-700 flex items-center gap-1">
                    <KeenIcon icon="check-circle" className="w-4 h-4" />
                    Seleccionado
                  </p>
                  <p className="text-xs text-slate-600">Tu asiento elegido</p>
                </div>
              </div>
            </div>

            {/* Representación del Bus */}
            <div className="relative mx-auto max-w-2xl">
              <div className="relative bg-gradient-to-b from-slate-100 to-slate-200 rounded-[2.5rem] border-4 border-slate-400 shadow-2xl overflow-visible">
                {/* Líneas laterales del bus */}
                <div className="absolute left-0 top-12 bottom-12 w-1 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>
                <div className="absolute right-0 top-12 bottom-12 w-1 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>

                {/* Frente del Bus */}
                <div className="relative bg-gradient-to-b from-slate-700 to-slate-800 border-b-4 border-slate-900 rounded-t-[2rem] py-4 shadow-inner">
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
                      <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse"></div>
                      <div
                        className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse"
                        style={{ animationDelay: '0.3s' }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Interior del Bus - Asientos */}
                <div className="p-8 relative">
                  {/* Indicador de puerta */}
                  <div className={`absolute top-4 ${mapa.ladoPuerta === 'derecha' ? 'right-4' : 'left-4'} bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-lg flex items-center gap-1`}>
                    <KeenIcon icon="entrance-right" className="w-4 h-4" />
                    Puerta
                  </div>

                  {renderAsientos()}
                </div>
              </div>
            </div>

            {/* Información de selección */}
          {asientoTemp && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-sm font-semibold text-green-800">
                Asiento seleccionado: <span className="text-lg">{asientoTemp}</span>
              </p>
            </div>
          )}

            {/* Nota informativa */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <KeenIcon icon="information-2" className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800">
                  <strong>Nota:</strong> La selección de asiento es opcional. Si no seleccionas uno, el asiento se asignará automáticamente.
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCerrar}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              {asientoTemp && (
                <button
                  onClick={() => {
                    setAsientoTemp(null);
                  }}
                  className="px-4 py-2 rounded-md border border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors"
                >
                  Limpiar selección
                </button>
              )}
              <button
                onClick={handleConfirmar}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <KeenIcon icon="check" className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ModalMapaAsientos;
