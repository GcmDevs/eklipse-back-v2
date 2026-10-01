import { BadRequestException, Injectable } from '@nestjs/common';
import { FacturaCrudSource } from '../../infrastructure/repositories';

@Injectable()
export class FacturaCrudHandler {
  constructor(private _facturaCrud: FacturaCrudSource) {}

  public async fetch(start: Date, end: Date, centroId: number) {
    try {
      start = new Date(`${start.toISOString().split('T')[0]}:00:00:00`);
      end = new Date(`${end.toISOString().split('T')[0]}:23:59:59`);
      const result = await this._facturaCrud.fetch(start, end, centroId);
      return result;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
