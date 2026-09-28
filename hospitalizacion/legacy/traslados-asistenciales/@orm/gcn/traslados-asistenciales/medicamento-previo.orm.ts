import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { ProductoOrm } from './productos.orm';

@Entity({ name: 'EKHPNTRASLPRIMMED' })
export class MedicamentoPrevioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.medicamentosPrevios)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'INNPRODUC', nullable: true })
  medicamentoId?: number;

  @ManyToOne(() => ProductoOrm, { nullable: true })
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  medicamento?: ProductoOrm;

  @Column({ name: 'DESCRIPCION', length: 255, nullable: true })
  descripcion?: string;

  @Column({ name: 'FECHACREACION', type: 'datetime' })
  fechaCreacion: Date;
}
