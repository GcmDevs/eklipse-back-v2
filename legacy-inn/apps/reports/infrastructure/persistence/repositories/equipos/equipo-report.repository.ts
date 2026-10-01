import { BaseSource } from '@common/infrastructure/services';
import { ResponsableView } from '@orm/cor';
import { EquipoOrm } from '@orm/inn/equipos';
import { DocumentoTipoEquipoOrm } from '@orm/inn/equipos/catalogo/documento-tipo-equipo.orm';
import { Repository, SelectQueryBuilder } from 'typeorm';

export class TypeOrmEquipoReportRepository extends BaseSource {
  private readonly repository: Repository<EquipoOrm> =
    this.conn.getRepository(EquipoOrm);
  private readonly responsableRepository: Repository<ResponsableView> =
    this.conn.getRepository(ResponsableView);
  private readonly documentoTipoEquipoRepository: Repository<DocumentoTipoEquipoOrm> =
    this.conn.getRepository(DocumentoTipoEquipoOrm);

  public async findHdvReport(equipoId: number): Promise<EquipoOrm | null> {
    let qb = this.repository
      .createQueryBuilder('equipo')
      .leftJoinAndSelect('equipo.tipoEquipoRel', 'tipoEquipo')
      .leftJoinAndSelect('tipoEquipo.tipoActivo', 'tipoActivo')
      .leftJoinAndSelect('tipoEquipo.modelo', 'modelo')
      .leftJoinAndSelect('modelo.marca', 'marca')
      .leftJoinAndSelect('equipo.responsable', 'responsable')
      .leftJoinAndSelect('equipo.compra', 'compra')
      .leftJoinAndSelect('compra.proveedor', 'proveedor')
      .leftJoinAndSelect('equipo.planesActividad', 'planesActividad');
    this.joinDocumentos(qb, 'tipoEquipo.documentos', 'documentosTipoEquipo');
    this.joinDocumentos(qb, 'compra.documentos', 'documentosCompra');

    qb = qb.leftJoinAndSelect(
      'equipo.accesoriosUnidad',
      'accesoriosUnidad',
      'accesoriosUnidad.descontinuado = :descontinuado',
      { descontinuado: false },
    );
    qb = qb
      .leftJoinAndSelect('accesoriosUnidad.accesorioEstandar', 'accesorioEstandar')
      .leftJoinAndSelect('accesorioEstandar.marca', 'accesorioMarca')
      .where('equipo.id = :equipoId', { equipoId });

    return qb.getOne();
  }

  public async findDepartamentoEquipoByResponsableId(
    responsableId: number,
  ): Promise<ResponsableView | null> {
    return this.responsableRepository.findOne({
      where: { responsableId },
    });
  }

  private joinDocumentos(
    qb: SelectQueryBuilder<EquipoOrm>,
    relation: string,
    alias: string,
  ): void {
    qb.leftJoinAndSelect(
      relation,
      alias,
      `${alias}.activo = :activo`,
      { activo: true },
    )
      .leftJoinAndSelect(
        `${alias}.tipoDocumento`,
        `${alias}TipoDocumento`,
      )
      .leftJoinAndSelect(
        `${alias}.archivo`,
        `${alias}Archivo`,
      );
  }
}
