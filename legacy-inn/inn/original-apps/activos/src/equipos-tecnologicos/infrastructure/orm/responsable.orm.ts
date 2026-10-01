import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DependenciaOrm } from './dependencia.orm';

@Entity('AFNRESPON')
export class ResponsableOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'RESCODIGO', length: 20 })
  codigo: string;

  @Column({ name: 'RESNOMBRE' })
  nombre: string;

  @Column({ name: 'RESCEDULA' })
  cedula: string;

  @Column({ name: 'AFNDEPART' })
  dependenciaId: number;

  @OneToOne(() => DependenciaOrm)
  @JoinColumn({ name: 'AFNDEPART', referencedColumnName: 'id' })
  dependencia: DependenciaOrm;
}
