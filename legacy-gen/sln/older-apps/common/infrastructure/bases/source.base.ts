import { REQUEST } from '@nestjs/core';
import { DataSource, QueryRunner } from 'typeorm';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { GcmContexts } from '@common/application/constants';
import { ITokenDecoded, decodeToken, getCodeAuthorities } from '../services';
import { ADMIN_AUTHORITY } from '@sln/old/authorities/principal';
import { TimerService } from '@sln/old/common/application/services';
import { GCM_CONTEXTS, gcmContextFactory } from '@common/domain/types';
import { switchConn } from '@common/infrastructure/services';

@Injectable()
export class BaseSource {
  protected qr: QueryRunner;
  protected conn: DataSource;
  protected ekConn: DataSource;

  constructor(@Inject(REQUEST) private _request: Request) {
    this.ekConn = switchConn(GCM_CONTEXTS.EKLIPSE);
    this.conn = switchConn(gcmContextFactory(this.getContext()));
    this.qr = this.conn.createQueryRunner();
  }

  /**
   * Requerido para cuando se requiere obtener data de diferentes bbdd al tiempo.
   * @param ctx
   * @returns QueryRunner
   */
  protected dynamicQR(ctx: GcmContexts): QueryRunner {
    return switchConn(gcmContextFactory(ctx)).createQueryRunner();
  }

  protected get timer() {
    const timer = new TimerService();
    return timer;
  }

  protected dynamicConn(ctx: GcmContexts): DataSource {
    return switchConn(gcmContextFactory(ctx));
  }

  /**
   * Retorna el contexto en el cual está autenticado el usuario.
   * @returns Contexts
   */
  protected getContext(): GcmContexts {
    try {
      return this._getTokenDecoded().context;
    } catch (_) {
      throw new UnauthorizedException(
        'Token auth is required for know who are you and the context'
      );
    }
  }

  protected getAuthUser() {
    return { id: this._getTokenDecoded().id };
  }

  /**
   * Responde a la pregunta ¿el usuario autenticado es un administrador?.
   * @returns boolean
   * @deprecated Use hasAnyAuthority.
   */
  protected async isAdmin(): Promise<boolean> {
    const authorities = await getCodeAuthorities(
      this._getTokenDecoded().id,
      this._getTokenDecoded().context
    );

    return authorities.includes(ADMIN_AUTHORITY);
  }

  /**
   * Retorna el token decodificado.
   * @returns ITokenDecoded
   */
  private _getTokenDecoded(): ITokenDecoded {
    const tk = this._request.headers.authorization.split(' ')[1];

    return decodeToken(tk);
  }

  /**
   * Retorna información sobre el usuario autenticado.
   * @param properties
   * @returns Promise<AuthUserModel>
   */
  protected get auth() {
    const user = this._getTokenDecoded().user;
    const id = this._getTokenDecoded().id;
    const context = this._getTokenDecoded().context;

    return { id, user, context };
  }

  protected async hasAnyAuthority(
    authoritiesRequired: string[],
    userAuthorities?: string[],
    id?: number,
    context?: GcmContexts
  ): Promise<boolean> {
    if (!userAuthorities) {
      userAuthorities = await getCodeAuthorities(
        id ? id : this.auth.id,
        context ? context : this.auth.context
      );
    }

    const hasAnyAuthority = () =>
      userAuthorities.some((authority: string) => authoritiesRequired.includes(authority));

    return hasAnyAuthority();
  }

  protected userId(): number {
    const id = this._getTokenDecoded().id;
    return id;
  }
}
