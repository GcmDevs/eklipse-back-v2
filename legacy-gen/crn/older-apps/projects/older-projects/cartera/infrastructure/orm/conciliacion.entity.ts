import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'GCMCONCCART' })
export class ConciliacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID', type: 'integer' })
  id: number;

  /** Codigo acta de conciliación. */
  @Column({ name: 'NACTACONCI', /*type: 'varchar',*/ default: '000', length: 20 })
  actaConciliacion?: string;

  @Column({ name: 'GCMGESCART', type: 'integer' })
  gestionId: number;

  @Column({ name: 'FECHACONC', type: 'datetime' })
  fechaConciliacion: Date;

  @Column({ name: 'VALCONCI', type: 'decimal', default: 0 })
  valorConciliado?: number;

  /** Valor reconocido para pagos. */
  @Column({ name: 'VALRECPAG', type: 'decimal', default: 0 })
  valorReconocidoPagos?: number;

  @Column({ name: 'VALGLOSAD', type: 'decimal', default: 0 })
  valorGlosado?: number;

  @Column({ name: 'VALDEVUEL', type: 'decimal', default: 0 })
  valorDevuelto?: number;

  @Column({ name: 'VALNORADI', type: 'decimal', default: 0 })
  valorNoRadicado!: number;

  @Column({ name: 'AUDITORIA', type: 'decimal', default: 0 })
  valorEnAuditoria!: number;

  @Column({ name: 'RETENCION', type: 'decimal', default: 0 })
  valorEnRetencion!: number;

  /** Valor Glosas Aceptadas por IPS. */
  @Column({ name: 'GLOSACEPTIPS', type: 'decimal', default: 0 })
  valorGlosasIps?: number;

  /** Valor no Descontado por EPS. */
  @Column({ name: 'NOTNODESCEPS', type: 'decimal', default: 0 })
  valorNoDescontadoEps?: number;

  /** Valor Pagos no Aplicados. */
  @Column({ name: 'PAGNOAPLI', type: 'decimal', default: 0 })
  valorPagoNoAplicado?: number;

  @Column({ name: 'COPCUOMODE', type: 'decimal', default: 0 })
  valorCuotaModeradora?: number;

  @Column({ name: 'VALCANCEL', type: 'decimal', default: 0 })
  valorCancelado?: number;

  @Column({ name: 'TOTAL', type: 'decimal', default: 0 })
  valorTotal!: number;

  @Column({ name: 'DIFEREN', type: 'decimal', default: 0 })
  valorDiferencia!: number;

  @Column({ name: 'RUTARCHI', /* type: 'varchar', */ default: null, length: 50 })
  rutaComprobanteConciliacion!: string;

  @Column({ name: 'ESTADO', /* type: 'varchar', */ default: 'PENDIENTE', length: 15 })
  estado?: string;
}
