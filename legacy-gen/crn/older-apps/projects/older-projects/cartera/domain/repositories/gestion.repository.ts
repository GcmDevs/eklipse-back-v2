import { GestionModel } from '@crn/rft/cartera/application/models';
import { GestionOrm } from '@crn/rft/cartera/infrastructure/orm';
import { CreateGestionDto } from '@crn/rft/cartera/presentation/dtos';

export abstract class GestionRepository {
  abstract fetch(inicio: Date, final: Date): Promise<GestionModel[]>;

  abstract create(body: CreateGestionDto): Promise<GestionOrm>;

  abstract update(id: number, body: CreateGestionDto): Promise<GestionOrm>;

  abstract delete(id: number): Promise<boolean>;
}
