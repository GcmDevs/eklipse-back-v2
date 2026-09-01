import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity(TABLE_NAMES.hpn.trasladosAsistenciales.evolucion)
export class TrasladoEvolucionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'TIPO' })
  tipoCode: number;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion?: string;

  @Column({ name: 'FECHA', type: 'timestamp' })
  fecha: Date;
}
