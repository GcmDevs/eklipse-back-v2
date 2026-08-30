import { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { DataSource, QueryRunner } from 'typeorm';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ITokenDecoded, JWTServices } from '../../application/services';
import { GCM_CONTEXTS, GcmContextType } from '../../domain/types';
import { _PrivSecUserOrm } from '../orm/user.orm';
import { fetchAuthsByUser } from './authorities';
import { switchConn } from './connections';
import { RolDependenciaCode } from '../orm/dependence.orm';
import { _PrivSecUserDependenceOrm } from '../orm/user-dependence.orm';

export interface UserDependenceI {
  user: {
    id: number;
    document: string;
    fullName: string;
  };
  dependence: {
    id: number;
    code: string;
    name: string;
  };
  role: {
    code: RolDependenciaCode;
    name: string;
  };
}

@Injectable()
export class BaseSource {
  protected qr: QueryRunner;
  protected conn: DataSource;
  protected ekConn: DataSource;

  constructor(@Inject(REQUEST) private _request: Request) {
    this.conn = switchConn(this.auth.context);
    this.ekConn = switchConn(GCM_CONTEXTS.EKLIPSE);
    this.qr = this.conn.createQueryRunner();
  }

  protected get auth() {
    try {
      const tkDecoded = this.getTokenDecoded();

      const id = tkDecoded.user.id;
      const user = tkDecoded.user;
      const context = tkDecoded.context;
      const isDim = tkDecoded.isDim === undefined ? true : tkDecoded.isDim;
      const tipoUsuExt = tkDecoded.tipoUsuExt;

      return { id, user, context, isDim, tipoUsuExt };
    } catch (error: any) {
      throw new UnauthorizedException(error.message);
    }
  }

  protected dynamicConn(ctx: GcmContextType): DataSource {
    return switchConn(ctx);
  }

  protected dynamicQR(ctx: GcmContextType): QueryRunner {
    return switchConn(ctx).createQueryRunner();
  }

  protected async userCodeAuthorities(): Promise<string[]> {
    try {
      const response = await fetchAuthsByUser({ id: this.auth.id, ctx: this.auth.context });
      return response.onlyCodes;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  protected async hasAnyAuthority(
    requiredAuthorities: string[],
    userAuthorities?: string[],
    userDocument?: string,
    ctx?: GcmContextType
  ): Promise<boolean> {
    try {
      if (!userAuthorities && !userDocument && !ctx) {
        userAuthorities = await this.userCodeAuthorities();
      }

      if (userDocument && ctx) {
        const conn = switchConn(ctx);
        const userRp = conn.getRepository(_PrivSecUserOrm);
        const user = await userRp.findOne({ where: { document: userDocument } });
        if (user) {
          const response = await fetchAuthsByUser({ id: user.id, ctx });
          userAuthorities = response.onlyCodes;
        } else {
          userAuthorities = [];
        }
      }

      const hasAnyAuthority = () =>
        userAuthorities.some((authority: string) => requiredAuthorities.includes(authority));

      return hasAnyAuthority();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  protected async hasAnyAuthorityFromRemote(
    requiredAuthorities: string[],
    userId: number,
    ctx: GcmContextType
  ): Promise<boolean> {
    try {
      const response = await fetchAuthsByUser({ id: userId, ctx });
      const userAuthorities = response.onlyCodes;

      const hasAnyAuthority = () =>
        userAuthorities.some((authority: string) => requiredAuthorities.includes(authority));

      return hasAnyAuthority();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  protected async fetchUserByDocument(userDocument: string, ctx: GcmContextType) {
    try {
      const conn = switchConn(ctx);
      const userRp = conn.getRepository(_PrivSecUserOrm);
      const user = await userRp.findOne({ where: { document: userDocument } });
      delete user.password;
      return user;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  protected async fetchUserDependences(
    userId: number,
    ctx: GcmContextType
  ): Promise<UserDependenceI[]> {
    try {
      const conn = switchConn(ctx);
      const userDependenceRp = conn.getRepository(_PrivSecUserDependenceOrm);
      const dependencesByUser = await userDependenceRp
        .createQueryBuilder('usuDep')
        .leftJoinAndSelect('usuDep.user', 'user')
        .leftJoinAndSelect('usuDep.dependence', 'dependence')
        .where('usuDep.user.id = :id', { id: userId })
        .getMany();

      return dependencesByUser.map(dbu => {
        dbu.setTypes();
        return {
          user: {
            id: dbu.user.id,
            document: dbu.user.document,
            fullName: dbu.user.fullName,
          },
          dependence: {
            id: dbu.dependence.id,
            code: dbu.dependence.code,
            name: dbu.dependence.name,
          },
          role: {
            code: dbu.role.getCode(),
            name: dbu.role.getForHumans(),
          },
        };
      });
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  protected getToken(): string {
    return this._request.headers.authorization!.split(' ')[1];
  }

  protected getTokenDecoded(): ITokenDecoded {
    const tkDcd = JWTServices.decodeToken(this.getToken());
    return tkDcd;
  }
}
