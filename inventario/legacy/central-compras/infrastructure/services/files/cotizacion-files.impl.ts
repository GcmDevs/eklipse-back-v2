import { Injectable } from '@nestjs/common';
import { CentralComprasSource } from '../../base';
import { GcmContexts } from '@common/domain/types';
import { OCPayload, generateOrdCo } from './pdf-generator.orden';
import { generateComprobante, generateCxP } from './pdf-generator.cxp';
import {
  CambioEstadoOrm,
  CotizacionOrm,
  DetalleCuentaxPagarOrm,
  SolicitudOrm,
} from '@inn/lgc/ctc/orm/inn/central-compras';
import { gcmContextFactory } from '@common/domain/types';
import {
  TIPOS,
  ESTADOS,
  ESTADOS_ESPECIFICOS,
} from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import { TIPOS_PAGO } from '@inn/lgc/ctc/types/inn/central-compras/cotizaciones';
import { CentroOrm } from '@inn/lgc/ctc/orm/adn';
import { switchConn } from '@common/infrastructure/services';
import { DataSource } from 'typeorm';
import { INN_AUTHORITIES } from '@inn/authorities';

@Injectable()
export class FilesCotizacionesImpl extends CentralComprasSource {
  public async generateOrdenCompra(payload: { context: GcmContexts; cotizacionId: number }) {
    const { context, cotizacionId } = payload;

    const ekConn = switchConn(gcmContextFactory(context));
    const cotizacionRp = ekConn.getRepository(CotizacionOrm);

    const cotizacion = await cotizacionRp.findOne({
      where: { id: cotizacionId },
      relations: [
        'solicitud',
        'cotDocumento',
        'cotDocumento.documento',
        'cotDocumento.documento.creadoPor',
        'solicitud.cambiosEstado',
        'solicitud.cambiosEstado.usuario',
        'cotDocumento',
        'detalle',
        'detalle.item',
      ],
    });

    const data = await ekConn.query(`
    select PR.GPRNOMBRE nombreProveedor,
MC.MUNNOMMUN + ' (' + DT.DEPNOMDEP + ')' ciudadProveedor,
D.IDFECDOC fechaDocumento,
OCD.ICOFECENT fechaEntrega,
pr.GPRDIRECC direccionProveedor,
D.IDCONSEC consecutivo,
CASE D.IDESTADO
WHEN -1 THEN 'No Registrado'
WHEN 0 THEN 'Registrado'
WHEN 1 THEN 'Confirmado'
WHEN 2 THEN 'Anulado'
END estado,
PR.GPRTELEFO1 telefonoProveedor,
isNull(OCD.ICOLUGENT, 'CALLE 13 B BIS 17-54 BARRIO ALFONSO LOPEZ') direccionEntrega,
ocd.icforpag formaPago,
pr.gprplazos diasPlazo,
CASE D.IDTIPDOC
WHEN 0 THEN 'Orden_compra'
WHEN 19 THEN 'Orden_servicio'
END tipoDocumento,
CASE OCD.ICOMONEDA
WHEN 0 THEN 'Pesos'
WHEN 1 THEN 'Extranjera'
END moneda,
TC.CTCNOMBRE tipoContrato,
CASE T.TERTIPDOC
WHEN 0 THEN 'Ninguno'
WHEN 1 THEN 'C.C'
WHEN 2 THEN 'Cedula de extranjería'
WHEN 3 THEN 'Tarjeta de identidad'
WHEN 4 THEN 'Registro civil'
WHEN 5 THEN 'Pasaporte'
WHEN 6 THEN 'Adulto sin identificación'
WHEN 7 THEN 'Menor sin identificación'
WHEN 8 THEN 'Numero unico de identificación'
WHEN 9 THEN 'NIT'
WHEN 10 THEN 'Carné diplomático'
WHEN 11 THEN 'Salvoconducto'
WHEN 12 THEN 'Certificado nacido vivo'
ELSE 'No definido'
END tipoDocumentoProveedor,
T.TERNUMDOC numeroDocumentoProveedor,
OCD.ICODETALL detalleOC
from INNDOCUME D
inner JOIN INNCORDEN OCD ON D.OID = OCD.OID
LEFT join CPNTIPCON TC ON TC.OID = OCD.CPNTIPCON
INNER JOIN GENTERCERP PR ON PR.OID = OCD.GENPROVEE
INNER JOIN GENTERCER T ON T.OID = PR.GENTERCER
inner JOIN GENMUNICI MC ON MC.OID = T.DGNMUNICIPIO
INNER JOIN GENDEPTO DT ON DT.OID = MC.GENDEPTO
where D.OID =  ${cotizacion.cotDocumento.documentoId}
`);

    const productos = await ekConn.query(`
    select p.OID id, isNull(p.IPRCODIGO, 'N/A') codigo, isNull(p.IPRDESCOR, d.IMODETALLE) nombre,
    isNull(p.IPRMARDISP,'N/A') marca, d.IDDCANTID cantidad, 'UNIDAD' unidadMedida,
    d.IMOVALUNP valorUnitario, d.IDDCANTID * d.IMOVALUNP as subtotal,
    d.IMOPORDES porcDescuento, d.IMOPORIVA porcIVA from INNDOCUME i
    inner join INNMORDEN d on i.OID = d.INNCORDEN
    left join INNPRODUC p on d.INNPRODUC = p.OID
    where i.OID = ${cotizacion.cotDocumento.documentoId}`);

    const activosFijos = await ekConn.query(`select p.OID id, isNull(p.APRCODIGO, 'N/A') codigo,
      isNull(p.APRNOMBRE, d.IMODETALLE) nombre,
    'N/A' marca, d.IDDCANTID cantidad, 'UNIDAD' unidadMedida,
    d.IMOVALUNP valorUnitario, d.IDDCANTID * d.IMOVALUNP as subtotal,
    d.IMOPORDES porcDescuento, d.IMOPORIVA porcIVA from INNDOCUME i
    inner join INNMORDACTNET d on i.OID = d.INNCORDEN
    left join AFNPRODUC p on d.AFNPRODUC = p.OID
    where i.OID = ${cotizacion.cotDocumento.documentoId}`);

    productos.push(...activosFijos);

    productos.map((el: any) => {
      el.subtotalConIVA =
        el.cantidad * (el.valorUnitario + (el.valorUnitario / 100) * el.porcentajeIVA);
    });

    const tempVerificacionOC: CambioEstadoOrm[] = cotizacion.solicitud.cambiosEstado.filter(
      el =>
        el.entidadRelacionadaId === cotizacion.id &&
        el.tipoCode === ESTADOS.SOL_ULTIMOS_PASOS.getCode() &&
        el.keyCode === ESTADOS_ESPECIFICOS.COTI_OC_APROBADA.getCode()
    );

    const tempProgramacionOC: CambioEstadoOrm[] = cotizacion.solicitud.cambiosEstado.filter(
      el =>
        el.entidadRelacionadaId === cotizacion.id &&
        el.tipoCode === ESTADOS.SOL_ULTIMOS_PASOS.getCode() &&
        el.keyCode === ESTADOS_ESPECIFICOS.COTI_OC_PROGRAMADA.getCode()
    );

    const verificacionOC = tempVerificacionOC.length ? tempVerificacionOC[0] : null;

    const programacionOC = tempProgramacionOC.length ? tempProgramacionOC[0] : null;

    const aprobado1FromCE = cotizacion.solicitud.cambiosEstado.filter(
      est => est.tipoCode === ESTADOS.COTI_APROBADA.getCode()
    )[0];

    const aprobado2FromCE = cotizacion.solicitud.cambiosEstado.filter(
      est => est.tipoCode === ESTADOS.COTI_APROBADA.getCode()
    )[1];

    const aprobado3FromCE =
      cotizacion.solicitud.cambiosEstado.filter(
        est => est.tipoCode === ESTADOS.COTI_APROBADA.getCode()
      ).length === 3
        ? cotizacion.solicitud.cambiosEstado.filter(
            est => est.tipoCode === ESTADOS.COTI_APROBADA.getCode()
          )[2]
        : undefined;

    const elaborador = {
      subtitle: 'Elaboró',
      nombre: cotizacion.cotDocumento.documento.creadoPor.nombreCompleto!,
      documento: cotizacion.cotDocumento.documento.creadoPor.cedula!,
      cargo: 'LIDER DE COMPRAS',
    };

    const aprobado1 = aprobado1FromCE
      ? {
          nombre: aprobado1FromCE.usuario.nombreCompleto,
          documento: aprobado1FromCE.usuario.cedula,
          cargo: (await this.hasAnyAuthorityFromRemote(
            [INN_AUTHORITIES.CENTRAL_COMPRAS.CARGO_1_APROBAR_RECHAZAR_COTI_RECOMEN],
            aprobado1FromCE.usuario.id,
            gcmContextFactory(payload.context)
          ))
            ? 'COORDINADOR(A) DE COMPRAS'
            : (await this.hasAnyAuthorityFromRemote(
                  [INN_AUTHORITIES.CENTRAL_COMPRAS.CARGO_2_APROBAR_RECHAZAR_COTI_RECOMEN],
                  aprobado1FromCE.usuario.id,
                  gcmContextFactory(payload.context)
                ))
              ? 'GERENTE DE COMPRAS'
              : (await this.hasAnyAuthorityFromRemote(
                    [INN_AUTHORITIES.CENTRAL_COMPRAS.CARGO_4_APROBAR_RECHAZAR_COT_RECOMEN],
                    aprobado1FromCE.usuario.id,
                    gcmContextFactory(payload.context)
                  ))
                ? 'SUBDIRECTOR(A) DE COMPRAS'
                : 'VERIFICA COORDINACION DE COMPRAS',
        }
      : undefined;

    const aprobado2 = aprobado2FromCE
      ? {
          nombre: aprobado2FromCE.usuario.nombreCompleto,
          documento: aprobado2FromCE.usuario.cedula,
          cargo: (await this.hasAnyAuthorityFromRemote(
            [INN_AUTHORITIES.CENTRAL_COMPRAS.CARGO_1_APROBAR_RECHAZAR_COTI_RECOMEN],
            aprobado2FromCE.usuario.id,
            gcmContextFactory(payload.context)
          ))
            ? 'COORDINADOR(A) DE COMPRAS'
            : (await this.hasAnyAuthorityFromRemote(
                  [INN_AUTHORITIES.CENTRAL_COMPRAS.CARGO_2_APROBAR_RECHAZAR_COTI_RECOMEN],
                  aprobado2FromCE.usuario.id,
                  gcmContextFactory(payload.context)
                ))
              ? 'GERENTE DE COMPRAS'
              : (await this.hasAnyAuthorityFromRemote(
                    [INN_AUTHORITIES.CENTRAL_COMPRAS.CARGO_4_APROBAR_RECHAZAR_COT_RECOMEN],
                    aprobado1FromCE.usuario.id,
                    gcmContextFactory(payload.context)
                  ))
                ? 'SUBDIRECTOR(A) DE COMPRAS'
                : 'VERIFICA COORDINACION DE COMPRAS',
        }
      : undefined;

    const aprobado3 = aprobado3FromCE
      ? {
          nombre: aprobado3FromCE.usuario.nombreCompleto,
          documento: aprobado3FromCE.usuario.cedula,
          cargo: 'DIRECTOR(A) DE COMPRAS',
        }
      : undefined;

    const verificador = verificacionOC
      ? {
          nombre: verificacionOC?.usuario.nombreCompleto,
          documento: verificacionOC?.usuario.cedula,
          cargo: 'DIRECTOR ADMINISTRATIVO Y FINANCIERO',
        }
      : undefined;

    const programadorPago = {
      nombre: programacionOC?.usuario.nombreCompleto,
      documento: programacionOC?.usuario.cedula,
      cargo: 'GERENTE CORPORATIVO ECONÓMICO',
    };

    const encargados =
      cotizacion.solicitud.tipoCode !== TIPOS.MEDICAMENTOS.getCode() ||
      (cotizacion.solicitud.tipoCode === TIPOS.MEDICAMENTOS.getCode() &&
        cotizacion.cotDocumento.tipoPagoCode === TIPOS_PAGO.ANTICIPO.getCode())
        ? [elaborador, aprobado1, aprobado2, aprobado3, verificador, programadorPago]
        : [elaborador, aprobado1, aprobado2];

    const dataForPDF: OCPayload = {
      clinica: {
        contexto: payload.context,
        nit: '824001041-6',
        direccion: 'CALLE 16B # 11-33',
      },
      ordenCompra: {
        consecutivo: data[0].consecutivo,
        fechaCreacion: data[0].fechaDocumento as any,
        fechaEntrega: data[0].fechaEntrega as any,
        estado: data[0].estado,
        moneda: data[0].moneda,
        clase: data[0].tipoDocumento,
        tipoContrato: data[0].tipoContrato,
        direccionEntrega: data[0].direccionEntrega,
        formaPago: data[0].formaPago,
        diasPlazo: data[0].diasPlazo,
        detalle: data[0].detalleOC,
      },
      proveedor: {
        nombre: data[0].nombreProveedor,
        tipoDocumento: data[0].tipoDocumentoProveedor,
        documento: data[0].numeroDocumentoProveedor,
        direccion: data[0].direccionProveedor,
        ciudad: data[0].ciudadProveedor,
        telefono: data[0].telefonoProveedor || '',
      },
      productos,
      usuario: {
        id: this.auth.user.id,
        cedula: this.auth.user.document,
        nombreCompleto: this.auth.user.fullName,
      },
      encargados,
      productosCotizados: cotizacion.detalle,
    };

    return generateOrdCo(dataForPDF);
  }

  public async generateCxP(payload: { context: GcmContexts; cxpId: number }): Promise<any> {
    const { context, cxpId } = payload;

    const dataSource = switchConn(gcmContextFactory(context));

    const detalleCuentaxPagarRp = dataSource.getRepository(DetalleCuentaxPagarOrm);

    const detalleCuentaxPagar = await detalleCuentaxPagarRp.findOne({ where: { id: cxpId } });

    if (detalleCuentaxPagar.cuentaxPagarId) {
      return this._generateCxP(payload, dataSource);
    } else if (detalleCuentaxPagar.comprobanteContableId) {
      return this._generateComprobanteContable(payload, dataSource);
    } else {
      throw new Error('No existe');
    }
  }

  private async _generateComprobanteContable(
    payload: { context: GcmContexts; cxpId: number },
    dataSource: DataSource
  ): Promise<any> {
    const { cxpId } = payload;

    const detalleCuentaxPagarRp = dataSource.getRepository(DetalleCuentaxPagarOrm);
    const centroRp = dataSource.getRepository(CentroOrm);
    const cotizacionRp = dataSource.getRepository(CotizacionOrm);
    const solicitudRp = dataSource.getRepository(SolicitudOrm);

    const detalleCuentaxPagar = await detalleCuentaxPagarRp.findOne({ where: { id: cxpId } });

    const cotizacion = await cotizacionRp.findOne({
      where: { id: detalleCuentaxPagar.cotizacionId },
    });

    const solicitud = await solicitudRp.findOne({ where: { id: cotizacion.solicitudId } });

    const centro = await centroRp.findOne({ where: { id: solicitud.centroId } });

    let data = await dataSource.query(`SELECT
    C.COMCODIGO consecutivo,
    C.COMNUMDOCU codigo,
    CASE C.COMESTADO
    WHEN -1 THEN 'No Registrado'
    WHEN 0 THEN 'Registrado'
    WHEN 1 THEN 'Confirmado'
    WHEN 2 THEN 'Anulado'
    END estado,
    TD.TCNOMBRE nombreTipoComprobante,
    C.COMDETALLE detalle,
    C.COMFECCOM fecha
    FROM CTNCOM${detalleCuentaxPagar.comprobanteContableAnio} C
    INNER JOIN CTNTIPCOM TD ON C.CTNTIPCOM = TD.OID
    WHERE C.OID = ${detalleCuentaxPagar.comprobanteContableId}`);

    data = data[0];

    const conceptos =
      await dataSource.query(`select C.CUECODIGO codigoCuenta, C.CUENOMBRE nombreCuenta,
      D.COMDETALLE detalle, D.CMMVALDEB debito, D.CMMVALCRE credito,
      T.TERNUMDOC documentoTercero,T.TERPRINOM primerNombreTercero,
      T.TERSEGNOM segundoNombreTercero, T.TERPRIAPE primerApellidoTercero,
      T.TERSEGAPE segundoApellidoTercero
      from CTNCOMD${detalleCuentaxPagar.comprobanteContableAnio} D
      left join CTNCUENTA C on D.CTNCUENTA = C.OID
      left join GENTERCER T on D.GENTERCER = T.OID
      where D.CTNCOMCONC = ${detalleCuentaxPagar.comprobanteContableId}`);

    data.conceptos = conceptos;

    const url = await generateComprobante({
      clinica: {
        contexto: payload.context,
        nombre: centro.nombre,
      },
      usuario: {
        id: this.auth.user.id,
        cedula: this.auth.user.document,
        nombreCompleto: this.auth.user.fullName,
      },
      retefuente: detalleCuentaxPagar.retefuente,
      reteica: detalleCuentaxPagar.reteica,
      reteIVA: detalleCuentaxPagar.reteIVA,
      data: data,
    });

    return url;
  }

  private async _generateCxP(
    payload: { context: GcmContexts; cxpId: number },
    dataSource: DataSource
  ): Promise<any> {
    const { cxpId } = payload;

    const detalleCuentaxPagarRp = dataSource.getRepository(DetalleCuentaxPagarOrm);
    const centroRp = dataSource.getRepository(CentroOrm);
    const cotizacionRp = dataSource.getRepository(CotizacionOrm);
    const solicitudRp = dataSource.getRepository(SolicitudOrm);

    const detalleCuentaxPagar = await detalleCuentaxPagarRp.findOne({ where: { id: cxpId } });

    const cotizacion = await cotizacionRp.findOne({
      where: { id: detalleCuentaxPagar.cotizacionId },
    });
    const solicitud = await solicitudRp.findOne({ where: { id: cotizacion.solicitudId } });

    const centro = await centroRp.findOne({ where: { id: solicitud.centroId } });

    const data = await dataSource.query(`select
    CP.OID id,
    CP.CXPCONSEC consecutivo,
    CP.CXPDOCUME factura,
    CASE CP.CXPESTADO
    WHEN 0 THEN 'Registrado'
    WHEN 1 THEN 'Confirmado'
    WHEN 2 THEN 'Anulado'
    END estado,
    CASE T.TERTIPDOC
    WHEN 0 THEN 'Ninguno'
    WHEN 1 THEN 'Cedula de ciudadanía'
    WHEN 2 THEN 'Cedula de extranjería'
    WHEN 3 THEN 'Tarjeta de identidad'
    WHEN 4 THEN 'Registro civil'
    WHEN 5 THEN 'Pasaporte'
    WHEN 6 THEN 'Adulto sin identificación'
    WHEN 7 THEN 'Menor sin identificación'
    WHEN 8 THEN 'Numero unico de identificación'
    WHEN 9 THEN 'NIT'
    WHEN 10 THEN 'Carné diplomático'
    WHEN 11 THEN 'Salvoconducto'
    WHEN 12 THEN 'Certificado nacido vivo'
    ELSE 'No definido'
    END tipoDocumentoProveedor,
    T.TERNUMDOC numeroDocumentoProveedor,
    P.GPRNOMBRE nombreProveedor,
    CP.CXPDOCFECHA fechaDocumento,
    CP.CXPFECHACXP fechaFactura,
    CXPDOCPLAZO diasPlazo,
    CXPDOCFECVEN fechaVencimiento,
    CTA.CUECODIGO codigoCuentaContable,
    CTA.CUENOMBRE nombreCuentaContable,
    CTS.CCCODIGO codigoCentroCostos,
    CTS.CCNOMBRE nombreCentroCostos,
    CXPOBSERVA observaciones,
    CPTOCP.CONCODIGO detCodigoConcepto,
    CPTOCP.CONNOMBRE detNombreConcepto,
    DTCPCTA.CUECODIGO detCodigoCuentaContable,
    DTCPCTA.CUENOMBRE detNombreCuentaContable,
    DTCPCTS.CCCODIGO detCodigoCentroCostos,
    DTCPCTS.CCNOMBRE detNombreCentroCostos,
    CASE DTCP.DETNATURA
    WHEN 0 THEN 'Ninguna'
    WHEN 1 THEN 'Debito'
    WHEN 2 THEN 'Credito'
    END detNaturaleza,
    DTCP.DETVALOR detNetoAPagar
    from PGNCXP CP
    INNER JOIN GENTERCERP P ON P.OID = CP.GENTERCERP
    INNER JOIN GENTERCER T ON T.OID = P.GENTERCER
    INNER JOIN CTNCUENTA CTA ON CTA.OID = CP.CTNCUENTA
    LEFT JOIN CTNCENCOS CTS ON CP.CTNCENCOS = CTS.OID 
    INNER JOIN PGNCXPDETALLE DTCP ON DTCP.PGNCXP= CP.OID
    LEFT JOIN CTNCUENTA DTCPCTA ON DTCPCTA.OID = DTCP.CTNCUENTA
    LEFT JOIN CTNCENCOS DTCPCTS ON DTCPCTS.OID = DTCP.CTNCENCOS
    LEFT JOIN PGNCONCXP CPTOCP ON CPTOCP.OID =DTCP.PGNCONCXP
    where CP.OID = ${detalleCuentaxPagar.cuentaxPagarId}
`);

    const conceptos = await dataSource.query(`
    select
    CPTOCP.CONCODIGO codigoConcepto,
    CPTOCP.CONNOMBRE nombreConcepto,
    DTCPCTA.CUECODIGO codigoCuentaContable,
    DTCPCTA.CUENOMBRE nombreCuentaContable,
    DTCPCTS.CCCODIGO codigoCentroCostos,
    DTCPCTS.CCNOMBRE nombreCentroCostos,
    CASE DTCP.DETNATURA
    WHEN 0 THEN 'Ninguna'
    WHEN 1 THEN 'Debito'
    WHEN 2 THEN 'Credito'
    END naturaleza,
    DTCP.DETVALOR netoAPagar
    from PGNCXP CP
    LEFT JOIN PGNCXPDETALLE DTCP ON DTCP.PGNCXP= CP.OID
    LEFT JOIN CTNCUENTA DTCPCTA ON DTCPCTA.OID = DTCP.CTNCUENTA
    LEFT JOIN CTNCENCOS DTCPCTS ON DTCPCTS.OID = DTCP.CTNCENCOS
    LEFT JOIN PGNCONCXP CPTOCP ON CPTOCP.OID = DTCP.PGNCONCXP
    where CP.OID = ${data[0].id}  order by CP.OID asc`);

    const pagos = await dataSource.query(`select PGCUOTA noCuota, PGVENCE fechaVencimiento,
    PGVALOR valor from PGNCXPC where PGNCXP = ${data[0].id} order by OID asc`);

    data[0].conceptos = conceptos;
    data[0].pagos = pagos;

    const url = await generateCxP({
      clinica: {
        contexto: payload.context,
        nombre: centro.nombre,
      },
      usuario: {
        id: this.auth.user.id,
        cedula: this.auth.user.document,
        nombreCompleto: this.auth.user.fullName,
      },
      retefuente: detalleCuentaxPagar.retefuente,
      reteica: detalleCuentaxPagar.reteica,
      reteIVA: detalleCuentaxPagar.reteIVA,
      data: data[0],
    });

    return url;
  }
}
