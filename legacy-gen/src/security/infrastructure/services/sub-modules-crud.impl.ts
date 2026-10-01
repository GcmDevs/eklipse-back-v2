import { BadRequestException, Injectable } from '@nestjs/common';
import { _PrivSecSubModuleOrm } from '@common/infrastructure/orm/sub-module.orm';
import { _PrivSecModuleOrm } from '@common/infrastructure/orm/module.orm';
import { ALL_CONTEXTS_WITH_AUTHORITIES } from '@common/domain/types';
import { CreateSubModuleDto } from '@gen/security/presentation/dtos';
import { RSAServices } from '@common/application/services';
import { BaseSource } from '@common/infrastructure/services';

@Injectable()
export class SubModulesCrudImpl extends BaseSource {
  async create(payload: CreateSubModuleDto) {
    let failMsg = '';
    for (let index = 0; index < ALL_CONTEXTS_WITH_AUTHORITIES.length; index++) {
      const ctx = ALL_CONTEXTS_WITH_AUTHORITIES[index];
      const qr = this.dynamicQR(ctx);
      await qr.connect();
      await qr.startTransaction();
      try {
        payload.name = payload.name.trim().toUpperCase();
        const moduleRp = this.conn.getRepository(_PrivSecModuleOrm);
        const subModuleRp = qr.manager.getRepository(_PrivSecSubModuleOrm);

        const moduleIdDecrypted = RSAServices.decryptId(payload.moduleId);

        const moduleExist = await moduleRp.findOne({ where: { id: moduleIdDecrypted } });
        if (!moduleExist) throw new Error('No existe modulo con este id');

        const localModuleRp = qr.manager.getRepository(_PrivSecModuleOrm);
        const localModule = await localModuleRp.findOne({ where: { code: moduleExist.code } });

        const subModuleWithSameName = await subModuleRp.find({
          where: { name: payload.name, moduleId: localModule.id },
        });
        if (subModuleWithSameName.length) throw new Error('Ya existe un subModulo con este nombre');

        const lastSubModule = await subModuleRp.find({
          where: { moduleId: localModule.id },
          order: { id: 'desc' },
          take: 1,
        });

        const newSubModuleCode = lastSubModule.length ? +lastSubModule[0].code + 1 : 1;
        const zeros = newSubModuleCode <= 9 ? '00' : newSubModuleCode <= 99 ? '0' : '';

        const newSubModule = new _PrivSecSubModuleOrm();
        newSubModule.code = `${zeros}${newSubModuleCode}`;
        newSubModule.isActive = true;
        newSubModule.moduleId = localModule.id;
        newSubModule.name = payload.name;

        await subModuleRp.save(newSubModule);

        await qr.commitTransaction();
      } catch (error) {
        failMsg += ` ${ctx.getCode()},`;
        await qr.rollbackTransaction();
      } finally {
        await qr.release();
      }
    }

    if (failMsg) throw new BadRequestException(`El registró falló en ${failMsg}`);
    else return true;
  }
}
