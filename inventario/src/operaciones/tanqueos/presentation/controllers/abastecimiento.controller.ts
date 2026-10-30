import { INN_AUTHORITIES } from '@inn/authorities';
import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Authorities } from '@common/presentation/decorators';
import {
  Body,
  Controller,
  Delete,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { RepositorioCombustibleService, TanqueoEvidenciasService } from '@inn/operaciones/tanqueos/application';
import { TipoEvidencia } from '@inn/operaciones/tanqueos/domain/enums';
import { AbastecimientoRead } from '@inn/operaciones/tanqueos/domain/reads';
import {
  AnularTanqueoDto,
  EliminarTanqueoEvidenciaDto,
  OrdenTanqueoEvidenciasDto,
  ReasignarTanqueoEvidenciaDto,
  TanqueoEvidenciaDto,
} from '../dto';

@Controller('/v4/inn/vehiculos/abastecimientos')
export class AbastecimientoController extends BaseShelteredController {
  constructor(
    private readonly repositorioService: RepositorioCombustibleService,
    private readonly evidenciasService: TanqueoEvidenciasService
  ) {
    super();
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.RESOLVER])
  @Patch('/:id/anular')
  public async anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: AnularTanqueoDto
  ): Promise<BaseApiResponse<AbastecimientoRead>> {
    const abast = await this.repositorioService.anularAbastecimiento(id, data.motivoAnulacion);
    return { data: abast, message: 'Abastecimiento anulado' };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.RESOLVER])
  @Post('/:id/evidencias')
  public async agregarEvidencia(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: TanqueoEvidenciaDto
  ): Promise<BaseApiResponse<AbastecimientoRead | null>> {
    await this.evidenciasService.agregarAbastecimiento(id, data.tipo, data.mediaId, data.motivo);
    const view = await this.repositorioService.findAbastecimientoView(id);
    return { data: view };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.RESOLVER])
  @Patch('/:id/evidencias/orden')
  public async ordenEvidencias(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: OrdenTanqueoEvidenciasDto
  ): Promise<BaseApiResponse<AbastecimientoRead | null>> {
    await this.evidenciasService.reordenarAbastecimiento(id, data.tipos);
    const view = await this.repositorioService.findAbastecimientoView(id);
    return { data: view };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.RESOLVER])
  @Delete('/:id/evidencias/:tipo')
  public async eliminarEvidencia(
    @Param('id', ParseIntPipe) id: number,
    @Param('tipo', new ParseEnumPipe(TipoEvidencia)) tipo: TipoEvidencia,
    @Body() data: EliminarTanqueoEvidenciaDto
  ): Promise<BaseApiResponse<AbastecimientoRead | null>> {
    await this.evidenciasService.eliminarAbastecimiento(id, tipo, data.motivo);
    const view = await this.repositorioService.findAbastecimientoView(id);
    return { data: view };
  }

  @Authorities([INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.RESOLVER])
  @Post('/:id/evidencias/:tipo/reasignar')
  public async reasignarEvidencia(
    @Param('id', ParseIntPipe) id: number,
    @Param('tipo', new ParseEnumPipe(TipoEvidencia)) tipo: TipoEvidencia,
    @Body() data: ReasignarTanqueoEvidenciaDto
  ): Promise<BaseApiResponse<AbastecimientoRead | null>> {
    await this.evidenciasService.reasignarAbastecimiento(id, tipo, data.tipoDestino, data.motivo);
    const view = await this.repositorioService.findAbastecimientoView(id);
    return { data: view };
  }
}
