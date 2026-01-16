import { ReactElement } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { DefaultPage } from '@/pages/dashboards';
import { AccountRolesPage } from '@/pages/account';

import { AuthPage, useAuthContext } from '@/auth';
import { RequireAuth } from '@/auth/RequireAuth';
import { Demo1Layout } from '@/layouts/demo1';
import { ErrorsRouting } from '@/errors';
import ProtectedRoute from '@/auth/ProtectedRoute';
import { MedioPagoPage } from '@/pages/medios-pago/MedioPagoPage';
import { TipoPagoPage } from '@/pages/tipos-pago/TipoPagoPage';
import { TipoDocumentoPage } from '@/pages/tipos-documento/TipoDocumentoPage';
import PermissionsToggle from '@/pages/account/members/permissions-toggle/blocks/PermissionsToggle';
import ProcesoPage from '@/pages/proceso/ProcesoPage';
import GestionAlmacenPage from '@/pages/gestion-almacen/GestionAlmacenPage';
import SolicitudAlmacenPage from '@/pages/gestion-solicitud-almacen/SolicitudAlmacenPage';
import ConexionesPage from '@/pages/conexiones/ConexionesPage';
import { CanvaPage } from '@/pages/canva/CanvaPage';
import { BoardPage } from '@/pages/canva/BoardPage';
import { ContratacionPage } from '@/pages/contratacion/ContratacionPage';
import { ContratosPage } from '@/pages/contratos/ContratosPage';
import { ContratoPage } from '@/pages/contratos/ContratoPage';
import { PagosPendientesPage } from '@/pages/pagos-contratos/pagos-pendientes/PagosPendientesPage';
import { PagoPendientePage } from '@/pages/pagos-contratos/pagos-pendientes/PagoPendientePage';
import { ConfiguracionNominaPage } from '@/pages/nomina/ConfiguracionNominaPage';
import { CentroCostosPage } from '@/pages/centro-costos/CentroCostosPage';
import { TarifasRiesgoPage } from '@/pages/tarifas-riesgo/TarifasRiesgoPage';
import { ConfiguracionHorasExtraPage } from '@/pages/configuracion-horas-extras/ConfiguracionHorasExtraPage';
import { ComisionPage } from '@/pages/comisiones/ComisionPage';

import { SolicitudVacacionesPage } from '@/pages/tu-nomina/novedades/vacaciones/SolicitudVacacionesPage';
import { SolicitudVacacionesAdminPage } from '@/pages/tu-nomina/novedades/vacaciones/admin/SolicitudVacacionesAdminPage';
import { SolicitudIncapacidadLicenciaAdminPage } from '@/pages/tu-nomina/novedades/licencias-permisos/admin/SolicitudIncapacidadLicenciaAdminPage';
import { SolicitudIncapacidadLicenciaPage } from '@/pages/tu-nomina/novedades/licencias-permisos/SolicitudIncapacidadLicenciaPage';
import { TipoIncapacidadesPage } from '@/pages/tipo-incapacidades/TipoIncapacidadesPage';
import { TerceroPage } from '@/pages/registrar-compra/TerceroPage';
import { RegistroCompraPage } from '@/pages/registrar-compra/RegistroCompraPage';
import { CuentasPagarPage } from '@/pages/cuentas-pagar/CuentasPagarPage';
import GestionSedesPage from '@/pages/gestion-sedes/GestionSedesPage';
import PuntosVentaPage from '@/pages/gestion-puntos-venta/PuntosVentaPage';
import PuntosDeVentaPage from '@/pages/puntos-de-venta/PuntosDeVentaPage';
import CajaContent from '@/pages/puntos-de-venta/Caja/CajaContent';
import { AfiliacionVehiculoPage } from '@/pages/afiliacion-vehiculos/AfiliacionVehiculoPage';
import GestionRutasPage from '@/pages/transporte/gestion-rutas/GestionRutasPage';
import { AfiliacionesPage } from '@/pages/afiliaciones/AfiliacionesPage';
import CronogramaRutasPage from '@/pages/transporte/cronograma-rutas/CronogramaRutasPage';
import { CuentasCobrarPage } from '@/pages/cuentas-cobrar/CuentasCobrarPage';
import CajaPage from '@/pages/puntos-de-venta/Caja/CajaPage';
import PosTiendaPage from '@/pages/Pos/PosTiendaPage';
import { PosPage } from '@/pages/Pos/components/PosPage';
import { ConfiguracionEmpresaPage } from '@/pages/configuracion-empresa/ConfiguracionEmpresaPage';
import { UsuariosPage } from '@/pages/usuarios/UsuariosPage';
import { PerfilPage } from '@/pages/perfil/PerfilPage';
import { TipoContratoPage } from '@/pages/tipo-contrato/TipoContratoPage';
import { EntidadesSeguridadSocialPage } from '@/pages/entidades-seguridad-social/EntidadesSeguridadSocialPage';
import GestionEscenariosPage from '@/pages/gestion-escenarios/GestionEscenariosPage';
import ServiciosPage from '@/pages/gestion-servicios/GestionServiciosPage';
import GestionCotizaciones from '@/pages/gestion-pedidos/GestionCotizaciones';
import { CuentasPucPage } from '@/pages/cuentas-puc/CuentasPucPage';
import { AreaPage } from '@/pages/areas/AreaPage';
import { HorasExtraTrabajadorPage } from '@/pages/tu-nomina/novedades/horas-extra/horas-extra-trabajador/HorasExtraTrabajadorPage';
import { HorasExtraAdminPage } from '@/pages/tu-nomina/novedades/horas-extra/admin/HorasExtraAdminPage';
import { OtrasDeduccionesPage } from '@/pages/tu-nomina/novedades/otras-deducciones/OtrasDeduccionesPage';
import { ReporteSuperintendenciaPage } from '@/pages/reporte-superintendencia/ReporteSuperintendenciaPage';
import { BonificacionPage } from '@/pages/tu-nomina/novedades/bonificaciones/BonificacionPage';
import { ReemplazoPage } from '@/pages/tu-nomina/novedades/reemplazos/ReemplazoPage';
import { AfiliacionesPendientesPage } from '@/pages/afiliaciones-pendientes/AfiliacionesPendientesPage';
import { SociosPage } from '@/pages/aportes-socios/SociosPage';
import { AporteSociosPage } from '@/pages/aportes-socios/AporteSociosPage';
import { NominasPage } from '@/pages/tu-nomina/NominasPage';
import { LiquidacionNominaPage } from '@/pages/tu-nomina/LiquidacionNominaPage';
import { ConfiguracionNovedadesPage } from '@/pages/tu-nomina/novedades/configuracion-novedades/ConfiguracionNovedadesPage';
import DetalleRevisionPage from '@/pages/transporte/detalle-revision/DetalleRevisionPage';
import RevicionVehiculosPage from '@/pages/transporte/resvisionVehiculos/RevicionVehiculosPage';
import DescuentoPlanillaPage from '@/pages/transporte/descuentos-planilla/DescuentoPlanillaPage';
import { RegistroAutorizacionMenoresPage } from '@/pages/transporte/autorizacion-menores/RegistroAutorizacionMenoresPage';
import { RegistroAutorizacionMenoresWebForm } from '@/pages/transporte/autorizacion-menores/RegistroAutorizacionMenoresWebForm';
import { FacturacionElectronicaPage } from '@/pages/facturacion-electronica/FacturacionElectronicaPage';
import { GrupoNominaPage } from '@/pages/grupo-nomina';
import ReservasPage from '@/pages/reservas-pendientes/ReservasPage';
import { ConfiguracionPagosPage } from '@/pages/configuracion-pagos';
import { TarifasPage } from '@/pages/tarifas';
import CalendarioReunionesPage from '@/pages/calendario-reuniones/ReunionesPage';
import Pedidos from '@/pages/gestion-pedidos/Pedidos';
import PedidosPendientes from '@/pages/gestion-pedidos/PedidosPendientes';
import { RegistrarFactura } from '@/pages/registrar-factura/RegistrarFactura';
import { ProvedorPage } from '@/pages/registrar-factura/ProveedorPage';
import { ConfiguracionProductoPage } from '@/pages/gestion-productos/ConfiguracionProductoPage';
import { ConfigurarAsientosPage } from '@/pages/configurar-asientos';
import { AhorroTerceroPage } from '@/pages/ahorro-tercero';
import { CobrosPolizasPage } from '@/pages/cobros-polizas';
import MultimediaPage from '@/pages/multimedia/gestion-multimedia/MultimediaPage';
import ProfesoresPage from '@/pages/profesores/profes/ProfesoresPage';
import PeriodosPage from '@/pages/periodos/PeriodosPage';
import JornadasPage from '@/pages/gestion-jornadas/JornadasPage';

import DashboardCoordinador from '@/pages/cordinador/DashboardCordinador';
import GestionProgramas from '@/pages/programas-academicos/GestionProgramas';
import ProfesoresContent from '@/pages/profesores/profes/ProfesoresContent';
import EstudiantesPage from '@/pages/estudiantes/EstudiantesPage';
import DashboardRector from '@/pages/rector/DashboardRector';

// Componentes temporales para pruebas

const InfraestructuraPage = () => (
  <div className="p-8">
    <h2>Gestión de Infraestructura - Próximamente</h2>
  </div>
);

// Configuración de prioridades de Dashboards
// El orden importa: el primero que coincida será el que se muestre.
const DASHBOARD_CONFIG = [
  {
    permission: 'GESTION_RECTOR',
    component: <DashboardRector />
  },
  {
    permission: 'GESTION_COORDINADOR',
    component: <DashboardCoordinador />
  },
  {
    permission: 'GESTION_PROFESOR',
    component: <ProfesoresPage />
  },
  {
    permission: 'GESTION_ESTUDIANTE',
    component: <EstudiantesPage />
  }
];
const AppRoutingSetup = (): ReactElement => {
  const { permissions } = useAuthContext();

  // Función lógica para seleccionar el dashboard
  const getActiveDashboard = () => {
    const active = DASHBOARD_CONFIG.find((item) => permissions?.includes(item.permission));

    // Si hay coincidencia retornamos su componente, si no, el DefaultPage original
    return active ? active.component : <DefaultPage />;
  };

  return (
    <Routes>
      <Route element={<RequireAuth />}>
        <Route element={<Demo1Layout />}>
          <Route path="/" element={getActiveDashboard()} />
          <Route
            path="gestion-usuarios/usuarios"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="meeting/calendar"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_BOARD_TASK']}>
                <CalendarioReunionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="gestion-usuarios/roles"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_ROLES']}>
                <AccountRolesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="gestion-usuarios/permisos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_ROL_PERMISOS']}>
                <PermissionsToggle />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/contratacion"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CONTRATACION']}>
                <ContratacionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/contratos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CONTRATOS']}>
                <ContratosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/contratos/contrato"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CONTRATOS']}>
                <ContratoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/tipo-contratos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_TIPO_CONTRATO']}>
                <TipoContratoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/entidades-seguridad-social"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_ENTIDADES_SEGURIDAD_SOCIAL']}>
                <EntidadesSeguridadSocialPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="gestion-pedidos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <Pedidos />
              </ProtectedRoute>
            }
          />

          <Route
            path="gestion-pedidos-pendientes"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <PedidosPendientes />
              </ProtectedRoute>
            }
          />

          <Route
            path="gestion-cotizaciones"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <GestionCotizaciones />
              </ProtectedRoute>
            }
          />

          <Route
            path="gestion-escenarios"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <GestionEscenariosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="gestion-servicios"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <ServiciosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/areas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_AREAS']}>
                <AreaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/pagos-pendientes/pago"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PAGOS_CONTRATOS']}>
                <PagoPendientePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-contratos/pagos-pendientes"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PAGOS_CONTRATOS']}>
                <PagosPendientesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pagos/configuracion-pagos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_MEDIO_PAGO']}>
                <ConfiguracionPagosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pagos/medio-pagos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_MEDIO_PAGO']}>
                <MedioPagoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/pagos/tipo-pagos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_TIPO_PAGO']}>
                <TipoPagoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tipo-documento/tipo-documentos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_TIPO_DOCUMENTOS']}>
                <TipoDocumentoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/aplicaciones/canva"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_BOARD_TASK']}>
                <CanvaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/aplicaciones/canva/board"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_BOARD_TASK']}>
                <BoardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/proceso"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PROCESOS']}>
                <ProcesoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/conexiones"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CONEXIONES']}>
                <ConexionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/configuracion"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <ConfiguracionNominaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nomina/centros-costos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <CentroCostosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/tarifas-riesgo"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <TarifasRiesgoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/configuracion-horas-extra"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <ConfiguracionHorasExtraPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/configuracion-grupos-nomina"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <GrupoNominaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/comisiones"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <ComisionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/tipo-incapacidad"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <TipoIncapacidadesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/tu-nomina"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <LiquidacionNominaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/tu-nomina/liquidacion-nomina"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <NominasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/vacaciones-trabajador"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA_TRABAJADOR']}>
                <SolicitudVacacionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/vacaciones-admin"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <SolicitudVacacionesAdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/licencias-trabajador"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA_TRABAJADOR']}>
                <SolicitudIncapacidadLicenciaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/licencias-admin"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <SolicitudIncapacidadLicenciaAdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/horas-extra-admin"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <HorasExtraAdminPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/horas-extra-trabajador"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_HORAS_EXTRA_TRABAJADOR']}>
                <HorasExtraTrabajadorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/otras-deducciones"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <OtrasDeduccionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/bonificaciones"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <BonificacionPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/reemplazos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <ReemplazoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/nomina/novedades/configuracion-incapacidades"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_NOMINA']}>
                <ConfiguracionNovedadesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compras/terceros"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_COMPRAS']}>
                <TerceroPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compras/terceros/registrar-compra"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_COMPRAS']}>
                <RegistroCompraPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compras/cuentas-pagar"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_COMPRAS']}>
                <CuentasPagarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compras/cuentas-cobrar"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CUENTAS_PENDIENTES']}>
                <CuentasCobrarPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sedes/gestion-sedes"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_SEDE']}>
                <GestionSedesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-punto-de-ventas/punto-ventas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PUNTO_VENTAS']}>
                <PuntosVentaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/punto-de-ventas/puntos-de-ventas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PUNTO_VENTAS']}>
                <PuntosDeVentaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/punto-de-ventas/pos-tienda"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PUNTO_VENTAS']}>
                <PosTiendaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tienda/caja/:idPunto?"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PUNTO_VENTAS']}>
                <PosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/caja/:idPunto?"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PUNTO_VENTAS']}>
                <CajaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-vinculaciones/vinculacion-vehiculo"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_AFILIACIONES']}>
                <AfiliacionVehiculoPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transporte/gestion-rutas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_RUTAS']}>
                <GestionRutasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transporte/autorizacion-menores"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_AUTORIZACION_MENORES']}>
                <RegistroAutorizacionMenoresPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cronograma/cronograma-rutas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CRONOGRAMA_RUTAS']}>
                <CronogramaRutasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/detalles/detalles-revision"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_DETALLES_REVISION']}>
                <DetalleRevisionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transporte/descuentos-planilla"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_DESCUENTOS_PLANILLA']}>
                <DescuentoPlanillaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trasporte/revision-vehiculos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_REVISION_PREOPERACIONAL']}>
                <RevicionVehiculosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/empresa/configuracion-empresa"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CONFIGURACION_EMPRESA']}>
                <ConfiguracionEmpresaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-vinculaciones/vinculaciones"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_AFILIACIONES']}>
                <AfiliacionesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-vinculaciones/vinculaciones-pendientes"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_AFILIACIONES']}>
                <AfiliacionesPendientesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <PerfilPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-cuentas/cuentas-puc"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CUENTAS_PUC']}>
                <CuentasPucPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-cuentas/aportes-socios"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_APORTES_SOCIOS']}>
                <SociosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-cuentas/aportes-socios/registrar-aporte"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_APORTES_SOCIOS']}>
                <AporteSociosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-cuentas/ahorro-tercero"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CUENTAS_PENDIENTES']}>
                <AhorroTerceroPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cobros-polizas/cobros-polizas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CUENTAS_PENDIENTES']}>
                <CobrosPolizasPage />
              </ProtectedRoute>
            }
          />

          {/* --- SECCIÓN GESTIÓN ACADÉMICA --- */}
          <Route
            path="/gestion-academica/configuracion/programas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <GestionProgramas />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-academica/configuracion/periodos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <PeriodosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-academica/configuracion/infraestructura"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <InfraestructuraPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestion-academica/configuracion/jornadas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <JornadasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/multimedia/gestion-multimedia"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIOS']}>
                <MultimediaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reporte-superintendencia/reporte-superintendencia"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_REPORTE_SUPERINTENDENCIA']}>
                <ReporteSuperintendenciaPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/facturacion-electronica/facturacion-electronica"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_FACTURACION_ELECTRONICA']}>
                <FacturacionElectronicaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservas-pendientes/reservas-pendientes"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_RESERVAS_PENDIENTES']}>
                <ReservasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tarifas/tarifas"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_TARIFAS']}>
                <TarifasPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-productos/configuracion-producto"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PUNTO_VENTAS']}>
                <ConfiguracionProductoPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factura/proveedor/registrar-factura"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <RegistrarFactura />
              </ProtectedRoute>
            }
          />
          <Route
            path="/factura/proveedor"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <ProvedorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion/asientos"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_CONFIGURACION_ASIENTOS']}>
                <ConfigurarAsientosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-almacen"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <GestionAlmacenPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/gestion-solicitud-almacen"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_USUARIO']}>
                <SolicitudAlmacenPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profesores"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_PROFESOR']}>
                <ProfesoresPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estudiantes"
            element={
              <ProtectedRoute requiredPermissions={['GESTION_ESTUDIANTE']}>
                <EstudiantesPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>
      <Route path="error/*" element={<ErrorsRouting />} />
      <Route path="auth/*" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/error/404" />} />
      <Route path="autorizacion-menores" element={<RegistroAutorizacionMenoresWebForm />} />
    </Routes>
  );
};

export { AppRoutingSetup };
