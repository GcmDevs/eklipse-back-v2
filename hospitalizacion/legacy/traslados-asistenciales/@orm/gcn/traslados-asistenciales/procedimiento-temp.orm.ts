import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'HPNTRASLPROC' })
export class ProcedimientoTempOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TIPO' })
  tipo: number;

  @Column({ name: 'CODIGO' })
  codigo: string;

  @Column({ name: 'NOMBRE' })
  nombre: string;
}
