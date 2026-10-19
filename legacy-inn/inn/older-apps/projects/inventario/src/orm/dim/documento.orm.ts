import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { InnGenUsuarioOrm } from './usuario.orm';

@Entity('INNDOCUME')
export class InnDocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IDCONSEC', length: 14 })
  consecutivo: string;

  @Column({ name: 'IDFECDOC' })
  fecha: Date;

  @Column({ name: 'IDTIPDOC' })
  tipo: number;

  @Column({ name: 'IDESTADO' })
  estado: number;

  @Column({ name: 'GENUSUARIO2' })
  creadoPorId: number;

  @ManyToOne(() => InnGenUsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO2', referencedColumnName: 'id' }])
  creadoPor: InnGenUsuarioOrm;

  @Column({ name: 'IDFECCRE' })
  fechaCreacion: Date;

  @ManyToOne(() => InnGenUsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO3', referencedColumnName: 'id' }])
  confirmadoPor: InnGenUsuarioOrm;

  @Column({ name: 'IDFECCON' })
  fechaConfirmacion: Date;

  @ManyToOne(() => InnGenUsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO4', referencedColumnName: 'id' }])
  anuladoPor: InnGenUsuarioOrm;

  @Column({ name: 'IDFECANU' })
  fechaAnulacion: Date;

  @Column({ name: 'OptimisticLockField' })
  OptimisticLockField: number;

  @Column({ name: 'ObjectType' })
  objectType: number;

  centroId: number;
}
