import { Injectable } from '@nestjs/common';
import { GestionRepository } from '@crn/rft/cartera/domain/repositories';
import { CreateGestionDto } from '@crn/rft/cartera/presentation/dtos';
import { GestionModel } from '@crn/rft/cartera/application/models';
import { dataToGestionOrm, dataToGestionModel } from '../factories';
import { ConciliacionOrm, GestionOrm } from '../orm';
import { GestionResponse } from '../data-transfers';
import { fetchGestionesQuery } from '../queries';
import { BaseSource } from '@crn/old/common/infrastructure/bases';

@Injectable()
export class GestionSource extends BaseSource implements GestionRepository {
  public async fetch(inicio: Date, final: Date): Promise<GestionModel[]> {
    const response: GestionResponse[] = await this.conn.query(fetchGestionesQuery(), [
      inicio.toISOString().split('T')[0],
      final.toISOString().split('T')[0],
    ]);

    return response.map(_ => dataToGestionModel(_));
  }

  public async create(body: CreateGestionDto): Promise<GestionOrm> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const newGestion = dataToGestionOrm(body, this.auth.id);

      const gestionSaved = await this.qr.manager.save(GestionOrm, newGestion);

      if (body.fechaConciliacion !== null) {
        const newConciliacion = new ConciliacionOrm();
        newConciliacion.gestionId = gestionSaved.id;
        newConciliacion.fechaConciliacion = new Date(body.fechaConciliacion);
        await this.qr.manager.save(ConciliacionOrm, newConciliacion);
      }

      await this.qr.commitTransaction();
      return gestionSaved;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new Error('No se registró la gestión correctamente');
    } finally {
      await this.qr.release();
    }
  }

  public async update(id: number, body: CreateGestionDto): Promise<GestionOrm> {
    await this.qr.connect();
    await this.qr.startTransaction();
    try {
      const gestion = await this.qr.manager.findOne(GestionOrm, { where: { id } });
      const gestionMapped = Object.assign(gestion, body);
      const gestionUpdated = await this.qr.manager.save(GestionOrm, gestionMapped);

      if (gestionMapped.fechaConciliacion !== null) {
        const conciliacion = await this.qr.manager.findOne(ConciliacionOrm, {
          where: { gestionId: gestion.id },
        });

        conciliacion.fechaConciliacion = new Date(body.fechaConciliacion);
        await this.qr.manager.save(ConciliacionOrm, conciliacion);
      }
      await this.qr.commitTransaction();

      return gestionUpdated;
    } catch (error) {
      await this.qr.rollbackTransaction();
      throw new Error('No se actualizó la gestión correctamente');
    } finally {
      await this.qr.release();
    }
  }

  public async delete(id: number): Promise<boolean> {
    return true;
    /* await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    try {
      const gestion = await this.queryRunner.manager.findOne(GestionOrm, id);

      if (gestion) {
        //const conciliacion = await this.queryRunner.manager.findOne(ConciliacionOrm, gestion.id);
        //if (conciliacion) await this.queryRunner.manager.remove(ConciliacionOrm, conciliacion);
        //await this.queryRunner.manager.remove(GestionOrm, gestion);

        gestion.deleteAt = new Date();
        await this.queryRunner.manager.save(GestionOrm, gestion);
      }

      await this.queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await this.queryRunner.rollbackTransaction();
      throw new Error('Bad request');
    } finally {
      await this.queryRunner.release();
    } */
  }
}
