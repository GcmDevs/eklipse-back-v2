import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PacienteOrm } from '@inn/orm/gen';
import { EstanciaOrm } from '@inn/orm/hpn';
import { SolicitudOrm } from './solicitud.orm';

@Entity('EKINNCTMZPACEXT')
export class PacienteExternoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GENPACIEN', nullable: true })
  pacienteId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'HPNESTANC', nullable: true })
  estanciaId: number;

  @ManyToOne(() => EstanciaOrm)
  @JoinColumn([{ name: 'HPNESTANC', referencedColumnName: 'id' }])
  estancia: EstanciaOrm;

  @Column({ name: 'NOMCOM', length: 150, nullable: true })
  nombreCompleto: string;

  @Column({ name: 'NUMDOC', length: 15, nullable: true })
  numeroDocumento: string;

  @Column({ name: 'FECHNAC', type: 'date', nullable: true })
  fechaNacimiento: Date;

  @Column({ name: 'CAMA', length: 100, nullable: true })
  cama: string;

  @OneToMany(() => SolicitudOrm, (solicitud) => solicitud.pacienteExterno)
  solicitudes: SolicitudOrm[];
}
