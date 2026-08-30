import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BadRequestException, Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { CotizacionServicesSource } from '@inn/lgc/ctc/infrastructure/services';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { GcmContexts } from '@common/domain/types';
import { INN_AUTHORITIES } from '@inn/authorities';
import {
  ReportarOrdenCompraListaEntregaDto,
  ContabilizarOrdenCompraDto,
  ProgramarOrdenCompraDto,
  ConfirmarOrdenCompraDto,
  AgregarOrdenCompraDto,
  RecibirOrdenCompraDto,
  PagarOrdenCompraDto,
} from '../dtos';

@CommonGuards()
@ApiTags('Cotizaciones')
@Controller('v1/inn/ctc/cotizaciones')
export class CotizacionServicesController {
  constructor(private _cotizacionServices: CotizacionServicesSource) {}

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Get('update-proveedor/:contextCode/:cotizacionId/:proveedorId')
  public updateProveedor(
    @Param('contextCode') contextCode: GcmContexts,
    @Param('cotizacionId') cotizacionId: number,
    @Param('proveedorId') proveedorId: number
  ) {
    try {
      return this._cotizacionServices.updateProveedor(contextCode, +cotizacionId, +proveedorId);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Patch('agregar-orden-compra')
  public async agregarOC(@Body() body: AgregarOrdenCompraDto): Promise<boolean> {
    try {
      const response = await this._cotizacionServices.agregarOrdenCompra(body);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.PROGRAMAR_OC])
  @Patch('programar-orden-compra')
  public programarOrden(@Body() body: ProgramarOrdenCompraDto) {
    try {
      return this._cotizacionServices.programarOrdenCompra(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CONTABILIZAR_OC])
  @Patch('contabilizar-orden-compra')
  public contabilizarOrden(@Body() body: ContabilizarOrdenCompraDto) {
    try {
      if (!body.consecutivo && !body.codigoComprobanteContable) {
        throw new Error('Solo puede enviar cuenta x pagar o comprobante contable');
      } else {
        return this._cotizacionServices.contabilizarOrdenCompra(body);
      }
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.PAGAR_OC])
  @Patch('pagar-orden-compra')
  public pagarOrden(@Body() body: PagarOrdenCompraDto) {
    try {
      return this._cotizacionServices.pagarOrdenCompra(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([
    INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC,
    INN_AUTHORITIES.CENTRAL_COMPRAS.REPORTAR_ENTREGA,
  ])
  @Patch('reportar-oc-lista-entrega')
  public reportarOCListaParaEntrega(@Body() body: ReportarOrdenCompraListaEntregaDto) {
    try {
      return this._cotizacionServices.reportarOCListaParaEntrega(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Patch('recibir-orden-compra')
  public recibirOrdenCompra(@Body() body: RecibirOrdenCompraDto) {
    try {
      return this._cotizacionServices.recibirOrdenCompra(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CONFIRMAR_OC_EN_COTI])
  @Patch('confirmar-orden-compra')
  public confirmarOrdenCompra(@Body() body: ConfirmarOrdenCompraDto) {
    try {
      return this._cotizacionServices.confirmarOrdenCompra(body);
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
