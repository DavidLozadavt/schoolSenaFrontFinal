import React, { useState, useEffect } from 'react';
import { Search, Calendar, AlertCircle, CheckCircle, Clock, Filter, X } from 'lucide-react';
import axios from 'axios';
import ModalRevisionPreoperacional from '@/pages/puntos-de-venta/Caja/MoldalRevisionPreoperacional';
import { ApiResponse, VehiculoRevision } from './model/RevisionvehiculosInterface';
import ModalRevisionAnterior from './ModalRevisionAnterior';

const RevisionVehiculosContent = ({ reload }: { reload?: boolean }) => {
  const [vehiculos, setVehiculos] = useState<VehiculoRevision[]>([]);
  const [filteredVehiculos, setFilteredVehiculos] = useState<VehiculoRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'revision' | 'rechazo'>('todos');
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoRevision | null>(null);
  const [isModalRevisionOpen, setIsModalRevisionOpen] = useState(false);
  const [isModalRevisionAnteriorOpen, setIsModalRevisionAnteriorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarVehiculos();
  }, [reload]);

  useEffect(() => {
    aplicarFiltros();
  }, [searchTerm, fechaInicio, fechaFin, tipoFiltro, vehiculos]);

  const cargarVehiculos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/vehiculos_con_rechazos', {});
      const data: ApiResponse = await response.data;
      setVehiculos(data.data || []);
    } catch (error) {
      console.error('Error al cargar vehículos:', error);
      setError(error instanceof Error ? error.message : 'Error al cargar los vehículos');
      setVehiculos([]);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...vehiculos];

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.vehiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vehiculo.marca.marca.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (tipoFiltro === 'revision') {
      filtered = filtered.filter((v) => v.tienePorRevision);
    } else if (tipoFiltro === 'rechazo') {
      filtered = filtered.filter((v) => v.tieneRechazo);
    }

    if (fechaInicio || fechaFin) {
      filtered = filtered.filter((v) => {
        const fechas = [
          ...v.porRevision.map((r) => new Date(r.fechaRevision)),
          ...v.rechazos.map((r) => new Date(r.fechaRechazo))
        ];
        return fechas.some((fecha) => {
          const cumpleInicio = !fechaInicio || fecha >= new Date(fechaInicio);
          const cumpleFin = !fechaFin || fecha <= new Date(fechaFin + 'T23:59:59');
          return cumpleInicio && cumpleFin;
        });
      });
    }

    setFilteredVehiculos(filtered);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFechaInicio('');
    setFechaFin('');
    setTipoFiltro('todos');
  };

  const formatFecha = (fecha?: string | null) => {
    if (!fecha || isNaN(new Date(fecha).getTime())) return 'Sin fecha';
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Error al cargar los vehículos
            </h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={cargarVehiculos}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      {/* Filtros */}
      <div className="rounded-lg shadow-sm p-6 border border-gray-200 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </h2>
          {(searchTerm || fechaInicio || fechaFin || tipoFiltro !== 'todos') && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por placa o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div className="relative">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="input"
            />
          </div>

          <div className="relative">
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="input"
            />
          </div>

          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value as any)}
            className="select"
          >
            <option value="todos">Todos</option>
            <option value="revision">Por Revisión</option>
            <option value="rechazo">Rechazados</option>
          </select>
        </div>

        <div className="flex gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-gray-600">Por revisión:</span>
            <span className="font-semibold text-amber-600">
              {vehiculos.filter((v) => v.tienePorRevision).length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-gray-600">Rechazados:</span>
            <span className="font-semibold text-red-600">
              {vehiculos.filter((v) => v.tieneRechazo).length}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-gray-600" />
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold">{vehiculos.length}</span>
          </div>
        </div>
      </div>

      {/* Lista de Vehículos */}
      <div className="space-y-3">
        {filteredVehiculos.length === 0 ? (
          <div className="rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              No se encontraron vehículos con los filtros aplicados
            </p>
          </div>
        ) : (
          filteredVehiculos.map((item) => (
            <div
              key={item.vehiculo.id}
              className="rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Imagen del vehículo */}
                  <div className="flex-shrink-0">
                    <img
                      src={item.vehiculo.foto}
                      alt={`${item.vehiculo.marca.marca} ${item.vehiculo.placa}`}
                      className="w-full md:w-48 h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/200x150?text=Sin+Imagen';
                      }}
                    />
                  </div>

                  {/* Información */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {item.vehiculo.marca.marca} - {item.vehiculo.modelo.modelo}
                        </h3>
                        <p className="text-lg text-gray-600 font-mono">{item.vehiculo.placa}</p>
                      </div>
                      <div className="flex gap-2">
                        {item.tienePorRevision && (
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Por Revisión
                          </span>
                        )}
                        {item.tieneRechazo && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Rechazado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Por revisión */}
                    {item.porRevision.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Pendientes de Revisión ({item.porRevision.length})
                        </h4>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-2 custom-scroll">
                          {item.porRevision.map((rev, idx) => (
                            <div key={idx} className="border-l-4 border-amber-400 p-3 rounded">
                              <p className="text-sm font-medium text-gray-800">{rev.detalle}</p>
                              <p className="text-sm text-gray-600 mt-1">{rev.observacion}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFecha(rev.fechaRevision)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rechazados */}
                    {item.rechazos.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Rechazados ({item.rechazos.length})
                        </h4>
                        <div className="space-y-2 max-h-52 overflow-y-auto pr-2 custom-scroll">
                          {item.rechazos.map((rec, idx) => (
                            <div key={idx} className="border-l-4 border-red-400 p-3 rounded">
                              <p className="text-sm font-medium text-gray-800">{rec.detalle}</p>
                              <p className="text-sm text-gray-600 mt-1">{rec.observacion}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFecha(rec.fechaRechazo)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedVehiculo(item);
                      setIsModalRevisionAnteriorOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Ver revisión anterior
                  </button>

                  {(item.tienePorRevision || item.tieneRechazo) && (
                    <button
                      onClick={() => {
                        setSelectedVehiculo(item);
                        setIsModalRevisionOpen(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Revisar nuevamente
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modales */}
      <ModalRevisionAnterior
        open={isModalRevisionAnteriorOpen}
        onClose={() => {
          setIsModalRevisionAnteriorOpen(false);
          setSelectedVehiculo(null);
        }}
        idVehiculo={selectedVehiculo?.vehiculo.id}
      />

      <ModalRevisionPreoperacional
        open={isModalRevisionOpen}
        onClose={() => {
          setIsModalRevisionOpen(false);
          setSelectedVehiculo(null);
        }}
        onSave={async () => {
          cargarVehiculos();
          setIsModalRevisionOpen(false);
        }}
        idVehiculo={selectedVehiculo?.vehiculo.id}
      />
    </div>
  );
};

export default RevisionVehiculosContent;
