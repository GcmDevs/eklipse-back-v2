import { Injectable } from '@nestjs/common';
import { GestionCarteraDto } from '../dto/gestion.dto';
import { GestionCarteraEntity } from '../entity';
import { AllowUsersAC, AllowUsersVDP, AllowUsersAGU, AllowUsersSJ } from '../../AllowUser';
import { getAllByUser, getAll } from './querysGestion';
import { BaseSource } from '@crn/old/common/infrastructure/bases';
import { GcmContexts } from '@crn/old/common/application/constants';
import { ConciliacionCarteraEntity } from '../../conciliacion/entity';
import * as fs from 'fs';
import { deleteFile } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/constants';

@Injectable()
export class GestionRepository extends BaseSource {
  async getTercero(nit: string) {
    return await this.conn.query(
      `
        SELECT 
        OID, 
        TERNUMDOC, 
        TERNOMCOM 
        FROM GENTERCER 
        WHERE TERACTINAC = 1 
        AND TERNUMDOC = @0
    `,
      [nit]
    );
  }

  async getGestions() {
    if (this.auth.context === GcmContexts.ALTACENTRO) {
      if (AllowUsersAC.includes(this.auth.id)) {
        return await this.conn.query(getAll);
      } else {
        return await this.conn.query(getAllByUser, [this.auth.id]);
      }
    }
    if (this.auth.context === GcmContexts.SANJUAN) {
      if (AllowUsersSJ.includes(this.auth.id)) {
        return await this.conn.query(getAll);
      } else {
        return await this.conn.query(getAllByUser, [this.auth.id]);
      }
    }
    if (this.auth.context === GcmContexts.AGUACHICA) {
      if (AllowUsersAGU.includes(this.auth.id)) {
        return await this.conn.query(getAll);
      } else {
        return await this.conn.query(getAllByUser, [this.auth.id]);
      }
    }
    if (this.auth.context === GcmContexts.VALLEDUPAR) {
      if (AllowUsersVDP.includes(this.auth.id)) {
        return await this.conn.query(getAll);
      } else {
        return await this.conn.query(getAllByUser, [this.auth.id]);
      }
    }
  }

  async addGestion(gestion: GestionCarteraDto) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();
      const gestionCartera: GestionCarteraEntity = await this.Map(gestion);
      const createdGestion = this.qr.manager.create(GestionCarteraEntity, gestionCartera);
      const result = await this.qr.manager.save(GestionCarteraEntity, createdGestion);

      if (gestion.FECHCONCI !== null) {
        const cretaedConciliacion = await this._addConciliacion(result, 'insert');
        await this.qr.manager.save(ConciliacionCarteraEntity, cretaedConciliacion);
      }
      await this.qr.commitTransaction();
      return {
        success: true,
        message: 'Gestion creada con exito',
        data: result,
      };
    } catch (error) {
      await this.qr.rollbackTransaction();
      return {
        success: false,
        message: 'Error al Crear la Gestion',
      };
    } finally {
      await this.qr.release();
    }
  }

  async updateGestion(oid: number, gestion: GestionCarteraDto) {
    await this.qr.connect();
    delete gestion.FECHA;

    let result: GestionCarteraEntity;

    if (gestion.FECHCONCI) gestion.FECHCONCI = new Date(`${gestion.FECHCONCI}:00:00`);
    try {
      await this.qr.startTransaction();
      const findGestion = await this.qr.manager.findOne(GestionCarteraEntity, {
        where: { OID: oid },
      });
      result = findGestion;
      if (new Date() <= new Date(findGestion.FECHA.getTime() + 172800000)) {
        let conciliacionExiste = false;
        if (findGestion.FECHCONCI) conciliacionExiste = true;
        const updatedGestion = Object.assign(findGestion, gestion);
        result = await this.qr.manager.save(GestionCarteraEntity, updatedGestion);
        if (!conciliacionExiste && updatedGestion.FECHCONCI) {
          await this._addConciliacion2(updatedGestion, 'insert');
        } else if (conciliacionExiste && updatedGestion.FECHCONCI) {
          await this._addConciliacion2(updatedGestion, 'update');
        } else if (conciliacionExiste && !updatedGestion.FECHCONCI) {
          const findConciliacion = await this.qr.manager.findOne(ConciliacionCarteraEntity, {
            where: { GCMGESCART: updatedGestion.OID },
          });
          await this.qr.manager.remove(ConciliacionCarteraEntity, findConciliacion);
        }
      }

      await this.qr.commitTransaction();
      return {
        success: true,
        data: result,
        message: 'Gestion actualizada con exito',
      };
    } catch (error) {
      await this.qr.rollbackTransaction();
      return { success: false, message: 'Error al actualizar la Gestion' };
    } finally {
      await this.qr.release();
    }
  }

  async deleteGestion(oid: number) {
    await this.qr.connect();
    try {
      let thowErr = false;
      await this.qr.startTransaction();
      const findGestion = await this.qr.manager.findOne(GestionCarteraEntity, {
        where: { OID: oid },
      });

      let url = '';

      const conciliacion = await this.qr.manager.findOne(ConciliacionCarteraEntity, {
        where: { GCMGESCART: oid },
      });

      if (new Date() <= new Date(findGestion.FECHA.getTime() + 172800000)) {
        if (conciliacion) {
          url = conciliacion.RUTARCHI;
          await this.qr.manager.remove(ConciliacionCarteraEntity, conciliacion);
        }
        if (findGestion) {
          await this.qr.manager.remove(GestionCarteraEntity, findGestion);
        }
      } else {
        thowErr = true;
      }
      await this.qr.commitTransaction();

      if (thowErr) throw new Error('Solo puede eliminar la gestión el mismo dia que la creó');

      if (conciliacion.RUTARCHI != null) {
        deleteFile(`${FILE_LOCATIONS.crn.gcc.actas}/${url}`);
      }

      return {
        success: true,
        message: 'Gestion eliminada con exito',
      };
    } catch (error) {
      await this.qr.rollbackTransaction();
      return { success: false, message: 'Error al eliminar la Gestion' };
    } finally {
      await this.qr.release();
    }
  }

  /** @deprecated */
  private async _addConciliacion(
    gestion: GestionCarteraEntity,
    action: string
  ): Promise<ConciliacionCarteraEntity> {
    const conciliacion = new ConciliacionCarteraEntity();
    if (action === 'insert') {
      conciliacion.GCMGESCART = gestion.OID;
      conciliacion.FECHACONC = new Date(gestion.FECHCONCI);
      return this.qr.manager.create(ConciliacionCarteraEntity, conciliacion);
    }
    if (action === 'update') {
      const findConciliacion = await this.qr.manager.findOne(ConciliacionCarteraEntity, {
        where: { GCMGESCART: gestion.OID },
      });
      findConciliacion.FECHACONC = new Date(gestion.FECHCONCI);
      return await this.qr.manager.save(ConciliacionCarteraEntity, findConciliacion);
    }
  }

  /** PARA NO MODIFICAR EL ANTERIOR */
  private async _addConciliacion2(
    gestion: GestionCarteraEntity,
    action: string
  ): Promise<ConciliacionCarteraEntity> {
    const conciliacion = new ConciliacionCarteraEntity();
    if (action === 'insert') {
      conciliacion.GCMGESCART = gestion.OID;
      conciliacion.FECHACONC = new Date(gestion.FECHCONCI);
      return this.qr.manager.save(ConciliacionCarteraEntity, conciliacion);
    }
    if (action === 'update') {
      const findConciliacion = await this.qr.manager.findOne(ConciliacionCarteraEntity, {
        where: { GCMGESCART: gestion.OID },
      });
      findConciliacion.FECHACONC = new Date(gestion.FECHCONCI);
      return this.qr.manager.save(ConciliacionCarteraEntity, findConciliacion);
    }
  }

  async Map(gestionDto: GestionCarteraDto): Promise<GestionCarteraEntity> {
    let fechaConciliacionUpdated: Date | null = null;

    if (gestionDto.FECHCONCI) {
      const fechaConciliacion = new Date(gestionDto.FECHCONCI).getTime();
      fechaConciliacionUpdated = new Date(fechaConciliacion + 36000000);
    }

    const gestion = new GestionCarteraEntity();
    gestion.FECHA = new Date();
    gestion.GENUSUARIO = this.auth.user.id;
    gestion.GENTERCER = gestionDto.GENTERCER;
    gestion.TELEFTERC = gestionDto.TELEFTERC;
    gestion.RESPTERC = gestionDto.RESPTERC;
    gestion.MOTLLAMAD = gestionDto.MOTLLAMAD;
    gestion.OBSERVACION = gestionDto.OBSERVACION;
    gestion.FECHCONCI = fechaConciliacionUpdated;
    gestion.TIPCONCI = gestionDto.TIPCONCI;
    return gestion;
  }

  borrararchivo(filename: string) {
    const path = `./${filename}`;
    fs.unlink(path, err => {
      if (err) console.log(err);
    });
  }
}
