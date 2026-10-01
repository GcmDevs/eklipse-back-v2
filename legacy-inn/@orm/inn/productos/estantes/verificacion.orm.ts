import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { EstanteOrm } from './estante.orm';
import { UsuarioOrm } from '@orm/gen';
import { ReporteOrm } from './reporte.orm';

@Entity(TABLE_NAMES.inn.pdt.stt.verificaciones)
export class VerificacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'OBSERVACIONES' })
  observaciones: string;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}1`, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}1` })
  creadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}2`, referencedColumnName: 'id' }])
  verificadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}2` })
  verificadoPorId: number;

  @ManyToOne(() => EstanteOrm)
  @JoinColumn([{ name: TABLE_NAMES.inn.pdt.stt.estantes, referencedColumnName: 'id' }])
  estante: EstanteOrm;

  @Column({ name: TABLE_NAMES.inn.pdt.stt.estantes })
  estanteId: number;

  @OneToMany(() => ReporteOrm, reporte => reporte.verificacion)
  reportes: ReporteOrm[];

  @Column({ name: 'FECHCREACIO' })
  fechaCreacion: Date;

  @Column({ name: 'FECHVERIFICACI' })
  fechaVerificacion: Date;
}
