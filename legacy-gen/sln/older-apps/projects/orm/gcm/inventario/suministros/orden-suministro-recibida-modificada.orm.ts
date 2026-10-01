import { ViewEntity, ViewColumn, PrimaryGeneratedColumn } from 'typeorm';

@ViewEntity({ name: 'GCMINNSUMRECMODIF' })
export class OrdenSuministroRecibidaModificadaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ViewColumn({ name: 'GENUSUARIO' })
  usuario: number;

  @ViewColumn({ name: 'INNCSUMPA' })
  ordenSuministros: number;

  @ViewColumn({ name: 'CREATEDAT' })
  createdAt: Date;
}
