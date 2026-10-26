import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAccidenteOrm } from './traslado-accidente.orm';
import { UsuarioOrm } from '../../gen';
import { TipoVehiculoInvolucradoTypeCode } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';

@Entity('EKHPNTRASLVEHINV')
export class TrasladoVehiculoInvolucradoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ACCIDENTE' })
  accidenteId: number;

  @ManyToOne(() => TrasladoAccidenteOrm, accidente => accidente.vehiculos)
  @JoinColumn([{ name: 'ACCIDENTE', referencedColumnName: 'id' }])
  accidente: TrasladoAccidenteOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm, usuario => usuario)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'FUGA', nullable: true })
  fuga?: boolean;

  @Column({ name: 'NOIDENTIFICADO', nullable: true })
  noIdentificado?: boolean;

  @Column({ name: 'PLACA', nullable: true })
  placa?: string;

  @Column({ name: 'TIPO', type: 'int', nullable: true })
  tipo?: TipoVehiculoInvolucradoTypeCode;

  @Column({ name: 'MARCA', nullable: true })
  marca?: string;

  @Column({ name: 'COLOR', nullable: true })
  color?: string;

  @Column({ name: 'CONDUCTOR', nullable: true })
  conductor?: string;

  @Column({ name: 'DOCUMENTO', nullable: true })
  documento?: string;

  @Column({ name: 'CELULAR', nullable: true })
  celular?: string;

  @Column({ name: 'DIRECCION', nullable: true })
  direccion?: string;

  @Column({ name: 'BARRIO', nullable: true })
  barrio?: string;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion?: Date;
}
