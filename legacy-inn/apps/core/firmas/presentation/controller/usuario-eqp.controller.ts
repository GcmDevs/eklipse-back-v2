import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { Controller, Get, Query } from '@nestjs/common';
import { UsuarioEqpService } from '../../application/services/usuario-eqp.service';
import { UsuarioMapper } from '../../infrastructure/mappers';
import { FilterUsuarioSearchDto } from '../dto';

@Controller('/v4/usuarios')
export class UsuarioEqpController extends BaseShelteredController {
  constructor(private readonly firmaService: UsuarioEqpService) {
    super();
  }

  @Get('/suggestions')
  async getSuggestions(
    @Query() { nombre, numeroDocumento }: FilterUsuarioSearchDto
  ): Promise<BaseApiResponse<any>> {
    const usuariosFound = await this.firmaService.findSuggestions(nombre, numeroDocumento);
    return { data: UsuarioMapper.toResponseList(usuariosFound) };
  }
}
