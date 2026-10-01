import { gcmContextFactory } from '@common/domain/types';
import { BaseSource } from '@common/infrastructure/services';
import { UsuarioConteoDto } from '@farmacia/inventario/dto/inventarios.dto';
import { UsuarioConteoMapper } from '@farmacia/inventario/mapper/usuario-conteo.mapper';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsuarioConteoOrm } from '@orm/inn/inventario';

@Injectable()
export class UsuarioConteoImpl extends BaseSource {
  public async crearUsuarioConteo(dto: UsuarioConteoDto) {
    const { usuarioId, contextCode } = dto;

    const ctx = gcmContextFactory(contextCode);
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const repo = qr.manager.getRepository(UsuarioConteoOrm);

      const existe = await repo.findOne({ where: { usuarioId } });

      if (existe) {
        throw new BadRequestException('El usuario ya está registrado para conteos');
      }

      const entity = repo.create({
        usuarioId,
        createdAt: new Date(),
        isActive: true,
      });

      const saved = await repo.save(entity);

      const withUsuario = await repo.findOne({
        where: { id: saved.id },
        relations: ['usuario'],
      });

      return UsuarioConteoMapper.toDto(withUsuario);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
  async execute() {
    const ctx = gcmContextFactory(this.auth.context.getCode());
    const qr = this.dynamicQR(ctx);
    await qr.connect();

    try {
      const repo = qr.manager.getRepository(UsuarioConteoOrm);

      const usuarios = await repo.find({
        relations: ['usuario'],
        order: { id: 'ASC' },
      });

      return UsuarioConteoMapper.toDtoList(usuarios);
    } catch (error: any) {
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
