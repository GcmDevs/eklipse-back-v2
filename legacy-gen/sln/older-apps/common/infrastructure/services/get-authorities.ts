import { GcmContexts } from '@common/application/constants';
import { uniq } from 'lodash';
import { AuthorityOrm, UserOrm } from '../orm';
import { BadRequestException } from '@nestjs/common';
import { switchConn } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';

export const getCodeAuthorities = async (id: number, context: GcmContexts): Promise<string[]> => {
  try {
    const conn = switchConn(gcmContextFactory(context));

    const userRp = conn.getRepository(UserOrm);
    const user = await userRp.findOne({
      where: { id },
      relations: [
        'authorities',
        'authorities.module',
        'authorities.subModule',
        'role',
        'role.authorities',
        'role.authorities.module',
        'role.authorities.subModule',
      ],
    });

    const authorities: AuthorityOrm[] = [];

    const authoritiesByUser = user.authorities.map(el => {
      el.isByRol = false;
      let authority = '';

      if (el.module) {
        authority += el.module.code;
        if (el.isActive) el.isActive = el.module.isActive;
      } else {
        delete el.module;
      }

      if (el.subModule) {
        authority += el.subModule.code;
        if (el.isActive) el.isActive = el.subModule.isActive;
      } else {
        delete el.subModule;
      }

      authority += el.code;

      if (el.isActive) {
        el.code = authority;
        return el;
      } else {
        return null;
      }
    });

    const authoritiesByRole = user.role.authorities.map(el => {
      el.isByRol = true;
      let authority = '';

      if (el.module) {
        authority += el.module.code;
        if (el.isActive) el.isActive = el.module.isActive;
      } else {
        delete el.module;
        delete el.moduleId;
      }

      if (el.subModule) {
        authority += el.subModule.code;
        if (el.isActive) el.isActive = el.subModule.isActive;
      } else {
        delete el.subModule;
        delete el.subModuleId;
      }

      authority += el.code;

      if (el.isActive) {
        el.code = authority;
        return el;
      } else {
        return null;
      }
    });

    authorities.push(
      ...uniq([
        ...authoritiesByUser.filter(el => el !== null),
        ...authoritiesByRole.filter(el => el !== null),
      ])
    );

    const codes: string[] = [];

    authorities.map(el => {
      if (el.module) {
        delete el.module.isActive;
        codes.push(el.module.code);
        //el.module.id = RSAServices.encryptId(el.module.id) as any;
        delete el.moduleId;
      }
      if (el.subModule) {
        delete el.subModule.isActive;
        codes.push(`${el.module.code}${el.subModule.code}`);
        //el.subModule.id = RSAServices.encryptId(el.subModule.id) as any;
        delete el.subModule.moduleId;
        delete el.subModuleId;
      }
      codes.push(el.code);
      delete el.isActive;
      //el.id = RSAServices.encryptId(el.id) as any;
    });

    return uniq(codes);
  } catch (error) {
    throw new BadRequestException(error.message);
  }
};
