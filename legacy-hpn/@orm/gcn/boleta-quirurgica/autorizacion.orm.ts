import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'GCMCIRDERINTRAHOSPAUD' })
export class BoletaQuirurgicaAuditoriaOrm {
  @PrimaryColumn({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @Column({ name: 'FECHA_CAPTACION', type: 'datetime' })
  fechaCaptacion: Date;

  @Column({ name: 'MUNICIPIO', type: 'nvarchar', length: 150 })
  municipio: string;

  @Column({ name: 'TIPO', type: 'nvarchar', length: 100 })
  tipo: string;

  @Column({ name: 'AUTORIZADO', type: 'nvarchar', length: 20 })
  autorizado: string;

  @Column({ name: 'PENDIENTE1', type: 'nvarchar', length: 250, nullable: true })
  pendiente1: string;

  @Column({ name: 'PENDIENTE2', type: 'nvarchar', length: 250, nullable: true })
  pendiente2: string;

  @Column({ name: 'PENDIENTE3', type: 'nvarchar', length: 250, nullable: true })
  pendiente3: string;

  @Column({ name: 'PENDIENTE4', type: 'nvarchar', length: 250, nullable: true })
  pendiente4: string;

  @Column({ name: 'PENDIENTE5', type: 'nvarchar', length: 250, nullable: true })
  pendiente5: string;

  @Column({ name: 'PENDIENTE6', type: 'nvarchar', length: 250, nullable: true })
  pendiente6: string;

  @Column({ name: 'PENDIENTE7', type: 'nvarchar', length: 250, nullable: true })
  pendiente7: string;

  @Column({ name: 'SERVICIO', type: 'nvarchar', length: 250, nullable: true })
  servicio: string;

  @Column({ name: 'OBSERVACION', type: 'nvarchar', length: 'MAX', nullable: true })
  observacion: string;

  @Column({ name: 'FECHA_FIN', type: 'datetime', nullable: true })
  fechaFin: Date;

  @Column({ name: 'cambio_cups', type: 'nvarchar', length: 20, nullable: true })
  cambioCups: string;

  @Column({ name: 'usuario', type: 'nvarchar', length: 150, nullable: true })
  usuario: string;

  @PrimaryColumn({ name: 'folio', type: 'int' })
  folio: number;
}
