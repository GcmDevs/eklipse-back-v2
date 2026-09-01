import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { DireccionOrm } from './direccion.orm';
import { MunicipioOrm } from '@hpn/lgc/tas/orm/gen';

@Entity('GENTERCER')
export class TerceroOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DireccionOrm)
  @JoinColumn({ name: 'GENTERCERD' })
  direccion: DireccionOrm;

  @Column({ name: 'TERNUMDOC' })
  documento: number;

  @Column({ name: 'TERPRINOM' })
  nombre: number;

  @Column({ name: 'GENTERCERD' })
  direccionId: number;

  @ManyToOne(() => MunicipioOrm)
  @JoinColumn([{ name: 'DGNMUNICIPIO', referencedColumnName: 'id' }])
  municipio: MunicipioOrm;

  @Column({ name: 'DGNMUNICIPIO' })
  municipioId: number;
}
