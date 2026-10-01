import { GestionModel } from '@crn/rft/cartera/application/models';
import { GestionRepository } from '@crn/rft/cartera/domain/repositories';
import { GestionOrm } from '@crn/rft/cartera/infrastructure/orm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateGestionDto } from '../dtos';

@Injectable()
export class GestionHandler {
  constructor(private _gestiones: GestionRepository) {}

  public async fetch(inicio: Date, final: Date): Promise<GestionModel[]> {
    try {
      return this._gestiones.fetch(inicio, final);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async create(body: CreateGestionDto): Promise<GestionOrm> {
    try {
      return this._gestiones.create(body);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async update(id: number, body: CreateGestionDto): Promise<GestionOrm> {
    try {
      return this._gestiones.update(id, body);
    } catch (error) {
      throw new BadRequestException();
    }
  }

  public async delete(id: number): Promise<boolean> {
    try {
      return this._gestiones.delete(id);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}
