import { BaseSource } from '@common/infrastructure/services';
import { Formato } from '@equipos/domain/entities/actividades';
import { ModoFormato, TipoMantenimiento } from '@equipos/domain/enums';
import { FormatoRead } from '@equipos/domain/read';
import { FormatoRepository } from '@equipos/domain/repositories';
import { FormatoMapper } from '@equipos/infrastructure/mappers';
import { FormatoOrm } from '@orm/inn/equipos';
import { EstadoVersionFormato, VersionFormatoEvento, VersionFormatoFmt } from 'apps/motor-formatos/domain';
import { EventoAuditVersionFormatoOrm, VersionFormatoFmtOrm } from 'apps/motor-formatos/infrastructure';
import { VersionFormatoEventoMapper, VersionFormatoMapper } from 'apps/motor-formatos/infrastructure/mappers';
import { Repository } from 'typeorm';


export class TypeOrmFormatoRepository extends BaseSource implements FormatoRepository {
  private readonly repository: Repository<FormatoOrm> = this.conn.getRepository(FormatoOrm);
  private readonly versionRepository: Repository<VersionFormatoFmtOrm> = this.conn.getRepository(VersionFormatoFmtOrm);
  private readonly versionFmtEventorepository: Repository<EventoAuditVersionFormatoOrm> =
    this.conn.getRepository(EventoAuditVersionFormatoOrm);


  private getAttributesVersion(prefix: string) {
    return [
      `${prefix}.id`,
      `${prefix}.version`,
      `${prefix}.etiquetaVersion`,
      `${prefix}.fechaPublicacion`,
      `${prefix}.estado`,
      `${prefix}.createdAt`,
      `${prefix}.updatedAt`,
      `${prefix}.creadoPorId`,
    ]
  }

  async findViewById(id: number): Promise<FormatoRead> {
    const formatoFound = await this.repository.createQueryBuilder('fmt')
      .leftJoin('fmt.versiones', 'versiones')
      .addSelect(
        this.getAttributesVersion('versiones')
      )
      .where('fmt.id = :id', { id: id })
      .getOne();
    return formatoFound ? FormatoMapper.toView(formatoFound) : null;
  }

  findAllView(page: number, limit: number): Promise<[FormatoRead[], number]> {
    throw new Error('Method not implemented.');
  }

  async save(formato: Formato): Promise<Formato> {
    const formatoOrm = FormatoMapper.toOrm(formato);
    const formatoSaved = await this.repository.save(formatoOrm);
    return FormatoMapper.toDomain(formatoSaved);
  }

  async saveVersionFormato(versionFormato: VersionFormatoFmt): Promise<VersionFormatoFmt> {
    const versionFormatoOrm = VersionFormatoMapper.toOrm(versionFormato);
    const versionFormatoSaved = await this.versionRepository.save(versionFormatoOrm);
    return VersionFormatoMapper.toDomain(versionFormatoSaved);
  }

  async saveVersionFormatoEventoAud(evento: VersionFormatoEvento): Promise<VersionFormatoEvento> {
    const eventoOrm = VersionFormatoEventoMapper.toOrm(evento);
    const eventoSaved = await this.versionFmtEventorepository.save(eventoOrm);
    return VersionFormatoEventoMapper.toDomain(eventoSaved);
  }

  public async findAllAndCount(
    skip: number,
    take: number,
    search?: string,
    modo?: ModoFormato
  ): Promise<[FormatoRead[], number]> {
    const qb = this.repository
      .createQueryBuilder('fmt')
      .leftJoin('fmt.versiones', 'versiones')
      .addSelect(this.getAttributesVersion('versiones'));

    if (search?.trim()) {
      qb.andWhere(
        '(fmt.nombre LIKE :search OR fmt.codigo LIKE :search OR fmt.descripcion LIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    if (modo) {
      qb.andWhere('fmt.modoFormato = :modo', { modo: modo })
    }

    const [formatosFound, count] = await qb
      .orderBy('fmt.id', 'ASC')
      .skip((skip - 1) * take)
      .take(take)
      .getManyAndCount();
    const formatos = FormatoMapper.toViewList(formatosFound);
    return [formatos, count];
  }

  async findById(id: number): Promise<Formato | null> {
    const formatoFound = await this.repository.createQueryBuilder('fmt')
      .leftJoin('fmt.versiones', 'versiones')
      .addSelect(this.getAttributesVersion('versiones'))
      .where('fmt.id = :id', { id: id })
      .getOne();
    return formatoFound ? FormatoMapper.toDomain(formatoFound) : null;
  }

  async findByIdAndTipo(id: number, tipo: TipoMantenimiento): Promise<Formato | null> {
    const formatoFound = await this.repository.createQueryBuilder('fmt')
      .leftJoin('fmt.versiones', 'versiones')
      .addSelect(this.getAttributesVersion('versiones'))
      .where('fmt.id = :id', { id: id })
      .andWhere('fmt.tipo = :tipo', { tipo: tipo })
      .getOne();
    return formatoFound ? FormatoMapper.toDomain(formatoFound) : null;
  }

  async findByIdWithoutVersions(id: number): Promise<FormatoRead | null> {
    const formatoFound = await this.repository.findOne({ where: { id: id } })
    return formatoFound ? FormatoMapper.toView(formatoFound) : null;
  }

  async findByIdWithSpecificVersion(
    formatoId: number,
    versionId: number
  ): Promise<Formato | null> {
    const formatoFound = await this.repository
      .createQueryBuilder('fmt')
      .leftJoinAndSelect(
        'fmt.versiones',
        'versiones',
        'versiones.id = :versionId',
        { versionId }
      )
      .leftJoinAndSelect('versiones.secciones', 'secciones')
      .leftJoinAndSelect('secciones.seccion', 'seccion')
      .where('fmt.id = :formatoId', { formatoId })
      .getOne();

    return formatoFound ? FormatoMapper.toDomain(formatoFound) : null;
  }


  public async exist(id: number): Promise<boolean | null> {
    return await this.repository.exists({ where: { id: id } });
  }

  public async findVersionFormato(versionFormatoId: number): Promise<VersionFormatoFmt | null> {
    const orm = await this.versionRepository.createQueryBuilder('verFmt')
      .leftJoinAndSelect('verFmt.secciones', 'secciones')
      .leftJoinAndSelect('secciones.seccion', 'seccion')
      .leftJoinAndSelect('verFmt.configuracionSecImagenes', 'configuracionSecImagenes')
      .where('verFmt.id = :id', { id: versionFormatoId })
      .getOne();

    if (!orm) return null
    return VersionFormatoMapper.toDomain(orm);
  }

  public async findLastPublishedVersion(
    formatoId: number,
  ): Promise<VersionFormatoFmt | null> {
    const lastVersionFmtPublished = await this.versionRepository.findOne({
      where: {
        formatoId,
        estado: EstadoVersionFormato.PUBLICADO,
      },
      order: {
        version: 'DESC',
      },
    });

    if (!lastVersionFmtPublished) return null;
    return VersionFormatoMapper.toDomain(lastVersionFmtPublished);
  }

  public async existPublishedByFormato(formatoId: number): Promise<boolean> {
    const result = await this.versionRepository
      .createQueryBuilder('verFmt')
      .select('1')
      .where('verFmt.formatoId = :formatoId', { formatoId })
      .andWhere('verFmt.estado = :estado', { estado: EstadoVersionFormato.PUBLICADO })
      .limit(1).
      getRawOne();

    return Boolean(result);
  }

  update(updateEntity: Formato): Promise<Formato> {
    throw new Error('Method not implemented.');
  }
  delete(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  exists(id: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}





