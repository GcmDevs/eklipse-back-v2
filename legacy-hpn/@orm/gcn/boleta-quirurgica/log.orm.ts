import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'GCMCIRDERINTRAHOSPLOG' })
export class BoletaQuirurgicaLogOrm {
  @Column({ name: 'FECHA', type: 'datetime' })
  fecha: Date;

  @Column({ name: 'USUARIO', type: 'nvarchar', length: 150 })
  usuario: string;

  @Column({ name: 'DETALLE', type: 'nvarchar', length: 150 })
  detalle: string;

  @Column({ name: 'MODULO', type: 'nvarchar', length: 80 })
  modulo: string;

  @PrimaryColumn({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @Column({ name: 'HOST', type: 'varchar', length: 150 })
  host: string;

  @Column({ name: 'IPHOST', type: 'varchar', nullable: true })
  direccionIp: string;
}
