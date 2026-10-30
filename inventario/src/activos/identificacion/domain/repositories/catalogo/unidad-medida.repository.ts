import { UnidadMedida } from "@inn/activos/identificacion/domain/entities";

export interface UnidadMedidaRepository {
  save(unidadMedida: UnidadMedida): Promise<UnidadMedida>;
  findById(id: number): Promise<UnidadMedida | null>;
  findAll(): Promise<UnidadMedida[]>;
}
