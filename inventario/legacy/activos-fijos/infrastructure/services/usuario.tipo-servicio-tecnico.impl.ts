import { Injectable } from '@nestjs/common';
import { BaseSource } from '@common/infrastructure/services';
import {
  AfnTipoSerTecCode,
  AfnTipoSerTecType,
  afnTipoSerTecTypeFactory,
} from '@inn/lgc/afn/types/inn/activos-fijos';
import { UsuarioTipoServicioTecnicoOrm } from '@inn/lgc/afn/orm/inn/activos-fijos/servicio-tecnico';
import { TABLE_NAMES } from '@common/application/constants';
import { RSAServices } from '@common/application/services';

@Injectable()
export class AfnUsuarioTipoServicioImpl extends BaseSource {
  public async misTiposServicio(): Promise<AfnTipoSerTecType[]> {
    try {
      const repository = this.conn.getRepository(UsuarioTipoServicioTecnicoOrm);

      const result = await repository.find({
        where: { usuarioId: this.auth.id },
      });

      return result.map(r => afnTipoSerTecTypeFactory(r.tipoServicioTecnicoCode));
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async tiposByUsuario(id: string): Promise<AfnTipoSerTecType[]> {
    try {
      const repository = this.conn.getRepository(UsuarioTipoServicioTecnicoOrm);

      const result = await repository.find({
        where: { usuarioId: RSAServices.decryptId(id) },
      });

      return result.map(r => afnTipoSerTecTypeFactory(r.tipoServicioTecnicoCode));
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async addTipoServicio(
    usuarioIdEnc: string,
    tipoServicioCode: AfnTipoSerTecCode
  ): Promise<boolean> {
    let transactionStarted = false;
    try {
      const usuarioId = RSAServices.decryptId(usuarioIdEnc);
      await this.verifyEntityExist(TABLE_NAMES.gen.usu.usuarios, usuarioId);

      const tipoServicio = afnTipoSerTecTypeFactory(tipoServicioCode);

      transactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();

      const usuarioTipoSerTecRp = this.qr.manager.getRepository(UsuarioTipoServicioTecnicoOrm);

      const usuarioTipoSerTec = new UsuarioTipoServicioTecnicoOrm();
      usuarioTipoSerTec.usuarioId = usuarioId;
      usuarioTipoSerTec.tipoServicioTecnicoCode = tipoServicio.getCode();

      await usuarioTipoSerTecRp.save(usuarioTipoSerTec);

      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }

  public async removeTipoServicio(
    usuarioIdEnc: string,
    tipoServicioCode: AfnTipoSerTecCode
  ): Promise<boolean> {
    let transactionStarted = false;
    try {
      const usuarioId = RSAServices.decryptId(usuarioIdEnc);
      await this.verifyEntityExist(TABLE_NAMES.gen.usu.usuarios, usuarioId);

      const tipoServicio = afnTipoSerTecTypeFactory(tipoServicioCode);

      transactionStarted = true;
      await this.qr.connect();
      await this.qr.startTransaction();

      const usuarioTipoSerTecRp = this.qr.manager.getRepository(UsuarioTipoServicioTecnicoOrm);

      const usuarioTipoSerTec = await usuarioTipoSerTecRp.findOne({
        where: { usuarioId, tipoServicioTecnicoCode: tipoServicio.getCode() },
      });

      if (usuarioTipoSerTec) await usuarioTipoSerTecRp.remove(usuarioTipoSerTec);

      await this.qr.commitTransaction();
      return true;
    } catch (error: any) {
      if (transactionStarted) await this.qr.rollbackTransaction();
      throw new Error(error.message);
    } finally {
      if (transactionStarted) await this.qr.release();
    }
  }
}
