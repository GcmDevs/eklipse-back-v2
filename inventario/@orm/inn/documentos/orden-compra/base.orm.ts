import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DetalleOrdenCompraOrm } from './detalle.orm';

@Entity('INNCORDEN')
export class OrdenCompraOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'ICOCLADOC' })
  claseCode: number;

  @Column({ name: 'ICOESTPRO' })
  estadoCode: number;

  @Column({ name: 'GENPROVEE' })
  proveedorId: number;

  @Column({ name: 'ICOMONEDA' })
  tipoMonedaCode: number;

  @Column({ name: 'ICOTASACA', scale: 4 })
  tasaCambio: number;

  @Column({ name: 'ICODETALL' })
  ICODetalle: string;

  @Column({ name: 'ICOVALNEP', scale: 4 })
  valorNetoCOP: number;

  @Column({ name: 'ICOVALDEP', scale: 4 })
  valorDescuentoCOP: number;

  @Column({ name: 'ICOVALIMP', scale: 4 })
  valorImpuestosCOP: number;

  @Column({ name: 'ICOVALTOP', scale: 4 })
  valorTotalCOP: number;

  @Column({ name: 'ICOVALNEM', scale: 4 })
  valorNetoEXT: number;

  @Column({ name: 'ICOVALDEM', scale: 4 })
  valorDescuentoEXT: number;

  @Column({ name: 'ICOVALIMM', scale: 4 })
  valorImpuestosEXT: number;

  @Column({ name: 'ICOVALTOM', scale: 4 })
  valorTotalEXT: number;

  @Column({ name: 'ICOCONTRA' })
  contrato: string;

  @Column({ name: 'ICOFECENT' })
  fechaEntrega: Date;

  @Column({ name: 'INNALMACE' })
  almacenId: number;

  @Column({ name: 'ICOLUGENT' })
  lugarEntrega: string;

  @Column({ name: 'ICOORIORD' })
  origenCode: number;

  @Column({ name: 'ICORECHUM' })
  tipoServicioCode: number;

  @Column({ name: 'ICOFECCUM' })
  fechaCumplimiento: Date;

  @Column({ name: 'ICOMODALI' })
  modalidadCode: number;

  @Column({ name: 'TIPNEGCOJ' })
  tipoNegociacionCode: number;

  @Column({ name: 'ICFORPAG' })
  formaPago: string;

  @Column({ name: 'ICFORENTR' })
  formaEntrega: string;

  @Column({ name: 'ICPROCOMP' })
  procesoCompraCode: number;

  @Column({ name: 'ICEXCLU' })
  isExclusividad: boolean;

  @Column({ name: 'ICGARANT' })
  isGarantiaUnica: boolean;

  @Column({ name: 'CPNTIPCON' })
  tipoCPNContratoCode: number;

  @Column({ name: 'ICOTIPCON' })
  tipoICOContratoCode: number;

  @Column({ name: 'ICOAREDEP' })
  areaDependencia: number;

  @Column({ name: 'ICOTALHUM' })
  isForTalentoHumano: boolean;

  @Column({ name: 'ICOCONTHUM' })
  isConsecutivoTalentoHumano: boolean;

  @Column({ name: 'ICOADICION' })
  isAdicion: boolean;

  @Column({ name: 'ICOADINUM' })
  adicionNumero: string;

  @Column({ name: 'ICOLEGALIZADO' })
  isLegalizado: boolean;

  @Column({ name: 'ICODESDEPLN' })
  isDesdePlano: boolean;

  @OneToMany(() => DetalleOrdenCompraOrm, item => item.orden)
  detalle: DetalleOrdenCompraOrm[];
}
