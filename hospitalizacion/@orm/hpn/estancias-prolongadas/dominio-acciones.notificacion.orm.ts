import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EstanciasProlongadasOrm } from './estancia-prolongada.orm';
import { DominioAccionesOrm } from './dominio-acciones.orm';

@Entity({ name: 'EKHPNESTPROACCIONNOTIFICACION' })
export class DominioAccionNotificacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'USUARIOID', type: 'int' })
  usuarioId: number;

  @Column({ name: 'ESTANCIAPROLONGADAID', type: 'int' })
  estanciaProlongadaId: number;

  @ManyToOne(() => EstanciasProlongadasOrm)
  @JoinColumn([{ name: 'ESTANCIAPROLONGADAID', referencedColumnName: 'id' }])
  estanciaProlongada: EstanciasProlongadasOrm;

  @Column({ name: 'ACCIONID', type: 'int' })
  accionId: number;

  @ManyToOne(() => DominioAccionesOrm)
  @JoinColumn([{ name: 'ACCIONID', referencedColumnName: 'id' }])
  accion: DominioAccionesOrm;

  @Column({ name: 'DESCRIPCION', type: 'nvarchar', length: 1000 })
  descripcion: string;

  @Column({ name: 'VISTO', type: 'bit' })
  visto: boolean;

  @Column({ name: 'FECHAVISTO', type: 'datetime', nullable: true })
  fechaVisto: Date;

  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime', nullable: true })
  updatedAt: Date;
}
