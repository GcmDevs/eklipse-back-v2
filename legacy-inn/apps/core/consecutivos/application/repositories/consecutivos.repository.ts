import { ConsecutivoOrm } from '@orm/cor';

export const CONSECUTIVO_REPOSITORY = Symbol('CONSECUTIVO_REPOSITORY');

export interface ConsecutivoRepository {
  findByCodigo(codigo: string): Promise<ConsecutivoOrm | null>;
  save(consecutivo: Partial<ConsecutivoOrm>): Promise<ConsecutivoOrm>;
  incrementAndGet(codigo: string): Promise<ConsecutivoOrm | null>;
}
