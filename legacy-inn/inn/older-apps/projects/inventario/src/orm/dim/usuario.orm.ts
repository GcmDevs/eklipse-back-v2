import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { InnRolOrm } from './rol.orm';

@Entity('GENUSUARIO')
export class InnGenUsuarioOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => InnRolOrm, rol => rol.usuarios)
  @JoinColumn({ name: 'GENROL' })
  rol: InnRolOrm;

  @Column({ name: 'USUDESCRI' })
  nombreCompleto: string;

  @Column({ name: 'USUNOMBRE' })
  numeroDocumento: string;

  @Column({ name: 'USUESTADO' })
  status: number;

  centroId?: number;
}
