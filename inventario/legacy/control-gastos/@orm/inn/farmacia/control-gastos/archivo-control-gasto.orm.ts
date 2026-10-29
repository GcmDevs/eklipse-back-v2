import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@inn/lgc/cgt/orm/gen/usuario.orm';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { ControlGastoOrm } from '@inn/lgc/cgt/orm/inn/farmacia/control-gastos/control-gasto.orm';
import { TipoDocumentoAdjuntoTypeCode } from '../../../../@types/inn/orden-despacho';
import { DocumentoOrm } from '@inn/lgc/cgt/orm/inn/documentos/documento.orm';

@Entity(TABLE_NAMES.inn.fmc.cgt.controlGastosArchivos)
export class ControlGastoArchivoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: TABLE_NAMES.inn.fmc.cgt.controlGastos })
  controlGastoId: number;

  @ManyToOne(() => ControlGastoOrm, cg => cg.archivos)
  @JoinColumn({ name: TABLE_NAMES.inn.fmc.cgt.controlGastos })
  controlGasto: ControlGastoOrm;

  @Column({ name: TABLE_NAMES.gen.usu.usuarios })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: TABLE_NAMES.gen.usu.usuarios })
  usuario: UsuarioOrm;

  @Column({ name: 'TIPODOCU' })
  tipoCode: TipoDocumentoAdjuntoTypeCode;

  @Column({ name: 'INNDOCUME' })
  documentoId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn({ name: 'INNDOCUME' })
  documento: DocumentoOrm;

  @Column({ name: 'UPDATEDAT' })
  updatedAt: Date;

  @Column({ name: 'RECHAZADOAT', nullable: true })
  rechazadoAt: Date;

  @Column({ name: 'MOTIVORECHAZO', length: 300, nullable: true })
  motivoRechazo: string;
}
