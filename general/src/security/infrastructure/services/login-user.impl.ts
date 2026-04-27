import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import {
  ESTADOS_USUARIO,
  EstadoUsuarioCode,
  estadoUsuarioTypeFactory,
} from '@gen/security/domain/types/gen/usuarios';
import { cryptoServices, IAuthToken, RSAServices } from '@common/application/services';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';
import { LoginUserDto } from '@gen/security/presentation/dtos';
import { LastAuthOrm } from '@gen/security/infrastructure/orm';
import { switchConn } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';
import { ENVIRONMENTS } from '@gen/app.environments';
import { processEnv } from '@env';

@Injectable()
export class LoginUserImpl {
  public async execute(payload: LoginUserDto, fromMobile: boolean, expiredSuperFast: boolean) {
    const errorMsg = 'Usuario y/o clave incorrecta';
    const { username, password, context } = payload;

    const conn = switchConn(gcmContextFactory(payload.context));
    const qr = conn.createQueryRunner();
    await qr.connect();
    try {
      await qr.startTransaction();

      const userRp = qr.manager.getRepository(_PrivSecUserOrm);
      const lastAuthRp = qr.manager.getRepository(LastAuthOrm);

      const user = await userRp.findOne({
        where: [{ document: username }],
        select: {
          id: true,
          document: true,
          fullName: true,
          password: true,
          statusCode: true,
        },
      });

      if (!user) throw new Error(errorMsg);

      if (user.statusCode !== ESTADOS_USUARIO.ACTIVO.getCode()) {
        throw new Error(
          `Su usuario está en estado ${estadoUsuarioTypeFactory(user.statusCode as EstadoUsuarioCode).getForHumans()}`
        );
      }

      const matchingPasswords = await cryptoServices.compareDimPassword(password, user.password);

      if (matchingPasswords) {
        const payload: IAuthToken = {
          jti: RSAServices.encryptId(user.id),
          dcm: user.document,
          fnm: user.fullName,
          sub: context,
        };

        const token = jwt.sign(payload, processEnv.JWT_SECRET_KEY, {
          expiresIn: expiredSuperFast ? '1h' : fromMobile ? '30d' : '7d',
          algorithm: 'HS512',
        });

        if (!expiredSuperFast) {
          let newLastAuth = await lastAuthRp.findOne({ where: { user } });

          if (!newLastAuth) {
            newLastAuth = new LastAuthOrm();
            newLastAuth.userId = user.id;
            newLastAuth.timesFromMobile = fromMobile ? 1 : 0;
            newLastAuth.timesFromWeb = fromMobile ? 0 : 1;
            if (fromMobile) newLastAuth.lastAuthOnMobile = new Date();
            else newLastAuth.lastAuthOnWeb = new Date();
          } else {
            if (fromMobile) {
              const authsInMobile = newLastAuth.timesFromMobile;
              newLastAuth.timesFromMobile = authsInMobile < 32000 ? authsInMobile + 1 : 1;
              newLastAuth.lastAuthOnMobile = new Date();
            } else {
              const authsInWeb = newLastAuth.timesFromWeb;
              newLastAuth.timesFromWeb = authsInWeb < 32000 ? authsInWeb + 1 : 1;
              newLastAuth.lastAuthOnWeb = new Date();
            }
          }

          user.lastAuth = new Date();

          if (ENVIRONMENTS.production) {
            await userRp.save(user);
            await lastAuthRp.save(newLastAuth);
          }
        }

        await qr.commitTransaction();

        return { token };
      } else {
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
    }
  }
}
