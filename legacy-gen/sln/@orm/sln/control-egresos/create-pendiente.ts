import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity(TABLE_NAMES.sln.ctegr.pendientes)
export class CreatePendienteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO' })
  estado: number;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'ADNINGRESO' })
  numero_ingreso: number;

  @Column({ name: 'MOTIVONOFACTURACION' })
  motivo_no_facturacion: number;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  @Column({ name: `CREADOPOR` })
  creadoPorId: number;
}
