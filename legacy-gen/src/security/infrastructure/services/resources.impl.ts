import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { ITokenDecoded, RSAServices } from '@common/application/services';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';
import { _PrivSecRoleOrm } from '@common/infrastructure/orm/role.orm';
import { EkCenterOrm } from '@gen/security/infrastructure/orm';
import { ESTADOS_USUARIO } from '@gtypes/gen/usuarios';
import { GCM_CONTEXTS } from '@common/domain/types';

@Injectable()
export class ResourcesImpl extends BaseSource {
  public async fetchActiveUsers(): Promise<_PrivSecUserOrm[]> {
    const usersRp = this.conn.getRepository(_PrivSecUserOrm);

    const users = await usersRp.find({
      where: { statusCode: ESTADOS_USUARIO.ACTIVO.getCode() },
      relations: ['role'],
    });

    users.map(u => {
      u.encryptId();
      u.role.encryptId();
      delete u.password;
      delete u.statusCode;
      return u;
    });

    return users;
  }

  public async fetchRoles(): Promise<_PrivSecRoleOrm[]> {
    const rolesRp = this.conn.getRepository(_PrivSecRoleOrm);

    const roles = await rolesRp.find({
      relations: ['authorities', 'authorities.module', 'authorities.subModule'],
    });

    roles.map(u => {
      u.encryptId();
      u.authorities.map(a => {
        a.encryptId();
        let newCode = a.code;
        if (a.module) {
          newCode = `${a.module.code}${a.code}`;
          if (a.isActive) a.isActive = a.module.isActive;
        }
        if (a.subModule) {
          newCode = `${a.module.code}${a.subModule.code}${a.code}`;
          if (a.isActive) a.isActive = a.subModule.isActive;
        }
        a.code = newCode;
        delete a.module;
        delete a.moduleId;
        delete a.subModule;
        delete a.subModuleId;
        delete a.isActive;
      });
      return u;
    });

    return roles;
  }

  public async fetchCenters(): Promise<EkCenterOrm[]> {
    const conn = this.dynamicConn(GCM_CONTEXTS.EKLIPSE);
    const centerRp = conn.getRepository(EkCenterOrm);
    const centers = await centerRp.find();
    return centers;
  }

  public async fetchMyAuthData(): Promise<{ tokenDecoded: ITokenDecoded }> {
    const tkDcd = this.getTokenDecoded();
    tkDcd.user.id = RSAServices.encryptId(tkDcd.user.id) as any;
    return { tokenDecoded: tkDcd };
  }
}
