import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_NAMES } from '@common/application/constants';
import { DocumentoOrm } from '../documento.orm';
import { TerceroOrm } from '@orm/gen';
import {
  EstadoRadicacionCode,
  EstadoRadicacionType,
  estadoRadicacionTypeFactory,
} from '@ctypes/crn/rdc';

@Entity(TABLE_NAMES.crn.rdc.radicaciones)
export class RadicacionOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @ManyToOne(() => DocumentoOrm)
  @JoinColumn([{ name: 'OID', referencedColumnName: 'id' }])
  documento: DocumentoOrm;

  @Column({ name: 'CRFESTADO' })
  estadoCode: EstadoRadicacionCode;

  @ManyToOne(() => TerceroOrm)
  @JoinColumn([{ name: TABLE_NAMES.gen.terceros, referencedColumnName: 'id' }])
  tercero: TerceroOrm;

  @Column({ name: TABLE_NAMES.gen.terceros })
  terceroId: number;

  /** @deprecated */
  estado: EstadoRadicacionType;

  setTypes(removeCodes = true) {
    this.estado = estadoRadicacionTypeFactory(this.estadoCode);

    if (removeCodes) {
      delete this.estadoCode;
    }
  }
}
