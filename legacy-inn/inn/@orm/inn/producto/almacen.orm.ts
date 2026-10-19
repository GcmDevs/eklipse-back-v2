import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { EstanteAlmacenOrm } from './estante.orm';

@Entity('INNALMACE')
export class AlmacenProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IALCODIGO' })
  codigo: string;

  @Column({ name: 'IALNOMBRE' })
  nombre: string;

  @Column({ name: 'IALPREFIJ' })
  prefijo: string;

  @OneToMany(() => EstanteAlmacenOrm, estante => estante.almacen)
  estantes: EstanteAlmacenOrm[];

  setTypes(removeTypeCodes?: boolean) {
    //
  }
}
