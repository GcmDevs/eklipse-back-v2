import { TABLE_NAMES } from '@common/application/constants';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { DocumentoTipoEquipoOrm } from './documento-tipo-equipo.orm';
import { CategoriaDocumento } from '@equipos/domain/enums';
import { ReglasObligatoriedadTipoActivo } from '@equipos/domain/value-objects/reglas-obligatoriedad-tipo-activo.vo';
import { reglasTipoActivoTransformer } from '../supports/transformers/reglas-tipo-activo.transformer';

@Entity({ name: TABLE_NAMES.inn.eqp.tip_doc_categoria_activo })
@Unique('UQ_EKINNEQPTIPDOCCATEGORIA_NOMBRE', ['nombre'])
export class TipoDocCategoriaActivoOrm extends BaseTimestampedOrm {
  @Column({ name: 'NOMBRE', type: 'varchar', length: 80 })
  nombre: string;

  @Column({ name: 'CATEGORIA', type: 'varchar', length: 30 })
  categoria: CategoriaDocumento;

  @Column({
    name: 'REGLASTIPOACTIVO',
    type: 'nvarchar',
    length: 'max',
    nullable: true,
    transformer: reglasTipoActivoTransformer,
  })
  reglasTipoActivo?: ReglasObligatoriedadTipoActivo;

  @Column({ name: 'DESCRIPCION', type: 'nvarchar', length: 300, nullable: true })
  descripcion?: string;

  @OneToMany(() => DocumentoTipoEquipoOrm, doc => doc.tipoDocumento)
  documentos: DocumentoTipoEquipoOrm[];
}
