import * as jwt from 'jsonwebtoken';
import { Injectable } from '@nestjs/common';
import {
  ESTADOS_USUARIO,
  EstadoUsuarioCode,
  estadoUsuarioTypeFactory,
} from '@gen/security/domain/types/gen/usuarios';
import { cryptoServices as crypto, IAuthToken, RSAServices } from '@common/application/services';
import { _PrivSecEkUserOrm } from '@common/infrastructure/orm/ek-user.orm';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';
import {
  gcmContextFactory,
  GcmContexts,
  usuExtTypeFactory,
  USU_EXTS,
  AuthenticatedAs,
} from '@common/domain/types';
import { LoginUserDto } from '@gen/security/presentation/dtos';
import { LastAuthOrm, PacienteOrm } from '@gen/security/infrastructure/orm';
import { switchConn } from '@common/infrastructure/services';
import { ENVIRONMENTS } from '@gen/app.environments';
import { processEnv } from '@env';
import { dataToUsuExtOrm } from '../orm/factories';

@Injectable()
export class LoginUserImpl {
  public async execute(body: LoginUserDto, fromMobile: boolean, expiredSuperFast: boolean) {
    if (body.authenticatedAs === AuthenticatedAs.USUARIO) {
      return await this._executeAsUser(body, fromMobile, expiredSuperFast);
    } else {
      return await this._executeAsPaciente(body, fromMobile, expiredSuperFast);
    }
  }

  private async _executeAsUser(body: LoginUserDto, fromMobile: boolean, expiredSuperFast: boolean) {
    const errorMsg = 'Usuario y/o clave incorrecta';
    const { username, password } = body;
    const context = gcmContextFactory(body.context);
    const conn = switchConn(context);
    const ekConn = switchConn(gcmContextFactory(GcmContexts.EKLIPSE));

    const qr = conn.createQueryRunner();
    const ekQr = ekConn.createQueryRunner();

    await qr.connect();
    await ekQr.connect();
    try {
      await qr.startTransaction();
      await ekQr.startTransaction();

      const userRp = qr.manager.getRepository(_PrivSecUserOrm);
      const ekUserRp = ekQr.manager.getRepository(_PrivSecEkUserOrm);
      const lastAuthRp = qr.manager.getRepository(LastAuthOrm);

      let user: _PrivSecUserOrm | _PrivSecEkUserOrm | null = null;
      let matchingPasswords = false;
      let isDimUser = true;
      let tipoUsuExtCode = USU_EXTS.GENUSUARIO.getCode();

      user = await userRp.findOne({
        where: [{ document: username }],
        select: {
          id: true,
          document: true,
          fullName: true,
          password: true,
          statusCode: true,
          lastAuth: true,
        },
      });

      if (!user) {
        // Si el usuario no es de dinamica debe ser de eklipse
        user = await ekUserRp.findOne({
          where: [{ document: username }],
          select: {
            id: true,
            document: true,
            fullName: true,
            password: true,
            statusCode: true,
            lastAuth: true,
            passwordIsReset: true,
            tipoUsuarioExternoCode: true,
            contextCode: true,
          },
        });
        if (user) isDimUser = false;
        if (user.tipoUsuarioExternoCode) {
          tipoUsuExtCode = usuExtTypeFactory(user.tipoUsuarioExternoCode).getCode();
        }
        if (user.contextCode && user.contextCode !== context.getEkKey()) {
          throw new Error(`Usuario no pertenece al contexto ${body.context}`);
        }
      }

      if (!user) throw new Error(errorMsg);

      if (user.statusCode !== ESTADOS_USUARIO.ACTIVO.getCode()) {
        throw new Error(
          `Su usuario está en estado ${estadoUsuarioTypeFactory(user.statusCode as EstadoUsuarioCode).getForHumans()}`
        );
      }

      if (isDimUser) matchingPasswords = await crypto.compareDimPassword(password, user.password);
      else matchingPasswords = await crypto.compare(password, user.password);

      const passwordIsReset = !isDimUser ? (user as any).passwordIsReset : false;

      if (matchingPasswords) {
        const payload: IAuthToken = {
          jti: RSAServices.encryptId(user.id),
          rst: passwordIsReset,
          dcm: user.document,
          fnm: user.fullName,
          dim: isDimUser,
          sub: body.context,
          tue: tipoUsuExtCode,
        };

        const token = jwt.sign(payload, processEnv.JWT_SECRET_KEY, {
          expiresIn: expiredSuperFast || passwordIsReset ? '1h' : fromMobile ? '30d' : '7d',
          algorithm: 'HS512',
        });

        if (!expiredSuperFast && isDimUser) {
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
            if (isDimUser) {
              await userRp.save(user);
              await lastAuthRp.save(newLastAuth);
            } else {
              await ekUserRp.save(user);
            }
          }
        }

        if (!isDimUser) {
          user.lastAuth = new Date();
          await ekUserRp.save(user);
        }

        await qr.commitTransaction();
        await ekQr.commitTransaction();

        return { token, passwordIsReset };
      } else {
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      await qr.rollbackTransaction();
      await ekQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
      await ekQr.release();
    }
  }

  private async _executeAsPaciente(
    body: LoginUserDto,
    fromMobile: boolean,
    expiredSuperFast: boolean
  ) {
    const errorMsg = 'Usuario y/o clave incorrecta';
    const { username, password } = body;
    const context = gcmContextFactory(body.context);
    const conn = switchConn(context);
    const ekConn = switchConn(gcmContextFactory(GcmContexts.EKLIPSE));

    const qr = conn.createQueryRunner();
    const ekQr = ekConn.createQueryRunner();

    await qr.connect();
    await ekQr.connect();
    try {
      await qr.startTransaction();
      await ekQr.startTransaction();

      const pacienteRp = qr.manager.getRepository(PacienteOrm);
      const ekPacienteRp = ekQr.manager.getRepository(_PrivSecEkUserOrm);

      const paciente = await pacienteRp.findOne({ where: { documento: username } });
      if (!paciente) throw new Error('El paciente no ha sido atendido en esta clinica');

      let pacAsUser = await ekPacienteRp.findOne({
        where: { document: username },
        select: {
          id: true,
          document: true,
          fullName: true,
          password: true,
          statusCode: true,
          passwordIsReset: true,
        },
      });

      if (!pacAsUser) {
        pacAsUser = await dataToUsuExtOrm(paciente);
        pacAsUser = await ekPacienteRp.save(pacAsUser);
      }

      if (pacAsUser.statusCode !== ESTADOS_USUARIO.ACTIVO.getCode()) {
        throw new Error(
          `Su usuario está en estado ${estadoUsuarioTypeFactory(pacAsUser.statusCode as EstadoUsuarioCode).getForHumans()}`
        );
      }

      if (!pacAsUser.passwordIsReset) {
        const matchingPass = await crypto.compare(password, pacAsUser.password);
        if (!matchingPass) throw new Error(errorMsg);
      }

      const payload: IAuthToken = {
        jti: RSAServices.encryptId(pacAsUser.id),
        rst: pacAsUser.passwordIsReset,
        dcm: paciente.documento,
        fnm: paciente.nombreCompleto,
        dim: false,
        sub: body.context,
        tue: USU_EXTS.GENPACIEN.getCode(),
      };

      const token = jwt.sign(payload, processEnv.JWT_SECRET_KEY, {
        expiresIn: expiredSuperFast || pacAsUser.passwordIsReset ? '1h' : fromMobile ? '30d' : '7d',
        algorithm: 'HS512',
      });

      if (!pacAsUser.passwordIsReset) {
        pacAsUser.lastAuth = new Date();
        await ekPacienteRp.save(pacAsUser);
      }

      await qr.commitTransaction();
      await ekQr.commitTransaction();

      return { token, passwordIsReset: pacAsUser.passwordIsReset };
    } catch (error: any) {
      await qr.rollbackTransaction();
      await ekQr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      await qr.release();
      await ekQr.release();
    }
  }
}
