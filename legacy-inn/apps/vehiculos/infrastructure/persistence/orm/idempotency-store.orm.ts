import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'EKCORIDEMPOTENCIAS' })
export class IdempotencyStoreOrm {
  @PrimaryColumn({ name: 'LLAVE', type: 'nvarchar', length: 100 })
  idempotencyKey: string;

  @Column({ name: 'HASH', type: 'nvarchar', length: 64 })
  responseHash: string;

  @Column({ name: 'CUERPO', type: 'nvarchar', length: 'MAX' })
  responseBody: string;

  @Column({ name: 'CREATEDAT', type: 'datetime2' })
  createdAt: Date;

  @Column({ name: 'EXPIRESAT', type: 'datetime2' })
  expiresAt: Date;
}
