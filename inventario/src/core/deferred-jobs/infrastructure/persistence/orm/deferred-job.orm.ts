import { DeferredJobRowStatus } from '@inn/core/deferred-jobs/domain';
import { BaseTimestampedOrm } from '@common/infrastructure/orm';
import { Column, Entity, Index, Unique, ValueTransformer } from 'typeorm';

const jsonTransformer: ValueTransformer = {
  to: (value: unknown) => (value === undefined ? null : JSON.stringify(value)),
  from: (value: string | null) => {
    if (value === null || value === undefined || value === '') return null;
    return JSON.parse(value);
  },
};

@Entity({ name: 'EKCORTRABAJODIF' })
@Unique('UQ_EKCORTRABAJODIF_KEY_JOB', ['jobId'])
@Index('IX_EKCORTRABAJODIF_DUE', ['scope', 'status', 'nextTryAt'])
export class DeferredJobOrm extends BaseTimestampedOrm {
  @Column({ name: 'KEY_JOB', type: 'varchar', length: 200 })
  jobId: string;

  @Column({ name: 'ESPACIO', type: 'varchar', length: 80 })
  namespace: string;

  @Column({ name: 'CONTEXTO', type: 'varchar', length: 40 })
  scope: string;

  @Column({ name: 'CLAVE', type: 'varchar', length: 120 })
  key: string;

  @Column({ name: 'EJECUTAEN', type: 'datetime2' })
  runAt: Date;

  @Column({ name: 'CUERPO', type: 'nvarchar', length: 'MAX', transformer: jsonTransformer })
  payload: unknown;

  @Column({ name: 'ESTADO', type: 'varchar', length: 20 })
  status: DeferredJobRowStatus;

  @Column({ name: 'INTENTOS', type: 'int' })
  attempts: number;

  @Column({ name: 'MAXINTENTOS', type: 'int' })
  maxAttempts: number;

  @Column({ name: 'ULTERROR', type: 'nvarchar', length: 500, nullable: true })
  lastError?: string;

  @Column({ name: 'PROXINTENTO', type: 'datetime2' })
  nextTryAt: Date;
}
