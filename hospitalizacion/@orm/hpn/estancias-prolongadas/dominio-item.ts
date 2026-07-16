import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DominioOrm } from './dominio.orm';
import { EstanciaItemPreguntasOrm } from './estancia-item-preguntas.orm';

@Entity({ name: 'EKHPNESTPRODOMINIOITEM' })
export class DominioItemOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'DOMINIOID', type: 'int' })
  dominioId: number;

  @ManyToOne(() => DominioOrm, dominio => dominio.items)
  @JoinColumn([{ name: 'DOMINIOID', referencedColumnName: 'id' }])
  dominio: DominioOrm;

  @Column({ name: 'TITULO', type: 'nvarchar', length: 350 })
  titulo: string;

  @Column({ name: 'SUBTITULO', type: 'nvarchar', length: 350 })
  subTitulo: string;

  @Column({ name: 'PUNTOS', type: 'int' })
  puntos: number;

  @Column({ name: 'ISACTIVE', type: 'bit' })
  isActive: boolean;

  @Column({ name: 'DISPLAYORDEN', type: 'int', nullable: true })
  orden: number;

  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime', nullable: true })
  updatedAt: Date;

  @OneToMany(() => EstanciaItemPreguntasOrm, pregunta => pregunta.dominioItem)
  preguntas: EstanciaItemPreguntasOrm[];
}
