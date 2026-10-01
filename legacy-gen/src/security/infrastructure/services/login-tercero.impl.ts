import * as jwt from 'jsonwebtoken';
import { BadRequestException, Injectable } from '@nestjs/common';
import { cryptoServices, IAuthToken, RSAServices } from '@common/application/services';
import { ESTADOS_USUARIO, estadoUsuarioTypeFactory } from '@gtypes/gen/usuarios';
import { AuthProveedorOrm } from '@gen/security/infrastructure/orm';
import { LoginUserDto } from '@gen/security/presentation/dtos';
import { switchConn } from '@common/infrastructure/services';
import { gcmContextFactory } from '@common/domain/types';
import { processEnv } from '@env';

@Injectable()
export class LoginTerceroImpl {
  public async execute(payload: LoginUserDto, fromMobile: boolean, nonEncrypted: boolean) {
    throw new BadRequestException('No hay convocatorias abiertas');

    if (!nonEncrypted) {
      payload.username = cryptoServices.decodeBase64(payload.username);
      payload.password = cryptoServices.decodeBase64(payload.password);
    }
    const errorMsg = 'Usuario y/o clave incorrecta';
    const { username, password, context } = payload;

    const conn = switchConn(gcmContextFactory(payload.context));
    const qr = conn.createQueryRunner();
    await qr.connect();
    try {
      await qr.startTransaction();

      const userRp = qr.manager.getRepository(AuthProveedorOrm);

      const users = await userRp.find({
        where: [{ document: username }],
        select: {
          id: true,
          document: true,
          fullName: true,
          email1: true,
          email2: true,
          email3: true,
          password: true,
          statusCode: true,
        },
      });

      if (!users.length) throw new Error(errorMsg);

      let user: AuthProveedorOrm;

      users.forEach(u => {
        const matchingPasswords = password === u.password;
        if (matchingPasswords && !user) user = u;
      });

      if (!user) throw new Error(errorMsg);

      if (user.statusCode !== ESTADOS_USUARIO.ACTIVO.getCode()) {
        throw new Error(
          `Su tercero está en estado ${estadoUsuarioTypeFactory(user.statusCode).getForHumans()}`
        );
      }

      delete user.statusCode;

      //const matchingPasswords = await cryptoServices.compare(password, user.password);
      const matchingPasswords = password === user.password;

      if (matchingPasswords) {
        const payload: IAuthToken = {
          jti: RSAServices.encryptId(user.id),
          dcm: user.document,
          fnm: user.fullName,
          tbl: 'EKINNOFERPROVEEDOR',
          sub: context,
        };

        const token = jwt.sign(payload, processEnv.JWT_SECRET_KEY, {
          expiresIn: fromMobile ? '30d' : '7d',
          algorithm: 'HS512',
        });

        await qr.commitTransaction();

        return { token };
      } else {
        throw new Error(errorMsg);
      }
    } catch (error) {
      await qr.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await qr.release();
    }
  }
}
