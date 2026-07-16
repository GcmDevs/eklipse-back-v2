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
import { DominioOrm } from './dominio.orm';

@Entity({ name: 'EKHPNESTPRODOMINIOACCIONES' })
export class DominioAccionesOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTANCIAPROLONGADAID', type: 'int' })
  estanciaProlongadaId: number;

  @ManyToOne(() => EstanciasProlongadasOrm, stay => stay.acciones)
  @JoinColumn([{ name: 'ESTANCIAPROLONGADAID', referencedColumnName: 'id' }])
  estanciaProlongada: EstanciasProlongadasOrm;

  @Column({ name: 'DOMINIOID', type: 'int' })
  dominioId: number;

  @ManyToOne(() => DominioOrm, domain => domain.acciones)
  @JoinColumn([{ name: 'DOMINIOID', referencedColumnName: 'id' }])
  dominio: DominioOrm;

  @Column({ name: 'ACCIONESPECIFICA', type: 'nvarchar', length: 1000 })
  accionEspecifica: string;

  @Column({ name: 'ESTADO', type: 'nvarchar', length: 30 })
  estado: string;

  @Column({ name: 'RESPONSABLE', type: 'nvarchar', length: 150, nullable: true })
  responsable: string;

  @Column({ name: 'USUARIOID', type: 'int' })
  usuarioId: number;

  @Column({ name: 'ESTIMADODATE', type: 'datetime', nullable: true })
  tiempoEstimado: Date;

  @Column({ name: 'OBSERVACIONES', type: 'nvarchar', length: 1000, nullable: true })
  observaciones: string;

  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime', nullable: true })
  updatedAt: Date;
}
