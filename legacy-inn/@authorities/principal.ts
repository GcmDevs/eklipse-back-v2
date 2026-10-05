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
      SECURITY: `${codeModules.gen}001`,
      AUTHORITIES: `${codeModules.gen}002`,
      DEPENDENCIAS: `${codeModules.gen}003`,
    },
  },
  HOSPITALIZACION: {
    CODE: codeModules.hpn,
    SUBS: {
      DIETAS: `${codeModules.hpn}001`,
      GESTION_CLINICA: `${codeModules.hpn}002`,
      CENSOS: `${codeModules.hpn}003`,
      CAMAS: `${codeModules.hpn}004`,
      REFERENCIA: `${codeModules.hpn}005`,
      TRIAGE: `${codeModules.hpn}006`,
      APIS: `${codeModules.hpn}007`,
      AUDITORIA: `${codeModules.hpn}008`,
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
      COSTOS: `${codeModules.inn}007`,
      FARMACIA: `${codeModules.inn}008`,
      SERVICIO_TECNICO: `${codeModules.inn}009`,
      GESTION_ACTIVOS: `${codeModules.inn}013`,
      GESTION_TANQUEOS: `${codeModules.inn}016`,
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
      CONTROL_EGRESOS: `${codeModules.sln}003`,
    },
  },
  CARTERA: {
    CODE: codeModules.crn,
    SUBS: {
      GESTIONES_CONCILIACIONES: `${codeModules.crn}001`,
      RADICACIONES: `${codeModules.crn}002`,
    },
  },
};

export const ADMIN_AUTHORITY = `${MODULES.GENERAL.SUBS.SECURITY}001`;
