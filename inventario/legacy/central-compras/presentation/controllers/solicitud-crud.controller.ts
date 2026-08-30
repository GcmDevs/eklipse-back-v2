import { ApiBody, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Controller,
  Param,
  Query,
  Post,
  Body,
  Get,
  Patch,
} from '@nestjs/common';
import { SolicitudCrudSource } from '@inn/lgc/ctc/infrastructure/repositories';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { TipoCode } from '@inn/lgc/ctc/types/inn/central-compras/solicitudes';
import {
  BasicInfoSolicitudRes,
  ComplementoSolicitudRes,
} from '@inn/lgc/ctc/infrastructure/responses';
import { GcmContextCode } from '@common/domain/types';
import { CancelarSolicitudDto, ManageSolicitudDto } from '../dtos';
import { INN_AUTHORITIES } from '@inn/authorities';

@CommonGuards()
@ApiTags('Solicitudes')
@Controller('v1/inn/ctc/solicitudes')
export class SolicitudCompraCrudController {
  constructor(private _crud: SolicitudCrudSource) {}

  @ApiOkResponse({ type: BasicInfoSolicitudRes, isArray: true })
  @ApiQuery({ name: 'start', type: Date, required: true })
  @ApiQuery({ name: 'end', type: Date, required: true })
  @ApiQuery({ name: 'tipos', type: Number, isArray: true, required: true })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get()
  async fetchResumen(
    @Query('start') start: Date,
    @Query('end') end: Date,
    @Query('tipos') tipos: TipoCode[]
  ) {
    try {
      const response = await this._crud.fetchResumen(start, end, tipos);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: ComplementoSolicitudRes, isArray: true })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.CODE])
  @Get('complemento/:solicitudId/:contextCode')
  async fetchComplemento(
    @Param('solicitudId') solicitudId: number,
    @Param('contextCode') contextCode: GcmContextCode
  ) {
    try {
      const response = await this._crud.fetchComplemento(solicitudId, contextCode);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @ApiBody({ type: ManageSolicitudDto })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.AGREGAR])
  @Post()
  async create(@Body() payload: ManageSolicitudDto) {
    try {
      const response = await this._crud.create(payload);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOkResponse({ type: Boolean })
  @Authorities([INN_AUTHORITIES.CENTRAL_COMPRAS.ELIMINAR])
  @Patch('cancelar')
  async cancelar(@Body() body: CancelarSolicitudDto) {
    try {
      const response = await this._crud.cancelar(body);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
