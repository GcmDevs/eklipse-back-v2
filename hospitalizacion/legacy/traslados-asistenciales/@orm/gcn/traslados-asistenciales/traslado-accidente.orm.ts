import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { TrasladoVehiculoInvolucradoOrm } from './traslado-vehiculo-involucrado.orm';
import { AreaRecogidaTypeCode, ClimaTypeCode } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';

@Entity('EKHPNTRASLACCIDENTE')
export class TrasladoAccidenteOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @OneToOne(() => TrasladoAsistencialOrm, traslado => traslado.accidente)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'AREA', type: 'int', nullable: true })
  area?: AreaRecogidaTypeCode;

  @Column({ name: 'LATITUDORIGEN', type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitudOrigen?: number;

  @Column({ name: 'LONGITUDORIGEN', type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitudOrigen?: number;

  @Column({ name: 'BARRIOORIGEN', nullable: true })
  barrioOrigen?: string;

  @Column({ name: 'REFERENCIAORIGEN', nullable: true })
  referenciaOrigen?: string;

  @Column({ name: 'VEREDAORIGEN', nullable: true })
  veredaOrigen?: string;

  @Column({ name: 'VIAORIGEN', nullable: true })
  viaOrigen?: string;

  @Column({ name: 'KILOMETROORIGEN', nullable: true })
  kilometroOrigen?: string;

  @Column({ name: 'CODIGOCRUE', nullable: true })
  codigoCrue?: string;

  @Column({ name: 'ENTIDADDESPACHO', nullable: true })
  entidadDespacho?: string;

  @Column({ name: 'ESCENASEGURA', nullable: true })
  escenaSegura?: boolean;

  @Column({ name: 'CLIMA', type: 'int', nullable: true })
  clima?: ClimaTypeCode;

  @Column({ name: 'ESTADOVIA', nullable: true })
  estadoVia?: string;

  @Column({ name: 'SENALIZACION', nullable: true })
  senalizacion?: string;

  @Column({ name: 'MECANISMOCODE', nullable: true })
  mecanismoCode?: number;

  @Column({ name: 'QUEJAPRINCIPAL', nullable: true })
  quejaPrincipal?: string;

  @Column({ name: 'PERTENENCIASENTREGADAS', nullable: true })
  pertenenciasEntregadas?: boolean;

  @Column({ name: 'RELATO', type: 'nvarchar', length: 'MAX', nullable: true })
  relato?: string;

  @Column({ name: 'CUSTODIA', nullable: true })
  custodia?: boolean;

  @Column({ name: 'CONSENTIMIENTOOTORGADOPOR', nullable: true })
  consentimientoOtorgadoPor?: string;

  @Column({ name: 'FECHACREACION', nullable: true })
  fechaCreacion?: Date;

  @OneToMany(() => TrasladoVehiculoInvolucradoOrm, vehiculo => vehiculo.accidente)
  vehiculos: TrasladoVehiculoInvolucradoOrm[];
}
