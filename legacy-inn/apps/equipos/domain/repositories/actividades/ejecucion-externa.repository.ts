import { EjecucionExterna } from '@equipos/domain/entities';

export interface EjecucionExternaRepository {
  save(ejecucion: EjecucionExterna): Promise<EjecucionExterna>;
  findByRegActividadId(registroActividadId: number): Promise<EjecucionExterna | null>;
  existsByRegActividadId(registroActividadId: number): Promise<boolean>;
}
