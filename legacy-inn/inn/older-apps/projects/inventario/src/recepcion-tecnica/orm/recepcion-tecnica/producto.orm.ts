import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { RecepcionTecnicaOrm } from './recepcion-tecnica.orm';
import { ProductoOrm } from '../inventario/producto.orm';
import {
  UnidadMedidaTemperaturaTypeCode,
  EstadoRegInvimaTypeCode,
  TipoProductoTypeCode,
  TipoRiesgoTypeCode,
  NivelInspeccionTypeCode,
  NivelInspeccionType,
  TipoRiesgoType,
  TipoProveedorTypeCode,
} from '@inn/old/inn/recepcion-tecnica/domain/types';
import { SugerenciaOSRD } from '../shared-db';
import { RecTecLoteOrm } from './lote.orm';

@Entity('GCMRECTECPROD')
export class RecTecProductoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GCMRECTEC' })
  recepcionTecnicaId: number;

  @Column({ name: 'TIPO' })
  tipo: TipoProductoTypeCode;

  @Column({ name: 'RIESGO' })
  riesgoId: TipoRiesgoTypeCode;

  @Column({ name: 'NIVELINSPECCION' })
  nivelInspeccionId: NivelInspeccionTypeCode;

  @Column({ name: 'TAMANIOMUESTRA' })
  tamanioMuestra: number;

  @Column({ name: 'CANTERRCRITICOS' })
  cantErroresCriticos: number;

  @Column({ name: 'CANTERRMAYORES' })
  cantErroresMayores: number;

  @Column({ name: 'CANTERRMENORES' })
  cantErroresMenores: number;

  @Column({ name: 'CUMPLERECTEC' })
  cumpleRecepcionTecnica: boolean;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'CONCENTRACION' })
  concentracion: number;

  @Column({ name: 'CONCENCUNIMED' })
  unidadMedidaConcentracionId: number;

  @Column({ name: 'LABORATORIO' })
  laboratorioId: number;

  @Column({ name: 'PRESENTACION' })
  presentacionId: number;

  @Column({ name: 'FORMAFARMAC' })
  formaFarmaceuticaId: number;

  @Column({ name: 'TEMPUNIMED' })
  unidadMedidaTemperaturaId: UnidadMedidaTemperaturaTypeCode;

  @Column({ name: 'TEMPERATURA' })
  temperatura: number;

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

  @Column({ name: 'CANTIDADRECIBIDA' })
  cantidadRecibida: number;

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;

  @Column({ name: 'VIDAUTIL' })
  vidaUtil: string;

  @Column({ name: 'NUMSERIE' })
  numSerie: string;

  @Column({ name: 'MARCA' })
  marca: string;

  @Column({ name: 'TIPOPROVEEDOR' })
  tipoProveedor: TipoProveedorTypeCode;

  @ManyToOne(() => RecepcionTecnicaOrm, recepcionTecnica => recepcionTecnica.productos)
  @JoinColumn({ name: 'GCMRECTEC' })
  recepcionTecnica: RecepcionTecnicaOrm;

  @OneToMany(() => RecTecLoteOrm, lotes => lotes.recTecProducto)
  lotes: RecTecLoteOrm[];

  laboratorio?: SugerenciaOSRD;
  unidadMedidaConcentracion?: SugerenciaOSRD;
  presentacion?: SugerenciaOSRD;
  formaFarmaceutica?: SugerenciaOSRD;
  nivelInspeccion?: NivelInspeccionType;
  riesgo?: TipoRiesgoType;
  tempLotes: RecTecLoteOrm[];
}
