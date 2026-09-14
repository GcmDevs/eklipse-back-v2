import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'GCMCIRDERINTRAHOSP' })
export class BoletaQuirurgicaRegistroOrm {
  @PrimaryColumn({ name: 'INGRESO', type: 'int' })
  ingreso: number;

  @Column({ name: 'FOLIO', type: 'int' })
  folio: number;

  @Column({ name: 'ESTADO', type: 'nvarchar', length: 50 })
  estado: string;
}
