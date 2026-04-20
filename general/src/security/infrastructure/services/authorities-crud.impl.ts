import { IsNull } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseSource, fetchAuths } from '@common/infrastructure/services';
import { _PrivSecSubModuleOrm } from '@common/infrastructure/orm/sub-module.orm';
import { _PrivSecAuthOrm } from '@common/infrastructure/orm/authority.orm';
import { _PrivSecModuleOrm } from '@common/infrastructure/orm/module.orm';
import { ALL_CONTEXTS_WITH_AUTHORITIES } from '@common/domain/types';
import { CreateAuthorityDto } from '@gen/security/presentation/dtos';
import { RSAServices } from '@common/application/services';

@Injectable()
export class AuthoritiesCrudImpl extends BaseSource {
  public async fetch() {
    try {
      const res = await fetchAuths(this.auth.context);
      return res.authorities;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async create(payload: CreateAuthorityDto) {
    let failMsg = '';
    for (let index = 0; index < ALL_CONTEXTS_WITH_AUTHORITIES.length; index++) {
      const ctx = ALL_CONTEXTS_WITH_AUTHORITIES[index];
      const qr = this.dynamicQR(ctx);
      await qr.connect();
      await qr.startTransaction();
      try {
        payload.name = payload.name.trim().toUpperCase();
        const moduleRp = this.conn.getRepository(_PrivSecModuleOrm);
        const subModuleRp = this.conn.getRepository(_PrivSecSubModuleOrm);
        const authorityRp = qr.manager.getRepository(_PrivSecAuthOrm);

        const moduleIdDecrypted = RSAServices.decryptId(payload.moduleId);
        const subModuleIdDecrypted = RSAServices.decryptId(payload.subModuleId);

        const moduleExist = await moduleRp.findOne({ where: { id: moduleIdDecrypted } });
        if (!moduleExist) throw new Error('No existe modulo con este id');

        const subModExist = await subModuleRp.findOne({ where: { id: subModuleIdDecrypted } });
        if (!subModExist) throw new Error('No existe subModulo con este id');

        const localModuleRp = qr.manager.getRepository(_PrivSecModuleOrm);
        const localSubModRp = qr.manager.getRepository(_PrivSecSubModuleOrm);

        const localModule = await localModuleRp.findOne({ where: { code: moduleExist.code } });
        const localSubMod = await localSubModRp.findOne({
          where: { moduleId: localModule.id, code: subModExist.code },
        });

        const authorityWithSameName = await authorityRp.find({
          where: {
            name: payload.name,
            moduleId: localModule.id,
            subModuleId: localSubMod.id,
          },
        });

        if (authorityWithSameName.length) throw new Error('Ya existe un permiso con este nombre');

        const lastAuthority = await authorityRp.find({
          where: {
            moduleId: localModule.id,
            subModuleId: localSubMod.id,
          },
          order: { id: 'desc' },
          take: 1,
        });

        const newAuthorityCode = lastAuthority.length ? +lastAuthority[0].code + 1 : 1;
        const zeros = newAuthorityCode <= 9 ? '00' : newAuthorityCode <= 99 ? '0' : '';

        const newAuthority = new _PrivSecAuthOrm();
        newAuthority.code = `${zeros}${newAuthorityCode}`;
        newAuthority.isActive = ctx.getCode() === this.auth.context.getCode() ? true : false;
        newAuthority.moduleId = moduleIdDecrypted;
        newAuthority.subModuleId = subModuleIdDecrypted;
        newAuthority.name = payload.name;

        await authorityRp.save(newAuthority);

        await qr.commitTransaction();
      } catch (error: any) {
        failMsg = error.message;
        await qr.rollbackTransaction();
      } finally {
        await qr.release();
      }
    }

    if (failMsg) throw new BadRequestException(failMsg);
    else return true;
  }
}
