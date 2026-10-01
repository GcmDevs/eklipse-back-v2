import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { DetalleContratoOrm } from './contrato-detalle.orm';
import { IngresoOrm } from '@sln/orm/adn';

@Entity('SLNFACTUR')
export class FacturaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SFATIPDOC' })
  tipoCode: number;

  @Column({ name: 'SFANUMFAC' })
  codigo: string;

  @Column({ name: 'SFAFECFAC' })
  createdAt: Date;

  @Column({ name: 'SFADOCANU' })
  isAnulado: boolean;

  @Column({ name: 'SFAVALCAR', scale: 4 })
  valorFacturado: number;

  @Column({ name: 'SFAVALREC', scale: 4 })
  valorRecuperado: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn([{ name: 'ADNINGRESO', referencedColumnName: 'id' }])
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn([{ name: 'GENDETCON', referencedColumnName: 'id' }])
  detalleContrato: DetalleContratoOrm;

  @Column({ name: 'GENDETCON' })
  detalleContratoId: number;

  idPaciente: number;
  nombrePaciente: string;

  codigoContrato: string;
  nombreContrato: string;
}
