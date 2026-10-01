import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('GENDEPEND')
export class InnDependenciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDPCODIGO' })
  codigo: string;

  @Column({ name: 'GDPNOMBRE' })
  nombre: string;

  centroId?: number;
}
