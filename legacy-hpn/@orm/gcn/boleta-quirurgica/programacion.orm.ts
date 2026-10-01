import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'GCMCIRDERINTRAHOSPPRO' })
export class BoletaQuirurgicaProgramacionOrm {
  @PrimaryColumn({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @Column({ name: 'FECHA_RECEPCION', type: 'datetime' })
  fechaRecepcion: Date;

  @Column({ name: 'FECHA_PROGRAMACION', type: 'datetime' })
  fechaProgramacion: Date;

  @Column({ name: 'PROGRAMADA', type: 'nvarchar', length: 50 })
  programada: string;

  @Column({ name: 'INSTITUCION', type: 'nvarchar', length: 150 })
  sede: string;

  @Column({ name: 'ESTADO', type: 'nvarchar', length: 50, nullable: true })
  estado: string;

  @Column({ name: 'REQ_MAOS', type: 'nvarchar', length: 20 })
  reqMaos: string;

  @Column({ name: 'OBSERVACION', type: 'nvarchar', length: 'MAX', nullable: true })
  observacion: string;

  @Column({ name: 'ESTADO_PROG', type: 'nvarchar', length: 20 })
  estadoProg: string;

  @PrimaryColumn({ name: 'FOLIO', type: 'int' })
  folio: number;
}
