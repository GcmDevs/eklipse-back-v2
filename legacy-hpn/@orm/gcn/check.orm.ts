import { UbicacionPacienteTypeCode } from '@ctypes/gcn';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('GCMHPNCHECK')
export class CheckOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'UBICACION' })
  ubicacion: UbicacionPacienteTypeCode;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;
}
