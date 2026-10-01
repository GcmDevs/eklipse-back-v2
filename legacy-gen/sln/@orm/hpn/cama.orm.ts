import { EstadoCamaCode, EstadoCamaType, estadoCamaTypeFactory } from '@sln/c-types/hpn';
import { CentroOrm, IngresoOrm } from '@sln/orm/adn';
import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { SubgrupoOrm } from './cama-subgrupo.orm';

@Entity('HPNDEFCAM')
export class CamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCACODIGO' })
  codigo: string;

  @Column({ name: 'HCANOMBRE' })
  nombre: string;

  @ManyToOne(() => CentroOrm)
  @JoinColumn({ name: 'ADNCENATE', referencedColumnName: 'id' })
  centro: CentroOrm;

  @Column({ name: 'ADNCENATE' })
  centroId: string;

  @Column({ name: 'HCAESTADO' })
  estadoCode: EstadoCamaCode;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @ManyToOne(() => SubgrupoOrm)
  @JoinColumn({ name: 'HPNSUBGRU', referencedColumnName: 'id' })
  subgrupo: SubgrupoOrm;

  @Column({ name: 'HPNSUBGRU' })
  subGrupoId: number;

  estado: EstadoCamaType;

  setTypes(removeTypeCodes?: boolean) {
    this.estado = estadoCamaTypeFactory(this.estadoCode);

    if (removeTypeCodes) {
      delete this.estadoCode;
    }
  }

  get originalColumnName() {
    return 'HPNDEFCAM';
  }
}
