import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'GCMCIRDERINTRAHOSPGESTORQ' })
export class BoletaQuirurgicaGestorQxOrm {
  @PrimaryColumn({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @Column({ name: 'FECHA_RECEPCION', type: 'datetime' })
  fechaRecepcion: Date;

  @Column({ name: 'OTRAS_VALORACIONES', type: 'nvarchar', length: 255, nullable: true })
  otrasValoraciones: string;

  @Column({ name: 'OBSERVACION', type: 'nvarchar', length: 'MAX', nullable: true })
  observacion: string;

  @PrimaryColumn({ name: 'FOLIO', type: 'int' })
  folio: number;

  @Column({ name: 'estado_AUTORIZACION', type: 'nvarchar', length: 50 })
  estadoAutorizacion: string;
}
