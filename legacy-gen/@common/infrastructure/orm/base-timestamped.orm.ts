import { Column } from 'typeorm';
import { BaseOrm } from './base.orm';

export abstract class BaseTimestampedOrm extends BaseOrm {
  @Column({ type: 'datetime2', name: 'CREATEDAT' })
  createdAt: Date;

  @Column({ type: 'datetime2', name: 'UPDATEDAT' })
  updatedAt: Date;
}

export abstract class BaseCreatedOrm extends BaseOrm {
  @Column({ type: 'datetime2', name: 'CREATEDAT' })
  createdAt: Date;
}
