import { BaseApiResponse } from '@common/domain/types';
import { BaseShelteredController } from '@common/presentation/controllers';
import { extractTenantContext } from '@common/presentation/decorators/header-context.decorator';
import { PaginationHelper } from '@common/presentation/helpers';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { UsuarioEqpService } from '../../application/services/usuario-eqp.service';
import { UsuarioMapper } from '../../infrastructure/mappers';
import { SearchUsuarioDto, UsuarioRead } from '../dto';

@Controller('/v4/inn/identity/usuarios')
export class UsuarioController extends BaseShelteredController {
  constructor(private readonly usuarioService: UsuarioEqpService) {
    super();
  }

  @Get()
  async search(
    @Query() { page, limit, search, transversal }: SearchUsuarioDto,
    @Req() request: Request
  ): Promise<BaseApiResponse<UsuarioRead[]>> {
    if (transversal) {
      const ctxHeader = extractTenantContext(request);
      const [usuarios, count] = await this.usuarioService.searchTransversal(
        page,
        limit,
        search,
        ctxHeader
      );
      const data = UsuarioMapper.toResponseListWithSede(usuarios);
      return PaginationHelper.response(data, count, page, limit);
    }
    const [usuarios, count] = await this.usuarioService.search(page, limit, search);
    const data = UsuarioMapper.toResponseList(usuarios);
    return PaginationHelper.response(data, count, page, limit);
  }
}
