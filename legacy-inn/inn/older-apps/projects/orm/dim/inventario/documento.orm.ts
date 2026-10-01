import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrm } from '../general';

@Entity('INNDOCUME')
export class DocumentoOrm {
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

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO2', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'IDFECCRE' })
  fechaCreacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO3', referencedColumnName: 'id' }])
  confirmadoPor: UsuarioOrm;

  @Column({ name: 'IDFECCON' })
  fechaConfirmacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO4', referencedColumnName: 'id' }])
  anuladoPor: UsuarioOrm;

  @Column({ name: 'IDFECANU' })
  fechaAnulacion: Date;

  @Column({ name: 'OptimisticLockField' })
  OptimisticLockField: number;

  @Column({ name: 'ObjectType' })
  objectType: number;
}
