import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DominioAccionesOrm } from './dominio-acciones.orm';
import { DominioItemOrm } from './dominio-item';

@Entity({ name: 'EKHPNESTPRODOMINIO' })
export class DominioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TITULO', type: 'nvarchar', length: 350 })
  titulo: string;

  @Column({ name: 'MAXPUNTOS', type: 'int' })
  maxPuntos: number;

  @CreateDateColumn({ name: 'CREATEDAT', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATEDAT', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => DominioItemOrm, item => item.dominio)
  items: DominioItemOrm[];

  @OneToMany(() => DominioAccionesOrm, action => action.dominio)
  acciones: DominioAccionesOrm[];
}
