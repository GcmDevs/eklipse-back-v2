import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { FormatoEngineService } from 'apps/motor-formatos/application';
import { CloneFormatoPlantillaDto, DesignVersionFormatoDto, ResponseCloneFormatoDto } from '../dto';

@Controller('/v4/inn/fmts/motor')
export class FormatoEngineController extends BaseShelteredController {
  constructor(private readonly formatoEngineService: FormatoEngineService) {
    super();
  }

  @Post('/clone')
  public async clone(
    @Body() data: CloneFormatoPlantillaDto
  ): Promise<BaseApiResponse<ResponseCloneFormatoDto>> {
    const formatoPlantillaCloned = await this.formatoEngineService.clone(data);
    return {
      data: {
        formatoId: formatoPlantillaCloned.formatoId,
        versionId: formatoPlantillaCloned.versionId,
      },
      message: 'plantilla de formato clonada con exito',
    };
  }

  @Patch('/:versionId/designer')
  async editar(
    @Param('versionId', ParseIntPipe) versionId: number,
    @Body() data: DesignVersionFormatoDto
  ): Promise<BaseApiResponse<void>> {
    await this.formatoEngineService.designVersion(versionId, data);
    return { message: 'Plantilla de version de formato editada con exito' };
  }

  @Get(':versionId/schema')
  public async getSchema(
    @Param('versionId', ParseIntPipe) versionId: number
  ): Promise<BaseApiResponse<any>> {
    const formatoSchema = await this.formatoEngineService.getSchema(versionId);
    return { data: formatoSchema };
  }

  @Patch('/:versionId/publicar')
  async publish(@Param('versionId', ParseIntPipe) versionId: number) {
    await this.formatoEngineService.publish(versionId);
    return { message: 'Version publicada correctamente' };
  }

  @Patch('/:versionId/despublicar')
  async unPublish(@Param('versionId', ParseIntPipe) versionId: number) {
    await this.formatoEngineService.unPublish(versionId);
    return { message: 'Version despublicada correctamente' };
  }
}
