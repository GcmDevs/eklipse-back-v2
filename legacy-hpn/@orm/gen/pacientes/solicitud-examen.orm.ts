import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ServicioIpsOrm } from './servicio-ips.orm';
import { IngresoOrm } from './ingreso.orm';
import { FolioOrm } from './folio.orm';

@Entity('HCNSOLEXA')
export class SolicitudExamenOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENSERIPS' })
  servicioIpsId: number;

  @Column({ name: 'HCSFECSOL' })
  fecha: Date;

  @ManyToOne(() => ServicioIpsOrm)
  @JoinColumn([{ name: 'GENSERIPS', referencedColumnName: 'id' }])
  servicioIps: ServicioIpsOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'HCNFOLIO' })
  folioId: number;

  @ManyToOne(() => FolioOrm)
  @JoinColumn([{ name: 'HCNFOLIO', referencedColumnName: 'id' }])
  folio: FolioOrm;

  @Column({ name: 'HCNRESEXA' })
  resultadoId: number;

  get originalColumnName() {
    return 'HCNSOLEXA';
  }
}
