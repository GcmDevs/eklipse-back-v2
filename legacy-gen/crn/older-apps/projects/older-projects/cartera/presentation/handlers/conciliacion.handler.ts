import { BadRequestException, Injectable } from '@nestjs/common';
import { ConciliacionRepository } from '@crn/rft/cartera/domain/repositories';
import { ConciliacionModel } from '@crn/rft/cartera/application/models';
import { GestionOrm } from '@crn/rft/cartera/infrastructure/orm';
import { CreateGestionDto } from '../dtos';

@Injectable()
export class ConciliacionHandler {
  constructor(private _conciliaciones: ConciliacionRepository) {}

  public async fetch(inicio: Date, final: Date): Promise<ConciliacionModel[]> {
    try {
      return this._conciliaciones.fetch(inicio, final);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async create(body: CreateGestionDto): Promise<GestionOrm> {
    throw new BadRequestException();
    try {
      //return this._conciliaciones.create(body);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async update(id: number, body: CreateGestionDto): Promise<GestionOrm> {
    throw new BadRequestException();
    try {
      //return this._conciliaciones.update(id, body);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async delete(id: number): Promise<boolean> {
    throw new BadRequestException();
    try {
      //return this._conciliaciones.delete(id);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
