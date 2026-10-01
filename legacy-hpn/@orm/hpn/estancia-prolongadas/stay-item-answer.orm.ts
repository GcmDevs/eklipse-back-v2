import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DominioItemOrm } from './domain-item.orm';
import { ProlongadaEstanciaOrm } from './prolonged-stay.orm';

@Entity({ name: 'EKHPNESTPROSPREGUNTAS' })
export class EstanciaItemPreguntasOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTANCIAPROLONGADAID', type: 'int' })
  estanciaProlongadaId: number;

  @ManyToOne(() => ProlongadaEstanciaOrm, estanciaProlongada => estanciaProlongada.preguntas)
  @JoinColumn([{ name: 'ESTANCIAPROLONGADAID', referencedColumnName: 'id' }])
  estanciaProlongada: ProlongadaEstanciaOrm;

  @Column({ name: 'DOMINIOITEMID', type: 'int' })
  dominioItemId: number;

  @ManyToOne(() => DominioItemOrm, domainItem => domainItem.preguntas)
  @JoinColumn([{ name: 'DOMINIOITEMID', referencedColumnName: 'id' }])
  dominioItem: DominioItemOrm;

  @Column({ name: 'PUNTOSAWARDED', type: 'int' })
  puntosAwarded: number;

  @Column({ name: 'DOMINIOTITULOSNAPSHOT', type: 'nvarchar', length: 250 })
  dominioTituloSnapshot: string;

  @Column({ name: 'ITEMTITULOSNAPSHOT', type: 'nvarchar', length: 250 })
  itemTituloSnapshot: string;

  @Column({ name: 'ITEMSUBTITULOSNAPSHOT', type: 'nvarchar', length: 250, nullable: true })
  itemSubTituloSnapshot: string;

  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;
}
