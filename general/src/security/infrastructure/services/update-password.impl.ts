import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import { cryptoServices } from '@common/application/services';
import { _PrivSecEkUserOrm } from '@common/infrastructure/orm/ek-user.orm';
import { _PrivSecUserOrm } from '@common/infrastructure/orm/user.orm';

@Injectable()
export class UpdatePasswordImpl extends BaseSource {
  public async execute(newPassword: string): Promise<boolean> {
    const qr = this.ekConn.createQueryRunner();
    let transactionStarted = false;
    try {
      if (this.auth.isDim) return true;
      await qr.connect();
      await qr.startTransaction();

      transactionStarted = true;
      const ekUsersRp = qr.manager.getRepository(_PrivSecEkUserOrm);
      const user = await ekUsersRp.findOne({
        where: { id: this.auth.id },
        select: {
          id: true,
          password: true,
          passwordIsReset: true,
        },
      });

      if (!user) throw new Error('Usuario no encontrado');

      user.password = await cryptoServices.encrypt(newPassword);
      user.passwordIsReset = false;
      await ekUsersRp.save(user);

      await qr.commitTransaction();

      return true;
    } catch (error: any) {
      if (transactionStarted) await qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await qr.release();
    }
  }
}
