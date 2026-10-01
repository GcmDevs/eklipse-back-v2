import { DataSource } from 'typeorm';
import { ApiTags } from '@nestjs/swagger';
import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { getDateRange } from '@inn/old/common/application/services';
import { INN_AUTHORITIES } from '@inn/old/authorities/inventario';
import { BaseSource } from '@common/infrastructure/services';
import { GcmContextCode, gcmContextFactory } from '@common/domain/types';
import { Authorities, CommonGuards } from '@common/presentation/decorators';

const formatDate = (date: Date, add_: boolean, forHumans: boolean) => {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const monthFt = month <= 9 ? `0${month}` : month;

  const dateFt = !forHumans ? `${year}${add_ ? '-' : ''}${monthFt}` : `${monthFt}/${year}`;

  return dateFt;
};

const query = (date: Date) => {
  const dateFt = formatDate(date, false, false);
  return `SELECT INKFECHA AS FECHA,MONTH(inkfecha) AS MES,
    inngrupo.IGRNOMBRE AS GRUPO,
    INNPRODUC.IPRCODIGO AS COD_PRODUCTO,
    INNPRODUC.IPRDESCOR AS PRODUCTO,
    AGRCODIGO AS COD_AGRUPAMIENTO,
    AGRNOMBRE AS NOM_AGRUPAMIENTO,
    inndocume.idconsec as DOCUMENTO,
    CASE INNDOCUME.IDTIPDOC
        WHEN 0 THEN 'Orden_Compra' WHEN 1 THEN 'Remision_Entrada'
        WHEN 2 THEN 'Comprobante_Entrada'
        WHEN 3 THEN 'Suministro_Paciente'
        WHEN 4 THEN 'Inventario_Inicial'
        WHEN 5 THEN 'Devolucion_Suministro'
        WHEN 6 THEN 'CierreMensual'
        WHEN 7 THEN 'Cotizacion'
        WHEN 8 THEN 'Remision_Salida'
        WHEN 9 THEN 'factura'
        WHEN 10 THEN 'Prestamo_Mercancia'
        WHEN 11 THEN 'Ajuste_Inventario'
        WHEN 12 THEN 'Factura'
        WHEN 13 THEN 'Compromisos'
        WHEN 14 THEN 'Devolucion_Remision'
        WHEN 15 THEN 'Devolucion_Compra'
        WHEN 16 THEN 'Devolucion_Venta'
        WHEN 17 THEN 'Orden_Despacho'
        WHEN 18 THEN 'Contrato'
        WHEN 19 THEN 'Orden_Servicio'
        WHEN 20 THEN 'Orden_Produccion'
        WHEN 21 THEN 'Devolucion_OrdenD'
        WHEN 22 THEN 'Solicitud_Pedido'
        WHEN 23 THEN 'Demanda_Insatisfecha'
        WHEN 24 THEN 'Traslado_Producto_Consignacion'
        WHEN 25 THEN 'Recibo_Orden_Despacho'
        WHEN 26 THEN 'Reclasificacion_Regulados'
        END AS 'TIPO_DOCUMENTO',
    CASE INKTIPMOV
        WHEN 0 THEN INKCANTID
        WHEN 1 THEN ''
        END AS ENTRADA,
    CASE INKTIPMOV
        WHEN 0 THEN ''
        WHEN 1 THEN INKCANTID
        END AS SALIDA
    FROM INKD${dateFt}
        INNER JOIN INNPRODUC ON  INKD${dateFt}.INNPRODUC = INNPRODUC.OID
        INNER JOIN INNDOCUME ON INNDOCUME.OID = INKD${dateFt}.INNDOCUME
        INNER JOIN INNAGRUPAMI ON INNAGRUPAMI.OID = INNPRODUC.INNAGRUPAMI
        INNER JOIN INNGRUPO ON INNPRODUC.IGRCODIGO = INNGRUPO.OID
    `;
};

interface ReporteRes {
  FECHA: string;
  MES: number;
  GRUPO: string;
  COD_PRODUCTO: string;
  PRODUCTO: string;
  COD_AGRUPAMIENTO: string;
  NOM_AGRUPAMIENTO: string;
  DOCUMENTO: string;
  TIPO_DOCUMENTO: string;
  ENTRADA: number;
  SALIDA: number;
  EXISTENCIA_ACTUAL?: number;
}

@ApiTags('V1 - Reportes almacen')
@CommonGuards()
@Controller('v1/inn/pdt/reportes')
export class ReportesController extends BaseSource {
  @Authorities([INN_AUTHORITIES.PRODUCTOS.GESTION_REPORTES])
  @Get('uso-mes/:inicio/:fin')
  public async getUsoPorMes(
    @Param('inicio') inicio: Date,
    @Param('fin') fin: Date,
    @Query('context') context: GcmContextCode
  ) {
    inicio = new Date(`${inicio}:00:00`);
    fin = new Date(`${fin}:00:00`);

    let conn: DataSource;

    if (context) conn = this.dynamicConn(gcmContextFactory(context));
    else conn = this.conn;

    const dateRanges = getDateRange(inicio, fin);

    const results: { mes: string; mesForHumans: string; data: ReporteRes[] }[] = [];

    for (let i = 0; i < dateRanges.length; i++) {
      try {
        const response: ReporteRes[] = await conn.query(query(dateRanges[i].start));

        const result = response.filter(
          el =>
            el.MES === dateRanges[i].start.getMonth() + 1 && (el.ENTRADA !== 0 || el.SALIDA !== 0)
        );

        results.push({
          mes: formatDate(dateRanges[i].start, true, false),
          mesForHumans: formatDate(dateRanges[i].start, false, true),
          data: result,
        });
      } catch (error) {
        throw new BadRequestException(error.message);
      }
    }

    return results;
  }
}
