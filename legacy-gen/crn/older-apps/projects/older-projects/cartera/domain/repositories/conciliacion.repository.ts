import { ConciliacionModel } from '@crn/rft/cartera/application/models';
import { ConciliacionOrm } from '@crn/rft/cartera/infrastructure/orm';

export abstract class ConciliacionRepository {
  abstract fetch(inicio: Date, final: Date): Promise<ConciliacionModel[]>;

  abstract create(): Promise<ConciliacionOrm>;
}
