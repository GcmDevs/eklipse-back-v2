import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { FuenteLecturaOdometro } from '@inn/operaciones/tanqueos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: TABLE_NAMES.inn.ges_tanqueos.lecturas_odometro })
export class LecturaOdometroOrm extends BaseCreatedOrm {
  @Column({ name: 'ACTIVOOID', type: 'int' })
  activoId: number;

  @Column({ name: 'LECTURA', type: 'int' })
  lectura: number;

  @Column({ name: 'FECHALECTURA', type: 'datetime2' })
  fechaLectura: Date;

  @Column({ name: 'FUENTE', type: 'nvarchar', length: 15 })
  fuente: FuenteLecturaOdometro;

  @Column({ name: 'REFERENCIAOID', type: 'int', nullable: true })
  referenciaId?: number;

  @Column({ name: 'CONFIABLE', type: 'bit', default: true })
  confiable: boolean;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'OBSERVACION', type: 'nvarchar', length: 500, nullable: true })
  observacion?: string;
}
