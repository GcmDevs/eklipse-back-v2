import { TABLE_NAMES } from '@common/application/constants';
import { BaseOrm } from '@common/infrastructure/orm';
import { PaisOrm } from '@orm/shared-bd';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { TerceroRolOrm } from './rol-tercero.orm';

@Entity({ name: TABLE_NAMES.cor.terceros })
export class TerceroOrm extends BaseOrm {
  @Column({ name: 'NOMBRE', type: 'nvarchar', length: 50 })
  nombre: string;

  @Column({ name: 'IDENTIFICACION', type: 'nvarchar', length: 15, nullable: true })
  identificacion?: string;

  @Column({ name: 'CORREO', type: 'nvarchar', length: 136, nullable: true })
  correo?: string;

  @Column({ name: 'TELEFONO', type: 'nvarchar', length: 14, nullable: true })
  telefono?: string;

  @Column({ name: 'DIRECCION', type: 'nvarchar', length: 60, nullable: true })
  direccion?: string;

  @ManyToOne(() => PaisOrm, { nullable: true })
  @JoinColumn({ name: 'PAISOID' })
  pais?: PaisOrm;

  @OneToMany(() => TerceroRolOrm, terceroRol => terceroRol.tercero, { cascade: true })
  roles: TerceroRolOrm[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeFields() {
    if (this.nombre) {
      this.nombre = this.nombre.trim().toUpperCase();
    }

    if (this.identificacion) {
      this.identificacion = this.identificacion.trim().toUpperCase();
    }

    if (this.direccion) {
      this.direccion = this.direccion.trim().toUpperCase();
    }

    if (this.correo) {
      this.correo = this.correo.trim().toLowerCase();
    }

    if (this.telefono) {
      this.telefono = this.telefono.trim();
    }
  }
}
