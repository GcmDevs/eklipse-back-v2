import { TABLE_NAMES } from '@common/application/constants';
import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@inn/orm/gen';
import { CanalRegistro } from '@inn/operaciones/tanqueos/domain/enums';
import { EstadoIntentoTanqueo } from '@inn/operaciones/tanqueos/domain/enums/estados.enum';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TanqueoOrm } from './tanqueo.orm';

@Entity({ name: TABLE_NAMES.inn.ges_tanqueos.tanqueo_intentos })
export class TanqueoIntentoOrm extends BaseCreatedOrm {
  @Column({ name: 'CLIENTEUUID', type: 'nvarchar', length: 36, nullable: true })
  clienteUuid?: string;

  @Column({ name: 'IDEMPOTENCYKEY', type: 'nvarchar', length: 100, nullable: true })
  idempotencyKey?: string;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'DISPOSITIVOID', type: 'nvarchar', length: 100, nullable: true })
  dispositivoId?: string;

  @Column({ name: 'CANALREGISTRO', type: 'nvarchar', length: 10, nullable: true })
  canalRegistro?: CanalRegistro;

  @Column({ name: 'OPERACION', type: 'nvarchar', length: 50 })
  operacion: string;

  @Column({ name: 'PAYLOAD', type: 'nvarchar', length: 'MAX' })
  payload: string;

  @Column({ name: 'ERRORCODIGO', type: 'nvarchar', length: 50, nullable: true })
  errorCodigo?: string;

  @Column({ name: 'ERRORMENSAJE', type: 'nvarchar', length: 'MAX', nullable: true })
  errorMensaje?: string;

  @Column({
    name: 'ESTADO',
    type: 'nvarchar',
    length: 12,
    default: EstadoIntentoTanqueo.PENDIENTE,
  })
  estado: EstadoIntentoTanqueo;

  @ManyToOne(() => TanqueoOrm, { nullable: true })
  @JoinColumn({ name: 'TANQUEOOID' })
  tanqueo?: TanqueoOrm;

  @ManyToOne(() => UsuarioOrm, { nullable: true })
  @JoinColumn({ name: 'RESUELTOPOROID' })
  resueltoPor?: UsuarioOrm;

  @Column({ name: 'FECHARESOLUCION', type: 'datetime2', nullable: true })
  fechaResolucion?: Date;

  @Column({ name: 'FECHAINTENTO', type: 'datetime2' })
  fechaIntento: Date;
}
