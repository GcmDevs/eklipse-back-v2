import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'GCMCIRDERINTRAHOSPOBS' })
export class BoletaQuirurgicaObservacionOrm {
  @PrimaryColumn({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @PrimaryColumn({ name: 'FOLIO', type: 'int' })
  folio: number;

  @PrimaryColumn({ name: 'GESTOR', type: 'nvarchar', length: 50 })
  gestor: string; // <-- Ahora es parte de la llave, cambia por registro

  @PrimaryColumn({ name: 'FECHA_OBSERVACION', type: 'datetime' })
  fechaObservacion: Date; // <-- Ahora es parte de la llave, cambia por registro

  @Column({ name: 'OBSERVACION', type: 'nvarchar', length: 'MAX', nullable: true })
  observacion: string;

  @Column({ name: 'USUARIO', type: 'nvarchar', length: 250, nullable: true })
  usuario: string;
}
