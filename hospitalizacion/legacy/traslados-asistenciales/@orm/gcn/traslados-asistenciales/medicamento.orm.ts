import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { TrasladoTramoOrm } from './traslado-tramo.orm';
import { TrasladoAsignacionOrm } from './traslado-asignacion.orm';
import { ProductoOrm } from './productos.orm';
import { UsuarioOrm } from '@hpn/lgc/tas/orm/gen';

@Entity({ name: 'EKHPNTRASLMED' })
export class MedicamentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.medicamentos)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'TRAMO', nullable: true })
  tramoId?: number;

  @ManyToOne(() => TrasladoTramoOrm, tramo => tramo.medicamentos)
  @JoinColumn([{ name: 'TRAMO', referencedColumnName: 'id' }])
  tramo?: TrasladoTramoOrm;

  @Column({ name: 'ASIGNACION', nullable: true })
  asignacionId?: number;

  @ManyToOne(() => TrasladoAsignacionOrm)
  @JoinColumn([{ name: 'ASIGNACION', referencedColumnName: 'id' }])
  asignacion?: TrasladoAsignacionOrm;

  @Column({ name: 'INNPRODUC' })
  medicamentoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  medicamento: ProductoOrm;

  @Column({ name: 'DOSIS' })
  dosis: string;

  @Column({ name: 'VIA' })
  via: string;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAREGISTRO' })
  fechaRegistro: Date;

  @Column({ name: 'PROCESADAPORCENATE', nullable: true })
  centroProcesamiento: number;
}
