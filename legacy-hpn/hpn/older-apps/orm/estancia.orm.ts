import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CamaOrm } from './cama.orm';
import { CtmType } from '@common/domain/types';
import { IngresoOrm, UsuarioOrm } from './general';
import { TipoEstanciaCode, tipoEstanciaTypeFactory } from '../types';

@Entity('HPNESTANC')
export class EstanciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRES', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRES' })
  ingresoId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn([{ name: 'HPNDEFCAM', referencedColumnName: 'id' }])
  cama: CamaOrm;

  @Column({ name: 'HPNDEFCAM' })
  CamaId: number;

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

  setTypes(removeTypeCodes?: boolean) {
    this.tipoEstancia = tipoEstanciaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }

  get originalColumnName() {
    return 'HPNESTANC';
  }
}
