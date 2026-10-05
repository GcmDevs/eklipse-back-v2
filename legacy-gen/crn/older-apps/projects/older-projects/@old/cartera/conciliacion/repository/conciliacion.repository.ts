import { ConciliacionCarteraEntity } from '../entity';
import { ConciliacionCarteraDto } from '../dto';
import { AllowUsersAC, AllowUsersVDP, AllowUsersAGU, AllowUsersSJ } from '../../AllowUser';
import { getAllByUser, getAll } from './querysConciliacion';
import * as fs from 'fs';
import { BaseSource } from '@crn/old/common/infrastructure/bases';
import { Injectable } from '@nestjs/common';
import { GcmContexts } from '@crn/old/common/application/constants';
import { ENVIRONMENTS } from 'src/app.environments';
import { deleteFile } from '@common/presentation/helpers';
import { FILE_LOCATIONS } from '@common/application/file-locations';

@Injectable()
export class ConciliacionRepository extends BaseSource {
  async getConciliaciones() {
    if (this.auth.context === GcmContexts.ALTACENTRO) {
      if (AllowUsersAC.includes(this.auth.id)) {
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
    if (this.auth.context === GcmContexts.SANJUAN) {
      if (AllowUsersSJ.includes(this.auth.id)) {
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

  async getConciliacionByGestion(oid: number) {
    try {
      const conciliacion = await this.conn.manager.findOne(ConciliacionCarteraEntity, {
        where: { GCMGESCART: oid },
      });
      return conciliacion;
    } catch (error) {
      return null;
    }
  }

  async updateConciliacion(id: number, _conciliacion: ConciliacionCarteraDto) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();
      const conciliacion = await this.qr.manager.findOne(ConciliacionCarteraEntity, {
        where: { OID: id },
      });
      const newConciliacion = this.Map(_conciliacion);
      const updatedConciliacion = Object.assign(conciliacion, newConciliacion);
      const result = await this.qr.manager.save(ConciliacionCarteraEntity, updatedConciliacion);
      if (result.RUTARCHI) {
        result.RUTARCHI = `${ENVIRONMENTS.apiUrl}/${FILE_LOCATIONS.crn.gcc.actas}/${result.RUTARCHI}`;
      }
      await this.qr.commitTransaction();
      return {
        success: true,
        data: result,
        message: 'Conciliacion actualizada',
      };
    } catch (error) {
      await this.qr.rollbackTransaction();
      return { success: false, message: 'Error al actualizar la conciliacion' };
    } finally {
      await this.qr.release();
    }
  }

  async updateActa(OID: number, namefile: string) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();
      const conciliacion = await this.qr.manager.findOne(ConciliacionCarteraEntity, {
        where: { OID },
      });
      if (conciliacion.RUTARCHI != null) {
        deleteFile(`${FILE_LOCATIONS.crn.gcc.actas}/${conciliacion.RUTARCHI}`);
      }

      const updatedConciliacion = Object.assign(conciliacion, {
        RUTARCHI: namefile.replace('..\\public\\crn\\gcc\\actas-concl\\', ''),
      });
      await this.qr.manager.save(ConciliacionCarteraEntity, updatedConciliacion);
      await this.qr.commitTransaction();
      return {
        success: true,
        message: 'Acta Cargada',
      };
    } catch (error) {
      await this.qr.rollbackTransaction();
      return { success: false, message: 'Error al cargar el Acta' };
    } finally {
      await this.qr.release();
    }
  }

  async deleteConciliacion(OID: number) {
    await this.qr.connect();
    try {
      await this.qr.startTransaction();
      const conciliacion = await this.qr.manager.findOne(ConciliacionCarteraEntity, {
        where: { OID },
      });

      if (conciliacion.RUTARCHI != null) {
        deleteFile(`${FILE_LOCATIONS.crn.gcc.actas}/${conciliacion.RUTARCHI}`);
      }

      if (!conciliacion) {
        return { success: false, message: 'No existe la conciliacion' };
      }
      await this.qr.manager.remove(conciliacion);
      await this.qr.commitTransaction();
      return {
        success: true,
        message: 'Conciliacion eliminada',
      };
    } catch (error) {
      await this.qr.rollbackTransaction();
      return { success: false, message: 'Error al eliminar la conciliacion' };
    } finally {
      await this.qr.release();
    }
  }

  Map(newConciliacion: ConciliacionCarteraDto) {
    const conciliacion = new ConciliacionCarteraEntity();
    conciliacion.NACTACONCI = newConciliacion.NACTACONCI;
    conciliacion.FECHACONC = new Date();
    conciliacion.VALCONCI = newConciliacion.VALCONCI;
    conciliacion.VALRECPAG = newConciliacion.VALRECPAG;
    conciliacion.VALGLOSAD = newConciliacion.VALGLOSAD;
    conciliacion.VALDEVUEL = newConciliacion.VALDEVUEL;
    conciliacion.VALNORADI = newConciliacion.VALNORADI;
    conciliacion.AUDITORIA = newConciliacion.AUDITORIA;
    conciliacion.RETENCION = newConciliacion.RETENCION;
    conciliacion.GLOSACEPTIPS = newConciliacion.GLOSACEPTIPS;
    conciliacion.NOTNODESCEPS = newConciliacion.NOTNODESCEPS;
    conciliacion.PAGNOAPLI = newConciliacion.PAGNOAPLI;
    conciliacion.COPCUOMODE = newConciliacion.COPCUOMODE;
    conciliacion.VALCANCEL = newConciliacion.VALCANCEL;
    conciliacion.TOTAL = this.total(newConciliacion);
    conciliacion.DIFEREN = this.diferencia(newConciliacion);
    conciliacion.ESTADO = newConciliacion.ESTADO;
    return conciliacion;
  }

  total(conci: ConciliacionCarteraDto): number {
    return (
      conci.VALRECPAG +
      conci.VALGLOSAD +
      conci.VALDEVUEL +
      conci.VALNORADI +
      conci.AUDITORIA +
      conci.RETENCION +
      conci.GLOSACEPTIPS +
      conci.PAGNOAPLI +
      conci.NOTNODESCEPS +
      conci.COPCUOMODE +
      conci.VALCANCEL
    );
  }

  diferencia(conci: ConciliacionCarteraDto): number {
    return conci.VALCONCI - this.total(conci);
  }

  async getActa(OID: number) {
    return await this.conn.query(
      `
    SELECT 
    GCC.OID IdConciliacion,
    GCC.RUTARCHI Ruta
    FROM GCMCONCCART GCC
    WHERE GCC.OID = @0
    `,
      [OID]
    );
  }
}
