import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  AddDependenciaToUsuarioDto,
  AddDependenciaToUsuarioRes,
  RemoveDependenciaToUsuarioDto,
} from '../../presentation/dtos';
import { DependenciaOrm, UsuarioDependenciaOrm, UsuarioOrm } from '@orm/gen';
import { RSAServices } from '@common/application/services';
import { rolDependienteTypeFactory } from '@ctypes/gen';

@Injectable()
export class ManageDependenciaToUsuarioImpl extends BaseSource {
  public async add(payload: AddDependenciaToUsuarioDto): Promise<AddDependenciaToUsuarioRes> {
    payload.dependenciaIdDecrypted = RSAServices.decryptId(payload.dependenciaId);
    payload.usuarioIdDecrypted = RSAServices.decryptId(payload.usuarioId);
    const rol = rolDependienteTypeFactory(payload.rolCode);
    try {
      if (!rol) throw new Error('El rol del dependiente no existe');

      await this.qr.connect();
      await this.qr.startTransaction();

      const usuarioRp = this.qr.manager.getRepository(UsuarioOrm);
      const usuario = await usuarioRp.findOne({ where: { id: payload.usuarioIdDecrypted } });
      if (!usuario) throw new Error('El usuario no existe');

      const dependenciaRp = this.qr.manager.getRepository(DependenciaOrm);
      const dependencia = await dependenciaRp.findOne({
        where: { id: payload.dependenciaIdDecrypted },
      });
      if (!dependencia) throw new Error('La dependencia no existe');

      const usuarioDependenciaRp = this.qr.manager.getRepository(UsuarioDependenciaOrm);
      const newUsuarioDependencia = new UsuarioDependenciaOrm();
      newUsuarioDependencia.usuario = usuario;
      newUsuarioDependencia.dependencia = dependencia;
      newUsuarioDependencia.rolCode = payload.rolCode;

      await usuarioDependenciaRp.save(newUsuarioDependencia);

      await this.qr.commitTransaction();

      const response: AddDependenciaToUsuarioRes = {
        usuario: {
          id: payload.usuarioId,
          cedula: usuario.cedula,
          nombreCompleto: usuario.nombreCompleto,
        },
        dependencia: {
          id: payload.dependenciaId,
          codigo: dependencia.codigo,
          nombre: dependencia.nombre,
        },
        rol,
      };

      return response;
    } catch (error) {
      if (rol) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (rol) await this.qr.release();
    }
  }

  public async remove(payload: RemoveDependenciaToUsuarioDto): Promise<boolean> {
    payload.dependenciaIdDecrypted = RSAServices.decryptId(payload.dependenciaId);
    payload.usuarioIdDecrypted = RSAServices.decryptId(payload.usuarioId);
    try {
      await this.qr.connect();
      await this.qr.startTransaction();

      const usuarioRp = this.qr.manager.getRepository(UsuarioOrm);
      const usuario = await usuarioRp.findOne({
        where: { id: payload.usuarioIdDecrypted },
        relations: ['dependencias'],
      });
      if (!usuario) throw new Error('El usuario no existe');

      usuario.dependencias = usuario.dependencias.filter(
        el => el.id !== payload.dependenciaIdDecrypted
      );

      await usuarioRp.save(usuario);

      await this.qr.commitTransaction();

      return true;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
