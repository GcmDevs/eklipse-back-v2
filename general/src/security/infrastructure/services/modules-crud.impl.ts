import { BadRequestException, Injectable } from '@nestjs/common';
import { ALL_CONTEXTS_WITH_AUTHORITIES } from '@common/domain/types';
import { _PrivSecModuleOrm } from '@common/infrastructure/orm/module.orm';
import { BaseSource } from '@common/infrastructure/services';
import { CreateModuleDto } from '@gen/security/presentation/dtos';

@Injectable()
export class ModulesCrudImpl extends BaseSource {
  public async fetch() {
    try {
      const moduleRp = this.conn.getRepository(_PrivSecModuleOrm);
      let modules = await moduleRp.find({ relations: ['subModules'] });

      modules.map(el => {
        el.subModules = el.subModules.filter(sm => sm.isActive);
      });

      modules = modules.filter(el => el.isActive);

      modules.map(el => {
        el.subModules.map(sm => {
          delete sm.isActive;
          delete sm.moduleId;
          sm.encryptId();
        });
        delete el.isActive;
        el.encryptId();
      });

      return modules;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  public async create(payload: CreateModuleDto) {
    let failMsg = '';
    for (let index = 0; index < ALL_CONTEXTS_WITH_AUTHORITIES.length; index++) {
      const ctx = ALL_CONTEXTS_WITH_AUTHORITIES[index];
      const qr = this.dynamicQR(ctx);
      await qr.connect();
      await qr.startTransaction();
      try {
        payload.name = payload.name.trim().toUpperCase();
        const moduleRp = qr.manager.getRepository(_PrivSecModuleOrm);

        const moduleWithSameName = await moduleRp.find({
          where: { name: payload.name },
        });

        if (moduleWithSameName.length) throw new Error('Ya existe un modulo con este nombre');

        const lastModule = await moduleRp.find({ order: { id: 'desc' }, take: 1 });

        const newModuleCode = lastModule.length ? +lastModule[0].code + 1 : 1;
        const zeros = newModuleCode <= 9 ? '00' : newModuleCode <= 99 ? '0' : '';

        const newModule = new _PrivSecModuleOrm();
        newModule.code = `${zeros}${newModuleCode}`;
        newModule.isActive = true;
        newModule.name = payload.name;

        await moduleRp.save(newModule);

        await qr.commitTransaction();
      } catch (error: any) {
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
