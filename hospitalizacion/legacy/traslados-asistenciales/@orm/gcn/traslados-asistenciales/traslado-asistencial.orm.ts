import { TABLE_NAMES } from '@common/application/constants';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { PacienteOrm, UsuarioOrm } from '@hpn/lgc/tas/orm/gen';
import { TrasladoTramoOrm } from './traslado-tramo.orm';
import { TrasladoAsignacionOrm } from './traslado-asignacion.orm';
import { TrasladoEstadoHistorialOrm } from './traslado-estado-historial.orm';
import { TrasladoSignosVitalesOrm } from './traslado-signos-vitales.orm';
import { TrasladoNotaOrm } from './nota.orm';
import { ProcedimientoOrm } from './procedimiento.orm';
import { MedicamentoOrm } from './medicamento.orm';
import { TrasladoRevisionCentralOrm } from './traslado-revision-central.orm';
import {
  AsistenciaTipoCode,
  CodigoCupsTypeCode,
  EstadoPacienteCode,
  TipoRemisionTypeCode,
} from '@hpn/lgc/tas/types/gcn/traslados-asistenciales';
import { TipoTrasladoItemTypeCode, TipoTrasladoTypeCode } from '@hpn/lgc/tas/types/gcn';
import { EstadoAsistenciaTypeCode } from '@hpn/lgc/tas/types/gcn/traslados-asistenciales/estado-asistencia';
import { PacienteTrasladoOrm } from './paciente.orm';
import { DiagnosticoOrm } from '@hpn/lgc/tas/orm/temp';
import { ServicioOrm } from '../servicio-destino.orm';
import { GcmContextType } from '@common/domain/types';

@Entity(TABLE_NAMES.hpn.trasladosAsistenciales.index)
export class TrasladoAsistencialOrm {
  @PrimaryGeneratedColumn({ name: 'OID' })
  id: number;

  @Column({ name: 'CENTRO' })
  centroId: number;

  @Column({ name: 'GENPACIEN' })
  pacienteId: number;

  @ManyToOne(() => PacienteOrm)
  @JoinColumn([{ name: 'GENPACIEN', referencedColumnName: 'id' }])
  paciente: PacienteOrm;

  @Column({ name: 'EKPACIEN' })
  ekPacienteId: number;

  @ManyToOne(() => PacienteTrasladoOrm)
  @JoinColumn([{ name: 'EKPACIEN', referencedColumnName: 'id' }])
  ekPaciente: PacienteTrasladoOrm;

  @Column({ name: 'GENUSUARIO' })
  usuarioId: number;

  @ManyToOne(() => UsuarioOrm)
  @JoinColumn([{ name: 'GENUSUARIO', referencedColumnName: 'id' }])
  usuario: UsuarioOrm;

  @Column({ name: 'CUPS' })
  cupsCode: CodigoCupsTypeCode;

  @Column({ name: 'TIPO' })
  tipoCode: AsistenciaTipoCode;

  @Column({ name: 'ESTADO' })
  estadoCode: EstadoAsistenciaTypeCode;

  @Column({ name: 'TIPOREMISION' })
  tipoRemisionCode: TipoRemisionTypeCode;

  @Column({ name: 'OTROTIPOREMISION', nullable: true })
  otroTipoRemision: string;

  @Column({ name: 'TIPORECORRIDO' })
  tipoRecorridoCode: TipoTrasladoTypeCode;

  @Column({ name: 'TIPOTRASLADO' })
  tipoTrasladoCode: TipoTrasladoItemTypeCode;

  @Column({ name: 'ESTADOPACIENTE' })
  estadoPacienteCode: EstadoPacienteCode;

  @Column({ name: 'TIPOSOPORTEVITAL', nullable: true })
  tipoSoporteVital: string;

  @Column({ name: 'OTROSOPORTEVITAL', nullable: true })
  otroSignoVital: string;

  @Column({ name: 'SERVICIOREQUERIDO', nullable: true })
  servicioRequeridoId: number;

  @ManyToOne(() => ServicioOrm)
  @JoinColumn([{ name: 'SERVICIOREQUERIDO', referencedColumnName: 'id' }])
  servicioRequerido: ServicioOrm;

  @Column({ name: 'DIAGNOSTICO', nullable: true })
  diagnosticoId: number;

  @ManyToOne(() => DiagnosticoOrm)
  @JoinColumn([{ name: 'DIAGNOSTICO', referencedColumnName: 'id' }])
  diagnostico: DiagnosticoOrm;

  @Column({ name: 'DIAGSECUNDARIO', nullable: true })
  diagSecundarioId: number;

  @ManyToOne(() => DiagnosticoOrm)
  @JoinColumn([{ name: 'DIAGSECUNDARIO', referencedColumnName: 'id' }])
  diagSecundario: DiagnosticoOrm;

  @Column({ name: 'HALLAZGOS', nullable: true })
  hallazgos: string;

  @Column({ name: 'KMINICIAL', nullable: true })
  kmInicial: number;

  @Column({ name: 'ACOMPANANTENOM', nullable: true })
  acompananteNombre: string;

  @Column({ name: 'ACOMPANANTEDOC', nullable: true })
  acompananteDocumento: string;

  @Column({ name: 'TRIAGEIMG', nullable: true })
  triageImg: string;

  @Column({ name: 'FECHACREACION', type: 'timestamp' })
  fechaCreacion: Date;

  @Column({ name: 'FECHAPROGRAMADA', type: 'timestamp' })
  fechaProgramada: Date;

  @Column({ name: 'FECHAVISTOBIEN', type: 'timestamp', nullable: true })
  fechaHoraVistoBien: Date;

  @Column({ name: 'OBSERVACION', nullable: true })
  observacion: string;

  @Column({ name: 'ISDELETE', nullable: true })
  isDeleted: boolean;

  @OneToMany(() => TrasladoTramoOrm, tramo => tramo.traslado)
  tramos: TrasladoTramoOrm[];

  @OneToMany(() => TrasladoAsignacionOrm, asignacion => asignacion.traslado)
  asignaciones: TrasladoAsignacionOrm[];

  @OneToMany(() => TrasladoEstadoHistorialOrm, historial => historial.traslado)
  estadosHistorial: TrasladoEstadoHistorialOrm[];

  @OneToMany(() => TrasladoSignosVitalesOrm, signos => signos.traslado)
  signosVitales: TrasladoSignosVitalesOrm[];

  @OneToMany(() => TrasladoNotaOrm, nota => nota.traslado)
  notas: TrasladoNotaOrm[];

  @OneToMany(() => ProcedimientoOrm, procedimiento => procedimiento.traslado)
  procedimientos: ProcedimientoOrm[];

  @OneToMany(() => MedicamentoOrm, medicamento => medicamento.traslado)
  medicamentos: MedicamentoOrm[];

  @OneToMany(() => TrasladoRevisionCentralOrm, revision => revision.traslado)
  revisionesCentral: TrasladoRevisionCentralOrm[];

  contexto: GcmContextType;
}
