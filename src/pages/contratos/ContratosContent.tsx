import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeenIcon } from '@/components';
import axios from 'axios';
import { ContratoInterface } from './model/ContratoInterface';
import clsx from 'clsx';
import { toAbsoluteUrl } from '@/utils/Assets';
import { Calendar, Folder, CreditCard, ChevronRight, Building, Briefcase } from 'lucide-react';
import { useAuthContext } from '@/auth';
import ReactPaginate from 'react-paginate';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

type ContractPhotoProps = {
  src?: string | null;
};

const normalizePhotoUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  const value = String(raw).trim();
  if (!value) return null;

  // Already absolute URLs or data URIs
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;

  // Laravel suele devolver algo como:
  // - "storage/persona/xxx.jpg"
  // - "/storage/persona/xxx.jpg"
  // - "storage\\persona\\xxx.jpg"
  // Detectamos variantes de "storage" sin depender de los slashes exactos.
  const isStoragePath =
    value.includes('/storage/') ||
    value.includes('\\storage\\') ||
    value.includes('/storage') ||
    value.includes('\\storage') ||
    value.startsWith('storage/');

  // Laravel storage images suelen venir como "storage/..." o "/storage/...".
  // En esas rutas el host real suele ser el backend (VITE_APP_API_URL), no el front.
  if (isStoragePath) {
    const API_URL = import.meta.env.VITE_APP_API_URL || '';
    const baseUrl = API_URL.endsWith('/api/') ? API_URL.slice(0, -5) : API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const storageValue = value.replace(/\\/g, '/');
    const normalized = storageValue.startsWith('/') ? storageValue : `/${storageValue}`;
    return baseUrl ? `${baseUrl}${normalized}` : normalized;
  }

  // Rutas tipo "media/..." o similares (assets del front/back por el mismo host)
  if (!value.startsWith('/')) return toAbsoluteUrl(`/${value}`);
  return toAbsoluteUrl(value);
};

// Precarga la imagen. Mientras carga (cuando hay src) no mostramos nada para evitar parpadeos.
// Si no hay foto o falla, mostramos el ícono (avatar) como fallback.
const ContractPhoto = ({ src }: ContractPhotoProps) => {
  const normalizedSrc = useMemo(() => normalizePhotoUrl(src), [src]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>(
    normalizedSrc ? 'loading' : 'idle'
  );

  useEffect(() => {
    if (!normalizedSrc) {
      setStatus('idle');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      setStatus('loaded');
    };
    img.onerror = () => {
      if (cancelled) return;
      setStatus('error');
    };
    img.src = normalizedSrc;

    return () => {
      cancelled = true;
    };
  }, [normalizedSrc]);

  if (status === 'loaded' && normalizedSrc) {
    return (
      <Zoom>
        <img
          src={normalizedSrc}
          alt=""
          className="h-full w-full cursor-zoom-in object-cover object-center"
          draggable={false}
        />
      </Zoom>
    );
  }

  // Mientras carga, mostramos el "avatar" para no dejar el espacio vacío.
  // Cuando termine de cargar, reemplazamos por la foto (o por avatar si falla).
  if (status === 'loading') {
    return <KeenIcon icon="user" className="text-xl text-gray-400" />;
  }

  return <KeenIcon icon="user" className="text-xl text-gray-400" />;
};

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
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem(storageFilterId) || '');
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [selectedCentroFormacion, setSelectedCentroFormacion] = useState<number | null>(null);

  const authContext = useAuthContext();
  const { user, empresa, roles } = authContext;

  const [showEmpresaSelect, setShowEmpresaSelect] = useState(false);
  const [showCentroSelect, setShowCentroSelect] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (roles.length === 0) return;

    const adminRoles = ['ADMINISTRADOR VT', 'ADMIN REGIONAL'];
    setIsAdmin(roles.some((role: string) => adminRoles.includes(role.toUpperCase())));

    if (roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) {
      setShowEmpresaSelect(true);
      setShowCentroSelect(true);
    } else if (roles.some((role: string) => role.toUpperCase() === 'ADMIN REGIONAL')) {
      setShowEmpresaSelect(false);
      setShowCentroSelect(true);
    } else {
      setShowEmpresaSelect(false);
      setShowCentroSelect(false);
    }
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
      setEmpresas(response.data);
    } catch {
      /* silencioso */
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, [showEmpresaSelect]);

  const fetchDatosAdminVT = async (signal?: AbortSignal) => {
    if (!roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) return;

    setLoading(true);
    try {
      if (!selectedEmpresa) {
        setContratos([]);
        setCentrosFormacion([]);
        setLoading(false);
        return;
      }
      const params: any = { idCompany: selectedEmpresa };
      if (selectedCentroFormacion !== null) {
        params.idCentroFormacion = selectedCentroFormacion;
      }
      const response = await axios.get('contratos/flujo-vt', { params, signal });
      if (response.data.data) {
        setCentrosFormacion(response.data.data.centros || []);
        setContratos(response.data.data.contratos || []);
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCentrosFormacion = async (signal?: AbortSignal) => {
    if (!showCentroSelect) return;
    try {
      let centrosData: any[] = [];
      if (showEmpresaSelect && selectedEmpresa) {
        const response = await axios.get(`centrosFormacion/regional/${selectedEmpresa}`, { signal });
        centrosData = response.data.data || response.data || [];
      } else {
        const response = await axios.get('centrosFormacion', { signal });
        centrosData = response.data || [];
      }
      setCentrosFormacion(Array.isArray(centrosData) ? centrosData : []);
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      setCentrosFormacion([]);
    }
  };

  const fetchContratos = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params: any = {};
      if (roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) {
        await fetchDatosAdminVT(signal);
        return;
      } else if (roles.some((role: string) => role.toUpperCase() === 'ADMIN REGIONAL')) {
        if (selectedCentroFormacion !== null) {
          params.idCentroFormacion = selectedCentroFormacion;
        }
      }
      const response = await axios.get('contratos', { params, signal });
      setContratos(response.data);
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      setError('Error al cargar los contratos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roles.some((role: string) => role.toUpperCase() === 'ADMINISTRADOR VT')) return;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    fetchCentrosFormacion(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [showCentroSelect, selectedEmpresa, showEmpresaSelect, roles]);

  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    fetchContratos(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [reload, selectedEmpresa, selectedCentroFormacion, roles]);

  useEffect(() => {
    if (selectedEmpresa && showEmpresaSelect) {
      setSelectedCentroFormacion(null);
    }
  }, [selectedEmpresa, showEmpresaSelect]);

  const filteredData = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const list = !searchTerm
      ? [...contratos]
      : contratos.filter(
          (contrato) =>
            contrato.persona?.nombre1?.toLowerCase().includes(searchLower) ||
            contrato.persona?.nombre2?.toLowerCase().includes(searchLower) ||
            contrato.persona?.apellido1?.toLowerCase().includes(searchLower) ||
            contrato.persona?.apellido2?.toLowerCase().includes(searchLower) ||
            (contrato.persona as any)?.nombreCompleto?.toLowerCase?.().includes(searchLower) ||
            (contrato.persona as any)?.nombre?.toLowerCase?.().includes(searchLower) ||
            (contrato.persona as any)?.apellidos?.toLowerCase?.().includes(searchLower) ||
            contrato.persona?.identificacion?.toLowerCase().includes(searchLower) ||
            contrato.id?.toString().includes(searchLower) ||
            contrato.estado?.estado?.toLowerCase().includes(searchLower) ||
            contrato.salario?.rol?.name?.toLowerCase().includes(searchLower)
        );

    // Orden estable por código de contrato (id), ascendente
    list.sort((a, b) => Number(a.id ?? 0) - Number(b.id ?? 0));
    return list;
  }, [searchTerm, contratos]);

  const pageCount = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const currentData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  const getEstadoBadgeClass = (estado: string | undefined) => {
    const estadoUpper = (estado || '').toUpperCase();

    // Estilos tipo "badge" para que coincidan con el mockup de tarjetas.
    // Se combina con clases base en el <span>.
    if (estadoUpper === 'ACTIVO') return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    if (estadoUpper === 'INTERRUMPIDO') return 'bg-red-50 text-red-700 border-red-300';
    if (estadoUpper === 'ADICION DE CONTRATO' || estadoUpper.includes('ADICION')) return 'bg-yellow-50 text-yellow-700 border-yellow-300';

    // Fallback (mockup muestra verde para activos; usamos el mismo tono).
    return 'bg-emerald-50 text-emerald-700 border-emerald-300';
  };

  const getNombreCompleto = (contrato: ContratoInterface) => {
    const persona = contrato.persona;
    if (!persona) return '';

    const partes = [persona.nombre1, persona.nombre2, persona.apellido1, persona.apellido2]
      .filter((p) => p && String(p).trim())
      .map((p) => String(p).trim());

    if (partes.length > 0) {
      return partes.join(' ');
    }

    const alternoNombreCompleto = (persona as any).nombreCompleto;
    if (alternoNombreCompleto && String(alternoNombreCompleto).trim()) {
      return String(alternoNombreCompleto).trim();
    }

    const alternoNombre = (persona as any).nombre;
    const alternoApellidos = (persona as any).apellidos;
    const alterno = [alternoNombre, alternoApellidos]
      .filter((p) => p && String(p).trim())
      .map((p) => String(p).trim())
      .join(' ');

    return alterno || '';
  };

  const getFotoPerfil = (contrato: ContratoInterface) => {
    const persona = contrato.persona as any;
    return (
      persona?.rutaFotoUrl ||
      persona?.rutaFoto ||
      persona?.foto ||
      persona?.photoURL ||
      ''
    );
  };

  const toTitleCase = (value: string) =>
    value
      .toLowerCase()
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const getNombreCorto = (contrato: ContratoInterface) => {
    const persona = contrato.persona as any;
    if (!persona) return '';

    const n1 = String(persona?.nombre1 || '').trim();
    const a1 = String(persona?.apellido1 || '').trim();
    if (n1 || a1) {
      return toTitleCase(`${n1} ${a1}`.trim());
    }

    const completo = getNombreCompleto(contrato);
    const partes = completo.split(' ').filter(Boolean);
    if (partes.length === 0) return '';
    if (partes.length === 1) return toTitleCase(partes[0]);
    return toTitleCase(`${partes[0]} ${partes[1]}`);
  };

  /** Solo primer nombre y primer apellido en la tarjeta. */
  const nombreTitularTarjeta = (contrato: ContratoInterface) => {
    const persona = contrato.persona as any;
    if (!persona) return 'Sin nombre';
    const n1 = String(persona.nombre1 || '').trim();
    const a1 = String(persona.apellido1 || '').trim();
    if (n1 || a1) {
      const corto = `${n1} ${a1}`.trim();
      return corto ? toTitleCase(corto) : 'Sin nombre';
    }
    const palabras = getNombreCompleto(contrato).trim().split(/\s+/).filter(Boolean);
    if (palabras.length >= 2) return toTitleCase(`${palabras[0]} ${palabras[1]}`);
    if (palabras.length === 1) return toTitleCase(palabras[0]);
    return 'Sin nombre';
  };

  const renderItem = (contrato: ContratoInterface, index: number) => {
    const estadoTexto = contrato.estado?.estado || 'ACTIVO';
    const fechaFin = contrato.fechaFinalContrato
      ? formatDate(contrato.fechaFinalContrato as string)
      : 'Indefinido';

    const areaNombre =
      (contrato as any)?.area?.nombre ?? (contrato as any)?.area?.nombreAreaConocimiento ?? '';
    const areaId = (contrato as any)?.idArea ?? (contrato as any)?.area?.id ?? '';
    const areaValue = (String(areaNombre || areaId).trim() || '—') as string;

    const codigoValue = contrato.id ?? '—';
    const nombreCard = nombreTitularTarjeta(contrato);
    const cargoValue = contrato.salario?.rol?.name || 'Sin cargo asignado';
    const identificacionValue = contrato.persona?.identificacion || '—';
    const fechaInicio = formatDate(contrato.fechaContratacion as string);

    return (
      <div
        key={String(contrato.id ?? index)}
        className="group relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-[0_20px_45px_-24px_rgba(15,23,42,0.38)] dark:border-gray-700 dark:bg-coal-400"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/85 via-primary/60 to-transparent" />

        <div className="p-4 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 shadow-inner dark:border-gray-700 dark:bg-gray-800">
                <ContractPhoto src={getFotoPerfil(contrato)} />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
                  Contrato #{codigoValue}
                </p>
                <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-5 text-gray-900 dark:text-white">
                  {nombreCard}
                </h3>
                <p className="mt-0.5 truncate text-xs text-gray-600 dark:text-gray-400">
                  {cargoValue}
                </p>
              </div>
            </div>

            <span
              className={clsx(
                'inline-flex shrink-0 items-center justify-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em]',
                getEstadoBadgeClass(estadoTexto)
              )}
            >
              {estadoTexto}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-coal-300">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                <CreditCard className="size-3.5 opacity-70" />
                Identificacion
              </div>
              <p className="mt-1.5 truncate text-xs font-medium text-gray-800 dark:text-gray-100">
                {identificacionValue}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200/80 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-coal-300">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                <Folder className="size-3.5 opacity-70" />
                Area
              </div>
              <p className="mt-1.5 truncate text-xs font-medium text-gray-800 dark:text-gray-100">
                {areaValue}
              </p>
            </div>
          </div>

          <div className="mt-2.5 rounded-xl border border-gray-200/80 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-coal-300">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="size-3.5" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  Vigencia del contrato
                </p>
                <p className="mt-1 text-xs font-medium text-gray-800 dark:text-gray-100">
                  {fechaInicio} - {fechaFin}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                Registro
              </p>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-100">
                Codigo interno {codigoValue}
              </p>
            </div>
            <button
              type="button"
              onClick={() => contrato.id != null && handleContrato(Number(contrato.id))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              Ver detalle
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="card card-grid min-w-full">
      <div className="card-header flex-wrap py-5">
        <h3 className="card-title">Contratos</h3>
        <div className="flex w-full justify-end gap-6">
          <div className="relative w-full max-w-xl lg:max-w-[36rem]">
            <KeenIcon
              icon="magnifier"
              className="leading-none text-md text-gray-500 absolute top-1/2 left-0 -translate-y-1/2 ml-3"
            />
            <input
              type="text"
              placeholder="Buscar por nombre, identificación o código..."
              className="input input-sm pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full mt-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            {showEmpresaSelect && (
              <div className="flex items-center gap-2 min-w-[220px]">
                <Briefcase className="size-4 text-gray-500 shrink-0" />
                <select
                  className="select select-sm flex-1"
                  value={selectedEmpresa ?? ''}
                  onChange={(e) => setSelectedEmpresa(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Seleccione regional...</option>
                  {empresas.map((e: { id: number; razonSocial?: string; nombre?: string }) => (
                    <option key={e.id} value={e.id}>
                      {e.razonSocial || e.nombre || e.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {showCentroSelect && (
              <div className="flex items-center gap-2 min-w-[220px]">
                <Building className="size-4 text-gray-500 shrink-0" />
                <select
                  className="select select-sm flex-1"
                  value={selectedCentroFormacion ?? ''}
                  onChange={(e) =>
                    setSelectedCentroFormacion(e.target.value ? Number(e.target.value) : null)
                  }
                >
                  <option value="">Centro de formación</option>
                  {centrosFormacion.map((c: { id: number; nombre?: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre || c.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {(isAdmin || selectedEmpresa || selectedCentroFormacion !== null) && (
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <span key={r} className="badge badge-sm badge-outline badge-primary">
                  Rol: {r}
                </span>
              ))}
              {selectedEmpresa != null &&
                empresas.find((e: { id?: number }) => e.id === selectedEmpresa) && (
                  <span className="badge badge-sm badge-light">
                    Empresa:{' '}
                    {
                      (empresas.find((e: { id?: number }) => e.id === selectedEmpresa) as {
                        razonSocial?: string;
                      }).razonSocial
                    }
                  </span>
                )}
              {selectedCentroFormacion != null &&
                centrosFormacion.find((c: { id?: number }) => c.id === selectedCentroFormacion) && (
                  <span className="badge badge-sm badge-light">
                    Centro:{' '}
                    {
                      (
                        centrosFormacion.find((c: { id?: number }) => c.id === selectedCentroFormacion) as {
                          nombre?: string;
                        }
                      ).nombre
                    }
                  </span>
                )}
            </div>
          )}
        </div>
      </div>

      <div className="card-body p-4 lg:p-5">
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <span className="loading loading-spinner loading-lg text-primary" />
          </div>
        ) : filteredData.length === 0 ? (
          <p className="text-center text-gray-500 py-12 text-sm">No hay contratos para mostrar.</p>
        ) : (
          <>
            <div className="px-4 py-4 lg:px-5 lg:py-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 lg:gap-4">
                {currentData.map((c, i) => renderItem(c, i))}
              </div>

            {pageCount > 1 && (
              <div className="mt-8 flex w-full flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Mostrar</span>
                  <select
                    className="select select-sm w-20"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(0);
                    }}
                  >
                    {[6, 9, 18, 45].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <ReactPaginate
                  breakLabel="..."
                  nextLabel="›"
                  previousLabel="‹"
                  onPageChange={handlePageClick}
                  pageRangeDisplayed={3}
                  marginPagesDisplayed={1}
                  pageCount={pageCount}
                  forcePage={currentPage}
                  containerClassName="flex flex-wrap items-center gap-1 list-none m-0 p-0 [&_a]:outline-none [&_a]:ring-0 [&_a:focus]:outline-none [&_a:focus-visible]:outline-none [&_a:active]:outline-none"
                  pageClassName="inline-block"
                  pageLinkClassName="btn btn-sm btn-light rounded-lg shadow-none outline-none focus:outline-none focus:shadow-none"
                  activeClassName=""
                  activeLinkClassName="!btn-primary text-primary-content rounded-lg shadow-none outline-none focus:outline-none focus:shadow-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1"
                  previousClassName="inline-block"
                  previousLinkClassName="btn btn-sm btn-light rounded-lg shadow-none outline-none focus:outline-none focus:shadow-none"
                  nextClassName="inline-block"
                  nextLinkClassName="btn btn-sm btn-light rounded-lg shadow-none outline-none focus:outline-none focus:shadow-none"
                  disabledClassName="opacity-40 pointer-events-none"
                />
              </div>
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export { ContratoContent };

