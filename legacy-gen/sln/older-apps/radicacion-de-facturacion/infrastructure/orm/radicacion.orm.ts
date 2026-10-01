import { Entity, Column, PrimaryColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  EstadoRadicacionCode,
  EstadoRadicacionType,
  estadoRadicacionTypeFactory,
} from '../../domain/types';
import { TerceroOrm } from './tercero.orm';
import { DetalleRadicacionOrm } from './detalle-radicacion.orm';
import { DocumentoOrm } from './documento.orm';

@Entity('CRNRADFACC')
export class RadicacionOrm {
  @PrimaryColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CRFESTADO' })
  estadoCode: EstadoRadicacionCode;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn({ name: 'GENTERCER' })
  tercero: TerceroOrm;

  @Column({ name: 'GENTERCER' })
  terceroId: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn({ name: 'OID' })
  documento: DocumentoOrm;

  @OneToMany(() => DetalleRadicacionOrm, item => item.radicacion)
  detalle: DetalleRadicacionOrm[];

  estado: EstadoRadicacionType;

  setTypes(removeTypeCodes?: boolean) {
    this.estado = estadoRadicacionTypeFactory(this.estadoCode);

    if (removeTypeCodes) {
      delete this.estadoCode;
    }
  }

  get originalColumnName() {
    return 'CRNRADFACC';
  }
}
