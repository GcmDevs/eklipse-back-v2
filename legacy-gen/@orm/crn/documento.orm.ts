import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TipoDocumentoCode } from '@ctypes/crn';
import { TABLE_NAMES } from '@common/application/constants';
import { RadicacionOrm } from './rdc';
import { UsuarioOrm } from '@orm/gen';

@Entity(TABLE_NAMES.crn.documentos)
export class DocumentoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CDTIPDOC' })
  tipoCode: TipoDocumentoCode;

  @Column({ name: 'CDCONSEC' })
  consecutivo: string;

  @Column({ name: 'CDFECDOC' })
  fecha: Date;

  @ManyToOne(() => RadicacionOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  radicacion: RadicacionOrm;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}1`, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}1` })
  creadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}2`, referencedColumnName: 'id' }])
  confirmadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}2` })
  confirmadoPorId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}3`, referencedColumnName: 'id' }])
  anuladoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}3` })
  anuladoPorId: number;

  @Column({ name: 'CDFECCRE' })
  fechaCreacion: Date;

  @Column({ name: 'CDFECCON' })
  fechaConfirmacion: Date;

  @Column({ name: 'CDFECANU' })
  fechaAnulacion: Date;
}
