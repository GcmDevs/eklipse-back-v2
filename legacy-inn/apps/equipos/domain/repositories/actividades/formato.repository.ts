import { BaseRepository } from '@common/domain/repositories';
import { Formato } from '@equipos/domain/entities/actividades';
import { ModoFormato, TipoMantenimiento } from '@equipos/domain/enums';
import { FormatoRead } from '@equipos/domain/read';
import { VersionFormatoFmt } from 'apps/motor-formatos/domain';
import { VersionFormatoEvento } from 'apps/motor-formatos/domain/entities/auditoria';

export interface FormatoRepository extends BaseRepository<Formato, FormatoRead> {
  findByIdAndTipo(id: number, tipo: TipoMantenimiento): Promise<Formato | null>;
  saveVersionFormato(versionFormato: VersionFormatoFmt): Promise<VersionFormatoFmt>;
  saveVersionFormatoEventoAud(evento: VersionFormatoEvento): Promise<VersionFormatoEvento>;
  findByIdWithoutVersions(id: number): Promise<FormatoRead | null>;
  findByIdWithSpecificVersion(formatoId: number, versionId: number): Promise<Formato | null>;
  findAllAndCount(
    skip: number,
    take: number,
    search?: string,
    modo?: ModoFormato
  ): Promise<[FormatoRead[], number]>;
  findVersionFormato(versionFormatoId: number): Promise<VersionFormatoFmt | null>;
  findLastPublishedVersion(formatoId: number): Promise<VersionFormatoFmt | null>;
  existPublishedByFormato(formatoId: number): Promise<boolean>;
}
