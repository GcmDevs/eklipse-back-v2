import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { RecepcionTecnicaOrm } from './recepcion-tecnica.orm';
import { EstadoRegInvimaTypeCode, UnidadMedidaTemperaturaTypeCode } from './types';
import { ProductoOrm } from '@sln/old/orm/dim/inventario';
import { RecTecSugerenciaOrm } from './sugerencia.orm';

@Entity('GCMRECTECPROD')
export class RecTecProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GCMRECTEC' })
  recepcionTecnicaId: number;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'CONCENTRACION' })
  concentracion: number;

  @Column({ name: 'CONCENCUNIMED' })
  unidadMedidaConcentracion: number;

  @ManyToOne(() => RecTecSugerenciaOrm)
  @JoinColumn([{ name: 'CONCENCUNIMED', referencedColumnName: 'id' }])
  unidadMedidaIJ: RecTecSugerenciaOrm;

  @Column({ name: 'PRESENTACION' })
  presentacion: number;

  @ManyToOne(() => RecTecSugerenciaOrm)
  @JoinColumn([{ name: 'PRESENTACION', referencedColumnName: 'id' }])
  presentacionIJ: RecTecSugerenciaOrm;

  @Column({ name: 'FORMAFARMAC' })
  formaFarmaceutica: number;

  @ManyToOne(() => RecTecSugerenciaOrm)
  @JoinColumn([{ name: 'FORMAFARMAC', referencedColumnName: 'id' }])
  formaFarmaceuticaIJ: RecTecSugerenciaOrm;

  @Column({ name: 'TEMPERATURA' })
  temperatura: number;

  @Column({ name: 'TEMPUNIMED' })
  unidadMedidaTemperatura: UnidadMedidaTemperaturaTypeCode;

  @Column({ name: 'LABORATORIO' })
  laboratorio: number;

  @ManyToOne(() => RecTecSugerenciaOrm)
  @JoinColumn([{ name: 'LABORATORIO', referencedColumnName: 'id' }])
  laboratorioIJ: RecTecSugerenciaOrm;

  @Column({ name: 'REGISTROINVIMA', length: 100 })
  registroInvima: string;

  @Column({ name: 'REGISTRINVIMEST' })
  estadoRegistroInvima: EstadoRegInvimaTypeCode;

  @Column({ name: 'CUM', length: 50 })
  cum: string;

  @Column({ name: 'ESTADO' })
  estado: number;

  @Column({ name: 'VENCIMIENTO' })
  fechaVencimiento: Date;

  @Column({ name: 'LOTE' })
  lote: string;

  @Column({ name: 'CANTIDAD' })
  cantidad: number;

  @ManyToOne(() => RecepcionTecnicaOrm, recepcionTecnica => recepcionTecnica.productos)
  @JoinColumn({ name: 'GCMRECTEC' })
  recepcionTecnica: RecepcionTecnicaOrm;
}
