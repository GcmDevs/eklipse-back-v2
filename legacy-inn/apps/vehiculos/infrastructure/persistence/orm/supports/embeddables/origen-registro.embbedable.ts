import { Column } from 'typeorm';

export class OrigenRegistroEmbeddable {
  @Column({ name: 'CLIENTEUUID', type: 'nvarchar', length: 36 })
  clienteUuid: string;

  @Column({ name: 'CREADOOFFLINE', type: 'bit', default: false })
  creadoOffline: boolean;

  @Column({ name: 'FECHACREACIONLOCAL', type: 'datetime2', nullable: true })
  fechaCreacionLocal?: Date;

  @Column({ name: 'DISPOSITIVOID', type: 'nvarchar', length: 100, nullable: true })
  dispositivoId?: string;

  @Column({ name: 'FECHASINCRONIZACION', type: 'datetime2', nullable: true })
  fechaSincronizacion?: Date;
}
