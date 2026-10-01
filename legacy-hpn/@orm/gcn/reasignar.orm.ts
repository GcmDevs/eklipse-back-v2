import { ViewEntity, ViewColumn, PrimaryGeneratedColumn } from 'typeorm';

@ViewEntity({ name: 'GCMHPNHISTOREASIGAREA' })
export class ReasignarOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ViewColumn({ name: 'GCMHPNGESTI' })
  gestionId: number;

  @ViewColumn({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ViewColumn({ name: 'AREASIGNADA' })
  ultimaArea: number;

  @ViewColumn({ name: 'OBSERVACION' })
  observacion: string;

  @ViewColumn({ name: 'FECHREASIG' })
  createdAt: Date;
}
