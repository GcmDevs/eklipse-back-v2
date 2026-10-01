import { UnidadMedida } from "@equipos/domain/entities";

export interface UnidadMedidaRepository {
  save(unidadMedida: UnidadMedida): Promise<UnidadMedida>;
  findById(id: number): Promise<UnidadMedida | null>;
  findAll(): Promise<UnidadMedida[]>;
}
