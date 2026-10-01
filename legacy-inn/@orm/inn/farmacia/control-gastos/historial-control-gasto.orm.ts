import { TABLE_NAMES } from '@common/application/constants';
import { UsuarioOrm } from '@orm/gen';
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { ControlGastoOrm } from './control-gasto.orm';
import { EstadoControlGastoCode } from '@ctypes/inn/farmacia/control-gastos';

@Entity(TABLE_NAMES.inn.fmc.cgt.controlGastosHistorial)
export class ControlGastoHistorialOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => ControlGastoOrm, cg => cg.historial)
  @JoinColumn({ name: 'CONTROL_GASTO_ID' })
  controlGasto: ControlGastoOrm;

  @Column({ name: 'CONTROL_GASTO_ID' })
  controlGastoId: number;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoControlGastoCode;

  @Column({ name: 'FECHA_CAMBIO' })
  fechaCambio: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'USUARIO_ID' })
  usuario: UsuarioOrm;

  @Column({ name: 'USUARIO_ID' })
  usuarioId: number;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion?: string;

  @Column({ name: 'FACTURA_LINK', nullable: true })
  facturaLink?: string;

  @Column({ name: 'INTENTO', nullable: true })
  intento?: number;
}
