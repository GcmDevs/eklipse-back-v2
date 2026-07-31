// detalle-muestra-cups.entity.ts

import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FormatoMuestraAnatomopatologicaOrm } from './formato-anatomopatologicos.orm';

@Entity({ name: 'formatomuestrasanatomopatologicascups' })
@Index('idxdetallemuestraregistro', ['registroId'])
@Index('idxdetallemuestracups', ['codigoCups'])
export class DetalleMuestraCupsOrm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'REGISTROID',
    type: 'integer',
  })
  registroId: number;

  @ManyToOne(() => FormatoMuestraAnatomopatologicaOrm, registro => registro.cups, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'registroid' })
  registro: FormatoMuestraAnatomopatologicaOrm;

  /**
   * Snapshot del catálogo CUPS al momento del registro.
   */
  @Column({
    name: 'CODIGOCUPS',
    type: 'varchar',
    length: 20,
  })
  codigoCups: string;

  @Column({
    name: 'DESCRIPCIONCUPS',
    type: 'varchar',
    length: 500,
  })
  descripcionCups: string;

  @Column({
    name: 'TIPOCUPS',
    type: 'varchar',
    length: 100,
  })
  tipoCups: string;

  @Column({
    name: 'CANTIDAD',
    type: 'integer',
  })
  cantidad: number;

  @Column({
    name: 'ESPECIMEN',
    type: 'varchar',
    length: 250,
  })
  especimen: string;

  @Column({
    name: 'SOSPECHOSO',
  })
  sospechoso: boolean;
}
