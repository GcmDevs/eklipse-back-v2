import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EstadoDocumentoCode } from '@inn/lgc/cgt/types/inn/documentos/estados-documento.type';
import { TipoDocumentoCode } from '@inn/lgc/cgt/types/inn/documentos/tipos.type';
import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@inn/lgc/cgt/orm/gen/usuario.orm';
import { ComprobanteEntradaOrm } from '@inn/lgc/cgt/orm/inn/documentos/comprobante-entrada.orm';
import { RemisionEntradaOrm } from '@inn/lgc/cgt/orm/inn/documentos/remision-entrada.orm';

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

  @ManyToOne(() => ComprobanteEntradaOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  comprobanteEntrada: ComprobanteEntradaOrm;

  @ManyToOne(() => RemisionEntradaOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  remisionEntrada: RemisionEntradaOrm;

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
