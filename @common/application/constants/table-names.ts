/** @deprecated Uso totalmente desaconsejado, agregado por los modulos legacy */
export const TABLE_NAMES = {
  adn: {
    centros: 'ADNCENATE',
    ingresos: 'ADNINGRESO',
  },
  gen: {
    consecutivos: 'GENCONSEC',
    medicos: {
      index: 'GENMEDICO',
      especialidad: 'GENESPECI',
    },
    /** USUARIOS */
    usu: {
      usuarios: 'GENUSUARIO',
      informacionAdicional: 'EKGENUSUADIDATA',
      dependencias: 'EKGENUSUARIODEPEND',
    },
    areasServicio: 'GENARESER',
    dependencias: 'GENDEPEND',
    terceros: 'GENTERCER',
    proveedores: 'GENTERCERP',
    /** CONTRATOS */
    ctt: {
      contratos: 'GENCONTRA',
      detalle: 'GENDETCON',
    },
    /** PACIENTES */
    pct: {
      pacientes: 'GENPACIEN',
    },
  },
  inn: {
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

    /** EQUIPOS */
    eqp: {
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
  },
};
