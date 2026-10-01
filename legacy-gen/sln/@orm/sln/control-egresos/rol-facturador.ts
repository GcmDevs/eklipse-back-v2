import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity(TABLE_NAMES.sln.ctegr.rolFacturador)
export class RolFacturadorOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'NOMBRE' })
  nombre: string;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;
}
