import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CamaOrm } from './cama.orm';
import { CtmType } from '@common/domain/types';
import { IngresoOrm, UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { TipoEstanciaCode, tipoEstanciaTypeFactory } from '@hpn/lgc/tas/types/temp';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.hpn.estancias.index)
export class EstanciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRES', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRES' })
  ingresoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.usu.usuarios, referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn([{ name: 'HPNDEFCAM', referencedColumnName: 'id' }])
  cama: CamaOrm;

  @Column({ name: 'HPNDEFCAM' })
  camaId: number;

  @Column({ name: 'HESFECING' })
  fechaIngreso: Date;

  @Column({ name: 'HESFECSAL' })
  fechaEgreso: Date;

  @Column({ name: 'HESTIPOES' })
  tipoCode: TipoEstanciaCode;

  @Column({ name: 'HESCANEST' })
  dias: number;

  @Column({ name: 'HESVALEST' })
  Valor: number;

  @Column({ name: 'HESTRAURG' })
  esTrasladoAUrgencia: boolean;

  tipoEstancia: CtmType<TipoEstanciaCode>;

  isEgresado = false;
  isAnulado = false;

  setTypes(removeTypeCodes?: boolean) {
    this.tipoEstancia = tipoEstanciaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
