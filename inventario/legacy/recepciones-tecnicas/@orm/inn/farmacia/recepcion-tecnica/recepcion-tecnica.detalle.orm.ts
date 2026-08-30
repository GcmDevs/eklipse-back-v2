import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { RecepcionTecnicaOrm } from './recepcion-tecnica.orm';
import { RTCLoteOrm } from './lote.orm';
import {
  EstadosEmbalajeCode,
  EstadosEmbalajeType,
  NivelInspeccionCode,
  NivelInspeccionType,
  TipoProductoCode,
  TipoProductoType,
  tipoProductoTypeFactory,
  TemperaturaCode,
  TemperaturaType,
  UMTemperaturaTypeFactory,
  estadosEmbalajeTypeFactory,
  nivelInspeccionTypeFactory,
} from '@inn/lgc/rct/types/inn/farmacia/recepcion-tecnica';
import { RTCSugerenciaOrm } from './sugerencia.orm';
import {
  RiesgoProductoCode,
  RiesgoProductoType,
  riesgoProductoTypeFactory,
} from '@inn/lgc/rct/types/inn/productos';
import { ProductoOrm } from '@inn/lgc/rct/orm/inn/productos';
import {
  DetalleComprobanteEntradaOrm,
  DetalleRemisionEntradaOrm,
} from '@inn/lgc/rct/orm/inn/documentos';
import { TABLE_NAMES } from '@common/application/constants';

@Entity(TABLE_NAMES.inn.fmc.rct.detalle)
export class DetalleRecepcionTecnicaOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'GCMRECTEC' })
  recepcionTecnicaId: number;

  @ManyToOne(() => RecepcionTecnicaOrm, recepcionTecnica => recepcionTecnica.detalle)
  @JoinColumn({ name: 'GCMRECTEC' })
  recepcionTecnica: RecepcionTecnicaOrm;

  @Column({ name: 'INNPRODUC' })
  productoId: number;

  @ManyToOne(() => ProductoOrm)
  @JoinColumn([{ name: 'INNPRODUC', referencedColumnName: 'id' }])
  producto: ProductoOrm;

  @Column({ name: 'INNMDETAL' })
  itemDetalleId: number;

  @ManyToOne(() => DetalleComprobanteEntradaOrm)
  @JoinColumn([{ name: 'INNMDETAL', referencedColumnName: 'id' }])
  itemDetalle: DetalleComprobanteEntradaOrm;

  @Column({ name: 'TEMPUNIMED' })
  UMTemperaturaCode: TemperaturaCode;

  @Column({ name: 'TIPO' })
  tipoProductoCode: TipoProductoCode;

  @Column({ name: 'RIESGO' })
  tipoRiesgoCode: RiesgoProductoCode;

  @Column({ name: 'NIVELINSPECCION' })
  nivelInspeccionCode: NivelInspeccionCode;

  @Column({ name: 'TAMANIOMUESTRA' })
  tamanioMuestra: number;

  @Column({ name: 'CANTERRCRITICOS' })
  cantErroresCriticos: number;

  @Column({ name: 'CUMPLERECTEC' })
  cumpleRecepcionTecnica: boolean;

  @Column({ name: 'VERIREGSANINVIMA' })
  verifiRegSanINVIMA: boolean;

  @Column({ name: 'REVIETIQUEPRODU' })
  reviEtiquetaProducto: boolean;

  @Column({ name: 'REVIORTOSELLO' })
  reviOrtografiaSellos: boolean;

  @Column({ name: 'CORRESFABRIEXPSAN' })
  correspFabriExpediSani: boolean;

  @Column({ name: 'CONCENTRACION' })
  concentracion: number;

  @Column({ name: 'TEMPERATURA' })
  temperatura: number;

  @Column({ name: 'CONCENCUNIMED' })
  UMConcentracionId: number;

  @Column({ name: 'LABORATORIO' })
  laboratorioId: number;

  @Column({ name: 'PRESENTACION' })
  presentacionId: number;

  @Column({ name: 'FORMAFARMAC' })
  formaFarmaceuticaId: number;

  @Column({ name: 'REGISTROINVIMA', length: 100 })
  registroInvima: string;

  @Column({ name: 'CUM', length: 50 })
  cum: string;

  @Column({ name: 'ESTADO' })
  estadoEmbalajeCode: EstadosEmbalajeCode;

  @Column({ name: 'VIDAUTILSUG' })
  vidaUtilId: number;

  @Column({ name: 'NUMSERIE' })
  numeroSerie: string;

  @Column({ name: 'MARCA' })
  marca: string;

  @Column({ name: 'OBSERVACION' })
  observacion: string;

  @OneToMany(() => RTCLoteOrm, lotes => lotes.RTCProducto)
  lotes: RTCLoteOrm[];

  @OneToOne(() => DetalleRemisionEntradaOrm, itemRemisionEntrada => itemRemisionEntrada.rctProducto)
  @JoinColumn([{ name: 'INNMDETAL', referencedColumnName: 'id' }])
  itemRemisionEntrada: DetalleRemisionEntradaOrm;

  UMConcentracion: RTCSugerenciaOrm;
  laboratorio: RTCSugerenciaOrm;
  presentacion: RTCSugerenciaOrm;
  formaFarmaceutica: RTCSugerenciaOrm;
  vidaUtil: RTCSugerenciaOrm;

  UMTemperatura: TemperaturaType;
  tipoProducto: TipoProductoType;
  tipoRiesgo: RiesgoProductoType;
  nivelInspeccion: NivelInspeccionType;
  estadoEmbalaje: EstadosEmbalajeType;

  tempLotes?: RTCLoteOrm[];

  setTypes(removeTypeCodes?: boolean) {
    this.UMTemperatura = UMTemperaturaTypeFactory(this.UMTemperaturaCode);
    this.tipoProducto = tipoProductoTypeFactory(this.tipoProductoCode);
    this.tipoRiesgo = riesgoProductoTypeFactory(this.tipoRiesgoCode);
    this.nivelInspeccion = nivelInspeccionTypeFactory(this.nivelInspeccionCode);
    this.estadoEmbalaje = estadosEmbalajeTypeFactory(this.estadoEmbalajeCode);

    if (removeTypeCodes) {
      delete this.UMTemperaturaCode;
      delete this.tipoProductoCode;
      delete this.tipoRiesgoCode;
      delete this.nivelInspeccionCode;
      delete this.estadoEmbalajeCode;
    }
  }

  @Column({ name: 'ISDELETED' })
  isDeleted: boolean;
}
