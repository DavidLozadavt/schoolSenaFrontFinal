import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalBody, ModalHeader, ModalTitle } from '@/components/modal';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import { MapaAsientosInterface, AsientoInterface, ClaseVehiculoInterface } from './model/MapaAsientosInterface';

interface ModalConfigurarAsientosProps {
  open: boolean;
  onClose: () => void;
  mapa?: MapaAsientosInterface;
  onSave?: () => void;
}

type LadoPuerta = 'izquierda' | 'derecha';
type TipoDistribucion = '2+2' | '2+1' | '1+2' | '1+1';

const ModalConfigurarAsientos = ({ 
  open, 
  onClose, 
  mapa,
  onSave 
}: ModalConfigurarAsientosProps) => {
  const { enqueueSnackbar } = useSnackbar();
  
  // Componente SVG para el asiento
  const AsientoSVG = ({ 
    asiento, 
    onClick, 
    onDoubleClick,
    onDragStart,
    onDragOver,
    onDrop,
    isDragging 
  }: { 
    asiento: AsientoInterface;
    onClick?: () => void;
    onDoubleClick?: () => void;
    onDragStart?: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: () => void;
    isDragging?: boolean;
  }) => {
    const disponible = asiento.disponible;
    const colorPrincipal = disponible ? '#84cc16' : '#b0b0b0'; // Verde lima para disponible
    const colorRespaldo = disponible ? '#65a30d' : '#909090'; // Verde lima oscuro para disponible
    const colorSombra = disponible ? '#4d7c0f' : '#707070'; // Verde lima muy oscuro para disponible

    return (
      <div className="relative" style={{ width: '64px', height: '64px' }}>
        <button
          draggable
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          className={`w-full h-full cursor-move transition-all duration-200 ${
            isDragging ? 'opacity-50 scale-95' : 'hover:scale-105'
          }`}
          title={`Asiento ${asiento.etiqueta || asiento.numero} - ${asiento.disponible ? 'Disponible' : 'No disponible'} - Doble click para editar`}
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
              fill="#ffffff"
              fontSize="20"
              fontWeight="bold"
              fontFamily="Arial, sans-serif"
            >
              {asiento.etiqueta || asiento.numero}
            </text>
          </svg>
          
          {/* Indicador de no disponible */}
          {!disponible && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 pointer-events-none">
              <KeenIcon icon="cross" className="w-3 h-3 text-white" />
            </div>
          )}
          
          {/* Indicador de drag */}
          {/* <div className="absolute top-1 left-1 pointer-events-none">
            <KeenIcon icon="menu" className="w-3 h-3 text-white opacity-50" />
          </div> */}
          
          {/* Indicador de editable */}
          {/* <div className="absolute bottom-1 right-1 pointer-events-none">
            <KeenIcon icon="pencil" className="w-2.5 h-2.5 text-white opacity-40" />
          </div> */}
        </button>
      </div>
    );
  };

  const [cantidadAsientos, setCantidadAsientos] = useState<number>(20);
  const [ladoPuerta, setLadoPuerta] = useState<LadoPuerta>('derecha');
  const [distribucion, setDistribucion] = useState<TipoDistribucion>('2+2');
  const [asientos, setAsientos] = useState<AsientoInterface[]>([]);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [loadingGuardar, setLoadingGuardar] = useState(false);
  const [nombreVehiculo, setNombreVehiculo] = useState('');
  const [ultimaFilaEspecial, setUltimaFilaEspecial] = useState(false);
  const [asientosUltimaFila, setAsientosUltimaFila] = useState<number>(5);
  const [draggedAsiento, setDraggedAsiento] = useState<number | null>(null);
  const [asientoEditando, setAsientoEditando] = useState<number | null>(null);
  const [etiquetaTemporal, setEtiquetaTemporal] = useState<string>('');
  const [mapaId, setMapaId] = useState<number | null>(null);
  const [mapasDisponibles, setMapasDisponibles] = useState<any[]>([]);
  const [loadingMapas, setLoadingMapas] = useState(false);
  const [claseVehiculos, setClaseVehiculos] = useState<ClaseVehiculoInterface[]>([]);
  const [idClaseVehiculo, setIdClaseVehiculo] = useState<string>('');

  useEffect(() => {
    if (cantidadAsientos > 0) {
      generarAsientos();
    }
  }, [cantidadAsientos, distribucion, ultimaFilaEspecial, asientosUltimaFila]);

  useEffect(() => {
    if (open) {
      cargarMapasDisponibles();
      cargarClaseVehiculos();
      if (mapa && mapa.id) {
        cargarMapaExistente(mapa.id);
      } else {
        nuevoMapa();
      }
    }
  }, [open, mapa]);

  const cargarClaseVehiculos = async () => {
    try {
      const response = await axios.get('clase_vehiculos');
      setClaseVehiculos(response.data);
    } catch (error) {
      console.error('Error al cargar clases de vehículos:', error);
      enqueueSnackbar('Error al cargar clases de vehículos', { variant: 'error' });
    }
  };

  const cargarMapasDisponibles = async () => {
    setLoadingMapas(true);
    try {
      const response = await axios.get('/mapas-asientos');
      if (response.data.success) {
        setMapasDisponibles(response.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar mapas:', error);
      enqueueSnackbar('Error al cargar mapas disponibles', { variant: 'error' });
    } finally {
      setLoadingMapas(false);
    }
  };

  const cargarMapaExistente = async (id: number) => {
    try {
      const response = await axios.get(`/mapas-asientos/${id}`);
      if (response.data.success) {
        const mapa = response.data.data;
        
        setMapaId(mapa.id);
        setNombreVehiculo(mapa.nombreMapa || mapa.nombre_mapa);
        setCantidadAsientos(mapa.cantidadAsientos || mapa.cantidad_asientos);
        setLadoPuerta(mapa.ladoPuerta || mapa.lado_puerta);
        setDistribucion(mapa.tipoDistribucion || mapa.tipo_distribucion);
        setUltimaFilaEspecial(mapa.ultimaFilaEspecial || mapa.ultima_fila_especial);
        setAsientosUltimaFila(mapa.asientosUltimaFila || mapa.asientos_ultima_fila || 5);
        setIdClaseVehiculo(mapa.idClaseVehiculo?.toString() || mapa.id_clase_vehiculo?.toString() || '');
        
        // Cargar asientos
        const asientosCargados = mapa.asientos.map((a: any) => ({
          numero: a.numero,
          fila: a.fila,
          columna: a.columna,
          posicion: a.posicion,
          disponible: a.disponible,
          etiqueta: a.etiqueta
        }));
        
        setAsientos(asientosCargados);
        enqueueSnackbar('Mapa cargado exitosamente', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error al cargar mapa:', error);
      enqueueSnackbar('Error al cargar el mapa', { variant: 'error' });
    }
  };

  const generarAsientos = () => {
    const nuevosAsientos: AsientoInterface[] = [];
    let numeroAsiento = 1;
    
    const asientosPorFila = distribucion === '2+2' ? 4 : 
                           distribucion === '2+1' ? 3 : 
                           distribucion === '1+2' ? 3 : 2;
    
    const asientosNormales = ultimaFilaEspecial 
      ? cantidadAsientos - asientosUltimaFila 
      : cantidadAsientos;
    
    const filasNormales = Math.ceil(asientosNormales / asientosPorFila);
    
    for (let fila = 0; fila < filasNormales; fila++) {
      if (distribucion === '2+2') {
        for (let col = 0; col < 4 && numeroAsiento <= asientosNormales; col++) {
          nuevosAsientos.push({
            numero: numeroAsiento++,
            fila,
            columna: col,
            posicion: col < 2 ? 'izquierda' : 'derecha',
            disponible: true
          });
        }
      } else if (distribucion === '2+1') {
        for (let col = 0; col < 3 && numeroAsiento <= asientosNormales; col++) {
          nuevosAsientos.push({
            numero: numeroAsiento++,
            fila,
            columna: col,
            posicion: col < 2 ? 'izquierda' : 'derecha',
            disponible: true
          });
        }
      } else if (distribucion === '1+2') {
        for (let col = 0; col < 3 && numeroAsiento <= asientosNormales; col++) {
          nuevosAsientos.push({
            numero: numeroAsiento++,
            fila,
            columna: col,
            posicion: col < 1 ? 'izquierda' : 'derecha',
            disponible: true
          });
        }
      } else if (distribucion === '1+1') {
        for (let col = 0; col < 2 && numeroAsiento <= asientosNormales; col++) {
          nuevosAsientos.push({
            numero: numeroAsiento++,
            fila,
            columna: col,
            posicion: col === 0 ? 'izquierda' : 'derecha',
            disponible: true
          });
        }
      }
    }
    
    if (ultimaFilaEspecial && asientosUltimaFila > 0) {
      const filaEspecial = filasNormales;
      for (let col = 0; col < asientosUltimaFila; col++) {
        nuevosAsientos.push({
          numero: numeroAsiento++,
          fila: filaEspecial,
          columna: col,
          posicion: 'centro',
          disponible: true
        });
      }
    }
    
    setAsientos(nuevosAsientos);
  };

  const toggleAsientoDisponibilidad = (numero: number) => {
    setAsientos(prev => 
      prev.map(asiento => 
        asiento.numero === numero 
          ? { ...asiento, disponible: !asiento.disponible }
          : asiento
      )
    );
  };

  const handleDragStart = (numero: number) => {
    setDraggedAsiento(numero);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (numeroDestino: number) => {
    if (draggedAsiento === null || draggedAsiento === numeroDestino) {
      setDraggedAsiento(null);
      return;
    }

    setAsientos(prev => {
      const newAsientos = [...prev];
      const draggedIndex = newAsientos.findIndex(a => a.numero === draggedAsiento);
      const targetIndex = newAsientos.findIndex(a => a.numero === numeroDestino);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      const tempNumero = newAsientos[draggedIndex].numero;
      newAsientos[draggedIndex].numero = newAsientos[targetIndex].numero;
      newAsientos[targetIndex].numero = tempNumero;

      return newAsientos.sort((a, b) => a.numero - b.numero);
    });

    setDraggedAsiento(null);
    enqueueSnackbar('Asientos reordenados', { variant: 'success' });
  };

  const agregarAsientoRapido = () => {
    const ultimoAsiento = Math.max(...asientos.map(a => a.numero), 0);
    const nuevaFila = Math.floor(asientos.length / 4);
    
    setAsientos(prev => [...prev, {
      numero: ultimoAsiento + 1,
      fila: nuevaFila,
      columna: prev.length % 4,
      posicion: (prev.length % 4) < 2 ? 'izquierda' : 'derecha',
      disponible: true
    }]);
    
    setCantidadAsientos(prev => prev + 1);
    enqueueSnackbar('Asiento agregado', { variant: 'success' });
  };

  const eliminarUltimoAsiento = () => {
    if (asientos.length <= 1) {
      enqueueSnackbar('Debe haber al menos 1 asiento', { variant: 'warning' });
      return;
    }

    setAsientos(prev => prev.slice(0, -1));
    setCantidadAsientos(prev => Math.max(1, prev - 1));
    enqueueSnackbar('Asiento eliminado', { variant: 'info' });
  };

  const iniciarEdicionEtiqueta = (numero: number, etiquetaActual?: string) => {
    setAsientoEditando(numero);
    setEtiquetaTemporal(etiquetaActual || numero.toString());
  };

  const guardarEtiqueta = (numero: number) => {
    if (!etiquetaTemporal.trim()) {
      enqueueSnackbar('La etiqueta no puede estar vacía', { variant: 'warning' });
      return;
    }

    setAsientos(prev =>
      prev.map(asiento =>
        asiento.numero === numero
          ? { ...asiento, etiqueta: etiquetaTemporal.trim().toUpperCase() }
          : asiento
      )
    );

    setAsientoEditando(null);
    setEtiquetaTemporal('');
    enqueueSnackbar('Etiqueta actualizada', { variant: 'success' });
  };

  const cancelarEdicion = () => {
    setAsientoEditando(null);
    setEtiquetaTemporal('');
  };

  const generarEtiquetasAutomaticas = () => {
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let letraIndex = 0;
    let numeroEnFila = 1;
    let filaAnterior = -1;

    setAsientos(prev =>
      prev.map(asiento => {
        if (asiento.fila !== filaAnterior) {
          filaAnterior = asiento.fila;
          numeroEnFila = 1;
          letraIndex++;
        }

        const etiqueta = `${letras[letraIndex % letras.length]}${numeroEnFila}`;
        numeroEnFila++;

        return { ...asiento, etiqueta };
      })
    );

    enqueueSnackbar('Etiquetas generadas automáticamente', { variant: 'success' });
  };

  const guardarConfiguracion = async () => {
    if (cantidadAsientos < 1) {
      enqueueSnackbar('La cantidad de asientos debe ser mayor a 0.', { variant: 'warning' });
      return;
    }

    if (!nombreVehiculo.trim()) {
      enqueueSnackbar('Por favor ingresa el nombre del mapa de asientos.', { variant: 'warning' });
      return;
    }

    if (!idClaseVehiculo) {
      enqueueSnackbar('Por favor selecciona una clase de vehículo.', { variant: 'warning' });
      return;
    }

    setLoadingGuardar(true);

    try {
      const payload = {
        nombreMapa: nombreVehiculo.trim(),
        cantidadAsientos: cantidadAsientos,
        ladoPuerta: ladoPuerta,
        tipoDistribucion: distribucion,
        ultimaFilaEspecial: ultimaFilaEspecial,
        asientosUltimaFila: ultimaFilaEspecial ? asientosUltimaFila : null,
        idClaseVehiculo: parseInt(idClaseVehiculo),
        descripcion: `Mapa de ${cantidadAsientos} asientos - Distribución ${distribucion}`,
        estado: 'activo',
        asientos: asientos.map(a => ({
          numero: a.numero,
          etiqueta: a.etiqueta || a.numero.toString(),
          fila: a.fila,
          columna: a.columna,
          posicion: a.posicion,
          disponible: a.disponible,
          estado: 'activo'
        }))
      };

      let response;
      
      if (mapaId) {
        response = await axios.put(`/mapas-asientos/${mapaId}`, payload);
      } else {
        response = await axios.post('/mapas-asientos', payload);
      }

      if (response.data.success) {
        enqueueSnackbar(
          mapaId ? 'Configuración actualizada exitosamente.' : 'Configuración guardada exitosamente.', 
          { variant: 'success' }
        );
        
        if (onSave) {
          onSave();
        }
        
        handleClose();
      } else {
        throw new Error(response.data.message || 'Error al guardar');
      }
    } catch (error: any) {
      const mensaje = error.response?.data?.message || 'Error al guardar la configuración.';
      enqueueSnackbar(mensaje, { variant: 'error' });
      console.error('Error al guardar:', error);
    } finally {
      setLoadingGuardar(false);
    }
  };

  const handleClose = () => {
    setCantidadAsientos(20);
    setLadoPuerta('derecha');
    setDistribucion('2+2');
    setAsientos([]);
    setVistaPrevia(false);
    setNombreVehiculo('');
    setUltimaFilaEspecial(false);
    setAsientosUltimaFila(5);
    setDraggedAsiento(null);
    setAsientoEditando(null);
    setEtiquetaTemporal('');
    setMapaId(null);
    setIdClaseVehiculo('');
    onClose();
  };

  const nuevoMapa = () => {
    setMapaId(null);
    setCantidadAsientos(20);
    setLadoPuerta('derecha');
    setDistribucion('2+2');
    setAsientos([]);
    setVistaPrevia(false);
    setNombreVehiculo('');
    setUltimaFilaEspecial(false);
    setAsientosUltimaFila(5);
    setDraggedAsiento(null);
    setAsientoEditando(null);
    setEtiquetaTemporal('');
    setIdClaseVehiculo('');
  
  };

  const renderAsientos = () => {
    const filas = Math.max(...asientos.map(a => a.fila)) + 1;
    const resultado = [];

    for (let fila = 0; fila < filas; fila++) {
      const asientosFila = asientos.filter(a => a.fila === fila);
      const asientosIzquierda = asientosFila.filter(a => a.posicion === 'izquierda');
      const asientosDerecha = asientosFila.filter(a => a.posicion === 'derecha');
      const asientosCentro = asientosFila.filter(a => a.posicion === 'centro');

      if (asientosCentro.length > 0) {
        resultado.push(
          <div key={fila} className="flex items-center justify-center gap-2 mb-2">
            <div className="flex gap-2">
              {asientosCentro.map(asiento => (
                <div key={asiento.numero} className="relative">
                  {asientoEditando === asiento.numero ? (
                    // Modo edición
                    <div className="w-16 h-16 rounded-xl bg-white border-3 border-blue-500 shadow-lg flex flex-col items-center justify-center p-1 gap-1">
                      <input
                        type="text"
                        value={etiquetaTemporal}
                        onChange={(e) => setEtiquetaTemporal(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarEtiqueta(asiento.numero);
                          if (e.key === 'Escape') cancelarEdicion();
                        }}
                        className="w-full text-center text-xs font-bold border-0 focus:outline-none focus:ring-0 p-0"
                        maxLength={4}
                        autoFocus
                      />
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => guardarEtiqueta(asiento.numero)}
                          className="p-0.5 bg-green-500 rounded hover:bg-green-600"
                        >
                          <KeenIcon icon="check" className="w-3 h-3 text-white" />
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="p-0.5 bg-red-500 rounded hover:bg-red-600"
                        >
                          <KeenIcon icon="cross" className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <AsientoSVG
                      asiento={asiento}
                      onClick={() => toggleAsientoDisponibilidad(asiento.numero)}
                      onDoubleClick={() => iniciarEdicionEtiqueta(asiento.numero, asiento.etiqueta)}
                      onDragStart={() => handleDragStart(asiento.numero)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(asiento.numero)}
                      isDragging={draggedAsiento === asiento.numero}
                    />
                  )}
                </div>
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
            {asientosIzquierda.map(asiento => (
              <div key={asiento.numero} className="relative">
                {asientoEditando === asiento.numero ? (
                  // Modo edición
                  <div className="w-16 h-16 rounded-xl bg-white border-3 border-blue-500 shadow-lg flex flex-col items-center justify-center p-1 gap-1">
                    <input
                      type="text"
                      value={etiquetaTemporal}
                      onChange={(e) => setEtiquetaTemporal(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') guardarEtiqueta(asiento.numero);
                        if (e.key === 'Escape') cancelarEdicion();
                      }}
                      className="w-full text-center text-xs font-bold border-0 focus:outline-none focus:ring-0 p-0"
                      maxLength={4}
                      autoFocus
                    />
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => guardarEtiqueta(asiento.numero)}
                        className="p-0.5 bg-green-500 rounded hover:bg-green-600"
                      >
                        <KeenIcon icon="check" className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="p-0.5 bg-red-500 rounded hover:bg-red-600"
                      >
                        <KeenIcon icon="cross" className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <AsientoSVG
                    asiento={asiento}
                    onClick={() => toggleAsientoDisponibilidad(asiento.numero)}
                    onDoubleClick={() => iniciarEdicionEtiqueta(asiento.numero, asiento.etiqueta)}
                    onDragStart={() => handleDragStart(asiento.numero)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(asiento.numero)}
                    isDragging={draggedAsiento === asiento.numero}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Pasillo central con líneas */}
          <div className="flex flex-col items-center justify-center w-12 h-16 relative">
            <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
            <div className="absolute inset-y-0 left-1/2 -translate-x-2 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
            <div className="absolute inset-y-0 left-1/2 translate-x-2 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
          </div>

          {/* Columna Derecha */}
          <div className="flex gap-2">
            {asientosDerecha.map(asiento => (
              <div key={asiento.numero} className="relative">
                {asientoEditando === asiento.numero ? (
                  // Modo edición
                  <div className="w-16 h-16 rounded-xl bg-white border-3 border-blue-500 shadow-lg flex flex-col items-center justify-center p-1 gap-1">
                    <input
                      type="text"
                      value={etiquetaTemporal}
                      onChange={(e) => setEtiquetaTemporal(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') guardarEtiqueta(asiento.numero);
                        if (e.key === 'Escape') cancelarEdicion();
                      }}
                      className="w-full text-center text-xs font-bold border-0 focus:outline-none focus:ring-0 p-0"
                      maxLength={4}
                      autoFocus
                    />
                    <div className="flex gap-0.5">
                      <button
                        onClick={() => guardarEtiqueta(asiento.numero)}
                        className="p-0.5 bg-green-500 rounded hover:bg-green-600"
                      >
                        <KeenIcon icon="check" className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={cancelarEdicion}
                        className="p-0.5 bg-red-500 rounded hover:bg-red-600"
                      >
                        <KeenIcon icon="cross" className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <AsientoSVG
                    asiento={asiento}
                    onClick={() => toggleAsientoDisponibilidad(asiento.numero)}
                    onDoubleClick={() => iniciarEdicionEtiqueta(asiento.numero, asiento.etiqueta)}
                    onDragStart={() => handleDragStart(asiento.numero)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(asiento.numero)}
                    isDragging={draggedAsiento === asiento.numero}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return resultado;
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalContent className="max-w-[1000px] top-[2%]">
        <ModalHeader className="p-5 flex justify-between items-center border-b bg-gradient-to-r to-indigo-50">
          <ModalTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="p-2  rounded-lg">
              <KeenIcon icon="cube-3" className="w-6 h-6 text-gray" />
            </div>
            <div>
              <p className="text-gray-800">Configuración de Asientos</p>
              <p className="text-xs font-normal text-gray-600">Vista aérea del vehículo</p>
            </div>
          </ModalTitle>
          <button
            className="p-2 rounded-full transition-colors hover:bg-gray-200"
            onClick={handleClose}
            aria-label="Cerrar"
          >
            <KeenIcon icon="cross" className="w-5 h-5" />
          </button>
        </ModalHeader>

        <ModalBody className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {!vistaPrevia ? (
            <>
              {/* Selector de Mapas Existentes */}
              <div className=" border rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold ">
                    Mapas Guardados
                  </h3>
                  <button
                    type="button"
                    onClick={nuevoMapa}
                    className="btn btn-sm btn-light-primary"
                    disabled={!mapaId}
                  >
                    <KeenIcon icon="plus" className="mr-1" />
                    Nuevo Mapa
                  </button>
                </div>
                
                {loadingMapas ? (
                  <div className="text-center py-2">
                    <span className="text-sm text-gray-600">Cargando mapas...</span>
                  </div>
                ) : mapasDisponibles.length > 0 ? (
                  <select
                    value={mapaId || ''}
                    onChange={(e) => e.target.value && cargarMapaExistente(parseInt(e.target.value))}
                    className="input w-full p-2 border  rounded-lg "
                  >
                    <option value="">Seleccionar mapa existente...</option>
                    {mapasDisponibles.map((mapa) => (
                      <option key={mapa.id} value={mapa.id}>
                        {mapa.nombreMapa || mapa.nombre_mapa} ({mapa.cantidadAsientos || mapa.cantidad_asientos} asientos - {mapa.tipoDistribucion || mapa.tipo_distribucion})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-2">
                    No hay mapas guardados. Crea uno nuevo.
                  </p>
                )}
              </div>

              {/* Formulario de Configuración */}
              <div className="grid grid-cols-2 gap-6">
                {/* Nombre del Mapa */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Mapa de Asientos *
                  </label>
                  <input
                    type="text"
                    value={nombreVehiculo}
                    onChange={(e) => setNombreVehiculo(e.target.value)}
                    placeholder="Ej. Bus Estándar 40 asientos"
                    className="input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Clase de Vehículo */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clase de Vehículo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={idClaseVehiculo}
                    onChange={(e) => setIdClaseVehiculo(e.target.value)}
                    className="input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione una clase de vehículo</option>
                    {claseVehiculos.map((clase) => (
                      <option key={clase.id} value={clase.id}>
                        {clase.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad de Asientos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Total de Asientos *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={cantidadAsientos}
                    onChange={(e) => setCantidadAsientos(parseInt(e.target.value) || 0)}
                    className="input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Distribución */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribución de Asientos *
                  </label>
                  <select
                    value={distribucion}
                    onChange={(e) => setDistribucion(e.target.value as TipoDistribucion)}
                    className="input w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2+2">2 + 2 (4 asientos por fila)</option>
                    <option value="2+1">2 + 1 (3 asientos por fila)</option>
                    <option value="1+2">1 + 2 (3 asientos por fila)</option>
                    <option value="1+1">1 + 1 (2 asientos por fila)</option>
                  </select>
                </div>

                {/* Lado de la Puerta */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación de la Puerta
                  </label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setLadoPuerta('izquierda')}
                      className={`
                        flex-1 p-4 rounded-lg border-2 transition-all
                        ${ladoPuerta === 'izquierda' 
                          ? 'border-blue-500  text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <KeenIcon icon="arrow-left" className="w-5 h-5" />
                        <span className="font-medium">Lado Izquierdo</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setLadoPuerta('derecha')}
                      className={`
                        flex-1 p-4 rounded-lg border-2 transition-all
                        ${ladoPuerta === 'derecha' 
                          ? 'border-blue-500 text-blue-700' 
                          : 'border-gray-300 hover:border-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span className="font-medium">Lado Derecho</span>
                        <KeenIcon icon="arrow-right" className="w-5 h-5" />
                      </div>
                    </button>
                  </div>
                </div>

                {/* Última Fila Especial */}
                <div className="col-span-2">
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="checkbox"
                      id="ultimaFilaEspecial"
                      checked={ultimaFilaEspecial}
                      onChange={(e) => setUltimaFilaEspecial(e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="ultimaFilaEspecial" className="text-sm font-medium text-gray-700 cursor-pointer">
                      <span className="flex items-center gap-2">
                        <KeenIcon icon="row-horizontal" className="w-4 h-4" />
                        Última fila especial (sin pasillo, todos juntos)
                      </span>
                    </label>
                  </div>
                  
                  {ultimaFilaEspecial && (
                    <div className="mt-3 p-4  rounded-lg border-2 ">
                      <label className="block text-sm font-medium mb-2">
                        Cantidad de asientos en última fila
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="7"
                        value={asientosUltimaFila}
                        onChange={(e) => setAsientosUltimaFila(parseInt(e.target.value) || 5)}
                        className="input w-full p-3 border  rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs  mt-2">
                        💡 Común: 5 asientos en la última fila trasera sin pasillo
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Información */}
              {/* <div className="bg-gradient-to-r  via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <KeenIcon icon="information-2" className="w-5 h-5 text-white shrink-0" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold  mb-1">💡 Información Importante</p>
                    <p className="text-xs  leading-relaxed">
                      Configura la cantidad de asientos y la distribución del vehículo. 
                      Luego podrás <strong>visualizar en vista aérea</strong> y personalizar cada asiento haciendo click sobre ellos.
                    </p>
                  </div>
                </div>
              </div> */}

              {/* Botones */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={handleClose}
                  className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setVistaPrevia(true)}
                  disabled={!nombreVehiculo.trim() || cantidadAsientos < 1}
                  className="flex items-center gap-2 px-5 py-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <KeenIcon icon="eye" className="w-4 h-4" />
                  Ver Vista Previa
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Vista Previa de Asientos */}
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r  via-indigo-50 to-purple-50 rounded-xl p-5 border-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                        <KeenIcon icon="bus" className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{nombreVehiculo}</h3>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <KeenIcon icon="abstract-26" className="w-4 h-4" />
                            {cantidadAsientos} asientos
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            <KeenIcon icon="menu" className="w-4 h-4" />
                            {distribucion}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span className="flex items-center gap-1">
                            <KeenIcon icon="exit-right" className="w-4 h-4" />
                            {ladoPuerta === 'izquierda' ? 'Izquierda' : 'Derecha'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setVistaPrevia(false)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-gray-300  text-gray-700 hover:border-gray-400 transition-all font-medium"
                    >
                      <KeenIcon icon="arrow-left" className="w-4 h-4" />
                      Volver
                    </button>
                  </div>
                </div>

                {/* Controles de Edición Rápida */}
                <div className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r  rounded-xl border-2 flex-wrap">
                  <button
                    type="button"
                    onClick={eliminarUltimoAsiento}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg  hover:bg-red-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <KeenIcon icon="minus-circle" className="w-4 h-4" />
                    <span className="font-medium">Eliminar Último</span>
                  </button>
                  
                  <div className="flex items-center gap-2 px-4 py-2  rounded-lg border-2 border-indigo-300">
                    <KeenIcon icon="abstract-26" className="w-5 h-5 text-indigo-600" />
                    <span className="font-bold text-lg text-indigo-900">{asientos.length}</span>
                    <span className="text-sm text-gray-600">asientos</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={agregarAsientoRapido}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <KeenIcon icon="plus-circle" className="w-4 h-4" />
                    <span className="font-medium">Agregar Asiento</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={generarEtiquetasAutomaticas}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-purple-600 transition-all shadow-md hover:shadow-lg"
                    title="Generar etiquetas automáticas (A1, A2, B1, B2...)"
                  >
                    <KeenIcon icon="text" className="w-4 h-4" />
                    <span className="font-medium">Auto-Etiquetar</span>
                  </button>
                </div>

                {/* Leyenda */}
                <div className="flex items-center justify-center gap-8 p-5  rounded-xl border-2  shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-md">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5">
                        <div className="w-full h-3 rounded-t-lg mb-0.5 bg-emerald-600 relative">
                          <div className="absolute inset-x-1 top-0.5 h-0.5 rounded-full bg-emerald-300 opacity-40"></div>
                        </div>
                        <div className="w-full flex-1 rounded-lg bg-emerald-600 flex items-center justify-center relative">
                          <div className="absolute inset-x-1.5 top-0.5 h-1 rounded-full bg-emerald-300 opacity-30"></div>
                          <span className="text-xs font-bold text-white z-10">1</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                        <KeenIcon icon="check-circle" className="w-4 h-4" />
                        Disponible
                      </p>
                      <p className="text-xs text-slate-600">Click para bloquear</p>
                    </div>
                  </div>
                  
                  <div className="w-px h-12 bg-slate-300"></div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 shadow-sm">
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1.5">
                        <div className="w-full h-3 rounded-t-lg mb-0.5 bg-gray-500 relative">
                          <div className="absolute inset-x-1 top-0.5 h-0.5 rounded-full bg-gray-300 opacity-40"></div>
                        </div>
                        <div className="w-full flex-1 rounded-lg bg-gray-500 flex items-center justify-center relative">
                          <div className="absolute inset-x-1.5 top-0.5 h-1 rounded-full bg-gray-300 opacity-30"></div>
                          <span className="text-xs font-bold text-white z-10">2</span>
                        </div>
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                        <KeenIcon icon="cross" className="w-2 h-2 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                        <KeenIcon icon="cross-circle" className="w-4 h-4" />
                        Bloqueado
                      </p>
                      <p className="text-xs text-slate-600">Click para habilitar</p>
                    </div>
                  </div>
                </div>

                {/* Representación del Bus - Canvas Configurable */}
                <div className="relative mx-auto max-w-2xl">
                  {/* Contenedor del bus con diseño mejorado */}
                  <div className="relative bg-gradient-to-b  rounded-[2.5rem] border-4 shadow-2xl overflow-visible">
                    {/* Líneas laterales del bus */}
                    <div className="absolute left-0 top-12 bottom-12 w-1 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>
                    <div className="absolute right-0 top-12 bottom-12 w-1 bg-gradient-to-b from-transparent via-slate-400 to-transparent"></div>
                    
                    {/* Frente del Bus - Cabina del Conductor */}
                    <div className="relative bg-gradient-to-b border  rounded-t-[2rem] py-4 shadow-inner">
                      <div className="flex items-center justify-center gap-4 px-6">
                        {/* Luces delanteras */}
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse"></div>
                          <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                        
                        {/* Parabrisas grandes */}
                        <div className="flex gap-2">
                          <div className="w-16 h-8 bg-gradient-to-br from-sky-200 to-blue-300 rounded-lg border-2 border-slate-600 shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12"></div>
                          </div>
                          <div className="w-16 h-8 bg-gradient-to-br from-sky-200 to-blue-300 rounded-lg border-2 border-slate-600 shadow-inner relative overflow-hidden">
                            <div className="absolute inset-0 bg-white opacity-20 transform -skew-x-12"></div>
                          </div>
                        </div>
                        
                        {/* Conductor */}
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-3 border-amber-600 flex items-center justify-center shadow-lg">
                            <KeenIcon icon="user" className="w-5 h-5 text-slate-800" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-md">
                            <div className="w-full h-full bg-emerald-400 rounded-full animate-ping opacity-75"></div>
                          </div>
                        </div>
                        
                        {/* Luces delanteras */}
                        <div className="flex gap-2">
                          <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                          <div className="w-3 h-3 bg-yellow-300 rounded-full shadow-lg shadow-yellow-500/50 animate-pulse" style={{ animationDelay: '0.9s' }}></div>
                        </div>
                      </div>
                      
                      {/* Placa o logo */}
                      {/* <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded text-[10px] font-bold text-slate-700 border-2 border-slate-600">
                        BUS-{cantidadAsientos}
                      </div> */}
                    </div>

                    {/* Contenedor principal con puerta */}
                    <div className="relative bg-gradient-to-b via-slate-50 to-white">
                      {/* Puerta Izquierda */}
                      {ladoPuerta === 'izquierda' && (
                        <div className="absolute left-0 top-8 -translate-x-8 z-10">
                          <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-r-xl px-4 py-3 shadow-2xl border-3 border-amber-600">
                            <div className="flex items-center gap-2">
                              <KeenIcon icon="exit-right" className="w-5 h-5 text-slate-800" />
                              <div>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">Puerta</p>
                                <p className="text-[8px] text-slate-700">Principal</p>
                              </div>
                            </div>
                            {/* Bisagras de puerta */}
                            <div className="absolute left-0 top-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                            <div className="absolute left-0 bottom-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                          </div>
                        </div>
                      )}

                      {/* Ventanas laterales decorativas */}
                      <div className="absolute left-2 top-4 bottom-4 w-2 flex flex-col gap-3">
                        {Array(Math.min(5, Math.ceil(asientos.length / 4))).fill(0).map((_, i) => (
                          <div key={i} className="w-full h-8 bg-gradient-to-r from-blue-200 to-sky-100 rounded-sm border border-slate-300 shadow-inner"></div>
                        ))}
                      </div>
                      <div className="absolute right-2 top-4 bottom-4 w-2 flex flex-col gap-3">
                        {Array(Math.min(5, Math.ceil(asientos.length / 4))).fill(0).map((_, i) => (
                          <div key={i} className="w-full h-8 bg-gradient-to-l from-blue-200 to-sky-100 rounded-sm border border-slate-300 shadow-inner"></div>
                        ))}
                      </div>

                      {/* Asientos - Canvas Principal */}
                      <div className="py-6 px-8">
                        {renderAsientos()}
                      </div>

                      {/* Puerta Derecha */}
                      {ladoPuerta === 'derecha' && (
                        <div className="absolute right-0 top-8 translate-x-8 z-10">
                          <div className="bg-gradient-to-l from-amber-400 to-amber-500 rounded-l-xl px-4 py-3 shadow-2xl border-3 border-amber-600">
                            <div className="flex items-center gap-2">
                              <div>
                                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide text-right">Puerta</p>
                                <p className="text-[8px] text-slate-700 text-right">Principal</p>
                              </div>
                              <KeenIcon icon="exit-left" className="w-5 h-5 text-slate-800" />
                            </div>
                            {/* Bisagras de puerta */}
                            <div className="absolute right-0 top-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                            <div className="absolute right-0 bottom-2 w-1 h-2 bg-slate-700 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Parte Trasera del Bus */}
                    <div className="relative bg-gradient-to-b border-t-4  rounded-b-[2rem] py-4 shadow-inner">
                      <div className="flex items-center justify-center gap-4">
                        {/* Luces traseras izquierda */}
                        <div className="flex flex-col gap-1">
                          <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-700 shadow-lg shadow-red-500/50 animate-pulse"></div>
                          <div className="w-4 h-4 bg-amber-400 rounded border-2 border-amber-600 shadow-lg"></div>
                        </div>
                        
                        {/* Motor / Bodega */}
                        <div className="text-center">
                          <KeenIcon icon="wrench" className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">Motor</p>
                          <p className="text-[8px] text-slate-400">Compartimento</p>
                        </div>
                        
                        {/* Luces traseras derecha */}
                        <div className="flex flex-col gap-1">
                          <div className="w-4 h-4 bg-red-500 rounded border-2 border-red-700 shadow-lg shadow-red-500/50 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                          <div className="w-4 h-4 bg-amber-400 rounded border-2 border-amber-600 shadow-lg"></div>
                        </div>
                      </div>
                      
                      {/* Matrícula trasera */}
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 px-4 py-1 bg-white rounded text-[10px] font-bold text-slate-700 border-2 border-slate-600">
                        {nombreVehiculo.substring(0, 10).toUpperCase() || 'VEHICULO'}
                      </div>
                    </div>
                  </div>

                  {/* Sombra del bus en el suelo - más realista */}
                  <div className="absolute -bottom-4 left-12 right-12 h-8 bg-gradient-radial from-slate-900/20 to-transparent rounded-full blur-xl"></div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative overflow-hidden bg-gradient-to-br  border-2 rounded-xl p-5 text-center group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
                    <KeenIcon icon="check-circle" className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-green-700 mb-1">
                      {asientos.filter(a => a.disponible).length}
                    </p>
                    <p className="text-xs font-medium text-green-800 uppercase tracking-wide">Disponibles</p>
                  </div>
                  
                  <div className="relative overflow-hidden bg-gradient-to-br   border-2 rounded-xl p-5 text-center group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gray-200 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
                    <KeenIcon icon="cross-circle" className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-700 mb-1">
                      {asientos.filter(a => !a.disponible).length}
                    </p>
                    <p className="text-xs font-medium text-gray-800 uppercase tracking-wide">Bloqueados</p>
                  </div>
                  
                  <div className="relative overflow-hidden bg-gradient-to-br  border-2 rounded-xl p-5 text-center group hover:shadow-lg transition-all">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -translate-y-10 translate-x-10 opacity-50"></div>
                    <KeenIcon icon="cube-3" className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-blue-700 mb-1">
                      {asientos.length}
                    </p>
                    <p className="text-xs font-medium text-blue-800 uppercase tracking-wide">Total</p>
                  </div>
                </div>

                {/* Instrucción */}
                {/* <div className="bg-gradient-to-r   border-2  rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500 rounded-lg">
                      <KeenIcon icon="information-2" className="w-5 h-5 text-white shrink-0" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-amber-900">💡 Cómo Usar el Editor</p>
                      <ul className="text-xs text-amber-800 leading-relaxed space-y-1 list-disc list-inside">
                        <li><strong>Click simple:</strong> Cambiar disponibilidad (verde = disponible, gris = bloqueado)</li>
                        <li><strong>Doble click:</strong> Editar etiqueta del asiento (Ej: A1, B2, C12, etc.)</li>
                        <li><strong>Arrastrar (Drag & Drop):</strong> Reordenar asientos intercambiando posiciones</li>
                        <li><strong>Botones +/-:</strong> Agregar o eliminar asientos rápidamente</li>
                        <li><strong>Última fila especial:</strong> {ultimaFilaEspecial ? `${asientosUltimaFila} asientos sin pasillo` : 'No configurada'}</li>
                      </ul>
                    </div>
                  </div>
                </div> */}

                {/* Botones de Acción */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    onClick={() => setVistaPrevia(false)}
                    disabled={loadingGuardar}
                    className="px-5 py-2 rounded-md border  text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    Volver a Editar
                  </button>
                  <button
                    onClick={guardarConfiguracion}
                    disabled={loadingGuardar}
                    className="flex items-center gap-2 px-5 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingGuardar ? (
                      <>
                        <KeenIcon icon="loading" className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <KeenIcon icon="check" className="w-4 h-4" />
                        Guardar Configuración
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export { ModalConfigurarAsientos };
export default ModalConfigurarAsientos;
