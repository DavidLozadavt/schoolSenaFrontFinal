import { type TMenuConfig } from '@/components/menu';

export const MENU_SIDEBAR: TMenuConfig = [
  {
    title: 'Gestión Académica',
    icon: 'teacher',
    requiredPermissions: ['GESTION_USUARIO'],
    children: [
      {
        title: 'Gestión Programas',
        path: '/gestion-academica/configuracion/programas',
        requiredPermissions: ['GESTION_USUARIO']
      },
      {
        title: 'Periodos',
        path: '/gestion-academica/configuracion/periodos',
        requiredPermissions: ['GESTION_USUARIO']
      },
      {
        title: 'Jornadas',
        path: '/gestion-academica/configuracion/jornadas',
        requiredPermissions: ['GESTION_USUARIO']
      },
      {
        title: 'Infraestructura',
        path: '/gestion-academica/configuracion/infraestructura',
        requiredPermissions: ['GESTION_USUARIO']
      }
    ]
  },

  {
    title: 'Gestión de Usuarios',
    icon: 'users',
    children: [
      {
        title: 'Usuarios',
        path: '/gestion-usuarios/usuarios',
        requiredPermissions: ['GESTION_USUARIO']
      },
      {
        title: 'Roles',
        path: '/gestion-usuarios/roles',
        requiredPermissions: ['GESTION_ROLES']
      },
      {
        title: 'Permisos',
        path: '/gestion-usuarios/permisos',
        requiredPermissions: ['GESTION_ROL_PERMISOS']
      }
    ]
  },

  {
    title: 'Gestión Laboral',
    icon: 'tablet-text-down',
    requiredPermissions: ['GESTION_LABORAL'],

    children: [
      {
        title: 'Pagos de Contrato',
        requiredPermissions: ['GESTION_LABORAL'],
        children: [
          {
            title: 'Pagos Pendientes',
            path: '/public-profile/profiles/default',
            requiredPermissions: ['GESTION_LABORAL']
          },
          {
            title: 'Historial de Pagos',
            path: '/public-profile/profiles/creator',
            requiredPermissions: ['GESTION_LABORAL']
          }
        ]
      },
      {
        title: 'Contratación',
        path: '/gestion-contratos/contratacion',
        requiredPermissions: ['GESTION_CONTRATACION']
      },
      {
        title: 'Contratos',
        path: '/gestion-contratos/contratos',
        requiredPermissions: ['GESTION_CONTRATOS']
      },
      {
        title: 'Pagos de Contratos',
        requiredPermissions: ['GESTION_PAGOS_CONTRATOS'],
        children: [
          {
            title: 'Pagos Pendientes',
            path: '/gestion-contratos/pagos-pendientes',
            requiredPermissions: ['GESTION_PAGOS_CONTRATOS']
          },
          {
            title: 'Historial de Pagos',
            path: '/gestion-contratos/historial-pagos',
            requiredPermissions: ['GESTION_PAGOS_CONTRATOS']
          }
        ]
      },

      {
        title: 'Pagos Adicionales',
        path: '/network/get-started',
        requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
      }
    ]
  },

  {
    title: 'Contabilidad',
    icon: 'chart-line',
    requiredPermissions: ['GESTION_NOMINA'],
    children: [
      {
        title: 'Centro de Costos',
        path: '/nomina/centros-costos',
        requiredPermissions: ['GESTION_NOMINA']
      },
      {
        title: 'Cuentas PUC',
        path: '/gestion-cuentas/cuentas-puc',
        requiredPermissions: ['GESTION_CUENTAS_PUC']
      },
      {
        title: 'Aportes Socios',
        path: '/gestion-cuentas/aportes-socios',
        requiredPermissions: ['GESTION_APORTES_SOCIOS']
      },
      {
        title: 'Cuentas Por Pagar',
        path: '/compras/cuentas-pagar',
        requiredPermissions: ['GESTION_COMPRAS']
      },
      {
        title: 'Cuentas Por Cobrar',
        path: '/compras/cuentas-cobrar',
        requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
      },

      {
        title: 'Facturacion Electronica',
        path: '/facturacion-electronica/facturacion-electronica',
        requiredPermissions: ['GESTION_FACTURACION_ELECTRONICA']
      },
      {
        title: 'Ahorros Terceros',
        path: '/gestion-cuentas/ahorro-tercero',
        requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
      },
      {
        title: 'Cobros Polizas',
        path: '/cobros-polizas/cobros-polizas',
        requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
      }
    ]
  },

  {
    title: 'Configuracion ',
    icon: 'setting',
    requiredPermissions: ['GESTION_NOMINA'],
    children: [
      {
        title: 'Configuración de Empresa',
        path: '/empresa/configuracion-empresa',
        requiredPermissions: ['GESTION_CONFIGURACION_EMPRESA']
      },
      {
        title: ' Gestion Puntos de Venta',
        path: '/gestion-punto-de-ventas/punto-ventas',
        requiredPermissions: ['GESTION_PUNTO_VENTAS']
      },
      {
        title: 'Gestión Escenarios',
        requiredPermissions: ['GESTION_USUARIO'],
        path: '/gestion-escenarios'
      },
      {
        title: 'Gestión Servicios',
        requiredPermissions: ['GESTION_USUARIO'],
        path: '/gestion-servicios'
      },
      {
        title: 'Config de Pagos',
        requiredPermissions: ['GESTION_NOMINA'],

        children: [
          {
            title: 'Configuración de Pagos',
            path: '/pagos/configuracion-pagos',
            requiredPermissions: ['GESTION_TIPO_PAGO']
          },
          {
            title: 'Medios de Pago',
            path: '/pagos/medio-pagos',
            requiredPermissions: ['GESTION_MEDIO_PAGO']
          },
          {
            title: 'Tipos de Pago',
            path: '/pagos/tipo-pagos',
            requiredPermissions: ['GESTION_TIPO_PAGO']
          },
          {
            title: 'Tipos de Transacción',
            path: '/pagos/tipo-transaccion',
            requiredPermissions: ['GESTION_TIPO_TRANSACCION']
          }
        ]
      },

      {
        title: 'Config de Documentos',
        icon: 'setting',
        requiredPermissions: ['GESTION_NOMINA'],

        children: [
          {
            title: 'Tipos de Documentos',
            path: '/tipo-documento/tipo-documentos',
            requiredPermissions: ['GESTION_TIPO_DOCUMENTOS']
          },
          {
            title: 'Proceso',
            path: '/proceso',
            requiredPermissions: ['GESTION_PROCESOS']
          }
        ]
      },
      {
        title: 'Tipos de Contrato',
        path: '/gestion-contratos/tipo-contratos',
        requiredPermissions: ['GESTION_TIPO_CONTRATO']
      },
      {
        title: 'Entidades Seguridad Social',
        path: '/gestion-contratos/entidades-seguridad-social',
        requiredPermissions: ['GESTION_ENTIDADES_SEGURIDAD_SOCIAL']
      },
      {
        title: 'Áreas',
        path: '/gestion-contratos/areas',
        requiredPermissions: ['GESTION_AREAS']
      }
    ]
  },

  {
    title: 'Puntos Pos',
    requiredPermissions: ['GESTION_PUNTO_VENTAS'],
    icon: 'shop',

    children: [
      {
        title: 'Ventanillas',
        path: '/punto-de-ventas/puntos-de-ventas',
        requiredPermissions: ['GESTION_PUNTO_VENTAS']
      },

      {
        title: 'Almacen',
        path: '/punto-de-ventas/pos-tienda',
        requiredPermissions: ['GESTION_PUNTO_VENTAS']
      },
      {
        title: 'Registrar Factura',
        path: '/factura/proveedor',
        requiredPermissions: ['GESTION_USUARIO']
      }
    ]
  },

  {
    title: 'Transporte',
    icon: 'car',

    children: [
      {
        title: 'Configuracion Transporte',
        requiredPermissions: ['GESTION_TRANSPORTE'],

        children: [
          {
            title: 'Configuracion salida',
            path: '/configuracion/configuracion-salida',
            requiredPermissions: ['GESTION_CONFIGURACION_SALIDA']
          },
          {
            title: 'Detalles Revision',
            path: '/detalles/detalles-revision',
            requiredPermissions: ['GESTION_DETALLES_REVISION']
          },
          {
            title: 'Revision Vehiculos',
            path: '/trasporte/revision-vehiculos',
            requiredPermissions: ['GESTION_REVISION_PREOPERACIONAL']
          },

          {
            title: 'Descuentos de Planilla',
            path: '/transporte/descuentos-planilla',
            requiredPermissions: ['GESTION_DESCUENTOS_PLANILLA']
          },

          {
            title: 'Configuración de Asientos',
            path: '/configuracion/asientos',
            requiredPermissions: ['GESTION_CONFIGURACION_ASIENTOS']
          },

          {
            title: 'Tarifas',
            path: '/tarifas/tarifas',
            requiredPermissions: ['GESTION_TARIFAS']
          }
        ]
      },
      {
        title: 'Rutas',
        path: '/transporte/gestion-rutas',
        requiredPermissions: ['GESTION_RUTAS']
      },
      {
        title: 'Cronograma Rutas',
        path: '/cronograma/cronograma-rutas',
        requiredPermissions: ['GESTION_CRONOGRAMA_RUTAS']
      },

      {
        title: 'Vinculaciones',
        path: '/gestion-vinculaciones/vinculaciones',
        requiredPermissions: ['GESTION_AFILIACIONES']
      },
      {
        title: 'Vinculaciones Pendientes',
        path: '/gestion-vinculaciones/vinculaciones-pendientes',
        requiredPermissions: ['GESTION_AFILIACIONES']
      },
      {
        title: 'Registrar Vinculación',
        path: '/gestion-vinculaciones/vinculacion-vehiculo',
        requiredPermissions: ['GESTION_AFILIACIONES']
      },
      {
        title: 'Registro Autorización Menores',
        path: '/transporte/autorizacion-menores',
        requiredPermissions: ['GESTION_AUTORIZACION_MENORES']
      },
      {
        title: 'Reservas Pendientes',
        path: '/reservas-pendientes/reservas-pendientes',
        requiredPermissions: ['GESTION_RESERVAS_PENDIENTES']
      }
    ]
  },

  {
    title: 'Gestión de sedes',
    icon: 'shop',
    children: [
      {
        title: 'Sedes',
        path: '/sedes/gestion-sedes',
        requiredPermissions: ['GESTION_SEDE']
      }
    ]
  },

  {
    title: 'Gestión de Productos',
    icon: 'package',
    children: [
      {
        title: 'Configuracion Productos',
        path: '/gestion-productos/configuracion-producto',
        requiredPermissions: ['GESTION_PUNTO_VENTAS']
      }
    ]
  },

  {
    title: 'Gestión de Almacén',
    icon: 'archive',
    children: [
      {
        title: 'Gestión de Almacén',
        path: '/gestion-almacen',
        requiredPermissions: ['GESTION_USUARIO']
      },
      {
        title: 'Gestión solicitud Almacén',
        path: '/gestion-solicitud-almacen',
        requiredPermissions: ['GESTION_USUARIO']
      }
    ]
  },

  {
    title: 'Gestión de Pedidos',
    icon: 'lots-shopping',
    children: [
      {
        title: 'Pedidos',
        path: '/gestion-pedidos',
        requiredPermissions: ['GESTION_USUARIO']
      },
      {
        title: 'Pedidos Pendientes',
        path: '/gestion-pedidos-pendientes',
        requiredPermissions: ['GESTION_USUARIO']
      },
      {
        title: 'Cotizaciones',
        path: '/gestion-cotizaciones',
        requiredPermissions: ['GESTION_USUARIO']
      }
    ]
  },

  {
    title: 'Gestión de Contratos',
    icon: 'tablet-text-down',
    children: []
  },

  {
    title: 'Nómina',
    icon: 'wallet',
    children: [
      {
        title: 'Novedades',
        requiredPermissions: ['GESTION_NOMINA'],
        children: [
          {
            title: 'Vacaciones - Supervisor',
            path: '/nomina/novedades/vacaciones-admin',
            requiredPermissions: ['GESTION_NOMINA']
          },
          {
            title: 'Licencias - Supervisor',
            path: '/nomina/novedades/licencias-admin',
            requiredPermissions: ['GESTION_NOMINA']
          },

          {
            title: 'Horas Extra - Supervisor',
            path: '/nomina/novedades/horas-extra-admin',
            requiredPermissions: ['GESTION_NOMINA']
          },
          {
            title: 'Deducciones',
            path: '/nomina/novedades/otras-deducciones',
            requiredPermissions: ['GESTION_NOMINA']
          },
          {
            title: 'Bonificaciones',
            path: '/nomina/novedades/bonificaciones',
            requiredPermissions: ['GESTION_NOMINA']
          },
          {
            title: 'Reemplazos',
            path: '/nomina/novedades/reemplazos',
            requiredPermissions: ['GESTION_NOMINA']
          },
          {
            title: 'Configuración Incapacidades',
            path: '/nomina/novedades/configuracion-incapacidades',
            requiredPermissions: ['GESTION_NOMINA']
          }
        ]
      },

      {
        title: 'Novedades',
        requiredPermissions: ['GESTION_NOMINA_TRABAJADOR'],
        children: [
          {
            title: 'Vacaciones - Trabajador',
            path: '/nomina/novedades/vacaciones-trabajador',
            requiredPermissions: ['GESTION_NOMINA_TRABAJADOR']
          },

          {
            title: 'Licencias - Trabajador',
            path: '/nomina/novedades/licencias-trabajador',
            requiredPermissions: ['GESTION_NOMINA_TRABAJADOR']
          },

          {
            title: 'Horas Extra - Trabajador',
            path: '/nomina/novedades/horas-extra-trabajador',
            requiredPermissions: ['GESTION_HORAS_EXTRA_TRABAJADOR']
          }
        ]
      },

      {
        title: 'Tu Nómina',
        path: '/nomina/tu-nomina',
        requiredPermissions: ['GESTION_NOMINA']
      },
      {
        title: 'Configuración de Nómina',
        path: '/nomina/configuracion',
        requiredPermissions: ['GESTION_NOMINA']
      },

      {
        title: 'Tarifas de Riesgo',
        path: '/nomina/tarifas-riesgo',
        requiredPermissions: ['GESTION_NOMINA']
      },
      {
        title: 'Configuración de Horas Extra',
        path: '/nomina/configuracion-horas-extra',
        requiredPermissions: ['GESTION_NOMINA']
      },
      {
        title: 'Configuración de Grupos Nomina',
        path: '/nomina/configuracion-grupos-nomina',
        requiredPermissions: ['GESTION_NOMINA']
      },
      {
        title: 'Comisiones',
        path: '/nomina/comisiones',
        requiredPermissions: ['GESTION_NOMINA']
      },
      {
        title: 'Tipo Incapacidades',
        path: '/nomina/tipo-incapacidad',
        requiredPermissions: ['GESTION_NOMINA']
      }
    ]
  },

  {
    title: 'Compras',
    icon: 'shop',
    children: [
      {
        title: 'Registrar Compra',
        path: '/compras/terceros',
        requiredPermissions: ['GESTION_COMPRAS']
      }
    ]
  },

  {
    title: 'Multimedia',
    icon: 'picture',
    children: [
      {
        title: 'Gestion Multimedia',
        path: '/multimedia/gestion-multimedia',
        requiredPermissions: ['GESTION_NOMINA']
      }
    ]
  },

  {
    title: 'Aplicaciones',
    icon: 'category',
    children: [
      // {
      //   title: 'Chat',
      //   path: '/network/get-started',
      //   requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
      // },
      {
        title: 'Tableros Kanban',
        path: '/aplicaciones/canva',
        requiredPermissions: ['GESTION_BOARD_TASK']
      },
      // {
      //   title: 'Videollamada',
      //   path: '/network/get-started',
      //   requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
      // }
      {
        title: 'Meeting Calendar',
        path: 'meeting/calendar',
        requiredPermissions: ['GESTION_BOARD_TASK']
      }
    ]
  },
  // {
  //   title: 'Productos Empresariales',
  //   icon: 'briefcase',
  //   children: [
  //     {
  //       title: 'Productos',
  //       path: '/network/get-started',
  //       requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
  //     },
  //     {
  //       title: 'Planes',
  //       path: '/network/get-started',
  //       requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
  //     },

  //     {
  //       title: 'Conexiones',
  //       path: '/conexiones',
  //       requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
  //     },
  //     {
  //       title: 'Solicitudes',
  //       path: '/network/get-started',
  //       requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
  //     }
  //   ]
  // },
  // {
  //   title: 'Gestión de Cuentas',
  //   icon: 'bill',
  //   children: [
  //     {
  //       title: 'Cuentas por Pagar',
  //       path: '/gestion-cuentas/get-started',
  //       requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
  //     },
  //     {
  //       title: 'Cuentas por Cobrar',
  //       path: '/gestion-cuentas/get-started',
  //       requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
  //     },

  //   ]
  // },
  {
    title: 'Reporte Superintendencia',
    icon: 'arrow-down-refraction',
    children: [
      {
        title: 'Reporte Superintendencia',
        path: '/reporte-superintendencia/reporte-superintendencia',
        requiredPermissions: ['GESTION_REPORTE_SUPERINTENDENCIA']
      }
    ]
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    children: [
      {
        title: 'Classic',
        children: [
          {
            title: 'Sign In',
            path: '/auth/classic/login'
          },
          {
            title: 'Sign Up',
            path: '/auth/classic/signup'
          },
          {
            title: '2FA',
            path: '/auth/classic/2fa'
          },
          {
            title: 'Check Email',
            path: '/auth/classic/check-email'
          },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '/auth/classic/reset-password/enter-email'
              },
              {
                title: 'Check Email',
                path: '/auth/classic/reset-password/check-email'
              },
              {
                title: 'Change Password',
                path: '/auth/classic/reset-password/change'
              },
              {
                title: 'Password Changed',
                path: '/auth/classic/reset-password/changed'
              }
            ]
          }
        ]
      },
      {
        title: 'Branded',
        children: [
          {
            title: 'Sign In',
            path: '/auth'
          },
          {
            title: 'Sign Up',
            path: '/auth/signup'
          },
          {
            title: '2FA',
            path: '/auth/2fa'
          },
          {
            title: 'Check Email',
            path: '/auth/check-email'
          },
          {
            title: 'Reset Password',
            children: [
              {
                title: 'Enter Email',
                path: '/auth/reset-password/enter-email'
              },
              {
                title: 'Check Email',
                path: '/auth/reset-password/check-email'
              },
              {
                title: 'Change Password',
                path: '/auth/reset-password/change'
              },
              {
                title: 'Password Changed',
                path: '/auth/reset-password/changed'
              }
            ]
          }
        ]
      },
      {
        title: 'Welcome Message',
        path: '/auth/welcome-message'
      },
      {
        title: 'Account Deactivated',
        path: '/auth/account-deactivated'
      },
      {
        title: 'Error 404',
        path: '/error/404'
      },
      {
        title: 'Error 500',
        path: '/error/500'
      }
    ]
  }
];

export const MENU_MEGA: TMenuConfig = [
  {
    title: 'Home',
    path: '/'
  },
  {
    title: 'Profiles',
    children: [
      {
        title: 'Profiles',
        children: [
          {
            children: [
              {
                title: 'Default',
                icon: 'badge',
                path: '/public-profile/profiles/default',
                requiredPermissions: ['GESTION_CUENTAS_PENDIENTES']
              },
              {
                title: 'Creator',
                icon: 'coffee',
                path: '/public-profile/profiles/creator'
              },
              {
                title: 'Company',
                icon: 'abstract-41',
                path: '/public-profile/profiles/company'
              },
              {
                title: 'NFT',
                icon: 'bitcoin',
                path: '/public-profile/profiles/nft'
              },
              {
                title: 'Blogger',
                icon: 'message-text',
                path: '/public-profile/profiles/blogger'
              },
              {
                title: 'CRM',
                icon: 'devices',
                path: '/public-profile/profiles/crm'
              },
              {
                title: 'Gamer',
                icon: 'ghost',
                path: '/public-profile/profiles/gamer'
              }
            ]
          },
          {
            children: [
              {
                title: 'Feeds',
                icon: 'book',
                path: '/public-profile/profiles/feeds'
              },
              {
                title: 'Plain',
                icon: 'files',
                path: '/public-profile/profiles/plain'
              },
              {
                title: 'Modal',
                icon: 'mouse-square',
                path: '/public-profile/profiles/modal'
              },
              {
                title: 'Freelancer',
                icon: 'financial-schedule',
                path: '#',
                disabled: true
              },
              {
                title: 'Developer',
                icon: 'technology-4',
                path: '#',
                disabled: true
              },
              {
                title: 'Team',
                icon: 'users',
                path: '#',
                disabled: true
              },
              {
                title: 'Events',
                icon: 'calendar-tick',
                path: '#',
                disabled: true
              }
            ]
          }
        ]
      }
    ]
  }
];

export const MENU_ROOT: TMenuConfig = [
  {
    title: 'Public Profile',
    icon: 'profile-circle',
    rootPath: '/public-profile/',
    path: 'public-profile/profiles/default',
    childrenIndex: 2
  },
  {
    title: 'Account',
    icon: 'setting-2',
    rootPath: '/account/',
    path: '/',
    childrenIndex: 3
  },
  {
    title: 'Network',
    icon: 'users',
    rootPath: '/network/',
    path: 'network/get-started',
    childrenIndex: 4
  },
  {
    title: 'Authentication',
    icon: 'security-user',
    rootPath: '/authentication/',
    path: 'authentication/get-started',
    childrenIndex: 5
  }
];
