import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TipoEstanciaCode } from '@ctypes/hpn/estancias';
import { CamaOrm } from './camas/cama.orm';
import { IngresoOrm } from '@orm/adn';
import { UsuarioOrm } from '@orm/gen/usuarios';

@Entity('HPNESTANC')
export class EstanciaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'HPNDEFCAM' })
  CamaId: number;

  @ManyToOne(() => CamaOrm)
  @JoinColumn([{ name: 'HPNDEFCAM', referencedColumnName: 'id' }])
  cama: CamaOrm;

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
  isTrasladoAUrgencia: boolean;

  @Column({ name: 'ADNINGRES' })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRES', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;
}
