import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { GrupoOrm } from './grupo.orm';
import { SubgrupoOrm } from './subgrupo.orm';
import { TipoCamaOrm } from './tipo-cama.orm';
import { CtmType } from '@common/domain/types';
import { IngresoOrm } from '@hpn/lgc/aud/orm/gen';
import {
  ClasificacionCamaCode,
  clasificacionCamaTypeFactory,
  EstadoCamaCode,
  estadoCamaTypeFactory,
  MotivoBloqueoCode,
  motivoBloqueoTypeFactory,
} from '@hpn/lgc/aud/types/temp';
import { CentroOrm } from '@hpn/lgc/aud/orm/adn';
import { TABLE_NAMES } from '@common/application/constants';

@Entity('HPNDEFCAM')
export class CamaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HCACODIGO' })
  codigo: string;

  @Column({ name: 'HCANOMBRE' })
  nombre: string;

  @ManyToOne(() => TipoCamaOrm)
  @JoinColumn({ name: 'HPNTIPOCA', referencedColumnName: 'id' })
  tipo: TipoCamaOrm;

  @Column({ name: 'HPNTIPOCA' })
  tipoId: string;

  @ManyToOne(() => CentroOrm)
  @JoinColumn({ name: TABLE_NAMES.adn.centros, referencedColumnName: 'id' })
  centro: CentroOrm;

  @Column({ name: TABLE_NAMES.adn.centros })
  centroId: string;

  @Column({ name: 'HCAESTADO' })
  estadoCode: EstadoCamaCode;

  @Column({ name: 'HCAOBSHOS' })
  clasificacionCode: ClasificacionCamaCode;

  @Column({ name: 'HCABLOPOR' })
  motivoBloqueoCode: MotivoBloqueoCode;

  @ManyToOne(() => GrupoOrm)
  @JoinColumn({ name: 'HPNGRUPOS', referencedColumnName: 'id' })
  grupo: GrupoOrm;

  @Column({ name: 'HPNGRUPOS' })
  grupoId: number;

  @ManyToOne(() => SubgrupoOrm)
  @JoinColumn({ name: 'HPNSUBGRU', referencedColumnName: 'id' })
  subgrupo: SubgrupoOrm;

  @Column({ name: 'HPNSUBGRU' })
  subGrupoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  estado: CtmType<EstadoCamaCode>;
  motivoBloqueo: CtmType<MotivoBloqueoCode>;
  clasificacion: CtmType<ClasificacionCamaCode>;

  setTypes(removeTypeCodes?: boolean) {
    this.estado = estadoCamaTypeFactory(this.estadoCode);
    this.motivoBloqueo = motivoBloqueoTypeFactory(this.motivoBloqueoCode);
    this.clasificacion = clasificacionCamaTypeFactory(this.clasificacionCode);

    if (removeTypeCodes) {
      delete this.estadoCode;
      delete this.motivoBloqueoCode;
      delete this.clasificacionCode;
    }
  }
}
