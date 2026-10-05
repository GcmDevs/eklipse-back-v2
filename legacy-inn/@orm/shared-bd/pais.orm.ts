import { BaseOrm } from '@common/infrastructure/orm';
import { Column, Entity } from 'typeorm';

@Entity({ name: 'GENPAISES' })
export class PaisOrm extends BaseOrm {
  @Column({ name: 'GPACODIGO', type: 'nvarchar', length: 10, nullable: true })
  codigo: string;

  @Column({ name: 'GPANOMBRE', type: 'nvarchar', length: 120, nullable: true })
  nombre: string;

  @Column({ name: 'GPACODNUM', type: 'nvarchar', length: 10, nullable: true })
  codigoNumerico: string;

  @Column({ name: 'GPACODIDIO', type: 'nvarchar', length: 3, nullable: true })
  codigoIdioma: string;

  @Column({ name: 'GPANOMIDIO', type: 'nvarchar', length: 120, nullable: true })
  idioma: string;

  @Column({ name: 'GPACODIGOALFA', type: 'nvarchar', length: 10, nullable: true })
  codigoAlpha: string;
}
