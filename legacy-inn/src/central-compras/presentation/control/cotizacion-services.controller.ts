import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { INN_AUTHORITIES } from '@authorities/inventario';
import {
  OldAddOrdenToCotDto,
  ConfirmarOrdenDto,
  OldContabilizarOrdenDto,
  OldOrdenListaDto,
  OldPagarOrdenDto,
  OldProgramarOrdenDto,
  OldRecibirOrdenDto,
} from '../dtos';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GcmContexts } from '@common/application/constants';
import { FILE_LOCATIONS } from '@common/application/file-locations';
import {
  AddOrdenToCotizacionImpl,
  ConfirmarOrdenImpl,
  ContabilizarOrdenImpl,
  CotizacionServicesImpl,
  OrdenListaParaEntregaImpl,
  PagarOrdenImpl,
  ProgramarOrdenImpl,
} from '@inn/central-compras/infrastructure/servis';
import { RecibirOrdenImpl } from '@inn/central-compras/infrastructure/servis/cotizacion/recibir-orden.impl';
import { FilesCotizacionesImpl } from '@inn/central-compras/infrastructure/services/files';
import { editFileName } from '@common/presentation/helpers';
import { ApiTags } from '@nestjs/swagger';

@CommonGuards()
@ApiTags('V4')
@Controller('v4/central-compras/cotizaciones')
export class CotizacionServiceController {
  constructor(
    private _addOrdenToCotizacion: AddOrdenToCotizacionImpl,
    private _confirmarOrden: ConfirmarOrdenImpl,
    private _contabilizarOrden: ContabilizarOrdenImpl,
    private _pagarOrden: PagarOrdenImpl,
    private _programarOrden: ProgramarOrdenImpl,
    private _recibirOrden: RecibirOrdenImpl,
    private _ordenLista: OrdenListaParaEntregaImpl,
    private _files: FilesCotizacionesImpl,
    private _services: CotizacionServicesImpl
  ) {}

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Patch('add-orden')
  public addOrdenToCotizacion(@Body() body: OldAddOrdenToCotDto) {
    try {
      return this._addOrdenToCotizacion.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CONFIRMAR_OC_EN_COTI])
  @Patch('confirmar-orden')
  public confirmarOrden(@Body() body: ConfirmarOrdenDto) {
    try {
      return this._confirmarOrden.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.PROGRAMAR_OC])
  @Patch('programar-orden')
  public programarOrden(@Body() body: OldProgramarOrdenDto) {
    try {
      return this._programarOrden.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CONTABILIZAR_OC])
  @Patch('contabilizar-orden')
  public contabilizarOrden(@Body() body: OldContabilizarOrdenDto) {
    try {
      if (body.consecutivo) {
        return this._contabilizarOrden.cuentaXPagar(body);
      } else if (body.codigoComprobanteContable) {
        return this._contabilizarOrden.comprobanteContable(body);
      } else {
        throw new Error('Solo puede enviar cuenta x pagar o comprobante contable');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.PAGAR_OC])
  @Post('comprobante-pago')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.inn.ctc.comprobantesPago}`,
        filename: editFileName,
      }),
    })
  )
  public async storeCotizacionFile(@Query('fileName') fileName: string) {
    const result = fileName;
    return result;
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.PAGAR_OC])
  @Patch('pagar-orden')
  public pagarOrden(@Body() body: OldPagarOrdenDto) {
    try {
      return this._pagarOrden.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([
    INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC,
    INN_AUTHORITIES.CENTRAL_COMPRAS.REPORTAR_ENTREGA,
  ])
  @Patch('orden-lista')
  public ordenListaParaEntrega(@Body() body: OldOrdenListaDto) {
    try {
      return this._ordenLista.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('recibir-orden')
  public recibirOrden(@Body() body: OldRecibirOrdenDto) {
    try {
      return this._recibirOrden.execute(body);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('download-orden/:context/:cotizacionId')
  public async downloadOrden(
    @Param('context') context: GcmContexts,
    @Param('cotizacionId') cotizacionId: number
  ) {
    try {
      const url = await this._files.generateOrdenCompra({ context, cotizacionId: +cotizacionId });
      return { url };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('download-cxp/:context/:cxpId')
  public async downloadCxP(@Param('context') context: GcmContexts, @Param('cxpId') cxpId: number) {
    try {
      const url = await this._files.generateCxP({ context, cxpId: +cxpId });
      return { url };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR_OC])
  @Get('update-proveedor/:context/:cotizacionId/:proveedorId')
  public updateProveedor(
    @Param('context') context: GcmContexts,
    @Param('cotizacionId') cotizacionId: number,
    @Param('proveedorId') proveedorId: number
  ) {
    try {
      return this._services.updateProveedor(context, +cotizacionId, +proveedorId);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
