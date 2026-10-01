const codeModules = {
  gen: '001',
  hpn: '002',
  hcn: '003',
  sln: '004',
  crn: '005',
  inn: '006',
};

export const MODULES = {
  GENERAL: {
    CODE: codeModules.gen,
    SUBS: {
      SEGURIDAD: `${codeModules.gen}001`,
      PERMISOS: `${codeModules.gen}002`,
    },
  },
  HOSPITALIZACION: {
    CODE: codeModules.hpn,
    SUBS: {
      DIETAS: `${codeModules.hpn}001`,
      GESTION_CLINICA: `${codeModules.hpn}002`,
      CENSOS: `${codeModules.hpn}003`,
      CAMAS: `${codeModules.hpn}004`,
    },
  },
  HISTORIA_CLINICA: {
    CODE: codeModules.hcn,
    SUBS: {
      BALANCES_ENFERMERIA: `${codeModules.hcn}001`,
      EPICRISIS: `${codeModules.hcn}002`,
      INTERCONSULTAS: `${codeModules.hcn}003`,
    },
  },
  FACTURACION: {
    CODE: codeModules.sln,
    SUBS: {
      INFORMES_GERENCIALES: `${codeModules.sln}001`,
      PRODUCTOS: `${codeModules.sln}002`,
    },
  },
  CARTERA: {
    CODE: codeModules.crn,
    SUBS: {
      GESTIONES_CONCILIACIONES: `${codeModules.crn}001`,
    },
  },
  INVENTARIO: {
    CODE: codeModules.inn,
    SUBS: {
      RECEPCION_TECNICA: `${codeModules.inn}001`,
      DOCUMENTOS: `${codeModules.inn}002`,
      SUMINISTROS: `${codeModules.inn}003`,
      CENTRAL_COMPRAS: `${codeModules.inn}004`,
      PRODUCTOS: `${codeModules.inn}005`,
      COTIZACIONES_PREFABRICADAS: `${codeModules.inn}006`,
    },
  },
};

export const ADMIN_AUTHORITY = `${MODULES.GENERAL.SUBS.SEGURIDAD}001`;

/** @deprecated */
export const AUTHORITIES = {
  // GEN - 001
  GENERAL: {
    SEGURIDAD: {
      ADMINISTRADOR: '001001001',
      BLOQUEAR_HOME: '001001002',
    },
    PERMISOS: {
      GESTIONAR_PERMISOS: '001002001',
    },
  },
  // HPN - 002
  HOSPITALIZACION: {
    GESTION_CLINICA: {
      GESTIONAR_AREAS: '002002001',
      ADMINISTRAR_GESTIONES: '002002002',
      GESTIONAR_PACIENTES: '002002003',
      TIEMPOS_EGRESOS: '002002004',
    },
    CENSOS: {
      CENSO_PACIENTES: '002003001',
      CENSO_CAMAS: '002003002',
    },
  },
  // HCN - 003
  HISTORIA_CLINICA: {
    BALANCES_ENFERMERIA: {
      SABANAS_UCI: '003001001',
      REPORTE_SABANAS: '003001002',
    },
    EPICRISIS: {
      DESCONFIRMAR_EPICRISIS: '003002001',
    },
    INTERCONSULTAS: {
      INTERC_PENDIENTES: '003003001',
      VER_TOTAS_INTERC_PENDIENTES: '003003002',
    },
  },
  // SLN - 004
  FACTURACION: {
    INFORMES_GERENCIALES: {
      FACTURACION_PERIODO: '004001001',
      ESTADISTICO_PFGP: '004001002',
      ESTADISTICO_RADICACION: '004001003',
      FACTURACION_TERCEROS: '004001004',
      FACTURACION_PERIODO_POR_ENTIDADES: '004001005',
      FACT_TERCEROS_INSTITUCION: '004001006',
    },
    PRODUCTOS: {
      CAMBIAR_CONCEPTO_FACTURACION: '004002001',
    },
  },
  // CRN - 005
  CARTERA: {
    GESTIONES_CONCILIACIONES: {
      GESTION_CARTERA: '005001001',
      CONCILIACION_CARTERA: '005001002',
      ELIMINAR_GEST_Y_O_CONCI: '005001003',
    },
  },
  // INN - 006
  INVENTARIO: {
    RECEPCION_TECNICA: {
      GENERAR_CONSULTAR: '006001001',
    },
    DOCUMENTOS: {
      GENERAR_RECIBO_ORDEN_DESPACHO: '006002002',
    },
    SUMINISTROS: {
      VER: '006003001',
      RECIBIR: '006003002',
    },
    CENTRAL_COMPRAS: {
      VER_SOLICITUDES: '006004001',
      GENERAR_SOLICITUD: '006004002',
      APROBAR_RECHAZAR_SOLICITUD: '006004003',
      COTIZAR_SOLICITUD: '006004004',
      APROBAR_ITEM_COT_SOLICITUD: '006004005',
      APROBAR_RECHAZAR_COT_RECOMEN: '006004006',
      AGREGAR_ORDEN_COMPRA_SOLICI: '006004007',
      PROGRAMAR_ORDEN_COMPRA_SOLICI: '006004008',
      CONTABILIZAR_ORDEN_COMPRA_SOLICI: '006004009',
      PAGAR_ORDEN_COMPRA_SOLICI: '006004010',
      CONFIRMAR_ORDEN_COMPRA_SOLICI: '006004011',
    },
  },
  // TSN (007)
  TESORERIA: {
    CENTRAL_COSTOS: {
      CONSULTAR_ESTADOS_FINANCIEROS: '007001001',
    },
  },
};
