import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('EKPOLMUN')
export class PollaMundialistaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADIO' })
  estadio: string;

  @Column({ name: 'PAIS' })
  pais: string;

  @Column({ name: 'FASE' })
  fase: string;

  @Column({ name: 'LOCALNOM' })
  localNombre: string;

  @Column({ name: 'VISITANOM' })
  visitanteNombre: string;

  @Column({ name: 'FECHA' })
  fecha: Date;

  @Column({ name: 'LOCALMARC' })
  localMarcador: number;

  @Column({ name: 'VISITAMARC' })
  visitanteMarcador: number;

  @Column({ name: 'ISCERRADO' })
  isCerrado: boolean;
}
