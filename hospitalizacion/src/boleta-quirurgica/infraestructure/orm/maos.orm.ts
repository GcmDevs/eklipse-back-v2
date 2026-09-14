import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'GCMCIRDERINTRAHOSPGES' })
export class BoletaQuirurgicaMaosOrm {
  @PrimaryColumn({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @Column({ name: 'FECHA_ENTREGA', type: 'datetime', nullable: true })
  fechaEntrega: Date;

  @Column({ name: 'MAOS_SOLICITADO', type: 'nvarchar', length: 255, nullable: true })
  maosSolicitado: string;

  @Column({ name: 'CASA_COMERCIAL', type: 'nvarchar', length: 'MAX', nullable: true })
  casaComercial: string;

  @PrimaryColumn({ name: 'FOLIO', type: 'int' })
  folio: number;

  @Column({ name: 'ESTADO_MAOS', type: 'nvarchar', length: 250, nullable: true })
  estadoMaos: string;

  @Column({ name: 'estado2_MAOS', type: 'nvarchar', length: 50, nullable: true })
  estado2Maos: string;

  @Column({ name: 'EXISTENCIA', type: 'nvarchar', length: 250, nullable: true })
  existencia: string;
}
