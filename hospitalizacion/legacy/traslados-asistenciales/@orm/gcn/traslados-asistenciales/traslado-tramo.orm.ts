import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TrasladoAsistencialOrm } from './traslado-asistencial.orm';
import { UbicacionOrm } from './ubicacion.orm';
import { TrasladoAsignacionOrm } from './traslado-asignacion.orm';
import { TrasladoSignosVitalesOrm } from './traslado-signos-vitales.orm';
import { TrasladoNotaOrm } from './nota.orm';
import { ProcedimientoOrm } from './procedimiento.orm';
import { MedicamentoOrm } from './medicamento.orm';
import { EntidadOrm } from '../entidad.orm';
import { TipoTrasladoItemTypeCode } from '@hpn/lgc/tas/types/gcn';

@Entity('EKHPNTRASLTRAMO')
export class TrasladoTramoOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'TRASLADO' })
  trasladoId: number;

  @ManyToOne(() => TrasladoAsistencialOrm, traslado => traslado.tramos)
  @JoinColumn([{ name: 'TRASLADO', referencedColumnName: 'id' }])
  traslado: TrasladoAsistencialOrm;

  @Column({ name: 'ORDEN' })
  orden: number;

  @Column({ name: 'TIPOTRAMO' })
  tipoTramoCode: number;

  @Column({ name: 'ORIGEN', nullable: true })
  origenId?: number;

  @ManyToOne(() => EntidadOrm)
  @JoinColumn([{ name: 'ORIGEN', referencedColumnName: 'id' }])
  origen?: EntidadOrm;

  @Column({ name: 'DESTINO', nullable: true })
  destinoId?: number;

  @ManyToOne(() => EntidadOrm)
  @JoinColumn([{ name: 'DESTINO', referencedColumnName: 'id' }])
  destino?: EntidadOrm;

  // TABLA DE EKLIPSE

  @Column({ name: 'EKORIGEN', nullable: true })
  ekOrigenId?: number;

  @ManyToOne(() => UbicacionOrm)
  @JoinColumn([{ name: 'EKORIGEN', referencedColumnName: 'id' }])
  ekOrigen?: UbicacionOrm;

  @Column({ name: 'EKDESTINO', nullable: true })
  ekDestinoId?: number;

  @ManyToOne(() => UbicacionOrm)
  @JoinColumn([{ name: 'EKDESTINO', referencedColumnName: 'id' }])
  ekDestino?: UbicacionOrm;

  @Column({ name: 'ESTADO', nullable: true })
  estadoCode?: number;

  /*   -----------------------------  */

  @Column({ name: 'HORASESPERA', nullable: true })
  horasEspera: number;

  @Column({ name: 'DESCRIPCIONESPERA', nullable: true })
  descripcionEspera: string;

  // datos ingreso a eps por urgencia

  @Column({ name: 'KMDESVIACION', nullable: true })
  kmDesviacion: number;

  @Column({ name: 'TIEMPOUTILIZADO', nullable: true })
  tiempoUtilizado: number;

  @Column({ name: 'CAUSADESVIACION', nullable: true })
  causaDesviacion?: string;

  @Column({ name: 'INGRESOIPS', nullable: true })
  ingresoIps: boolean;

  @Column({ name: 'IPS', nullable: true })
  nombreIps: string;

  /* _______ */

  @Column({ name: 'KMINICIAL', nullable: true })
  kmInicial: number;

  @Column({ name: 'KMFINAL', nullable: true })
  kmFinal: number;

  @Column({ name: 'RECIBIDOPORNOM', nullable: true })
  recibidoPorNombre?: string;

  @Column({ name: 'RECIBIDOPORDOC', nullable: true })
  recibidoPorDocumento?: string;

  @Column({ name: 'FIRMAIMG', nullable: true })
  firmaImg?: string;

  @Column({ name: 'TIPOTRASLADO' })
  tipoTrasladoCode: TipoTrasladoItemTypeCode;

  /* traslado primario */
  @Column({ name: 'HORAINICIORECORRIDO', type: 'timestamp', nullable: true })
  horaInicioRecorrido?: Date;

  @Column({ name: 'HORASOLICITUD', type: 'timestamp', nullable: true })
  horaSolicitud?: Date;

  @Column({ name: 'HORADESPACHO', type: 'timestamp', nullable: true })
  horaDespacho?: Date;

  @Column({ name: 'HORALLEGADAESCENA', type: 'timestamp', nullable: true })
  horaLlegadaEscena?: Date;

  @Column({ name: 'HORASALIDAESCENA', type: 'timestamp', nullable: true })
  horaSalidaEscena?: Date;

  @Column({ name: 'HORALLEGADAINST', type: 'timestamp', nullable: true })
  horaLlegadaInst?: Date;

  @Column({ name: 'HORARECEPCIONINST', type: 'timestamp', nullable: true })
  horaRecepcionInst?: Date;

  /*   @Column({ name: 'EVIDENCIAS', type: 'simple-json', nullable: true })
  archivos?: FilesTrasladoDataRes[]; */
  /*  */
  @Column({ name: 'ISACTIVO', nullable: true })
  isActivo?: boolean;

  @OneToMany(() => TrasladoAsignacionOrm, asignacion => asignacion.tramo)
  asignaciones: TrasladoAsignacionOrm[];

  @OneToMany(() => TrasladoSignosVitalesOrm, signos => signos.tramo)
  signosVitales: TrasladoSignosVitalesOrm[];

  @OneToMany(() => TrasladoNotaOrm, nota => nota.tramo)
  notas: TrasladoNotaOrm[];

  @OneToMany(() => ProcedimientoOrm, procedimiento => procedimiento.tramo)
  procedimientos: ProcedimientoOrm[];

  @OneToMany(() => MedicamentoOrm, medicamento => medicamento.tramo)
  medicamentos: MedicamentoOrm[];
}
