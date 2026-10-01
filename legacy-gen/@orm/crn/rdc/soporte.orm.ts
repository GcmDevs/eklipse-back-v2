import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { FacturaOrm } from '@orm/sln';
import { UsuarioOrm } from '@orm/gen';

@Entity(TABLE_NAMES.crn.rdc.soportes)
export class SoporteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CONTEXTO' })
  contextKey: number;

  @ManyToOne(() => FacturaOrm, factura => factura.soportesRadicacion)
  @JoinColumn([{ name: TABLE_NAMES.sln.facturas, referencedColumnName: 'id' }])
  factura: FacturaOrm;

  @Column({ name: TABLE_NAMES.sln.facturas })
  facturaId: number;

  @Column({ name: 'SLNFACTURDOC' })
  facturaDocumento: string;

  @Column({ name: 'RADICACIODOC' })
  comprobanteDocumento: string;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUCREADO', referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: 'GENUSUCREADO' })
  creadoPorId: number;

  @Column({ name: 'ESTADO' })
  estadoCode: 1 | 2 | 3;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUVERIFICA', referencedColumnName: 'id' }])
  verificadoPor: UsuarioOrm;

  @Column({ name: 'GENUSUVERIFICA' })
  verificadoPorId: number;

  @Column({ name: 'FECHACREACION' })
  fechaCreacion: Date;

  @Column({ name: 'RECHAZOBSERVA' })
  observacionVerificacion: string;

  @Column({ name: 'ISRECHAZADO' })
  isRechazado: boolean;

  @Column({ name: 'FECHULTIMESTAD' })
  fechaUltimoCambioEstado: Date;
}
