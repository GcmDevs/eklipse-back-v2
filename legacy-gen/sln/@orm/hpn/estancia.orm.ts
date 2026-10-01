import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TipoEstanciaCode, TipoEstanciaType, tipoEstanciaTypeFactory } from '@sln/c-types/hpn';
import { IngresoOrm } from '@sln/orm/adn';
import { UsuarioOrm } from '@sln/orm/gen';
import { CamaOrm } from './cama.orm';

@Entity('HPNESTANC')
export class EstanciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => IngresoOrm, ingreso => ingreso.estancias)
  @JoinColumn({ name: 'ADNINGRES' })
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

  tipoEstancia: TipoEstanciaType;
  codigoCama: string;
  nombreSubgrupo: string;

  setTypes(removeTypeCodes?: boolean) {
    this.tipoEstancia = tipoEstanciaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }
}
