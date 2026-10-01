import { Entity, Column, PrimaryColumn, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { DetalleRadicacionOrm } from './detalle-radicacion.orm';
import { TipoFacturaCode, TipoFacturaType, tipoFacturaTypeFactory } from '../../domain/types';
import { IngresoOrm } from './ingreso.orm';
import { DetalleContratoOrm } from './detalle-contrato.orm';

@Entity('SLNFACTUR')
export class FacturaOrm {
  @PrimaryColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'SFATIPDOC' })
  tipoCode: TipoFacturaCode;

  @Column({ name: 'SFANUMFAC' })
  codigo: string;

  @Column({ name: 'SFATOTFAC', type: 'money', precision: 4 })
  valorTotal: number;

  @OneToOne(() => DetalleRadicacionOrm, detalleRadicacion => detalleRadicacion.factura)
  detalleRadicacion: DetalleRadicacionOrm;

  @Column({ name: 'SFAFECFAC' })
  fechaCreacion: Date;

  @Column({ name: 'SFAFECVEN' })
  fechaVencimiento: Date;

  @Column({ name: 'SFAFECANU' })
  fechaAnulacion: Date;

  @Column({ name: 'SFADOCANU' })
  isAnulado: boolean;

  @ManyToOne(() => DetalleContratoOrm)
  @JoinColumn({ name: 'GENDETCON' })
  detalleContrato: DetalleContratoOrm;

  @Column({ name: 'GENDETCON' })
  detalleContratoId: number;

  @ManyToOne(() => IngresoOrm)
  @JoinColumn({ name: 'ADNINGRESO' })
  ingreso: IngresoOrm;

  @Column({ name: 'ADNINGRESO' })
  ingresoId: number;

  tipo: TipoFacturaType;

  setTypes(removeTypeCodes?: boolean) {
    this.tipo = tipoFacturaTypeFactory(this.tipoCode);

    if (removeTypeCodes) {
      delete this.tipoCode;
    }
  }

  get originalColumnName() {
    return 'SLNFACTUR';
  }
}
