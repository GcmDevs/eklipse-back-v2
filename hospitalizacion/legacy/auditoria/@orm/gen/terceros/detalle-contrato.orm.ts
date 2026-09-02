import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { ContratoOrm } from './contrato.orm';
import { MunicipioOrm } from '../ubicacion';

@Entity('GENDETCON')
export class DetalleContratoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GDECODIGO' })
  codigo: string;

  @Column({ name: 'GDENOMBRE' })
  nombre: string;

  @ManyToOne(() => ContratoOrm, contrato => contrato.detalles)
  @JoinColumn({ name: 'GENCONTRA1' })
  contrato: ContratoOrm;

  @ManyToOne(() => MunicipioOrm)
  @JoinColumn([{ name: 'GENMUNICI', referencedColumnName: 'id' }])
  municipio: MunicipioOrm;

  @Column({ name: 'GENCONTRA1' })
  contratoId: number;

  @Column({ name: 'GENMUNICI' })
  municipioId: number;

  nombreTipoContrato: 'CIA' | 'PGP' | 'EVENTO' = 'EVENTO';
}
