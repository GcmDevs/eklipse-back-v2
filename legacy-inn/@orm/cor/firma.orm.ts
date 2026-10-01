import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@orm/gen';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ArchivoAlmacenadoOrm } from './archivo-almacenado.orm';
import { TerceroOrm } from './tercero.orm';

export enum TipoFirmante {
  USUARIO = 'USUARIO',
  TERCERO = 'TERCERO',
}

@Entity({ name: TABLE_NAMES.cor.firmas })
@Index('UQ_EKCORFIRMAS_USUARIO', ['usuario'], { unique: true })
@Index('UQ_EKCORFIRMAS_TERCERO', ['tercero'], { unique: true })
export class FirmaOrm extends BaseCreatedOrm {
  @Column({ name: 'TIPOFIRMANTE', type: 'nvarchar', length: 10 })
  tipoFirmante: TipoFirmante;

  @Column({ name: 'NOMBREFIRMANTE', type: 'nvarchar', length: 55 })
  nombreFirmante: string;

  @ManyToOne(() => ArchivoAlmacenadoOrm, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'ARCHIVOFIRMAOID' })
  archivoFirma?: ArchivoAlmacenadoOrm;

  @ManyToOne(() => UsuarioOrm, { nullable: true })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario?: UsuarioOrm;

  @ManyToOne(() => TerceroOrm, { nullable: true })
  @JoinColumn({ name: 'TERCEROOID' })
  tercero?: TerceroOrm;

  @BeforeInsert()
  @BeforeUpdate()
  validate() {
    const tieneUsuario = !!this.usuario;
    const tieneTercero = !!this.tercero;

    if (tieneUsuario && tieneTercero) {
      throw new Error('Una firma no puede tener usuario y tercero al mismo tiempo');
    }
    if (!tieneUsuario && !tieneTercero) {
      throw new Error('Una firma debe tener al menos un firmante');
    }
    if (tieneUsuario) this.tipoFirmante = TipoFirmante.USUARIO;
    if (tieneTercero) this.tipoFirmante = TipoFirmante.TERCERO;
  }
}
