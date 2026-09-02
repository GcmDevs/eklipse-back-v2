import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { GenSubgrupoOrm } from './gen-subgrupo.orm';

@Entity('GENSERIPS')
export class ServicioIpsOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SIPCODIGO' })
  codigo: string;

  @Column({ name: 'SIPNOMBRE' })
  nombre: string;

  @Column({ name: 'SIPDESCUP' })
  descripcion: string;

  @Column({ name: 'GENSUBGRU1' })
  genSubgrupoId: number;

  @Column({ name: 'SIPTIPSER' })
  tipo: number;

  @Column({ name: 'SIPCODCUP' })
  codigoCups: string;

  @ManyToOne(() => GenSubgrupoOrm)
  @JoinColumn([{ name: 'GENSUBGRU1', referencedColumnName: 'id' }])
  genSubgrupo: GenSubgrupoOrm;
}
