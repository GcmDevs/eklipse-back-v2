import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EntidadOrm } from '../entidad.orm';
import { DepartamentoOrm, MunicipioOrm } from '@hpn/lgc/tas/orm/gen';

@Entity('EKHPNTRASLUBI')
export class UbicacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => EntidadOrm)
  @JoinColumn([{ name: 'INTITUCION', referencedColumnName: 'id' }])
  institucion: EntidadOrm;

  @Column({ name: 'INTITUCION', nullable: true })
  institucionId: number;

  @Column({ name: 'NOMBRE', nullable: true })
  nombre: string;

  @Column({ name: 'TIPO', nullable: true })
  tipo: number;

  @Column({ name: 'DIRECCION', nullable: true })
  direccion: string;

  @ManyToOne(() => DepartamentoOrm)
  @JoinColumn({ name: 'DEPTO' })
  departamento: DepartamentoOrm;

  @Column({ name: 'DEPTO' })
  departamentoId: number;

  @ManyToOne(() => MunicipioOrm)
  @JoinColumn([{ name: 'MUNICIPIO', referencedColumnName: 'id' }])
  municipio: MunicipioOrm;

  @Column({ name: 'MUNICIPIO' })
  municipioId: number;
}
