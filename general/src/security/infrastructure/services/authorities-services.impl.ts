import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource, fetchAuthsByUser } from '@common/infrastructure/services';
import { _PrivSecAuthOrm } from '@common/infrastructure/orm/authority.orm';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';
import { _PrivSecRoleOrm } from '@common/infrastructure/orm/role.orm';
import { enabledModules } from '@common/application/enabled-modules';
import { RSAServices } from '@common/application/services';

@Injectable()
export class AuthoritiesServicesImpl extends BaseSource {
  public async fetchUserData(): Promise<_PrivSecUserOrm> {
    try {
      const userRp = this.conn.getRepository(_PrivSecUserOrm);
      const me = await userRp.findOne({ where: { id: this.auth.id }, relations: ['role'] });
      me.encryptId();
      return me;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchByUser(id: string): Promise<any[]> {
    try {
      const authorities = (
        await fetchAuthsByUser({ id: RSAServices.decryptId(id), ctx: this.auth.context })
      ).authorities;

      return authorities;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async fetchMyAuthorities(): Promise<{
    authorities: _PrivSecAuthOrm[];
    onlyCodes: string[];
    enabledModules: string[];
  }> {
    try {
      const myAuthorities = await fetchAuthsByUser({ id: this.auth.id, ctx: this.auth.context });
      return { ...myAuthorities, enabledModules: enabledModules(myAuthorities.onlyCodes) };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async addAuthorityToUser(authorityId: string, userId: string) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();

      const authorityRp = this.qr.manager.getRepository(_PrivSecAuthOrm);
      const userRp = this.qr.manager.getRepository(_PrivSecUserOrm);

      const authority = await authorityRp.findOne({
        where: { id: RSAServices.decryptId(authorityId) },
      });

      const user = await userRp.findOne({
        where: { id: RSAServices.decryptId(userId) },
        relations: ['authorities'],
      });

      user.authorities.push(authority);

      await userRp.save(user);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async removeAuthorityToUser(authorityId: string, userId: string) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();

      const authorityRp = this.qr.manager.getRepository(_PrivSecAuthOrm);
      const userRp = this.qr.manager.getRepository(_PrivSecUserOrm);

      const authorityToRemove = await authorityRp.findOne({
        where: { id: RSAServices.decryptId(authorityId) },
      });
      const user = await userRp.findOne({
        where: { id: RSAServices.decryptId(userId) },
        relations: ['authorities'],
      });

      user.authorities = user.authorities.filter(authority => {
        return authority.id !== authorityToRemove.id;
      });

      await userRp.save(user);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async addAuthorityToRole(authorityId: string, roleId: string) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();

      const authorityRp = this.qr.manager.getRepository(_PrivSecAuthOrm);
      const roleRp = this.qr.manager.getRepository(_PrivSecRoleOrm);

      const authority = await authorityRp.findOne({
        where: { id: RSAServices.decryptId(authorityId) },
      });
      const role = await roleRp.findOne({
        where: { id: RSAServices.decryptId(roleId) },
        relations: ['authorities'],
      });

      role.authorities.push(authority);

      await roleRp.save(role);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }

  public async removeAuthorityToRole(authorityId: string, roleId: string) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();

      const authorityRp = this.qr.manager.getRepository(_PrivSecAuthOrm);
      const roleRp = this.qr.manager.getRepository(_PrivSecRoleOrm);

      const authorityToRemove = await authorityRp.findOne({
        where: { id: RSAServices.decryptId(authorityId) },
      });
      const role = await roleRp.findOne({
        where: { id: RSAServices.decryptId(roleId) },
        relations: ['authorities'],
      });

      role.authorities = role.authorities.filter(authority => {
        return authority.id !== authorityToRemove.id;
      });

      await roleRp.save(role);

      await this.qr.commitTransaction();

      return true;
    } catch (error: any) {
      await this.qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await this.qr.release();
    }
  }
}
