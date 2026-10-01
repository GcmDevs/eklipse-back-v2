import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { JornadaCode, TransactionDietaTypeCode } from '@hpn/ori/die/domain/types/local';

/** Manager de transacciones en pedidos de dietas. */
@Entity('PDYDIETRANST')
export class TransactionDietaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TIPO' })
  tipo: TransactionDietaTypeCode;

  @Column({ name: 'JORNADA' })
  jornada: JornadaCode;

  @Column({ name: 'HPNSUBGRU' })
  subgrupoId?: number;

  @Column({ name: 'HPNESTANC' })
  estanciaId?: number;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @Column({ name: 'CREATEDAT' })
  createdAt: Date;

  @Column({ name: 'SUCCESS' })
  success: boolean;

  @Column({ name: 'DETERROR' })
  detalleError?: string;
}
