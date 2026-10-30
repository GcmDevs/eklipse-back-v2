import { resolveContextoOperativoTransversal } from '@common/application/helpers';
import { INN_AUTHORITIES } from '@inn/authorities';
import { ResourceNotFoundError } from '@common/domain/errors';
import { FindThrowOptions, GcmContextType } from '@common/domain/types';
import {
  assertDirectAuthority,
  withTenantOverride,
} from '@common/infrastructure/persistence/transactional';
import { getUser } from '@common/infrastructure/services';
import { Inject, Injectable } from '@nestjs/common';
import { UsuarioOrm } from '@inn/orm/gen';
import { USUARIO_REPOSITORY, UsuarioConSede, UsuarioEqpRepository } from '../repositories';

@Injectable()
export class UsuarioEqpService {
  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarioRepository: UsuarioEqpRepository
  ) {}

  async search(page: number, limit: number, search?: string): Promise<[UsuarioOrm[], number]> {
    return this.usuarioRepository.search(page, limit, search);
  }

  async searchTransversal(
    page: number,
    limit: number,
    search?: string,
    ctxHeader?: GcmContextType
  ): Promise<[UsuarioConSede[], number]> {
    const usuario = getUser();
    const contexto = resolveContextoOperativoTransversal(usuario.context, ctxHeader);
    const work = () => this.usuarioRepository.searchTransversal(page, limit, search, contexto);
    if (ctxHeader && ctxHeader.getCode() !== usuario.context.getCode()) {
      await assertDirectAuthority(INN_AUTHORITIES.GESTION_TANQUEOS.TANQUEOS.VER_T_SEDES);
      return withTenantOverride(ctxHeader, work);
    }
    return work();
  }

  async findById(
    id: number,
    options: FindThrowOptions = new FindThrowOptions()
  ): Promise<UsuarioOrm | null> {
    const usuarioFound = await this.usuarioRepository.findById(id);
    if (!usuarioFound && options.throwIfNotFound) {
      throw new ResourceNotFoundError(`Usuario con id: ${id} no encontrado`);
    }
    return usuarioFound;
  }
}
