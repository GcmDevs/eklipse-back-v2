import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UsuarioOrm } from '@inn/orm/gen';
import { EstadoDocumentoCode, TipoDocumentoCode } from '@inn/types/inn/documentos';

@Entity('INNDOCUME')
export class DocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'IDTIPDOC' })
  tipoCode: TipoDocumentoCode;

  @Column({ name: 'IDESTADO' })
  estadoCode: EstadoDocumentoCode;

  @Column({ name: 'IDCONSEC' })
  consecutivo: string;

  @Column({ name: 'IDFECDOC' })
  fecha: Date;

  @Column({ name: `GENUSUARIO2` })
  creadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `GENUSUARIO2`, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: `GENUSUARIO3` })
  confirmadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `GENUSUARIO3`, referencedColumnName: 'id' }])
  confirmadoPor: UsuarioOrm;

  @Column({ name: `GENUSUARIO4` })
  anuladoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `GENUSUARIO4`, referencedColumnName: 'id' }])
  anuladoPor: UsuarioOrm;

  @Column({ name: 'IDFECCRE' })
  fechaCreacion: Date;

  @Column({ name: 'IDFECCON' })
  fechaConfirmacion: Date;

  @Column({ name: 'IDFECANU' })
  fechaAnulacion: Date;

  @Column({ name: 'OptimisticLockField' })
  optimisticLockField: number;

  @Column({ name: 'ObjectType' })
  objectType: number;

  @Column({ name: 'CTNCOMCONC' })
  unknownValue: number;
}
