import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoDocumentoCode, TipoDocumentoCode } from '@inn/lgc/ctc/types/inn/documentos';
import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@inn/lgc/ctc/orm/gen';

@Entity(TABLE_NAMES.inn.dcm.documentos)
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

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}2`, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}2` })
  creadoPorId: number;

  @Column({ name: 'IDFECCRE' })
  fechaCreacion: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}3`, referencedColumnName: 'id' }])
  confirmadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}3` })
  confirmadoPorId: number;

  @Column({ name: 'IDFECCON' })
  fechaConfirmacion: Date;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}4` })
  anuladoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}4`, referencedColumnName: 'id' }])
  anuladoPor: UsuarioOrm;

  @Column({ name: 'IDFECANU' })
  fechaAnulacion: Date;

  @Column({ name: 'OptimisticLockField' })
  optimisticLockField: number;

  @Column({ name: 'ObjectType' })
  objectType: number;

  @Column({ name: 'CTNCOMCONC' })
  unknownValue: number;
}
