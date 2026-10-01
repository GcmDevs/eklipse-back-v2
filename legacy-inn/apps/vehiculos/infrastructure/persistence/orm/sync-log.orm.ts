import { BaseCreatedOrm } from '@common/infrastructure/orm';
import { UsuarioOrm } from '@orm/gen';
import { ResultadoSync } from '@vehiculos/domain/enums';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity({ name: 'GCNSYNCLOGS' })
export class SyncLogOrm extends BaseCreatedOrm {
  @Column({ name: 'CLIENTEUUID', type: 'nvarchar', length: 36 })
  clienteUuid: string;

  @Column({ name: 'TANQUEOOID', type: 'int', nullable: true })
  tanqueoId?: number;

  @ManyToOne(() => UsuarioOrm, { nullable: false })
  @JoinColumn({ name: 'USUARIOOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'DISPOSITIVOID', type: 'nvarchar', length: 100 })
  dispositivoId: string;

  @Column({ name: 'OPERACION', type: 'nvarchar', length: 50, default: 'SINCRONIZAR_LOTE_TANQUEO' })
  operacion: string;

  @Column({ name: 'FECHAINTENTO', type: 'datetime2' })
  fechaIntento: Date;

  @Column({ name: 'RESULTADO', type: 'nvarchar', length: 20 })
  resultado: ResultadoSync;

  @Column({ name: 'DETALLE', type: 'nvarchar', length: 1000, nullable: true })
  detalle?: string;

  @Column({ name: 'ERRORMENSAJE', type: 'text', nullable: true })
  errorMensaje?: string;

  @Column({ name: 'DURACIONMS', type: 'int', nullable: true })
  duracionMs?: number;
}
