import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { AgrupadorOrm } from './agrupador.orm';
import { AgrupadorServicioIpsOrm } from './agrupador-servicio.orm';

@Entity('GENSERIPS')
export class ServicioIpsOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SIPCODIGO' })
  codigo: string;

  @Column({ name: 'SIPNOMBRE' })
  nombre: string;

  @ManyToMany(() => AgrupadorOrm, agrupador => agrupador.servicios)
  @JoinTable({
    name: 'EKSLNAGRUSERVTIP',
    joinColumn: {
      name: 'GENSERIPS',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'EKSLNAGRUPD',
      referencedColumnName: 'id',
    },
  })
  agrupadores: AgrupadorOrm[];

  @OneToMany(() => AgrupadorServicioIpsOrm, agruServ => agruServ.servicio)
  agrupadoresComplementados: AgrupadorServicioIpsOrm[];

  cantidad: number;
  valorProducto: number;
  valorEntidad: number;
  valorPaciente: number;
  valorTotal: number;

  nombreAgrupador: string;
  pesoAgrupador: number;
  idAgrupador: number;
}
