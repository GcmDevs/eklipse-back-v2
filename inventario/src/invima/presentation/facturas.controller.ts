import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { ADMIN_AUTHORITY } from '@common/application/constants';
import { INN_AUTHORITIES } from '@inn/authorities';
import { FacturasInvimaService } from '../application/facturas.service';
import { limitePdfBytes } from '../infrastructure/pdf-extractor.service';
import {
  EliminarFacturaDto,
  GuardarFacturaDto,
  ListarFacturasDto,
  ObservacionFacturaDto,
} from './factura.dto';
import { InformeInvimaPdfService } from '../infrastructure/informe-pdf.service';
import { InvimaDatabaseFilter } from './invima-database.filter';

@ApiTags('Facturas INVIMA')
@CommonGuards()
@UseFilters(InvimaDatabaseFilter)
@Controller('v4/inn/invima/facturas')
export class FacturasInvimaController {
  constructor(
    private readonly service: FacturasInvimaService,
    private readonly pdf: InformeInvimaPdfService
  ) {}
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Patch(':id/observaciones')
  observacion(@Param('id', ParseIntPipe) id: number, @Body() input: ObservacionFacturaDto) {
    return this.service.guardarObservacion(id, input);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get(':id/informe.pdf')
  @Header('Cache-Control', 'private, no-store')
  async informe(@Param('id', ParseIntPipe) id: number) {
    return new StreamableFile(await this.pdf.generar(await this.service.informe(id)), {
      type: 'application/pdf',
      disposition: `attachment; filename="verificacion-invima-${id}.pdf"`,
    });
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['archivo'],
      properties: { archivo: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('archivo', {
      storage: memoryStorage(),
      limits: { fileSize: limitePdfBytes(), files: 1, fields: 0 },
    })
  )
  subir(@UploadedFile() archivo: Express.Multer.File) {
    return this.service.subir(archivo);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get()
  listar(@Query() input: ListarFacturasDto) {
    return this.service.listar(input);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Get(':id')
  detalle(@Param('id', ParseIntPipe) id: number) {
    return this.service.detalle(id);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Put(':id')
  guardar(@Param('id', ParseIntPipe) id: number, @Body() input: GuardarFacturaDto) {
    return this.service.guardar(id, input);
  }
  @Authorities([ADMIN_AUTHORITY, INN_AUTHORITIES.PRODUCTOS.VERIFICACION_INVIMA])
  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id', ParseIntPipe) id: number, @Query() input: EliminarFacturaDto) {
    await this.service.eliminar(id, input.version);
  }
}
