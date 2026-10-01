import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TerceroOrm } from './tercero.orm';

export enum RolTercero {
  CLIENTE = 'CLIENTE',
  PROVEEDOR = 'PROVEEDOR',
  FABRICANTE = 'FABRICANTE',
  DISTRIBUIDOR = 'DISTRIBUIDOR',
  TECNICO = 'TECNICO',
  TRANSPORTISTA = 'TRANSPORTISTA',
  ORGANIZACION = 'ORGANIZACION',
  EMPLEADO = 'EMPLEADO',
}

@Entity({ name: TABLE_NAMES.cor.roles_terceros })
export class TerceroRolOrm extends BaseOrm {
  @ManyToOne(() => TerceroOrm, tercero => tercero.roles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'TERCEROOID' })
  tercero: TerceroOrm;

  @Column({
    name: 'ROL',
    type: 'varchar',
    length: 30,
  })
  rol: RolTercero;
}
