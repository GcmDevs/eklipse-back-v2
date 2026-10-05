import { EntidadTipoAnexo } from '@common/domain/enums';
import { Anexo } from '../entities/anexo.entity';
import { AnexoGroupKey, AnexoLookupItem } from '../types';
import { AnexoRead } from '../read/media.read';

export interface AnexoRepository {
  saveMany(anexos: Anexo[]): Promise<void>;
  countByEntidad(tipo: EntidadTipoAnexo, entidadId: number): Promise<number>;
  findGroupedByEntidad(items: AnexoLookupItem[]): Promise<Map<AnexoGroupKey, AnexoRead[]>>;
}
