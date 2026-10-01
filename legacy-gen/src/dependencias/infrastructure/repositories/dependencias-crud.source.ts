import { Injectable } from '@nestjs/common';
import { DependenciaOrm, UsuarioDependenciaOrm, UsuarioOrm } from '@orm/gen';
import { BaseSource } from '@common/infrastructure/services';
import { RSAServices } from '@common/application/services';

@Injectable()
export class DependenciasCrudSource extends BaseSource {
  public async fetch(): Promise<DependenciaOrm[]> {
    try {
      const dependenciaRp = this.conn.getRepository(DependenciaOrm);
      const dependencias = await dependenciaRp.find();
      dependencias.map(dp => dp.encryptId());
      return dependencias;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  public async fetchUserDependencias(id: string): Promise<DependenciaOrm[]> {
    try {
      id = RSAServices.decryptId(id) as any;
      const usuarioRp = this.conn.getRepository(UsuarioOrm);
      const usuario = await usuarioRp.findOne({ where: { id: +id } });
      if (!usuario) throw new Error('No se encontró un usuario con este id');

      const usuarioDependenciaRp = this.conn.getRepository(UsuarioDependenciaOrm);
      const dependencias = await usuarioDependenciaRp
        .createQueryBuilder('usuDep')
        .leftJoinAndSelect('usuDep.usuario', 'usuario')
        .leftJoinAndSelect('usuDep.dependencia', 'dependencia')
        .where('usuDep.usuario.id = :id', { id })
        .getMany();

      return dependencias.map(el => {
        el.setTypes();
        el.dependencia.encryptId();
        el.dependencia.rol = el.rol;
        return el.dependencia;
      });
    } catch (error) {
      throw new Error(error.message);
    }
  }
}
