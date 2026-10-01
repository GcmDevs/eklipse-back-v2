import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { TABLE_NAMES } from '@common/application/constants';
import { EstadoControlGastoCode } from '@ctypes/inn/farmacia/control-gastos';
import { UsuarioOrm } from '@orm/gen';
import { LegalizacionFacturaOrm } from './legalizacion-factura.orm';
import { CentroOrm } from '@orm/adn';

@Entity(TABLE_NAMES.inn.fmc.ldf.legalizacionFacturasHistorial)
export class LegalizacionFacturaHistorialOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => LegalizacionFacturaOrm, lf => lf.historial)
  @JoinColumn({ name: 'LEGALIZACIONFACTID' })
  legalizacionFact: LegalizacionFacturaOrm;

  @Column({ name: 'LEGALIZACIONFACTID' })
  legalizacionFactId: number;

  @Column({ name: 'SEDE' })
  sedeId: number;

  @ManyToOne(() => CentroOrm)
  @JoinColumn({ name: 'SEDE', referencedColumnName: 'id' })
  sede: CentroOrm;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoControlGastoCode;

  @Column({ name: 'FECHACAMBIO' })
  fechaCambio: Date;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn({ name: 'USUARIOID' })
  usuario: UsuarioOrm;

  @Column({ name: 'USUARIOID' })
  usuarioId: number;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion?: string;

  @Column({ name: 'FACTURALINK', nullable: true })
  facturaLink?: string;
}
