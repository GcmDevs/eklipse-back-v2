import { ServicioIpsOrm } from '@sln/pfgp/infrastructure/orm';
import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('SLNSERHOJ')
export class HojaServicioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @OneToOne(() => ServicioIpsOrm)
  @JoinColumn({ name: 'GENSERIPS1' })
  servicioIps: ServicioIpsOrm;
}
