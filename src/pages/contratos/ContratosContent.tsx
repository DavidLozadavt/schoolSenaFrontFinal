import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { ContratoInterface } from './model/ContratoInterface';
import clsx from 'clsx';
import { CommonAvatar } from '@/partials/common/CommonAvatar';
import { User, Calendar, Folder, CreditCard, ChevronRight, Building, Briefcase } from 'lucide-react';
import { useAuthContext } from '@/auth';

interface ContratosContentProps {
  reload: boolean;
}

const ContratoContent = ({ reload }: ContratosContentProps) => {
  const storageFilterId = 'contratos-filter';
  const [contratos, setContratos] = useState<ContratoInterface[]>([]);
  const [centrosFormacion, setCentrosFormacion] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(() => {
    return localStorage.getItem(storageFilterId) || '';
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [selectedCentroFormacion, setSelectedCentroFormacion] = useState<number | null>(null);
  
  const authContext = useAuthContext();
  const { user, empresa, roles } = authContext;

  const [showEmpresaSelect, setShowEmpresaSelect] = useState<boolean>(false);
  const [showCentroSelect, setShowCentroSelect] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (roles.length === 0) {
      return;
    }

    console.log('Roles del AuthContext:', roles);
    
    const adminRoles = ['ADMINISTRADOR VT', 'ADMIN REGIONAL'];
    const hasAdminRole = roles.some((role: string) => adminRoles.includes(role.toUpperCase()));
    
    console.log('¿Es admin?', hasAdminRole);
    
    setIsAdmin(hasAdminRole);
    
    if (roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) {
      console.log('Configurando para ADMINISTRADOR VT');
      setShowEmpresaSelect(true);
      setShowCentroSelect(true);
    } else if (roles.some((role: string) => role.toUpperCase() === 'ADMIN REGIONAL')) {
      console.log('Configurando para ADMIN REGIONAL');
      setShowEmpresaSelect(false);
      setShowCentroSelect(true);
    } else {
      console.log('Configurando para usuario normal - sin selects');
      setShowEmpresaSelect(false);
      setShowCentroSelect(false);
    }
    
    setLoading(false);
  }, [roles]);

  const handleContrato = useCallback((id: number) => {
    navigate(`/gestion-contratos/contratos/contrato`, { state: id });
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem(storageFilterId, searchTerm);
    setCurrentPage(0);
  }, [searchTerm]);

  const fetchEmpresas = async () => {
    if (!showEmpresaSelect) return;
    
    try {
      const response = await axios.get('regional');
      console.log('Empresas cargadas:', response.data);
      setEmpresas(response.data);
    } catch (error) {
      console.error('Error al cargar empresas:', error);
    }
  };

  const fetchDatosAdminVT = async () => {
    if (!roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) {
      return;
    }
    
    setLoading(true);
    try {
      if (!selectedEmpresa) {
        console.log('ADMINISTRADOR VT necesita seleccionar una empresa');
        setContratos([]);
        setCentrosFormacion([]);
        setLoading(false);
        return;
      }

      const params: any = {
        idCompany: selectedEmpresa
      };
      
      if (selectedCentroFormacion !== null) {
        params.idCentroFormacion = selectedCentroFormacion;
        console.log('Agregando idCentroFormacion:', selectedCentroFormacion);
      }
      
      console.log('=== FETCH DATOS ADMINISTRADOR VT ===');
      console.log('selectedEmpresa:', selectedEmpresa);
      console.log('selectedCentroFormacion:', selectedCentroFormacion);
      console.log('Parámetros enviados:', params);
      
      const response = await axios.get('contratos/flujo-vt', { params });
      console.log('Respuesta completa del backend:', response.data);
      
      if (response.data.data) {
        setCentrosFormacion(response.data.data.centros || []);
        setContratos(response.data.data.contratos || []);
        
        console.log('Centros actualizados:', response.data.data.centros?.length || 0);
        console.log('Contratos actualizados:', response.data.data.contratos?.length || 0);
      }
      
    } catch (error) {
      console.error('Error al cargar los datos (ADMINISTRADOR VT):', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCentrosFormacion = async () => {
    if (!showCentroSelect) return;
    
    try {
      let centrosData = [];
      
      if (showEmpresaSelect && selectedEmpresa) {
        console.log('Filtrando centros por empresa:', selectedEmpresa);
        const response = await axios.get(`centrosFormacion/regional/${selectedEmpresa}`);
        centrosData = response.data.data || response.data || [];
        console.log('Centros filtrados por empresa:', centrosData);
      } else {
        console.log('Cargando todos los centros');
        const response = await axios.get('centrosFormacion');
        centrosData = response.data || [];
        console.log('Todos los centros:', centrosData);
      }
      
      setCentrosFormacion(Array.isArray(centrosData) ? centrosData : []);
    } catch (error) {
      console.error('Error al cargar centros de formación:', error);
      setCentrosFormacion([]);
    }
  };

  const fetchContratos = async () => {
  
    setLoading(true);
    try {
      const params: any = {};
      
      console.log('=== FETCH CONTRATOS ===');
      console.log('Roles en fetchContratos:', roles);
      
      if (roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) {
        await fetchDatosAdminVT();
        return;
      }
      else if (roles.some((role: string) => role.toUpperCase() === 'ADMIN REGIONAL')) {
        console.log('Es ADMIN REGIONAL');
        if (selectedCentroFormacion !== null) {
          params.idCentroFormacion = selectedCentroFormacion;
          console.log('Agregando idCentroFormacion:', selectedCentroFormacion);
        }
      }
      else {
        console.log('Es usuario normal - backend filtrará por centro asignado');
      }
      
      console.log('Parámetros enviados:', params);
      
      const response = await axios.get('contratos', { params });
      console.log('Respuesta del backend:', response.data);
      console.log('Cantidad de contratos:', response.data.length);
      
      setContratos(response.data);
    } catch (error) {
      console.error('Error al cargar los contratos:', error);
      setError('Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect fetchEmpresas - showEmpresaSelect:', showEmpresaSelect);
    fetchEmpresas();
  }, [showEmpresaSelect]);

  useEffect(() => {
    console.log('useEffect fetchCentrosFormacion - showCentroSelect:', showCentroSelect);
    
    if (roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) {
      return;
    }
    
    fetchCentrosFormacion();
  }, [showCentroSelect, selectedEmpresa, showEmpresaSelect, roles]);

  useEffect(() => {
    console.log('useEffect fetchContratos - isAdmin:', isAdmin, 'reload:', reload);
    
    fetchContratos();
  }, [reload, selectedEmpresa, selectedCentroFormacion]);

  useEffect(() => {
    console.log('useEffect reset centro - selectedEmpresa:', selectedEmpresa);
    if (selectedEmpresa && showEmpresaSelect) {
      setSelectedCentroFormacion(null);
    }
  }, [selectedEmpresa, showEmpresaSelect]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return contratos;

    const searchLower = searchTerm.toLowerCase();
    return contratos.filter(
      (contrato) =>
        (contrato.persona?.nombre1?.toLowerCase().includes(searchLower) ||
         contrato.persona?.nombre1?.toLowerCase().includes(searchLower) ||
         contrato.persona?.apellido1?.toLowerCase().includes(searchLower) ||
         contrato.persona?.identificacion?.toLowerCase().includes(searchLower) ||
         contrato.id?.toString().includes(searchLower) ||
         contrato.estado?.estado?.toLowerCase().includes(searchLower) ||
         contrato.salario?.rol?.name?.toLowerCase().includes(searchLower))
    );
  }, [searchTerm, contratos]);

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const getEstadoBadgeClass = (estado: string | undefined) => {
    if (!estado) return 'badge-success';
    const estadoUpper = estado.toUpperCase();
    if (estadoUpper === 'ACTIVO') return 'badge-success';
    if (estadoUpper === 'INTERRUMPIDO') return 'badge-danger';
    if (estadoUpper === 'ADICION DE CONTRATO' || estadoUpper.includes('ADICION')) return 'badge-warning';
    return 'badge-success';
  };

  const getNombreCompleto = (contrato: ContratoInterface) => {
    if (roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT') && contrato.persona?.nombre1) {
      return contrato.persona.nombre1;
    }
    
    const nombre1 = contrato.persona?.nombre1 || '';
    const nombre2 = contrato.persona?.nombre2 || '';
    const apellido1 = contrato.persona?.apellido1 || '';
    const apellido2 = contrato.persona?.apellido2 || '';
    return `${nombre1} ${nombre2} ${apellido1} ${apellido2}`.trim().toUpperCase();
  };

  const renderItem = (contrato: ContratoInterface, index: number) => {
    const estado = contrato.estado?.estado || 'ACTIVO';
    const nombreCompleto = getNombreCompleto(contrato);
    const fotoUrl = contrato.persona?.rutaFotoUrl;

    return (
      <div
        key={contrato.id || index}
        className="card cursor-pointer hover:shadow-xl transition-all duration-300 group hover:scale-[1.02]"
        onClick={() => handleContrato(contrato.id!)}
      >
        <div className="card-body p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                {fotoUrl ? (
                  <CommonAvatar
                    className="w-full h-full"
                    image={fotoUrl}
                    imageClass="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-primary transition-colors duration-300">
                  {nombreCompleto}
                </h4>
              </div>
            </div>
            <span
              className={clsx(
                'badge shrink-0 text-xs font-medium',
                estado.toUpperCase() === 'ACTIVO'
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'badge-outline ' + getEstadoBadgeClass(estado)
              )}
            >
              {estado}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Código:</span> {contrato.id}
            </p>
          </div>

          <div className="space-y-2.5 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <CreditCard className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="truncate text-sm">
                {contrato.persona?.identificacion || 'N/A'}
              </span>
            </div>

            {contrato.salario?.rol?.name && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate text-sm">{contrato.salario.rol.name}</span>
              </div>
            )}

            {contrato.area?.nombre && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Folder className="w-4 h-4 text-gray-500 shrink-0" />
                <span className="truncate text-sm">{contrato.area.nombre}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
              <span className="truncate text-sm">
                {formatDate(contrato.fechaContratacion)} -{' '}
                {contrato.fechaFinalContrato
                  ? formatDate(contrato.fechaFinalContrato)
                  : 'Indefinido'}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-active transition-colors duration-300 w-full"
              onClick={(e) => {
                e.stopPropagation();
                handleContrato(contrato.id!);
              }}
            >
              Ver más información
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Cargando contratos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-w-full">
      <div className="mb-6 space-y-4">
        <div className="relative">
          <KeenIcon
            icon="magnifier"
            className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3 z-10"
          />
          <input
            type="text"
            placeholder="Buscar por nombre, identificación o código..."
            className="input input-sm pl-10 w-full max-w-md"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {showEmpresaSelect && (
            <div className="relative">
              <Briefcase className="w-4 h-4 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2 z-10" />
              <select
                className="select select-sm pl-10 w-full min-w-[200px]"
                value={selectedEmpresa || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  console.log('Cambio de empresa:', value);
                  setSelectedEmpresa(value);
                  setCurrentPage(0);
                }}
              >
                <option value="">Seleccionar empresa</option>
                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.razonSocial}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showCentroSelect && (
            <div className="relative">
              <Building className="w-4 h-4 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2 z-10" />
              <select
                className="select select-sm pl-10 w-full min-w-[250px]"
                value={selectedCentroFormacion || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  console.log('Cambio de centro:', value);
                  setSelectedCentroFormacion(value);
                  setCurrentPage(0);
                }}
              >
                <option value="">Seleccionar centro</option>
                {centrosFormacion.map((centro) => (
                  <option key={centro.id} value={centro.id}>
                    {centro.nombre} - {centro.empresa?.razonSocial || ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="badge badge-info">
            Rol: {roles.join(', ') || 'Cargando...'}
          </span>
          
          {selectedEmpresa && (
            <span className="badge badge-primary">
              Empresa: {empresas.find(e => e.id === selectedEmpresa)?.razonSocial}
              <button
                className="ml-2 text-xs hover:text-primary-active"
                onClick={() => {
                  setSelectedEmpresa(null);
                  setCurrentPage(0);
                }}
              >
                ×
              </button>
            </span>
          )}

          {selectedCentroFormacion && (
            <span className="badge badge-primary">
              Centro: {centrosFormacion.find(c => c.id === selectedCentroFormacion)?.nombre}
              <button
                className="ml-2 text-xs hover:text-primary-active"
                onClick={() => {
                  setSelectedCentroFormacion(null);
                  setCurrentPage(0);
                }}
              >
                ×
              </button>
            </span>
          )}
        </div>
      </div>

      {currentData.length === 0 ? (
        <div className="card card-grid">
          <div className="card-body text-center py-12">
            <p className="text-gray-500">No se encontraron contratos</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7.5">
            {currentData.map((contrato, index) => renderItem(contrato, index))}
          </div>

          <div className="card-footer mt-3 justify-center md:justify-between flex-col md:flex-row gap-3 text-gray-600 text-2sm font-medium">
            <div className="flex items-center gap-2">
              Mostrando
              <select
                className="select select-sm w-16"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(0);
                }}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              Por página
            </div>
            <div className="flex items-center gap-4 order-1 md:order-2">
              <span>
                {startIndex + 1} - {Math.min(endIndex, filteredData.length)} de {filteredData.length}
              </span>
              <div className="pagination flex gap-2">
                <button
                  className="btn"
                  disabled={currentPage === 0}
                  onClick={() => handlePageClick({ selected: currentPage - 1 } as any)}
                >
                  <KeenIcon icon="left" />
                </button>
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  let pageNum;
                  if (pageCount <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > pageCount - 4) {
                    pageNum = pageCount - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      className={clsx('btn', {
                        'btn-primary': currentPage === pageNum,
                        'btn-light': currentPage !== pageNum
                      })}
                      onClick={() => handlePageClick({ selected: pageNum } as any)}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  className="btn"
                  disabled={currentPage >= pageCount - 1}
                  onClick={() => handlePageClick({ selected: currentPage + 1 } as any)}
                >
                  <KeenIcon icon="right" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export { ContratoContent };