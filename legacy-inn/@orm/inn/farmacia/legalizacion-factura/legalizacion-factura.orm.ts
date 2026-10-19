import { CentroOrm } from '@orm/adn';
import { PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, Entity } from 'typeorm';

import { TABLE_NAMES } from '@common/application/constants';
import { GcmContextType } from '@common/domain/types';
import { EstadoControlGastoCode } from '@ctypes/inn/farmacia/control-gastos';
import { UsuarioOrm } from '@orm/gen';
import { LegalizacionFacturaHistorialOrm } from './legalizacion-factura-historial.orm';

@Entity(TABLE_NAMES.inn.fmc.ldf.legalizacionFacturas)
export class LegalizacionFacturaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoControlGastoCode;

  @ManyToOne(() => CentroOrm)
  @JoinColumn([{ name: 'SEDE', referencedColumnName: 'id' }])
  sede: CentroOrm;

  @Column({ name: 'SEDE' })
  sedeId: number;

  @Column({ name: 'FECHACREAC' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAPROCE' })
  fechaProcedimiento: Date;

  @Column({ name: 'NUMEROFACTURA' })
  numeroFactura: string;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: `${TABLE_NAMES.gen.usu.usuarios}1`, referencedColumnName: 'id' }])
  creadoPor: UsuarioOrm;

  @Column({ name: `${TABLE_NAMES.gen.usu.usuarios}1` })
  creadoPorId: number;

  @Column({ name: 'DOCUJUNTOLINK' })
  documentoAdjuntoLink: string;

  @Column({ name: 'DOCUJUNRECH' })
  isDocumentoRechazado: boolean;

  @Column({ name: 'HASVISTO' })
  hasVisto: boolean;

  @Column({ name: 'FACTURA1LINK' })
  factura1Link: string;

  @Column({ name: 'FACTURA2LINK' })
  factura2Link: string;

  @Column({ name: 'FACTURA3LINK' })
  factura3Link: string;

  @Column({ name: 'FECHAULTIFACT' })
  fechaUltimaFactura: Date;

  @Column({ name: 'OBSERVACIONRECHAZO' })
  obervacionRechazo: string;

  @Column({ name: 'ISDELETE' })
  isDelete: boolean;

  @OneToMany(() => LegalizacionFacturaHistorialOrm, historial => historial.legalizacionFact)
  historial: LegalizacionFacturaHistorialOrm[];

  context: GcmContextType;
}
