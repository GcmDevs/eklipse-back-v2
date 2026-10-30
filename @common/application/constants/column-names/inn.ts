export const TBNMS__INN__ = {
  /** DOCUMENTOS */
  dcm: {
    documentos: 'INNDOCUME',
    /** COMPROBANTES DE ENTRADA */
    cet: {
      comprobantesEntrada: 'INNCCOMPR',
      detalle: 'INNMCOMPR',
    },
    /** REMISIONES DE ENTRADA */
    rme: {
      remisionesEntrada: 'INNCREMEN',
      detalle: 'INNMREMEN',
    },
    /***  TRASLADO PRODUCTOS */
    tpd: {
      trasladoProducto: 'INNTRASPROD',
      trasladoProductoDetalle: 'INNTRASPRODD',
    },
    /** ORDENES DE DESPACHO */
    odp: {
      ordenesDespacho: 'INNORDDESC',
      detalle: 'INNORDDESD',
      relacionDocumento: 'INNRECORDES',
    },
    /** SUMINISTRO AL PACIENTE */
    smp: {
      suministroPaciente: 'INNCSUMPA',
      detalle: 'INNMSUMPA',
    },
    /** ORDENES DE COMPRA */
    ocs: {
      ordenesCompra: 'INNCORDEN',
      detalle: 'INNMORDEN',
    },
  },
  /** ACTIVOS FIJOS */
  afn: {
    activos: 'AFNACTIVO',
    informacionGeneral: 'AFNDAGEAC',
    productos: 'AFNPRODUC',
    responsables: 'AFNRESPON',
    grupos: 'AFNGRUPOS',
    /** SERVICIO TECNICO */
    svt: {
      solicitudes: 'EKINNAFNSOLISERTEC',
      items: 'EKINNAFNSOLISERTECITEM',
      notas: 'EKINNAFNSOLISERTECNOTA',
      usuarioTipoServicioTecnico: 'EKINNAFNSOLISERTECTIPOUSUARIO',
    },
  },
  /** PRODUCTOS */
  pdt: {
    agrupamientos: 'INNAGRUPAMI',
    almacenes: 'INNALMACE',
    centroAlmacen: 'EKINNALMACENATE',
    productos: 'INNPRODUC',
    fabricantes: 'INNFABRIC',
    existencias: 'INNFISICO',
    lotes: 'INNLOTSER',
    grupos: 'INNGRUPO',
    /** ESTANTES */
    stt: {
      estantes: 'EKINNESTANT',
      verificaciones: 'EKINNESTANTVERIFI',
      estanteProducto: 'EKINNESTANTPRODUC',
      reportes: 'EKINNESTANTBALAPROD',
      cambioEstante: 'EKINNESTANTCAMBIO',
    },
  },
  /** FARMACIA */
  fmc: {
    /** CONTROL DE GASTOS */
    cgt: {
      controlGastos: 'EKINNFMCCGT',
      detalle: 'EKINNFMCCGTITEM',
      controlGastosHistorial: 'EKINNFMCCGTHIST',
      controlGastosArchivos: 'EKINNFMCCGTARCHI',
    },
    /** LEGALIZACION DE FACTURAS */
    ldf: {
      legalizacionFacturas: 'EKINNFMLEGFACT',
      legalizacionFacturasHistorial: 'EKINNFMLEGFACTHIST',
    },
    /** RECEPCION TECNICA */
    rct: {
      recepcionesTecnicas: 'GCMRECTEC',
      detalle: 'GCMRECTECPROD',
      lotes: 'GCMRECTECPRLOT',
      sugerencias: 'INNRTCSUGERENCIA',
    },
  },
  /** OFERTAS */
  ofer: {
    categorias: 'EKINNOFERCATEGORIA',
    productos: 'EKINNOFERPRODUCTO',
    proveedores: 'EKINNOFERPROVEEDOR',
    ofertas: 'EKINNOFEROFERTA',
    oferta_docs: 'EKINNOFEROFERTADOC',
  },

  /** GESTION ACTIVOS */
  ges_actvo: {
    iden_equipo: 'EKINNEQPIDEQUIPOS',
    solicitudes: 'EKINNEQPSOLICITUDESAPROBACION',
    eventos: 'EKINNEQPEVENTOSEQUIPO',
    audit_tipo_equipo: 'EKINNEQPAUDITTIPOSEQPUIPO',
    tipos_activo: 'EKINNEQPTIPOSACTIVO',
    clases_equipo: 'EKINNEQPCLASESEQUIPO',
    subclases_equipo: 'EKINNEQPSUBCLASESEQUIPO',
    tipos_equipo: 'EKINNEQPTIPOSEQUIPO',
    tipo_eqp_fichas: 'EKINNEQPTPEQFICHASTECNICAS',
    tipo_eqp_accesorios: 'EKINNEQPTPEQACCESORIOS',
    tip_doc_categoria_activo: 'EKINNEQPTIPEQDOCTIPOSCATG',
    tipo_eqp_docs: 'EKINNEQPTPEQDOCUMENTOS',
    tipo_eqp_planes_default: 'EKINNEQPTPEQPLANESDEFAULT',
    adquisiciones: 'EKINNEQPADQUISICIONES',
    eq_accesorios_unidad: 'EKINNEQPEQACCESORIOSUNIDAD',
    partes_catg: 'EKINNEQPHVPARTESCATG',
    baja_equipo: 'EKINNEQPBAJAEQUIPOS',
    hdv_eqp: {
      accesorios: 'EKINNEQPHVACCESORIOS',
      partes_catg: 'EKINNEQPHVPARTESCATG',
      docs: 'EKINNEQPHVDOCUMENTOS',
      ficha_tecnica: 'EKINNEQPHVFICHASTECNICAS',
      hdv_eqp: 'EKINNEQPHVAEQUIPOS',
      tip_doc: 'EKINNEQPHVTIPODOCUMENTOSEQUIPO',
      medibles: {
        unidades_medida: 'EKINNEQPHVUNIDADESMEDIDA',
      },
    },
    actividades: {
      planes_actividades: 'EKINNEQPACTPLANESACTIVIDAD',
      regs_actividades: 'EKINNEQPACTREGSACTIVIDAD',
      reprogramaciones_actividades: 'EKINNEQPACTREGSREPROGSACTIVIDAD',
      cronogramas: 'EKINNEQPACTCRONOGRAMAS',
      cronograma_recursos: 'EKINNEQPACTCRONOGRAMARECURSOS',
      ejecuciones_externas: 'EKINNEQPACTREGSEJECUCIONEXTERNA',
    },

    pool_recursos: {
      recursos: 'EKINNEQPPLRECURSOS',
      asignaciones_recursos: 'EKINNEQPPLASINACIONRECURSOS',
      asignaciones_actividad_recurso: 'EKINNEQPPLASINACIONRECURSOACTIVIDAD',
      asignaciones_usuario_recurso: 'EKINNEQPPLASINACIONRECURSOUSUARIO',
    },

    fmt: {
      formatos: 'EKFMTFORMATOS',
      versiones: 'EKFMTVERSIONESFORMATOS',
      registros_diligenciados: 'EKFMTREGSDATOSDILIGENCIADOSMANT',
      eventos_version: 'EKFMTEVENTOSVERSION',

      secciones: {
        secciones: 'EKFMTSECSECCIONESCTG',
        plantillas: 'EKFMTSECPLANTILLASFORMATOS',
        config_imgs_slots: 'EKFMTSECCONFIGIMGSSLOTS',
      },

      mantenimiento: {
        grupos_ejecucion: 'EKFMTEJEGRUPOS',
        ejecuciones_items: 'EKFMTEJEITEMS',
      },
    },
  },

  ges_tan: {
    tanqueos: 'GCNTANQUEOS',
    tanqueo_incons: 'GCNTANQUEOINCONS',
    repositorios_comb: 'GCNREPOSITORIOSCOMB',
    movimientos_comb: 'GCNMOVIMIENTOSCOMB',
    abastecimientos: 'GCNABASTECIMIENTOS',
    sync_logs: 'GCNSYNCLOGS',
    estaciones_servicio: 'GCNESTACIONESSERVICIO',
    lecturas_odometro: 'GCNLECTURASODOMETRO',
    tanqueo_correcciones: 'GCNTANQUEOCORRECCIONES',
    tanqueo_intentos: 'GCNTANQUEOINTENTOS',
    tanqueo_evidencias_log: 'GCNTANQUEOEVIDENCIASLOG',
    tanqueo_eventos_log: 'GCNTANQUEOEVENTOSLOG',
    vehiculos: 'EKINNDEVEHICULOS',
  },

  turnos_veh: {
    ambulancia: 'AMBAMBULANCIA',
    plantilla: 'AMBPLANTILLA',
    elemento_venc: 'AMBELEMENTOVENC',
    turno: 'AMBTURNO',
    entrega: 'AMBENTREGA',
    entrega_decl: 'AMBENTREGADECL',
    limpieza: 'AMBLIMPIEZA',
    dotacion: 'AMBDOTACION',
    dotacion_novedad: 'AMBDOTACIONNOVEDAD',
    evento: 'AMBEVENTO',
  },
};
