import { ALL_CENTROS_ID, FILE_LOCATIONS } from '@common/application/constants';
import { Authorities, CommonGuards } from '@common/presentation/decorators';
import { nonEditFileName } from '@common/presentation/helpers';
import {
  AgregarSoportesRadicacionImpl,
  FetchRadPendByCentroImpl,
  VerificarSoportesRadicacionImpl,
} from '@crn/rad/infrastructure/services';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { GcmContextCode } from '@common/domain/types';
import { AddSopRadI, VerifySopRadI } from '../dtos';
import { CRN_AUTHORITIES } from '@authorities/cartera';

@ApiTags('V1 - Radicación')
@CommonGuards()
@Controller('v1/radicacion')
export class RadicacionByCentroController {
  constructor(
    private _fetchRadPendByCentro: FetchRadPendByCentroImpl,
    private _addSopRad: AgregarSoportesRadicacionImpl,
    private _verifySopRad: VerificarSoportesRadicacionImpl
  ) {}

  @Authorities([CRN_AUTHORITIES.RADICACIONES.GESTIONAR_RADICACIONES_GCM])
  @Get('fetch-pendientes-by-centro')
  async fetchRadPendByCentro(
    @Query('inicio') inicio: Date,
    @Query('final') final: Date,
    @Query('classQuery') classQuery: 1 | 2 | 3,
    @Query('getRadicados') getRadicados: boolean
  ) {
    inicio = new Date(`${inicio}:00:00:00`);
    final = new Date(`${final}:23:59:59`);

    return await this._fetchRadPendByCentro.execute(inicio, final, getRadicados, classQuery);
  }

  @Authorities([CRN_AUTHORITIES.RADICACIONES.GESTIONAR_RADICACIONES_GCM])
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'files' }], {
      storage: diskStorage({
        destination: `../${FILE_LOCATIONS.crn.rdc.comprobantes}`,
        filename: nonEditFileName,
      }),
    })
  )
  @Post('agregar-soportes')
  public async agregarSoportes(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: { data: string }
  ) {
    try {
      const payload: AddSopRadI = JSON.parse(body.data);
      const response = await this._addSopRad.execute(payload);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  @Authorities([CRN_AUTHORITIES.RADICACIONES.GESTIONAR_RADICACIONES_GCM])
  @Get('verificar-soportes')
  public async verificarSoportes(
    @Query('contextoCode') contextoCode: GcmContextCode,
    @Query('facturaId') facturaId: number,
    @Query('isAprobado') isAprobado: boolean,
    @Query('observaciones') observaciones: string
  ) {
    try {
      const payload: VerifySopRadI = {
        contextoCode,
        facturaId,
        isAprobado,
        observaciones,
      };
      const response = await this._verifySopRad.execute(payload);
      return response;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
